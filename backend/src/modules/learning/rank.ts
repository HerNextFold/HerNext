import type { LearningResource, LearningResourceType } from './learning.types.js';

/**
 * Deterministic, explainable ranking for discovered learning resources
 * (docs/API_CONTRACT.md §21a). No ML, no LLM re-ranking: every signal is
 * computed from provider metadata and the requested skill. Signals are
 * additive and cheap to reason about:
 *
 * 1. Skill-name token relevance (title mentions the skill)
 * 2. Match to the generated search queries
 * 3. Source reputation tier (currently constant; a place to raise trusted
 *    providers/channels later)
 * 4. Preferred resource type from the AI intent
 * 5. Recency (newer content is slightly preferred)
 * 6. Duration suitability around the 5-30 minute sweet spot
 *
 * The result is deduplicated by dedupeKey, capped at MAX_RESULTS and then
 * ordered by score descending with a stable alphabetical tie-break.
 */

export const MAX_RESULTS = 8;

const SKILL_TOKEN_BONUS = 3;
const QUERY_TOKEN_BONUS = 2;
const PREFERRED_TYPE_BONUS = 2;
const RECENCY_BONUS = 1;
const DURATION_BONUS = 1;
const DURATION_SWEET_MIN = 5;
const DURATION_SWEET_MAX = 30;
/** Content older than this receives no recency bonus. */
const RECENCY_WINDOW_MS = 1000 * 60 * 60 * 24 * 730;

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((token) => token.length > 1);
}

function tokenOverlap(title: string, phrases: string[], bonus: number): number {
  const titleTokens = new Set(tokenize(title));
  let score = 0;
  for (const phrase of phrases) {
    const phraseTokens = tokenize(phrase);
    for (const token of phraseTokens) {
      if (titleTokens.has(token)) {
        score += bonus;
      }
    }
  }
  return score;
}

function typePreference(type: LearningResourceType, preferred: LearningResourceType[]): number {
  return preferred.includes(type) ? PREFERRED_TYPE_BONUS : 0;
}

function recencyBonus(publishedAt: string | null, nowMs: number): number {
  if (publishedAt === null) return 0;
  const time = Date.parse(publishedAt);
  if (Number.isNaN(time)) return 0;
  if (nowMs - time > RECENCY_WINDOW_MS) return 0;
  return RECENCY_BONUS;
}

function durationBonus(durationMinutes: number | null): number {
  if (durationMinutes === null) return 0;
  if (durationMinutes >= DURATION_SWEET_MIN && durationMinutes <= DURATION_SWEET_MAX) {
    return DURATION_BONUS;
  }
  return 0;
}

/** Reputation tier, currently 0 for every provider; kept as a stable hook. */
function reputationTier(_provider: string): number {
  return 0;
}

export function rankResources(input: {
  skillName: string;
  queries: string[];
  preferredTypes: LearningResourceType[];
  items: LearningResource[];
  now?: Date;
}): LearningResource[] {
  const nowMs = (input.now ?? new Date()).getTime();
  const queries = input.queries.map((query) => query.trim()).filter((query) => query.length > 0);

  const deduped = new Map<string, LearningResource>();
  for (const item of input.items) {
    if (!deduped.has(item.dedupeKey)) {
      deduped.set(item.dedupeKey, item);
    }
  }

  const scored = [...deduped.values()].map((item) => {
    const skillTokens = tokenOverlap(item.title, [input.skillName], SKILL_TOKEN_BONUS);
    const queryTokens = tokenOverlap(item.title, queries, QUERY_TOKEN_BONUS);
    const reputation = reputationTier(item.provider);
    const preferred = typePreference(item.type, input.preferredTypes);
    const recency = recencyBonus(item.publishedAt, nowMs);
    const duration = durationBonus(item.durationMinutes);
    return { item, score: skillTokens + queryTokens + reputation + preferred + recency + duration };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, MAX_RESULTS)
    .map(({ item }) => item);
}

/**
 * Merges curated resources in front of discovered ones (docs/API_CONTRACT.md
 * §21a). Curated entries are hand-picked and verified, so they keep the top
 * slots; discovery fills the rest. Deduplication is by dedupeKey with the
 * curated version winning, and the total is capped at `max` so the response
 * always stays within the documented 10-resource envelope.
 */
export function mergeCuratedAndDiscovered(input: {
  curated: LearningResource[];
  discovered: LearningResource[];
  max?: number;
}): LearningResource[] {
  const limit = input.max ?? MAX_RESULTS;
  const seen = new Set<string>();
  const merged: LearningResource[] = [];
  for (const item of [...input.curated, ...input.discovered]) {
    if (seen.has(item.dedupeKey)) continue;
    seen.add(item.dedupeKey);
    merged.push(item);
    if (merged.length >= limit) break;
  }
  return merged;
}