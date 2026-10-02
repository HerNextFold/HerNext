import type { FastifyReply, FastifyRequest } from 'fastify';
import { sendOk } from '../../common/utils/api-response.js';
import type { CatalogueService } from './catalogue.service.js';

export class CatalogueController {
  constructor(private readonly service: CatalogueService) {}

  async careers(_request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    return sendOk(reply, await this.service.listCareers());
  }

  async skills(_request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    return sendOk(reply, await this.service.listSkills());
  }
}
