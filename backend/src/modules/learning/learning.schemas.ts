import { z } from 'zod';
import { AppError } from '../../common/errors/app-error.js';
import { errorCodes } from '../../common/errors/error-codes.js';
import { LEARNING_RESOURCE_TYPES, type LearningResourceType } from './learning.types.js';
import { isAllowedProvider } from './curated.js';
import {
  acceptableThumbnailUrl,
  hostnameOf,
  isHttpsUrl,
  isYoutubeHost,
  isYoutubeNocookieEmbedUrl,
  isValidYoutubeVideoId,
  sourceMatchesVideoId,
} from './validate.js';

/**
 * Request validation for GET /api/v1/learning/resources
 * (docs/API_CONTRACT.md §21a). Validation is exhaustive up front: skill is
 * required (max 120 chars), `types` is an optional CSV restricted to the
 * supported resource types, and `refresh` forces a fresh discovery run. The
 * schema is strict so unknown parameters (for example a client-supplied `url`)
 * are rejected rather than silently ignored.
 */
const TRUE_VALUES = new Set(['true', '1', 'yes']);
const FALSE_VALUES = new Set(['false', '0', 'no']);

/**
 * Parses the query boolean exactly. `z.coerce.boolean()` would treat every
 * non-empty string (including "false") as true, so coercion is replaced with
 * an explicit allowlist: anything else is a 400, never a silent force-refresh.
 */
const queryBoolean = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return value;
}, z.boolean());

export const learningResourcesQuerySchema = z
  .object({
    skill: z.string().min(1).max(120, 'Skill names are limited to 120 characters'),
    types: z.string().optional(),
    refresh: queryBoolean.optional(),
  })
  .strict();

export type LearningResourcesQuery = z.infer<typeof learningResourcesQuerySchema>;

/**
 * Parses the optional `types` CSV into an array of supported resource types.
 * Any unsupported token (for example `podcast`) is rejected rather than
 * silently ignored, so the contract stays explicit. A CSV that yields no
 * tokens means "all types", so `types=,,,` never silently empties the result.
 */
export function parseLearningTypes(raw: string | undefined): LearningResourceType[] {
  if (raw === undefined || raw.trim().length === 0) {
    return [...LEARNING_RESOURCE_TYPES];
  }
  const parsed: string[] = [];
  for (const token of raw.split(',')) {
    const value = token.trim();
    if (value.length === 0) continue;
    parsed.push(value);
  }
  if (parsed.length === 0) {
    return [...LEARNING_RESOURCE_TYPES];
  }
  const supported = new Set<string>(LEARNING_RESOURCE_TYPES);
  const unknown = parsed.filter((value) => !supported.has(value));
  if (unknown.length > 0) {
    throw new AppError(
      errorCodes.VALIDATION_ERROR,
      `Unsupported resource type: ${unknown.join(', ')}. Allowed types: ${LEARNING_RESOURCE_TYPES.join(', ')}.`,
      400,
    );
  }
  return parsed as LearningResourceType[];
}

/**
 * Response validation for the learning-resources payload. Curated and
 * discovered resources are both re-validated here before leaving the service
 * boundary, and the provider/sourceUrl relationship is cross-checked so a
 * resource can only claim a provider it actually came from (docs/SECURITY_SPEC.md
 * §28a): "YouTube" requires a YouTube source URL, any other provider must be a
 * host in the curated allowlist *and* the host of the source URL itself.
 */
export const learningResourceSchema = z
  .object({
    dedupeKey: z.string().min(1).max(500),
    type: z.enum(LEARNING_RESOURCE_TYPES),
    provider: z.string().min(1).max(60),
    title: z.string().min(1),
    creator: z.object({
      name: z.string().min(1).nullable(),
      url: z.string().refine(isHttpsUrl).nullable(),
    }),
    sourceUrl: z.string().refine(isHttpsUrl),
    videoId: z
      .string()
      .refine((value) => isValidYoutubeVideoId(value), 'videoId must be a canonical 11-character YouTube id')
      .nullable(),
    embedUrl: z.string().refine(isHttpsUrl).nullable(),
    thumbnail: z
      .string()
      .refine(acceptableThumbnailUrl, 'thumbnails must come from the ytimg.com allowlist')
      .nullable(),
    durationMinutes: z.number().int().min(1).nullable(),
    summary: z.string().nullable(),
    level: z.literal('BEGINNER'),
    isCurated: z.boolean(),
    discoveredAt: z.string().nullable(),
    publishedAt: z.string().nullable(),
  })
  .superRefine((resource, ctx) => {
    if (resource.type === 'video') {
      if (resource.videoId === null) {
        ctx.addIssue({ code: 'custom', path: ['videoId'], message: 'video resources must carry a videoId' });
      }
      if (resource.embedUrl === null || !isYoutubeNocookieEmbedUrl(resource.embedUrl)) {
        ctx.addIssue({
          code: 'custom',
          path: ['embedUrl'],
          message: 'video resources must carry a YouTube no-cookie embed URL',
        });
      }
    }

    if (resource.provider === 'YouTube') {
      if (!isYoutubeHost(resource.sourceUrl)) {
        ctx.addIssue({ code: 'custom', path: ['sourceUrl'], message: 'YouTube resources must come from a YouTube URL' });
      }
      if (resource.videoId !== null && !sourceMatchesVideoId(resource.sourceUrl, resource.videoId)) {
        ctx.addIssue({ code: 'custom', path: ['videoId'], message: 'videoId must match the source URL' });
      }
      return;
    }

    if (!isAllowedProvider(resource.provider)) {
      ctx.addIssue({ code: 'custom', path: ['provider'], message: `Unsupported provider: ${resource.provider}` });
      return;
    }
    if (hostnameOf(resource.sourceUrl) !== resource.provider.toLowerCase()) {
      ctx.addIssue({
        code: 'custom',
        path: ['provider'],
        message: 'provider must be the host of sourceUrl',
      });
    }
  });

export const learningResourcesDataSchema = z.object({
  skill: z.object({
    name: z.string().min(1).max(120),
    isCustom: z.boolean(),
  }),
  source: z.enum(['curated', 'discovered', 'mixed', 'empty']),
  freshness: z.enum(['fresh', 'stale']),
  resources: z.array(learningResourceSchema).max(10),
});

export type LearningResourcesData = z.infer<typeof learningResourcesDataSchema>;
export type LearningResourceOutput = z.infer<typeof learningResourceSchema>;
