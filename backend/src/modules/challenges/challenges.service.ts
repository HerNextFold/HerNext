import { AppError } from '../../common/errors/app-error.js';
import { errorCodes } from '../../common/errors/error-codes.js';
import { getPool, withTransaction } from '../../lib/db.js';
import { evaluateChallengeSubmission, findChallengeSpec } from '../../lib/challenges/challenge-evaluator.js';
import {
  attachSkills,
  findChallengeById,
  listChallengeRelevance,
  listChallenges as listChallengesInDb,
  listChallengeSkills,
  type ChallengeDifficulty,
  type ChallengeRelevanceRow,
  type ChallengeWithSkills,
} from '../../models/challenge.model.js';
import { findCareerProfileByUserId } from '../../models/career-profile.model.js';
import {
  insertSubmission,
  listLatestSubmissions,
  type SubmissionStatus,
} from '../../models/challenge-submission.model.js';
import { insertEvidence } from '../../models/evidence.model.js';
import { upsertUserSkill } from '../../models/user-skill.model.js';
import { parseOrThrow } from '../../common/utils/validate.js';
import type { AchievementService } from '../achievements/achievements.service.js';

export type ChallengeRelevance = 'RECOMMENDED' | 'BUILDING' | 'EXPLORING';

export interface ChallengeListItem {
  id: string;
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  skills: Array<{ skillId: string; skillName: string }>;
  relevance: ChallengeRelevance;
  relevanceReason: string;
  latestAttempt: { status: SubmissionStatus; score: number | null; submittedAt: Date } | null;
}

export interface SubmitChallengeResult {
  submissionId: string;
  status: SubmissionStatus;
  score: number;
  feedback: string;
  evidenceCreated: number;
}

const RELEVANCE_RANK: Record<ChallengeRelevance, number> = {
  RECOMMENDED: 0,
  BUILDING: 1,
  EXPLORING: 2,
};

/**
 * Human-readable, data-derived explanation. Never claims a match that is not
 * actually there.
 */
function describeRelevance(
  relevance: ChallengeRelevance,
  targetSkills: string[],
  existingSkills: string[],
): string {
  if (relevance === 'RECOMMENDED') {
    return `Builds ${targetSkills.join(', ')}, which your target career requires. Completing it produces evidence for that career.`;
  }
  if (relevance === 'BUILDING') {
    return `Builds on ${existingSkills.join(', ')}, which you already have. A quick way to show what you can already do.`;
  }
  return 'Not yet connected to your profile or target career. Included so you can explore beyond your current plan.';
}

/**
 * Combines a challenge, its skills, its relevance row and its latest attempt
 * into the API shape. Shared by `list` and `getById` so the single-challenge
 * response cannot drift from the list response.
 */
function buildListItem(
  challenge: ChallengeWithSkills,
  relevanceRow: ChallengeRelevanceRow | undefined,
  attempt: { status: SubmissionStatus; score: number | null; submittedAt: Date } | undefined,
): ChallengeListItem {
  const targetSkills = relevanceRow?.targetSkillNames ?? [];
  const existingSkills = relevanceRow?.existingSkillNames ?? [];
  // Target overlap wins: evidence for the career they are moving toward is more
  // useful than playing to a strength they already have.
  const relevance: ChallengeRelevance =
    targetSkills.length > 0
      ? 'RECOMMENDED'
      : existingSkills.length > 0
        ? 'BUILDING'
        : 'EXPLORING';
  return {
    ...challenge,
    relevance,
    relevanceReason: describeRelevance(relevance, targetSkills, existingSkills),
    latestAttempt:
      attempt === undefined
        ? null
        : { status: attempt.status, score: attempt.score, submittedAt: attempt.submittedAt },
  };
}

export class ChallengeService {
  constructor(private readonly achievements: AchievementService) {}

  async list(
    userId: string,
    filters: { skillId?: string; difficulty?: ChallengeDifficulty } = {},
  ): Promise<ChallengeListItem[]> {
    const challenges = await listChallengesInDb(getPool(), filters);
    if (challenges.length === 0) {
      return [];
    }
    const challengeIds = challenges.map((c) => c.id);
    // A participant who has not finished onboarding has no target career, so
    // every challenge is EXPLORING for them. That is the honest answer, and the
    // catalogue is still fully browsable.
    const profile = await findCareerProfileByUserId(getPool(), userId);
    const targetCareerId = profile?.targetCareerId ?? null;
    const [skillRows, latestAttempts, relevanceRows] = await Promise.all([
      listChallengeSkills(getPool(), challengeIds),
      listLatestSubmissions(getPool(), userId),
      listChallengeRelevance(getPool(), userId, targetCareerId, challengeIds),
    ]);
    const byChallenge = new Map(latestAttempts.map((a) => [a.challengeId, a]));
    const relevanceByChallenge = new Map(relevanceRows.map((r) => [r.challengeId, r]));

    return attachSkills(challenges, skillRows)
      .map((challenge) =>
        buildListItem(challenge, relevanceByChallenge.get(challenge.id), byChallenge.get(challenge.id)),
      )
      .sort((a, b) => {
        const byRelevance = RELEVANCE_RANK[a.relevance] - RELEVANCE_RANK[b.relevance];
        // Title is the tiebreak so the order is stable across requests.
        return byRelevance !== 0 ? byRelevance : a.title.localeCompare(b.title);
      });
  }

  async getById(userId: string, challengeId: string): Promise<ChallengeListItem> {
    const challenge = await findChallengeById(getPool(), challengeId);
    if (challenge === null) {
      throw new AppError(errorCodes.RESOURCE_NOT_FOUND, 'Challenge not found', 404);
    }
    const skillRows = await listChallengeSkills(getPool(), [challenge.id]);
    const profile = await findCareerProfileByUserId(getPool(), userId);
    const relevanceRows = await listChallengeRelevance(getPool(), userId, profile?.targetCareerId ?? null, [
      challenge.id,
    ]);
    const attempt = (await listLatestSubmissions(getPool(), userId)).find(
      (a) => a.challengeId === challenge.id,
    );
    const [item] = attachSkills([challenge], skillRows);
    if (item === undefined) {
      throw new AppError(errorCodes.INTERNAL_SERVER_ERROR, 'Could not load challenge.', 500);
    }
    return buildListItem(item, relevanceRows[0], attempt);
  }

  /**
   * Submits a challenge answer. Flow (docs/API_CONTRACT.md §27):
   * validate -> evaluate deterministically -> score -> pass/fail -> persist ->
   * create evidence when appropriate -> award achievements. The AI never
   * overrides the deterministic score (docs/AI_SPEC.md §22).
   */
  async submit(
    userId: string,
    challengeId: string,
    answer: Record<string, unknown>,
  ): Promise<SubmitChallengeResult> {
    const challenge = await findChallengeById(getPool(), challengeId);
    if (challenge === null) {
      throw new AppError(errorCodes.RESOURCE_NOT_FOUND, 'Challenge not found', 404);
    }
    const spec = findChallengeSpec(challenge.title);
    if (spec === null) {
      throw new AppError(
        errorCodes.RESOURCE_NOT_FOUND,
        'This challenge does not support submissions yet.',
        404,
      );
    }
    const validatedAnswer = parseOrThrow(spec.answerSchema, answer);

    const result = evaluateChallengeSubmission(challenge, validatedAnswer);

    return withTransaction(async (client) => {
      const submission = await insertSubmission(client, {
        challengeId,
        userId,
        answer: validatedAnswer as Record<string, unknown>,
        score: result.score,
        status: result.passed ? 'PASSED' : 'FAILED',
        feedback: result.feedback,
      });

      let evidenceCreated = 0;
      if (result.passed) {
        const skills = await listChallengeSkills(client, [challenge.id]);
        for (const skill of skills) {
          await upsertUserSkill(client, {
            userId,
            skillId: skill.skillId,
            source: 'CHALLENGE',
            confidence: 1,
            proficiency: 0.8,
          });
          const evidence = await insertEvidence(client, {
            userId,
            challengeId: challenge.id,
            skillId: skill.skillId,
            title: challenge.title,
            description: challenge.description,
            result: `PASSED (${result.score}/100)`,
            status: 'PENDING',
          });
          if (evidence !== null) {
            evidenceCreated += 1;
          }
        }
      }

      return {
        submissionId: submission.id,
        status: submission.status,
        score: result.score,
        feedback: result.feedback,
        evidenceCreated,
      };
    }).then(async (outcome) => {
      await this.achievements.evaluateAndAward(userId);
      return outcome;
    });
  }
}