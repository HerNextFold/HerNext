import { AppError } from '../../common/errors/app-error.js';
import { errorCodes } from '../../common/errors/error-codes.js';
import { getPool } from '../../lib/db.js';
import { MAX_SKILL_NAME_LENGTH, normalizeSkillName, skillCacheKeyFragment } from '../../common/utils/skill-name.js';
import type { SkillGapStatus } from '../../lib/scoring/skill-gap.js';
import type { GapPriority } from '../../lib/scoring/skill-gap.js';
import { findSkillByName } from '../../models/catalogue.model.js';
import { findLatestRoadmapWithTasks } from '../../models/roadmap.model.js';
import { findSkillGapsForUserCareer } from '../../models/careers.model.js';
import type { AiService } from '../ai/ai.service.js';
import type {
  CachedLearningPayload,
  LearningFreshness,
  LearningResource,
  LearningResourceType,
  LearningResourcesData,
  LearningSearchIntent,
  LearningSource,
  ResourceSearchProvider,
} from './learning.types.js';
import { LEARNING_RESOURCE_TYPES } from './learning.types.js';
import { TtlCache, LEARNING_CACHE_TTL_MS, type Cache } from './cache.js';
import { HttpError } from './http.js';
import { mergeCuratedAndDiscovered, rankResources } from './rank.js';
import { MIN_CURATED_RESULTS, curatedResourcesFor } from './curated.js';
import { learningResourcesDataSchema } from './learning.schemas.js';

/** Raw results requested per AI query; capped so quota stays bounded. */
export const MAX_PROVIDER_RESULTS_PER_QUERY = 5;

/** Catalogue skills row fields the learning service relies on. */
export interface LearningSkillRow {
  id: string;
  name: string;
  isCustom: boolean;
}

/** Optional grounding read from the participant's own records (docs/AI_SPEC.md §15a). */
export interface LearningContext {
  taskTitle?: string;
  taskDescription?: string;
  gapStatus?: SkillGapStatus;
  gapPriority?: GapPriority;
}

/**
 * Data access seam for the learning service. Production uses the database
 * backed implementation below; unit tests inject fakes so discovery flow can
 * be exercised without a database (docs/AGENTS.md §37).
 */
export interface LearningLookups {
  findSkill(skillName: string): Promise<LearningSkillRow | null>;
  loadContext(userId: string, skillId: string | null): Promise<LearningContext>;
}

const dbLookups: LearningLookups = {
  async findSkill(skillName: string): Promise<LearningSkillRow | null> {
    const row = await findSkillByName(getPool(), skillName);
    if (row === null) return null;
    return { id: row.id, name: row.name, isCustom: row.isCustom };
  },

  /**
   * Loads cheap grounding context for the AI prompt when the participant has a
   * current roadmap referencing this skill. Everything is optional and read
   * from the participant's own records only.
   */
  async loadContext(userId: string, skillId: string | null): Promise<LearningContext> {
    if (skillId === null) return {};
    const roadmap = await findLatestRoadmapWithTasks(getPool(), userId);
    if (roadmap === null) return {};
    const context: LearningContext = {};
    const task = roadmap.tasks.find((t) => t.skillId === skillId);
    if (task !== undefined) {
      if (task.title.trim().length > 0) context.taskTitle = task.title;
      if (task.description.trim().length > 0) context.taskDescription = task.description;
    }
    const gaps = await findSkillGapsForUserCareer(getPool(), userId, roadmap.roadmap.careerPathId);
    const gap = gaps.find((g) => g.skillId === skillId);
    if (gap !== undefined) {
      context.gapStatus = gap.status;
      context.gapPriority = gap.priority;
    }
    return context;
  },
};

/**
 * Learning-resource service (docs/API_CONTRACT.md §21a).
 *
 * Flow: normalize skill → curated catalogue check → cache check → AI search
 * intent (no URLs) → provider search → validation (in the provider) → ranking
 * → curated/discovery merge → cache → response. Curated-first: when the
 * hand-picked catalogue already has MIN_CURATED_RESULTS entries for the
 * requested types, no AI or provider call happens at all. Discovery is lazy:
 * it runs only when resources are requested, never during roadmap generation.
 */
export function buildLearningCacheKey(skillName: string, types: LearningResourceType[]): string {
  const unique = [...new Set(types)];
  const typesSlug = unique.length === LEARNING_RESOURCE_TYPES.length ? 'all' : unique.sort().join('_');
  return `learning:resources:${skillCacheKeyFragment(skillName)}:${typesSlug}`;
}

/**
 * Intent cache key is per participant and skill: a cached intent may quote the
 * participant's own roadmap context, so it must never be served to another
 * participant (docs/SECURITY_SPEC.md §28a).
 */
export function buildLearningIntentCacheKey(userId: string, skillName: string): string {
  return `learning:intent:${userId}:${skillCacheKeyFragment(skillName)}`;
}

/** Response `source` derived from where the returned resources came from. */
export function deriveLearningSource(curatedCount: number, discoveredCount: number): LearningSource {
  if (curatedCount > 0 && discoveredCount > 0) return 'mixed';
  if (curatedCount > 0) return 'curated';
  if (discoveredCount > 0) return 'discovered';
  return 'empty';
}

export class LearningService {
  private readonly cache: Cache<CachedLearningPayload> = new TtlCache<CachedLearningPayload>();
  private readonly intentCache: Cache<LearningSearchIntent> = new TtlCache<LearningSearchIntent>();

  constructor(
    private readonly ai: AiService,
    private readonly youtube: ResourceSearchProvider,
    private readonly lookups: LearningLookups = dbLookups,
  ) {}

  async getResources(
    userId: string,
    skill: string,
    types: LearningResourceType[],
    refresh = false,
  ): Promise<LearningResourcesData> {
    const normalized = normalizeSkillName(skill);
    if (normalized.length === 0) {
      throw new AppError(errorCodes.VALIDATION_ERROR, 'A skill name is required.', 400);
    }
    if (normalized.length > MAX_SKILL_NAME_LENGTH) {
      throw new AppError(
        errorCodes.VALIDATION_ERROR,
        `Skill names are limited to ${MAX_SKILL_NAME_LENGTH} characters.`,
        400,
      );
    }

    // Curated entries are static, hand-picked and verified: when the catalogue
    // already satisfies the request, serve it directly and spend no AI or
    // provider quota.
    const curated = curatedResourcesFor(normalized, types);
    if (curated.length >= MIN_CURATED_RESULTS) {
      return this.respond(staticPayload(await this.skillMeta(normalized), curated), 'fresh');
    }

    const key = buildLearningCacheKey(normalized, types);
    if (!refresh) {
      const fresh = this.cache.get(key);
      if (fresh !== undefined) {
        return this.respond(fresh, 'fresh');
      }
    }
    // Keep the (possibly expired) entry so we can serve stale data when the
    // AI or provider is temporarily unavailable - never fabricated data.
    const stale = this.cache.getStale(key);

    // Only video discovery exists in the MVP: article/course-only requests are
    // answered from the curated catalogue with no external calls at all.
    if (!types.includes('video')) {
      const skillInfo = await this.skillMeta(normalized);
      return this.respond(staticPayload(skillInfo, curated), 'fresh');
    }

    // Skill metadata is read-only: discovery keys by the normalized name and
    // never assumes catalogue membership, so custom-career and user-created
    // custom skills discover the same way as catalogue skills. Learning
    // resources are not user-scoped.
    const skillRow = await this.lookups.findSkill(normalized);
    const skillInfo: { name: string; isCustom: boolean } = {
      name: skillRow?.name ?? normalized,
      isCustom: skillRow?.isCustom ?? false,
    };

    if (!this.youtube.configured) {
      if (stale !== undefined) {
        return this.respond(stale, 'stale');
      }
      // Curated resources do not depend on discovery: serve them rather than
      // failing a request we can actually answer.
      if (curated.length > 0) {
        return this.respond(staticPayload(skillInfo, curated), 'fresh');
      }
      // Fail safely instead of pretending dynamic discovery works.
      throw new AppError(
        errorCodes.LEARNING_SERVICE_UNAVAILABLE,
        'Dynamic learning resource discovery is not configured. Please try again later.',
        503,
      );
    }

    try {
      const intent = await this.searchIntent(userId, normalized, skillRow?.id ?? null);

      const raw = await this.youtube.search({
        queries: intent.queries,
        types,
        maxPerQuery: MAX_PROVIDER_RESULTS_PER_QUERY,
      });
      const ranked = rankResources({
        skillName: normalized,
        queries: intent.queries,
        preferredTypes: intent.preferredTypes,
        items: raw,
      });
      const discovered: LearningResource[] = ranked.map((item) => ({
        ...item,
        summary: intent.intent,
      }));
      const resources = mergeCuratedAndDiscovered({ curated, discovered });

      const payload: CachedLearningPayload = {
        generatedAt: new Date().toISOString(),
        skill: skillInfo,
        intent: toStoredIntent(intent),
        source: deriveLearningSource(curated.length, discovered.length),
        resources,
      };

      // Every discovery outcome is cached, including an honest empty result:
      // a skill with nothing available must not re-spend AI/provider quota for
      // the full TTL. `refresh=true` bypasses the read and rewrites the entry.
      this.cache.set(key, payload, LEARNING_CACHE_TTL_MS);

      return this.respond(payload, 'fresh');
    } catch (error) {
      if (stale !== undefined) {
        return this.respond(stale, 'stale');
      }
      // Curated resources are independent of the failing AI/provider, so an
      // honest curated answer is better than an error for a skill we cover.
      if (curated.length > 0) {
        return this.respond(staticPayload(skillInfo, curated), 'fresh');
      }
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof HttpError) {
        throw new AppError(
          errorCodes.LEARNING_SERVICE_UNAVAILABLE,
          'Learning resource discovery is temporarily unavailable. Please try again shortly.',
          503,
        );
      }
      throw error;
    }
  }

  /**
   * Returns the AI search intent for this participant and skill, reusing the
   * 24h intent cache so different `types`/`refresh` requests for the same
   * skill do not repeat the AI call. A cached intent wins even when refresh is
   * set (only the provider search is re-run); if the AI fails while a
   * previously validated intent exists, that intent is reused instead of
   * failing the request.
   */
  private async searchIntent(
    userId: string,
    skillName: string,
    skillId: string | null,
  ): Promise<LearningSearchIntent> {
    const key = buildLearningIntentCacheKey(userId, skillName);
    const fresh = this.intentCache.get(key);
    if (fresh !== undefined) {
      return fresh;
    }
    const stale = this.intentCache.getStale(key);
    try {
      const context = await this.lookups.loadContext(userId, skillId);
      const intent = await this.ai.generateLearningSearchIntent({
        skillName,
        ...(context.taskTitle !== undefined ? { taskTitle: context.taskTitle } : {}),
        ...(context.taskDescription !== undefined ? { taskDescription: context.taskDescription } : {}),
        ...(context.gapStatus !== undefined ? { gapStatus: context.gapStatus } : {}),
        ...(context.gapPriority !== undefined ? { gapPriority: context.gapPriority } : {}),
      });
      this.intentCache.set(key, intent, LEARNING_CACHE_TTL_MS);
      return intent;
    } catch (error) {
      if (stale !== undefined) {
        return stale;
      }
      throw error;
    }
  }

  private async skillMeta(skillName: string): Promise<{ name: string; isCustom: boolean }> {
    const row = await this.lookups.findSkill(skillName);
    return { name: row?.name ?? skillName, isCustom: row?.isCustom ?? false };
  }

  private respond(payload: CachedLearningPayload, freshness: LearningFreshness): LearningResourcesData {
    return learningResourcesDataSchema.parse({
      skill: payload.skill,
      source: payload.source,
      freshness,
      resources: payload.resources,
    });
  }
}

/** A payload answered without an AI/provider round trip (curated-only). */
function staticPayload(
  skill: { name: string; isCustom: boolean },
  curated: LearningResource[],
): CachedLearningPayload {
  return {
    generatedAt: new Date().toISOString(),
    skill,
    intent: null,
    source: deriveLearningSource(curated.length, 0),
    resources: curated,
  };
}

function toStoredIntent(intent: LearningSearchIntent): LearningSearchIntent {
  return {
    skill: intent.skill,
    intent: intent.intent,
    queries: intent.queries,
    preferredTypes: intent.preferredTypes,
  };
}
