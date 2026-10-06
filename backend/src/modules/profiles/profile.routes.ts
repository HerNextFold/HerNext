import type { FastifyInstance } from 'fastify';
import { ProfileController } from './profile.controller.js';
import type { ProfileService } from './profile.service.js';
import {
  EMPLOYMENT_TYPES,
  SKILL_SOURCES,
  bearerAuth,
  bodySchema,
  errResponse,
  okResponse,
  uuidSchema,
} from '../../common/openapi/schemas.js';

const careerProfileViewSchema = {
  type: 'object',
  required: [
    'id',
    'country',
    'state',
    'currentOccupation',
    'industry',
    'yearsOfExperience',
    'education',
    'employmentType',
    'careerInterests',
    'targetCareerId',
    'targetCareer',
    'existingSkills',
    'createdAt',
    'updatedAt',
  ],
  additionalProperties: false,
  properties: {
    id: uuidSchema(),
    country: { type: 'string', description: "The authenticated user's country" },
    state: {
      type: ['string', 'null'],
      description: "The authenticated user's state or province. Null when unset.",
    },
    currentOccupation: { type: 'string' },
    industry: { type: 'string' },
    yearsOfExperience: { type: 'number', minimum: 0, maximum: 100 },
    education: { type: ['string', 'null'] },
    employmentType: { type: 'string', enum: [...EMPLOYMENT_TYPES] },
    careerInterests: { type: ['array', 'null'], items: { type: 'string' } },
    targetCareerId: { type: ['string', 'null'], format: 'uuid' },
    targetCareer: {
      type: ['object', 'null'],
      additionalProperties: false,
      properties: {
        id: uuidSchema(),
        name: { type: 'string' },
        industry: { type: 'string' },
        level: { type: 'string' },
        isCustom: {
          type: 'boolean',
          description: 'True when the participant named this career themselves; such a career is scoped to them and never appears in the shared catalogue.',
        },
      },
    },
    existingSkills: {
      type: 'array',
      items: {
        type: 'object',
        required: ['skillId', 'skillName', 'category', 'source'],
        additionalProperties: false,
        properties: {
          skillId: uuidSchema(),
          skillName: { type: 'string' },
          category: { type: ['string', 'null'] },
          source: { type: 'string', enum: [...SKILL_SOURCES] },
        },
      },
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} as const;

const upsertProfileBodySchema = {
  type: 'object',
  required: ['currentOccupation', 'industry', 'yearsOfExperience', 'employmentType'],
  additionalProperties: false,
  properties: {
    currentOccupation: { type: 'string', minLength: 1, maxLength: 200 },
    industry: { type: 'string', minLength: 1, maxLength: 200 },
    yearsOfExperience: { type: 'number', minimum: 0, maximum: 100 },
    education: { type: ['string', 'null'], maxLength: 300 },
    employmentType: { type: 'string', enum: [...EMPLOYMENT_TYPES] },
    careerInterests: {
      type: ['array', 'null'],
      maxItems: 20,
      items: { type: 'string', minLength: 1, maxLength: 200 },
    },
    targetCareerId: {
      type: ['string', 'null'],
      format: 'uuid',
      description:
        'Approved HerNext career catalogue id, OR the id of the participant\'s own custom career. Mutually exclusive with targetCareerName.',
    },
    targetCareerName: {
      type: ['string', 'null'],
      minLength: 1,
      maxLength: 120,
      description:
        'A career the participant names themselves, used when targetCareerId is omitted. Matched against the catalogue first; otherwise stored as a participant-scoped custom career. Both fields cannot be set together.',
    },
    skillIds: {
      type: ['array'],
      maxItems: 50,
      items: uuidSchema(),
      description: 'Optional skills to add as SELF_REPORTED',
    },
    country: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Optional. Updates the authenticated user location when present.',
    },
    state: {
      type: ['string', 'null'],
      maxLength: 100,
      description: 'Optional. Send null to clear the stored state or province.',
    },
  },
} as const;

const onboardingStatusSchema = {
  type: 'object',
  required: ['completed', 'completedAt'],
  additionalProperties: false,
  properties: {
    completed: {
      type: 'boolean',
      description:
        'True only after a full POST /onboarding submission committed. Never inferred from the profile row existing.',
    },
    completedAt: { type: ['string', 'null'], format: 'date-time' },
  },
} as const;

const completeOnboardingBodySchema = {
  type: 'object',
  required: [
    'currentOccupation',
    'industry',
    'yearsOfExperience',
    'employmentType',
  ],
  additionalProperties: false,
  properties: {
    currentOccupation: { type: 'string', minLength: 1, maxLength: 200 },
    industry: { type: 'string', minLength: 1, maxLength: 200 },
    yearsOfExperience: { type: 'number', minimum: 0, maximum: 100 },
    employmentType: { type: 'string', enum: [...EMPLOYMENT_TYPES] },
    education: { type: ['string', 'null'], maxLength: 300 },
    careerInterests: {
      type: ['array', 'null'],
      maxItems: 20,
      items: { type: 'string', minLength: 1, maxLength: 200 },
    },
    country: { type: 'string', minLength: 1, maxLength: 100 },
    state: { type: ['string', 'null'], maxLength: 100 },
    targetCareerId: {
      type: 'string',
      format: 'uuid',
      description:
        'Approved HerNext career catalogue id. Exactly one of targetCareerId / targetCareerName is required.',
    },
    targetCareerName: {
      type: 'string',
      minLength: 1,
      maxLength: 120,
      description:
        'A career the participant names themselves, used instead of targetCareerId. Stored as a participant-scoped custom career. Exactly one of the two is required.',
    },
    skillIds: { type: ['array'], maxItems: 50, items: uuidSchema() },
    experience: {
      type: ['object', 'null'],
      description:
        'Omit or send null when the participant has no genuine experience to record. Never fabricated.',
      additionalProperties: false,
      properties: {
        title: { type: 'string', minLength: 1, maxLength: 200 },
        description: { type: 'string', minLength: 1, maxLength: 5000 },
        organization: { type: ['string', 'null'], maxLength: 200 },
        years: { type: ['number', 'null'], minimum: 0, maximum: 100 },
        employmentType: { type: 'string', enum: [...EMPLOYMENT_TYPES] },
        startDate: { type: ['string', 'null'], format: 'date' },
        endDate: { type: ['string', 'null'], format: 'date' },
      },
    },
  },
} as const;

export function registerProfileModule(app: FastifyInstance, service: ProfileService): void {
  const controller = new ProfileController(service);

  void app.register(
    async (scope) => {
      scope.get(
        '/profile',
        {
          preHandler: scope.authenticate,
          schema: {
            tags: ['Profile'],
            summary: 'Get the authenticated participant career profile',
            operationId: 'profileGet',
            security: bearerAuth,
            response: {
              200: okResponse('Career profile', careerProfileViewSchema),
              401: errResponse('Unauthenticated'),
              404: errResponse('No career profile yet'),
            },
          },
        },
        (request, reply) => controller.get(request, reply),
      );

      scope.put(
        '/profile',
        {
          preHandler: scope.authenticate,
          schema: {
            tags: ['Profile'],
            summary: 'Create or update the authenticated participant career profile',
            operationId: 'profileUpsert',
            security: bearerAuth,
            body: bodySchema(
              'Career profile fields (upsert; all fields are persisted from this object)',
              upsertProfileBodySchema,
              {
                currentOccupation: 'POS Business Owner',
                industry: 'Financial Services',
                yearsOfExperience: 4,
                education: '',
                employmentType: 'INFORMAL_WORKER',
                careerInterests: ['Operations', 'Financial Services'],
                targetCareerId: '00000000-0000-4000-8000-000000000000',
                skillIds: [],
                country: 'Nigeria',
                state: 'Lagos',
              },
            ),
            response: {
              200: okResponse('Career profile saved', careerProfileViewSchema),
              400: errResponse('Invalid request data'),
              403: errResponse('The target career belongs to another participant'),
              404: errResponse('Career or skill not found'),
            },
          },
        },
        (request, reply) => controller.upsert(request, reply),
      );

      scope.post(
        '/onboarding',
        {
          preHandler: scope.authenticate,
          schema: {
            tags: ['Profile'],
            summary: 'Complete onboarding atomically for the authenticated participant',
            description:
              'Validates and commits the profile, self-reported skills, target career, optional experience and the explicit onboarding completion marker in a single transaction. A failed submission leaves no partial profile behind.',
            operationId: 'onboardingComplete',
            security: bearerAuth,
            body: bodySchema(
              'Full onboarding submission',
              completeOnboardingBodySchema,
              {
                currentOccupation: 'Software Developer',
                industry: 'Technology & Software',
                yearsOfExperience: 4,
                employmentType: 'EMPLOYED',
                education: "Bachelor's Degree",
                careerInterests: ['Product', 'Technology'],
                country: 'Nigeria',
                state: 'Lagos',
                targetCareerId: '00000000-0000-4000-8000-000000000000',
                skillIds: [],
                experience: {
                  title: 'Software Developer',
                  description: 'Built and shipped customer-facing web applications.',
                  employmentType: 'EMPLOYED',
                  years: 4,
                },
              },
            ),
            response: {
              200: okResponse('Onboarding completed', careerProfileViewSchema),
              400: errResponse('Invalid request data'),
              401: errResponse('Unauthenticated'),
              403: errResponse('The target career belongs to another participant'),
              404: errResponse('Target career or participant profile not found'),
            },
          },
        },
        (request, reply) => controller.complete(request, reply),
      );

      scope.get(
        '/onboarding/status',
        {
          preHandler: scope.authenticate,
          schema: {
            tags: ['Profile'],
            summary: 'Get the authenticated participant onboarding completion state',
            operationId: 'onboardingStatus',
            security: bearerAuth,
            response: {
              200: okResponse('Onboarding status', onboardingStatusSchema),
              401: errResponse('Unauthenticated'),
            },
          },
        },
        (request, reply) => controller.status(request, reply),
      );
    },
    { prefix: '/api/v1' },
  );
}