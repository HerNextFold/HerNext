import type { FastifyInstance } from 'fastify';
import { CatalogueController } from './catalogue.controller.js';
import type { CatalogueService } from './catalogue.service.js';
import { bearerAuth, errResponse, okResponse, uuidSchema } from '../../common/openapi/schemas.js';

const careerViewSchema = {
  type: 'object',
  required: ['id', 'name', 'industry', 'description', 'level'],
  additionalProperties: false,
  properties: {
    id: uuidSchema(),
    name: { type: 'string' },
    industry: { type: 'string' },
    description: { type: 'string' },
    level: { type: 'string' },
  },
} as const;

const skillViewSchema = {
  type: 'object',
  required: ['id', 'name', 'category', 'description'],
  additionalProperties: false,
  properties: {
    id: uuidSchema(),
    name: { type: 'string' },
    category: { type: 'string' },
    description: { type: 'string' },
  },
} as const;

/**
 * Read-only approved-catalogue lookups.
 *
 * Clients must send the ids returned here when persisting a target career or
 * self-reported skills; free text is never accepted as a catalogue reference
 * (docs/AGENTS.md §16, §20).
 */
export function registerCatalogueModule(app: FastifyInstance, service: CatalogueService): void {
  const controller = new CatalogueController(service);

  void app.register(
    async (scope) => {
      scope.get(
        '/catalogue/careers',
        {
          preHandler: scope.authenticate,
          schema: {
            tags: ['Catalogue'],
            summary: 'List the approved career catalogue',
            description:
              'Returns every approved career path with its catalogue id. Use the id to persist a participant target career during onboarding.',
            operationId: 'catalogueCareers',
            security: bearerAuth,
            response: {
              200: okResponse('Approved career paths', { type: 'array', items: careerViewSchema }),
              401: errResponse('Unauthenticated'),
            },
          },
        },
        (request, reply) => controller.careers(request, reply),
      );

      scope.get(
        '/catalogue/skills',
        {
          preHandler: scope.authenticate,
          schema: {
            tags: ['Catalogue'],
            summary: 'List the approved skill catalogue',
            description:
              'Returns every approved skill with its catalogue id. Use the id to persist participant self-reported skills during onboarding.',
            operationId: 'catalogueSkills',
            security: bearerAuth,
            response: {
              200: okResponse('Approved skills', { type: 'array', items: skillViewSchema }),
              401: errResponse('Unauthenticated'),
            },
          },
        },
        (request, reply) => controller.skills(request, reply),
      );
    },
    { prefix: '/api/v1' },
  );
}
