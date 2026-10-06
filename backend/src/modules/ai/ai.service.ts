import type { PoolClient } from 'pg';
import { AppError } from '../../common/errors/app-error.js';
import { errorCodes } from '../../common/errors/error-codes.js';
import { normalizeCareerName } from '../../common/utils/career-name.js';
import { getPool, withTransaction, type Db } from '../../lib/db.js';
import { calculateAiImpactScore, impactLevelForScore } from '../../lib/scoring/ai-impact.js';
import {
  calculateSkillMatchScore,
  calculateExperienceMatchScore,
  calculateCareerMatchScore,
  calculateAiReadinessScore,
  calculateCareerInterestScore,
  SKILL_IMPORTANCE_WEIGHTS,
  type SkillImportance,
} from '../../lib/scoring/career-match.js';
import { computeSkillGaps, missingSkills, type GapPriority, type SkillGapStatus } from '../../lib/scoring/skill-gap.js';
import { findOwnedExperience, listExperiences } from '../../models/experience.model.js';
import { findCareerProfileByUserId } from '../../models/career-profile.model.js';
import {
  assertCareerAccessible,
  findCareerWithSkills,
  findOrCreateSkillByName,
  listCareers,
  listSkills,
  replaceCareerSkills,
  updateCareerDescription,
  type CareerPathRow,
} from '../../models/catalogue.model.js';
import {
  insertCareerAnalysis,
  replaceTransferableSkills,
  listTransferableSkills,
  listTransferableSkillsForExperience,
  findLatestAnalysis,
  type CareerAnalysisRow,
} from '../../models/ai.model.js';
import {
  replaceCareerRecommendations,
  replaceSkillGaps,
  listCareerRecommendationsWithName,
} from '../../models/careers.model.js';
import { upsertUserSkill, listUserSkillsWithNames } from '../../models/user-skill.model.js';
import {
  deleteRoadmapTasks,
  findCurrentRoadmapWithTasks,
  findLatestRoadmapWithTasks,
  groupTasksByPhase,
  insertRoadmap,
  insertRoadmapTask,
  updateRoadmapContent,
  type RoadmapPhase,
  type RoadmapWithTasks,
} from '../../models/roadmap.model.js';
import { LLMProviderError, type LLMProvider } from './providers/llm.provider.js';
import { buildCareerImpactPrompt } from './prompts/career-impact.prompt.js';
import { buildCareerRequirementsPrompt } from './prompts/career-requirements.prompt.js';
import { buildTransferableSkillsPrompt } from './prompts/transferable-skills.prompt.js';
import { buildRoadmapPrompt } from './prompts/roadmap.prompt.js';
import {
  careerImpactOutputSchema,
  careerRequirementsOutputSchema,
  transferableSkillsOutputSchema,
  roadmapOutputSchema,
  type CareerImpactOutput,
  type CareerRequirementsOutput,
  type TransferableSkillsOutput,
  type RoadmapOutput,
} from './ai.schemas.js';
import { connectProfileWithExperience } from './ai.util.js';

const MAX_AI_RETRIES = 1;

/** A career together with its resolved requirements, as findCareerWithSkills returns. */
type CareerWithItsSkills = {
  career: CareerPathRow;
  skills: Array<{ skillId: string; skillName: string; importance: SkillImportance }>;
};

/**
 * Minimum usable skills an AI response must provide for a custom career after
 * de-duplication. Mirrors the schema's min(3); a runtime check is still needed
 * because de-duplication can reduce the resolved set below the raw count.
 */
const MIN_REQUIREMENT_SKILLS = 3;

export interface CareerImpactResponse {
  id: string;
  experienceId: string;
  score: number;
  level: string;
  automationTasks: string[];
  augmentedTasks: string[];
  humanStrengths: string[];
  emergingSkills: string[];
  explanation: string;
  createdAt: Date;
}

export interface TransferableSkillResponse {
  skillId: string;
  skillName: string | null;
  reason: string;
  confidence: number;
}

export interface CareerRecommendationResponse {
  careerId: string;
  careerName: string;
  matchScore: number;
  rank: number;
  reason: string;
}

/**
 * READY             - the participant's own data separated the careers, so
 *                     "recommendations" is a genuine ranking.
 * INSUFFICIENT_DATA - the scorer's inputs could not distinguish any two careers
 *                     (for example no stored skills and no target career). Every
 *                     catalogue entry scored identically, so the backend returns
 *                     an empty list and says what is missing instead of
 *                     presenting an arbitrary alphabetical entry as a match.
 */
export type CareerRecommendationStatus = 'READY' | 'INSUFFICIENT_DATA';

export interface CareerRecommendationsEnvelope {
  status: CareerRecommendationStatus;
  /** Deterministic, user-facing list of the inputs still needed. */
  missing: string[];
  recommendations: CareerRecommendationResponse[];
}

/**
 * Describes which participant inputs are still needed before career matching
 * can discriminate between catalogue entries.
 *
 * Note that years of experience alone is deliberately NOT sufficient: the
 * experience component is career-agnostic (it adds the same amount to every
 * career), so it cannot rank anything on its own. Only stored skills and an
 * explicit target career can separate two careers.
 */
function missingRecommendationInputs(
  skillCount: number,
  targetCareerId: string | null,
  experienceCount: number,
): string[] {
  const missing: string[] = [];
  if (skillCount === 0) {
    missing.push('Select at least one skill from the approved catalogue.');
  }
  if (targetCareerId === null) {
    missing.push('Choose a target career from the approved catalogue.');
  }
  if (experienceCount === 0) {
    missing.push('Add a work experience, or complete your AI career impact assessment.');
  }
  return missing;
}

export interface SkillGapsResponse {
  career: { id: string; name: string };
  skills: Array<{ skillId: string; skillName: string; status: SkillGapStatus; priority: GapPriority }>;
}

export interface RoadmapResponse {
  roadmap: {
    id: string;
    careerPathId: string;
    title: string;
    description: string;
    createdAt: Date;
  };
  phases: Record<RoadmapPhase, Array<Record<string, unknown>>>;
}

function aiFailure(_error: LLMProviderError): never {
  // Every call site classifies AppError before delegating here, so the failure
  // is always a provider error. We map it to a safe 503 and deliberately do
  // not surface provider internals or API keys (docs/SECURITY_SPEC.md §24).
  throw new AppError(
    errorCodes.AI_SERVICE_ERROR,
    'AI intelligence is temporarily unavailable. Please try again shortly.',
    503,
  );
}

export class AiService {
  constructor(private readonly provider: LLMProvider) {}

  /**
   * Runs or reuses a Career Impact Assessment (docs/API_CONTRACT.md §15).
   * When the experience has not changed since the saved assessment the stored
   * result is reused so the rate-limited AI is not called again. Pass
   * regenerate=true to force a fresh analysis.
   */
  async runCareerImpact(userId: string, experienceId: string, regenerate = false): Promise<CareerImpactResponse> {
    const experience = await findOwnedExperience(getPool(), experienceId, userId);
    if (experience === null) {
      throw new AppError(errorCodes.RESOURCE_NOT_FOUND, 'Experience not found', 404);
    }

    if (!regenerate) {
      const existing = await findLatestAnalysis(getPool(), userId, experienceId);
      if (existing && experience.updatedAt.getTime() <= existing.createdAt.getTime()) {
        return toCareerImpactResponse(existing);
      }
    }

    const profile = await findCareerProfileByUserId(getPool(), userId);
    const context = await connectProfileWithExperience(profile, experience);

    let output: CareerImpactOutput;
    try {
      const { system, user } = buildCareerImpactPrompt(context);
      const raw = await this.callWithRetry({ system, user });
      output = careerImpactOutputSchema.parse(raw);
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof LLMProviderError) throw aiFailure(error);
      throw new AppError(errorCodes.AI_OUTPUT_INVALID, 'The AI returned an unreadable response. Please try again.', 422);
    }

    const score = calculateAiImpactScore({
      automationCount: output.automationTasks.length,
      augmentedCount: output.augmentedTasks.length,
      humanCount: output.humanStrengths.length,
    });
    const impactLevel = impactLevelForScore(score);

    const saved = await withTransaction((client) =>
      insertCareerAnalysis(client, {
        userId,
        experienceId,
        aiImpactScore: score,
        impactLevel,
        automationTasks: output.automationTasks,
        augmentedTasks: output.augmentedTasks,
        humanStrengths: output.humanStrengths,
        emergingSkills: output.emergingSkills,
        explanation: output.explanation,
      }),
    );

    return toCareerImpactResponse(saved);
  }

  /**
   * Extracts or reuses transferable skills for an experience
   * (docs/API_CONTRACT.md §16). When valid rows already exist for the
   * experience and the experience has not changed, the stored result is reused
   * instead of calling the AI again. Pass regenerate=true to force a rebuild.
   */
  async runTransferableSkills(
    userId: string,
    experienceId: string,
    regenerate = false,
  ): Promise<TransferableSkillResponse[]> {
    const experience = await findOwnedExperience(getPool(), experienceId, userId);
    if (experience === null) {
      throw new AppError(errorCodes.RESOURCE_NOT_FOUND, 'Experience not found', 404);
    }

    const stored = await listTransferableSkillsForExperience(getPool(), userId, experienceId);
    if (!regenerate && stored.length > 0) {
      const latestCreated = new Date(Math.max(...stored.map((row) => row.createdAt.getTime())));
      if (experience.updatedAt.getTime() <= latestCreated.getTime()) {
        const skills = await listSkills(getPool());
        const byId = new Map(skills.map((s) => [s.id, s.name]));
        return toTransferableSkillResponse(stored, byId);
      }
    }

    const profile = await findCareerProfileByUserId(getPool(), userId);
    const context = await connectProfileWithExperience(profile, experience);

    const skills = await listSkills(getPool());
    const byId = new Map(skills.map((s) => [s.id, s.name]));
    const idsBySkillName = new Map(skills.map((s) => [s.name.toLowerCase(), s.id]));

    let parsed: TransferableSkillsOutput;
    try {
      const { system, user } = buildTransferableSkillsPrompt({
        ...context,
        skillCatalogue: [...new Set(skills.map((s) => s.name))],
      });
      const raw = await this.callWithRetry({ system, user });
      parsed = transferableSkillsOutputSchema.parse(raw);
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof LLMProviderError) throw aiFailure(error);
      throw new AppError(errorCodes.AI_OUTPUT_INVALID, 'The AI returned an unreadable response. Please try again.', 422);
    }

    const resolved = parsed.skills
      .map((item) => ({
        skillId: idsBySkillName.get(item.skillName.toLowerCase()) ?? null,
        skillName: item.skillName,
        reason: item.reason,
        confidence: item.confidence,
      }))
      .filter((item): item is { skillId: string; skillName: string; reason: string; confidence: number } => item.skillId !== null);

    await withTransaction(async (client) => {
      await replaceTransferableSkills(
        client,
        userId,
        experienceId,
        resolved.map((item) => ({ skillId: item.skillId, reason: item.reason, confidence: item.confidence })),
      );
      for (const item of resolved) {
        await upsertUserSkill(client, {
          userId,
          skillId: item.skillId,
          source: 'AI_DERIVED',
          confidence: item.confidence,
          proficiency: item.confidence,
        });
      }
    });

    return toTransferableSkillResponse(resolved, byId);
  }

  async runCareerRecommendations(userId: string, db?: Db): Promise<CareerRecommendationsEnvelope> {
    const computed = await this.computeCareerRecommendations(userId, db);
    // Never persist a ranking the scorer could not actually discriminate:
    // storing it would make an arbitrary alphabetical order look authoritative
    // on every later read.
    if (computed.status === 'INSUFFICIENT_DATA') {
      await replaceCareerRecommendations(db ?? getPool(), userId, []);
      return computed;
    }
    await replaceCareerRecommendations(
      db ?? getPool(),
      userId,
      computed.recommendations.map((item) => ({
        careerPathId: item.careerId,
        matchScore: item.matchScore,
        reason: item.reason,
        rank: item.rank,
      })),
    );
    const stored = await listCareerRecommendationsWithName(db ?? getPool(), userId);
    return {
      status: computed.status,
      missing: computed.missing,
      recommendations: stored.map(toCareerRecommendationResponse),
    };
  }

  /**
   * Read-first career recommendations (docs/API_CONTRACT.md §17). Returns the
   * persisted results when present; otherwise computes the deterministic
   * recommendation without persisting. Optional `limit` clamps the list.
   */
  async getCareerRecommendations(
    userId: string,
    limit?: number,
    db?: Db,
  ): Promise<CareerRecommendationsEnvelope> {
    const pool = db ?? getPool();
    const stored = await listCareerRecommendationsWithName(pool, userId);
    const envelope =
      stored.length > 0
        ? {
            status: 'READY' as const,
            missing: [] as string[],
            recommendations: stored.map(toCareerRecommendationResponse),
          }
        : await this.computeCareerRecommendations(userId, db);
    return {
      ...envelope,
      recommendations:
        limit === undefined ? envelope.recommendations : envelope.recommendations.slice(0, limit),
    };
  }

  /**
   * Deterministic, catalogue-grounded career matching (docs/AI_SPEC.md §15).
   *
   * Returns INSUFFICIENT_DATA rather than a ranked list whenever the scorer's
   * inputs cannot tell two careers apart. The failure this prevents: with no
   * stored skills and no target career, every career scored identically, and
   * because the sort had no tiebreak the alphabetically first catalogue entry
   * was presented to every participant as their "#1 match".
   */
  private async computeCareerRecommendations(
    userId: string,
    db?: Db,
  ): Promise<CareerRecommendationsEnvelope> {
    const pool = db ?? getPool();
    const userSkills = await listUserSkillsWithNames(pool, userId);
    const userSkillIds = new Set(userSkills.map((s) => s.skillId));
    const profile = await findCareerProfileByUserId(pool, userId);
    const experiences = await listExperiences(pool, userId);

    // An explicit completion marker is required before any ranking is offered.
    // A "career_profiles" row can exist from a submission that only half
    // committed under the old multi-request flow, and ranking that participant
    // would present a confident list built on data they never finished giving.
    // Score variance alone is not a sufficient guard: a target career on its own
    // separates the scores, so a half-written profile could still produce a
    // plausible-looking ranking.
    if (profile === null || profile.onboardingCompletedAt === null) {
      return {
        status: 'INSUFFICIENT_DATA',
        missing: ['Complete your onboarding profile so matches are calculated from real data'],
        recommendations: [],
      };
    }

    // Relevant experience duration comes from real user-provided records: the
    // declared years on each experience plus the career profile's total. We
    // prefer actual user-provided values over any heuristic (docs/AI_SPEC.md §18).
    const relevantYears = totalExperienceYears(profile?.yearsOfExperience ?? null, experiences);

    const careers = await listCareers(pool);
    const results: Array<{ careerId: string; careerName: string; matchScore: number; reason: string }> = [];
    for (const career of careers) {
      const withSkills = await findCareerWithSkills(pool, career.id);
      if (withSkills === null || withSkills.skills.length === 0) {
        continue;
      }
      const skillMatch = calculateSkillMatchScore({
        careerSkills: withSkills.skills.map((s) => ({ skillId: s.skillId, importance: s.importance })),
        userSkillIds,
      });
      const experienceMatch = calculateExperienceMatchScore({
        hasRelevantExperience: relevantYears > 0,
        relevantYears,
      });
      const interest = calculateCareerInterestScore(profile?.targetCareerId === career.id ? 100 : 0);
      const aiReadiness = calculateAiReadinessScore({
        relevantSkillCoverage: skillMatch,
        aiRoadmapCompletion: undefined,
      });
      const matchScore = calculateCareerMatchScore({
        skillMatch,
        experienceMatch,
        careerInterest: interest,
        aiReadiness,
      });
      results.push({
        careerId: career.id,
        careerName: career.name,
        matchScore,
        reason: this.buildRecommendationReason(career.name, skillMatch, experienceMatch),
      });
    }

    if (results.length === 0) {
      return {
        status: 'INSUFFICIENT_DATA',
        missing: missingRecommendationInputs(userSkillIds.size, profile?.targetCareerId ?? null, experiences.length),
        recommendations: [],
      };
    }

    // The ranking is only meaningful if the participant's own data actually
    // separated the careers. A single distinct score means every catalogue
    // entry tied, so any "top match" would be arbitrary.
    const distinctScores = new Set(results.map((item) => item.matchScore));
    if (distinctScores.size <= 1) {
      return {
        status: 'INSUFFICIENT_DATA',
        missing: missingRecommendationInputs(userSkillIds.size, profile?.targetCareerId ?? null, experiences.length),
        recommendations: [],
      };
    }

    // Primary: match score, descending. Secondary: career name, ascending, so
    // genuinely equal scores are ordered deterministically instead of inheriting
    // whatever order the catalogue query happened to return.
    const ranked = results
      .sort((a, b) => b.matchScore - a.matchScore || a.careerName.localeCompare(b.careerName))
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return { status: 'READY', missing: [], recommendations: ranked };
  }

  async runSkillGaps(userId: string, careerPathId: string, db?: Db): Promise<SkillGapsResponse> {
    // Write path: a custom career that has no AI-derived requirements yet gets
    // them generated once, so the gaps are computed from real requirements
    // rather than reported as an empty list. The GET path stays read-only.
    await this.ensureCareerSkills(userId, careerPathId);
    const view = await this.buildSkillGapsView(userId, careerPathId, db);
    if (view === null) {
      throw new AppError(errorCodes.RESOURCE_NOT_FOUND, 'Career not found', 404);
    }

    await replaceSkillGaps(
      db ?? getPool(),
      userId,
      careerPathId,
      view.skills.map((g) => ({ skillId: g.skillId, status: g.status, priority: g.priority, reason: null })),
    );
    return view;
  }

  /**
   * Read-first skill gap analysis (docs/API_CONTRACT.md §18). Computed
   * deterministically from the catalogue; no AI call and no persistence.
   */
  async getSkillGaps(userId: string, careerPathId: string, db?: Db): Promise<SkillGapsResponse> {
    const view = await this.buildSkillGapsView(userId, careerPathId, db);
    if (view === null) {
      throw new AppError(errorCodes.RESOURCE_NOT_FOUND, 'Career not found', 404);
    }
    return view;
  }

  private async buildSkillGapsView(
    userId: string,
    careerPathId: string,
    db?: Db,
  ): Promise<SkillGapsResponse | null> {
    const pool = db ?? getPool();
    // Ownership gate: a participant may only analyse a career they own (when
    // custom) or any approved catalogue career.
    await assertCareerAccessible(pool, careerPathId, userId);
    const withSkills = await findCareerWithSkills(pool, careerPathId);
    if (withSkills === null) {
      return null;
    }
    const userSkills = await listUserSkillsWithNames(pool, userId);
    const userSkillIds = new Set(userSkills.map((s) => s.skillId));

    const gaps = computeSkillGaps({
      careerSkills: withSkills.skills.map((s) => ({
        skillId: s.skillId,
        skillName: s.skillName,
        importance: s.importance,
      })),
      userSkillIds,
    });

    return {
      career: { id: withSkills.career.id, name: withSkills.career.name },
      skills: gaps.map((g) => ({ skillId: g.skillId, skillName: g.skillName, status: g.status, priority: g.priority })),
    };
  }

  /**
   * Ensures a career has the skill requirements its write-path operations
   * depend on. Approved catalogue careers already carry seeded requirements;
   * a participant's own custom career has none until the AI derives them once
   * (lazily, on the first skill-gap POST or roadmap generation). Returns the
   * career with its resolved requirements and enforces ownership.
   */
  private async ensureCareerSkills(userId: string, careerPathId: string): Promise<CareerWithItsSkills> {
    const career = await assertCareerAccessible(getPool(), careerPathId, userId);
    if (!career.isCustom) {
      const existing = await findCareerWithSkills(getPool(), careerPathId);
      if (existing === null) {
        throw new AppError(errorCodes.RESOURCE_NOT_FOUND, 'Career not found', 404);
      }
      return existing;
    }
    return this.generateCareerRequirements(userId, careerPathId);
  }

  /**
   * Generates (once) the AI-derived skill requirements for a participant's own
   * custom target career (docs/AI_SPEC.md §15, PRODUCT_SPEC.md §13).
   *
   * Idempotent: when the career already has requirements the existing set is
   * returned and the AI is not called again, so repeated skill-gap or roadmap
   * calls never burn the rate-limited provider. Only a career the participant
   * named themselves can be processed; catalogue careers always have seeded
   * requirements and anything AI could add would pollute the shared catalogue.
   */
  async generateCareerRequirements(userId: string, careerPathId: string): Promise<CareerWithItsSkills> {
    const career = await assertCareerAccessible(getPool(), careerPathId, userId);
    if (!career.isCustom) {
      throw new AppError(
        errorCodes.VALIDATION_ERROR,
        'Only a participant-named career can have AI-derived requirements.',
        400,
      );
    }

    return withTransaction(async (client) => {
      const persisted = await findCareerWithSkills(client, careerPathId);
      if (persisted !== null && persisted.skills.length > 0) {
        return persisted;
      }
      return this.generateAndStoreRequirements(client, career, userId);
    });
  }

  /**
   * Calls the AI for a custom career's requirements and persists them inside
   * the caller's transaction. Runs only when no requirements exist yet, so the
   * rate-limited provider is used at most once per career.
   */
  private async generateAndStoreRequirements(
    client: PoolClient,
    career: CareerPathRow,
    userId: string,
  ): Promise<CareerWithItsSkills> {
    const profile = await findCareerProfileByUserId(client, userId);
    const userSkills = await listUserSkillsWithNames(client, userId);

    let parsed: CareerRequirementsOutput;
    try {
      const { system, user } = buildCareerRequirementsPrompt({
        careerName: career.name,
        currentOccupation: profile?.currentOccupation ?? '',
        industry: profile?.industry ?? '',
        skillsKnown: userSkills.map((s) => s.skillName),
      });
      const raw = await this.callWithRetry({ system, user });
      parsed = careerRequirementsOutputSchema.parse(raw);
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof LLMProviderError) throw aiFailure(error);
      throw new AppError(errorCodes.AI_OUTPUT_INVALID, 'The AI returned an unreadable response. Please try again.', 422);
    }

    // The AI must name the participant's actual career, not a look-alike.
    if (parsed.careerName.trim().toLowerCase() !== career.name.trim().toLowerCase()) {
      throw new AppError(
        errorCodes.AI_OUTPUT_INVALID,
        'The AI did not target the requested career.',
        422,
      );
    }

    const resolved = await this.resolveRequirementSkills(client, parsed.skills);
    if (resolved.length < MIN_REQUIREMENT_SKILLS) {
      throw new AppError(
        errorCodes.AI_OUTPUT_INVALID,
        `The AI returned fewer than ${MIN_REQUIREMENT_SKILLS} usable skills for this career.`,
        422,
      );
    }

    await replaceCareerSkills(client, career.id, resolved);
    const description = parsed.careerDescription.trim();
    if (description.length > 0 && description !== career.description) {
      await updateCareerDescription(client, career.id, description);
    }

    const withSkills = await findCareerWithSkills(client, career.id);
    if (withSkills === null) {
      throw new AppError(
        errorCodes.INTERNAL_SERVER_ERROR,
        'Could not save the career requirements. Please try again.',
        500,
      );
    }
    return withSkills;
  }

  /**
   * Resolves AI-named requirement skills to "skills" rows, reusing the same
   * rule as participant-typed skills: an approved catalogue skill that matches
   * case-insensitively wins, and only a genuinely new name is stored as a
   * custom skill. Entries are de-duplicated by lowercase name, keeping the
   * highest-importance variant so a duplicate cannot skew weights.
   */
  private async resolveRequirementSkills(
    db: Db,
    items: Array<{ name: string; importance: SkillImportance }>,
  ): Promise<Array<{ skillId: string; importance: SkillImportance }>> {
    const bestByName = new Map<string, { name: string; importance: SkillImportance }>();
    for (const item of items) {
      const normalized = normalizeCareerName(item.name);
      if (normalized.length === 0) {
        continue;
      }
      const key = normalized.toLowerCase();
      const current = bestByName.get(key);
      if (
        current === undefined ||
        SKILL_IMPORTANCE_WEIGHTS[item.importance] > SKILL_IMPORTANCE_WEIGHTS[current.importance]
      ) {
        bestByName.set(key, { name: normalized, importance: item.importance });
      }
    }
    const resolved: Array<{ skillId: string; importance: SkillImportance }> = [];
    for (const item of bestByName.values()) {
      const skill = await findOrCreateSkillByName(db, item.name);
      resolved.push({ skillId: skill.id, importance: item.importance });
    }
    return resolved;
  }

  /**
   * Generates (or reuses) a 30/60/90-day roadmap (docs/API_CONTRACT.md §19).
   * When a current roadmap already exists for the same career it is reused so
   * the rate-limited AI is not called again; an explicit regenerate (or a
   * different target career) replaces it in place, preserving the roadmap row.
   */
  async runRoadmap(userId: string, careerPathId: string, regenerate = false): Promise<RoadmapResponse> {
    // Ownership gate plus, for custom careers, one-time generation of the
    // AI-derived requirements the roadmap depends on.
    const withSkills = await this.ensureCareerSkills(userId, careerPathId);
    const userSkills = await listUserSkillsWithNames(getPool(), userId);
    const userSkillIds = new Set(userSkills.map((s) => s.skillId));

    const gaps = missingSkills(
      computeSkillGaps({
        careerSkills: withSkills.skills.map((s) => ({
          skillId: s.skillId,
          skillName: s.skillName,
          importance: s.importance,
        })),
        userSkillIds,
      }),
    );
    if (gaps.length === 0) {
      throw new AppError(errorCodes.RESOURCE_ALREADY_EXISTS, 'You already have all the skills for this career.', 409);
    }

    if (!regenerate) {
      const current = await findLatestRoadmapWithTasks(getPool(), userId);
      if (current !== null && current.roadmap.careerPathId === careerPathId && current.tasks.length > 0) {
        return buildRoadmapResponse(current.roadmap.id, current);
      }
    }

    const profile = await findCareerProfileByUserId(getPool(), userId);
    // Every task must resolve to one of the career's actual skills. For a
    // participant's custom career those include user/custom skills, so the map
    // is built from the resolved career requirements rather than the approved
    // catalogue filter (listSkills), which would reject custom skills.
    const idByName = new Map(withSkills.skills.map((s) => [s.skillName.toLowerCase(), s.skillId]));

    let parsed: RoadmapOutput;
    try {
      const { system, user } = buildRoadmapPrompt({
        careerName: withSkills.career.name,
        careerDescription: withSkills.career.description,
        missingSkills: gaps.map((g) => ({ name: g.skillName, priority: g.priority })),
        currentSkills: userSkills.map((s) => s.skillName),
        occupation: profile?.currentOccupation ?? '',
      });
      const raw = await this.callWithRetry({ system, user });
      parsed = roadmapOutputSchema.parse(raw);
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof LLMProviderError) throw aiFailure(error);
      throw new AppError(errorCodes.AI_OUTPUT_INVALID, 'The AI returned an unreadable response. Please try again.', 422);
    }

    // Validate before persisting: 3-5 tasks per 30/60/90 phase and every task
    // resolves to an approved catalogue skill (docs/AI_SPEC.md §19-§20).
    const resolvedTasks = resolveRoadmapTasks(parsed, idByName);

    const roadmapId = await withTransaction(async (client) => {
      const existing = await findLatestRoadmapWithTasks(client, userId);
      if (existing !== null) {
        await updateRoadmapContent(client, existing.roadmap.id, userId, {
          careerPathId,
          title: parsed.title,
          description: parsed.description,
        });
        await deleteRoadmapTasks(client, existing.roadmap.id);
        for (const task of resolvedTasks) {
          await insertRoadmapTask(client, { roadmapId: existing.roadmap.id, ...task });
        }
        return existing.roadmap.id;
      }

      const created = await insertRoadmap(client, {
        userId,
        careerPathId,
        title: parsed.title,
        description: parsed.description,
      });
      for (const task of resolvedTasks) {
        await insertRoadmapTask(client, { roadmapId: created.id, ...task });
      }
      return created.id;
    });

    const full = await findCurrentRoadmapWithTasks(getPool(), userId);
    return buildRoadmapResponse(roadmapId, full);
  }

  async getRoadmap(userId: string): Promise<RoadmapResponse> {
    const full = await findCurrentRoadmapWithTasks(getPool(), userId);
    return buildRoadmapResponse(full.roadmap.id, full);
  }

  async getCareerImpact(userId: string, experienceId: string): Promise<CareerImpactResponse> {
    const latest = await findLatestAnalysis(getPool(), userId, experienceId);
    if (latest === null) {
      throw new AppError(errorCodes.RESOURCE_NOT_FOUND, 'No assessment found for this experience.', 404);
    }
    return toCareerImpactResponse(latest);
  }

  async getTransferableSkills(userId: string): Promise<TransferableSkillResponse[]> {
    const skills = await listSkills(getPool());
    const byId = new Map(skills.map((s) => [s.id, s.name]));
    const stored = await listTransferableSkills(getPool(), userId);
    return toTransferableSkillResponse(stored, byId);
  }

  private async callWithRetry(input: { system: string; user: string }): Promise<unknown> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_AI_RETRIES; attempt++) {
      try {
        return await this.provider.completeStructured(input);
      } catch (error) {
        lastError = error;
        const retryable = error instanceof LLMProviderError && error.retryable && attempt < MAX_AI_RETRIES;
        if (!retryable) {
          break;
        }
      }
    }
    throw lastError;
  }

  private buildRecommendationReason(name: string, skillMatch: number, experienceMatch: number): string {
    if (skillMatch >= 60) {
      return `You already have many of the core skills needed for ${name}.`;
    }
    if (experienceMatch >= 40) {
      return `Your experience is relevant to ${name}; developing a few more skills will strengthen your fit.`;
    }
    return `These are the next best-fit careers based on your current skills.`;
  }
}

function toCareerImpactResponse(row: CareerAnalysisRow): CareerImpactResponse {
  return {
    id: row.id,
    experienceId: row.experienceId,
    score: row.aiImpactScore,
    level: row.impactLevel,
    automationTasks: row.automationTasks,
    augmentedTasks: row.augmentedTasks,
    humanStrengths: row.humanStrengths,
    emergingSkills: row.emergingSkills,
    explanation: row.explanation,
    createdAt: row.createdAt,
  };
}

function toCareerRecommendationResponse(item: {
  careerId: string;
  careerName: string;
  matchScore: number;
  rank: number;
  reason: string;
}): CareerRecommendationResponse {
  return {
    careerId: item.careerId,
    careerName: item.careerName,
    matchScore: item.matchScore,
    rank: item.rank,
    reason: item.reason,
  };
}

function toTransferableSkillResponse(
  items: Array<{ skillId: string; reason: string; confidence: number }>,
  byId: Map<string, string>,
): TransferableSkillResponse[] {
  return items.map((item) => ({
    skillId: item.skillId,
    skillName: byId.get(item.skillId) ?? null,
    reason: item.reason,
    confidence: item.confidence,
  }));
}

/**
 * Total years of relevant experience derived solely from user-provided data:
 * the career profile's declared years plus the sum of the declared `years` on
 * each experience record. When a user gives no numbers, this returns 0 rather
 * than guessing (docs/AI_SPEC.md §18 - no fabricated history).
 */
function totalExperienceYears(
  profileYears: number | null,
  experiences: Array<{ years: number | null }>,
): number {
  let total = profileYears ?? 0;
  for (const experience of experiences) {
    total += experience.years ?? 0;
  }
  return total;
}

function buildRoadmapResponse(
  roadmapId: string,
  full: RoadmapWithTasks,
): RoadmapResponse {
  const byPhase = groupTasksByPhase(full.tasks);
  const brief = (t: RoadmapWithTasks['tasks'][number]) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    skillId: t.skillId,
    estimatedMinutes: t.estimatedMinutes,
    order: t.order,
    status: t.status,
    completedAt: t.completedAt,
  });
  return {
    roadmap: {
      id: roadmapId,
      careerPathId: full.roadmap.careerPathId,
      title: full.roadmap.title,
      description: full.roadmap.description,
      createdAt: full.roadmap.createdAt,
    },
    phases: {
      DAY_30: byPhase.DAY_30.map(brief),
      DAY_60: byPhase.DAY_60.map(brief),
      DAY_90: byPhase.DAY_90.map(brief),
    },
  };
}

const ROADMAP_PHASES: ReadonlyArray<{ key: '30' | '60' | '90'; phase: RoadmapPhase }> = [
  { key: '30', phase: 'DAY_30' },
  { key: '60', phase: 'DAY_60' },
  { key: '90', phase: 'DAY_90' },
];

const MIN_TASKS_PER_PHASE = 3;
const MAX_TASKS_PER_PHASE = 5;

interface ResolvedRoadmapTask {
  phase: RoadmapPhase;
  title: string;
  description: string;
  skillId: string;
  estimatedMinutes: number | null;
  order: number;
}

/**
 * Validates and resolves AI roadmap output before persistence
 * (docs/AI_SPEC.md §19-§20, AGENTS.md §22). Every phase must contain 3-5
 * tasks and every task must reference an approved catalogue skill by name.
 * Unresolvable output is rejected (422) rather than persisted partially.
 */
function resolveRoadmapTasks(parsed: RoadmapOutput, idByName: Map<string, string>): ResolvedRoadmapTask[] {
  const resolved: ResolvedRoadmapTask[] = [];
  for (const { key, phase } of ROADMAP_PHASES) {
    const tasks = parsed.phases[key] ?? [];
    if (tasks.length < MIN_TASKS_PER_PHASE || tasks.length > MAX_TASKS_PER_PHASE) {
      throw new AppError(
        errorCodes.AI_OUTPUT_INVALID,
        `The AI returned ${tasks.length} tasks for the ${key}-day phase. Expected ${MIN_TASKS_PER_PHASE}-${MAX_TASKS_PER_PHASE} tasks per phase.`,
        422,
      );
    }
    let order = 1;
    for (const task of tasks) {
      const skillId = idByName.get(task.skillName.toLowerCase());
      if (skillId === undefined) {
        throw new AppError(
          errorCodes.AI_OUTPUT_INVALID,
          `The AI referenced an unknown skill "${task.skillName}".`,
          422,
        );
      }
      resolved.push({
        phase,
        title: task.title,
        description: task.description,
        skillId,
        estimatedMinutes: task.estimatedMinutes ?? null,
        order,
      });
      order += 1;
    }
  }
  return resolved;
}
