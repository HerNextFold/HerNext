import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { LearningController } from './learning.controller.js';
import type { LearningService } from './learning.service.js';
import {
  bearerAuth,
  errResponse,
  okResponse,
  querystring,
} from '../../common/openapi/schemas.js';
import { LEARNING_RESOURCE_TYPES, LEARNING_SOURCES } from './learning.types.js';

const LEARNING_RATE_LIMIT = { max: 20, timeWindow: 60 * 1000 };

const learningResourceOpenApiSchema = {
  type: 'object',
  required: [
    'dedupeKey',
    'type',
    'provider',
    'title',
    'creator',
    'sourceUrl',
    'videoId',
    'embedUrl',
    'thumbnail',
    'durationMinutes',
    'summary',
    'level',
    'isCurated',
    'discoveredAt',
    'publishedAt',
  ],
  additionalProperties: false,
  properties: {
    dedupeKey: { type: 'string', description: 'Stable deduplication identity, e.g. "youtube:aIRcAruvnKk"' },
    type: { type: 'string', enum: [...LEARNING_RESOURCE_TYPES] },
    provider: { type: 'string', description: 'Discovery provider name, e.g. "YouTube"' },
    title: { type: 'string' },
    creator: {
      type: 'object',
      required: ['name', 'url'],
      additionalProperties: false,
      properties: {
        name: {
          type: ['string', 'null'],
          description: 'Creator/channel or publisher name; null on curated videos where the original channel is not recorded',
        },
        url: { type: ['string', 'null'], description: 'Canonical creator/channel URL when known' },
      },
    },
    sourceUrl: { type: 'string', format: 'uri', description: 'Canonical link to the resource' },
    videoId: { type: ['string', 'null'], description: 'YouTube video id (catalogue- or provider-returned, never AI-derived)' },
    embedUrl: {
      type: ['string', 'null'],
      description: 'no-cookie embed URL derived from the video id',
    },
    thumbnail: { type: ['string', 'null'] },
    durationMinutes: { type: ['integer', 'null'], minimum: 1, description: 'Video duration when available' },
    summary: {
      type: ['string', 'null'],
      description:
        'Human-written blurb on curated resources; the AI search intent that motivated the discovery on discovered resources. Never a per-resource assessment',
    },
    level: { type: 'string', enum: ['BEGINNER'] },
    isCurated: { type: 'boolean', description: 'true for hand-picked catalogue entries, false for dynamically discovered ones' },
    discoveredAt: { type: ['string', 'null'], format: 'date-time', description: 'Provider run timestamp; null for curated resources' },
    publishedAt: { type: ['string', 'null'], format: 'date-time', description: 'Provider-reported publish date when useful' },
  },
} as const;

const learningDataOpenApiSchema = {
  type: 'object',
  required: ['skill', 'source', 'freshness', 'resources'],
  additionalProperties: false,
  properties: {
    skill: {
      type: 'object',
      required: ['name', 'isCustom'],
      additionalProperties: false,
      properties: {
        name: { type: 'string', maxLength: 120, description: 'Canonical skill name (catalogue casing when known, otherwise the normalized query)' },
        isCustom: { type: 'boolean', description: 'true when the skill is a user-created custom skill' },
      },
    },
    source: {
      type: 'string',
      enum: [...LEARNING_SOURCES],
      description:
        'curated = only server-side curated catalogue entries (also used when discovery is unavailable); discovered = only dynamically discovered resources; mixed = curated entries merged in front of discovery results; empty = nothing existed for the requested skill and types.',
    },
    freshness: {
      type: 'string',
      enum: ['fresh', 'stale'],
      description:
        'fresh = freshly answered or served from cache within TTL; stale = cached data served because the AI/provider was temporarily unavailable.',
    },
    resources: { type: 'array', items: learningResourceOpenApiSchema, maxItems: 10 },
  },
} as const;

const learningQueryParamsSchema = {
  type: 'object',
  required: ['skill'],
  additionalProperties: false,
  properties: {
    skill: {
      type: 'string',
      minLength: 1,
      maxLength: 120,
      description:
        'Skill to discover learning resources for: an approved catalogue skill, an AI-generated skill from a custom career, or a user-created custom skill. Discovery keys by normalized name and never assumes catalogue membership.',
    },
    types: {
      type: 'string',
      description:
        'Optional CSV of resource types to include: video,article,course. Defaults to all supported types. Only video discovery is implemented in the MVP: article/course-only requests are answered from the curated catalogue with no external calls. Unknown query parameters are rejected with 400.',
    },
    refresh: {
      type: 'boolean',
      description:
        'true forces a fresh discovery run instead of serving the 24h cache. The AI search intent stays cached (24h, per participant) and results remain cached. Accepts true/false/1/0/yes/no; anything else is rejected with 400.',
    },
  },
} as const;

export function registerLearningModule(app: FastifyInstance, service: LearningService): void {
  const controller = new LearningController(service);

  void app.register(
    async (scope) => {
      scope.get(
        '/learning/resources',
        {
          preHandler: scope.authenticate,
          config: { rateLimit: LEARNING_RATE_LIMIT },
          schema: {
            tags: ['Learning'],
            summary: 'Discover learning resources for any skill (curated first, then dynamic discovery)',
            description:
              'Curated-first, lazy discovery: an authenticated participant requests resources for a skill. (1) When the server-side curated catalogue already has 3+ entries for the requested types, they are returned directly with source "curated" - no AI or provider call. (2) Otherwise the 24h cache is served when fresh. (3) Otherwise the backend asks the AI for a structured search intent - which never contains URLs - and runs an external provider search (YouTube Data API v3), validates, ranks, deduplicates, merges curated entries in front of the results and caches the outcome (including an honest empty result) for 24h. Never fabricates resources; source "empty" is returned when nothing exists. Failures fall back to cached or curated data before erroring.',
            operationId: 'learningResources',
            security: bearerAuth,
            querystring: querystring(learningQueryParamsSchema.properties, ['skill']),
            response: {
              200: okResponse('Learning resources (curated, discovered, mixed or empty)', learningDataOpenApiSchema),
              400: errResponse('Missing/oversized skill, unsupported resource type, unknown query parameter, or invalid refresh'),
              401: errResponse('Unauthenticated'),
              422: errResponse('The AI returned unreadable or ungrounded search intent'),
              429: errResponse('Rate limit exceeded'),
              503: errResponse('Learning discovery is not configured and nothing is cached, or the AI/provider is temporarily unavailable'),
            },
          },
        },
        (request: FastifyRequest, reply: FastifyReply) => controller.resources(request, reply),
      );
    },
    { prefix: '/api/v1' },
  );
}