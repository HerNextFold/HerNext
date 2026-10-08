import type { FastifyReply, FastifyRequest } from 'fastify';
import { sendOk } from '../../common/utils/api-response.js';
import { parseOrThrow } from '../../common/utils/validate.js';
import { learningResourcesQuerySchema, parseLearningTypes } from './learning.schemas.js';
import type { LearningService } from './learning.service.js';

/**
 * Thin controller for learning-resource discovery (docs/API_CONTRACT.md §21a).
 * Validates the query, then delegates; identity comes from request.user only.
 */
export class LearningController {
  constructor(private readonly service: LearningService) {}

  async resources(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const query = parseOrThrow(learningResourcesQuerySchema, request.query);
    const types = parseLearningTypes(query.types);
    const data = await this.service.getResources(request.user.id, query.skill, types, query.refresh);
    return sendOk(reply, data);
  }
}