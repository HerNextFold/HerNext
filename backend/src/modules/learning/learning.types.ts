/**
 * Types for the learning-resource module
 * (docs/API_CONTRACT.md §21a, docs/AI_SPEC.md §15a).
 *
 * Two layers feed a response: the server-side curated catalogue
 * (`curated.ts`, hand-picked and served first) and provider-agnostic dynamic
 * discovery (the service speaks to a ResourceSearchProvider that returns fully
 * validated resources with dedupeKeys; ranking/deduplication/caching happen in
 * the service). YouTube is the only implemented provider in the MVP;
 * allowlisted article/course search can be added later without rewriting the
 * service.
 */

export const LEARNING_RESOURCE_TYPES = ['video', 'article', 'course'] as const;
export type LearningResourceType = (typeof LEARNING_RESOURCE_TYPES)[number];

/**
 * Where the returned resources came from:
 * - 'curated'     - only server-side curated resources (the catalogue already
 *                   satisfied the request, or discovery was unavailable).
 * - 'discovered'  - only dynamically discovered resources.
 * - 'mixed'       - curated entries merged in front of discovery results.
 * - 'empty'       - nothing existed for the requested skill and types.
 */
export const LEARNING_SOURCES = ['curated', 'discovered', 'mixed', 'empty'] as const;
export type LearningSource = (typeof LEARNING_SOURCES)[number];

export const LEARNING_FRESHNESS = ['fresh', 'stale'] as const;
export type LearningFreshness = (typeof LEARNING_FRESHNESS)[number];

export interface LearningResourceCreator {
  /** null when the original creator was not recorded (never invented). */
  name: string | null;
  /** Canonical creator/channel URL when the provider returned enough metadata. */
  url: string | null;
}

/**
 * A validated, learning resource. Curated entries (`isCurated: true`) come
 * from the server-side catalogue and carry no discovery metadata
 * (`discoveredAt: null`). Discovered entries carry `isCurated: false` and the
 * provider run timestamp. `summary` is the AI search intent on discovered
 * resources - it is never a per-resource assessment - and the human-written
 * blurb on curated ones.
 */
export interface LearningResource {
  dedupeKey: string;
  type: LearningResourceType;
  provider: string;
  title: string;
  creator: LearningResourceCreator;
  sourceUrl: string;
  videoId: string | null;
  embedUrl: string | null;
  thumbnail: string | null;
  durationMinutes: number | null;
  summary: string | null;
  level: 'BEGINNER';
  isCurated: boolean;
  /** ISO timestamp of the provider run; null for curated resources. */
  discoveredAt: string | null;
  /** Provider-reported publish date (ISO) when useful; null when unknown. */
  publishedAt: string | null;
}

/** AI search intent (validated by learningSearchIntentOutputSchema). */
export interface LearningSearchIntent {
  skill: string;
  intent: string;
  queries: string[];
  preferredTypes: LearningResourceType[];
}

/** Cached payload for a skill+types combination. `intent` is null on payloads
 * served without an AI round trip (curated-only responses). */
export interface CachedLearningPayload {
  generatedAt: string;
  skill: { name: string; isCustom: boolean };
  intent: LearningSearchIntent | null;
  source: LearningSource;
  resources: LearningResource[];
}

export interface LearningResourcesData {
  skill: { name: string; isCustom: boolean };
  source: LearningSource;
  freshness: LearningFreshness;
  resources: LearningResource[];
}

/**
 * A provider that discovers learning resources from external services
 * (YouTube Data API v3 in the current MVP). Providers are responsible for
 * validating raw external data into LearningResource entries carrying stable
 * dedupeKeys; they never accept client-supplied URLs.
 */
export interface ResourceSearchProvider {
  readonly name: string;
  /** false when the provider cannot run (missing API key) - the service fails safely. */
  readonly configured: boolean;
  search(input: {
    queries: string[];
    types: LearningResourceType[];
    maxPerQuery: number;
  }): Promise<LearningResource[]>;
}