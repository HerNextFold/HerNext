import { describe, expect, it } from 'vitest';
import { AiService } from '../src/modules/ai/ai.service.js';
import { UnconfiguredProvider } from '../src/modules/ai/providers/llm.provider.js';
import { buildLearningCacheKey, LearningService } from '../src/modules/learning/learning.service.js';
import { LEARNING_RESOURCE_TYPES, type ResourceSearchProvider } from '../src/modules/learning/learning.types.js';

/** Provider that must never be reached when validation fails first. */
class NeverProvider implements ResourceSearchProvider {
  readonly name = 'never';
  readonly configured = true;
  async search(): Promise<never> {
    throw new Error('provider should not be called');
  }
}

function buildService(): LearningService {
  return new LearningService(new AiService(new UnconfiguredProvider()), new NeverProvider());
}

const ALL_TYPES = [...LEARNING_RESOURCE_TYPES];

describe('LearningService request validation (no database, no provider)', () => {
  it('rejects an empty or whitespace-only skill with 400', async () => {
    const service = buildService();
    await expect(service.getResources('00000000-0000-4000-8000-000000000000', '', ALL_TYPES)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    });
    await expect(service.getResources('00000000-0000-4000-8000-000000000000', '   ', ALL_TYPES)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('rejects a skill longer than 120 characters', async () => {
    const service = buildService();
    await expect(
      service.getResources('00000000-0000-4000-8000-000000000000', 'x'.repeat(121), ALL_TYPES),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 400 });
  });
});

describe('learning cache keys', () => {
  it('collapses the skill slug to a lowercased normalised fragment', () => {
    expect(buildLearningCacheKey('Data Analysis', ['video', 'article', 'course'])).toBe(
      'learning:resources:data analysis:all',
    );
  });

  it('sorts and joins requested types into a stable slug', () => {
    expect(buildLearningCacheKey('Excel', ['article', 'video'])).toBe('learning:resources:excel:article_video');
    expect(buildLearningCacheKey('Excel', ['video'])).toBe('learning:resources:excel:video');
    expect(buildLearningCacheKey('Excel', ['video', 'video'])).toBe('learning:resources:excel:video');
  });

  it('uses `all` only when every supported type is requested', () => {
    expect(buildLearningCacheKey('AWS', ['video', 'article', 'course'])).toBe('learning:resources:aws:all');
    expect(buildLearningCacheKey('AWS', ['video', 'article'])).toBe('learning:resources:aws:article_video');
  });
});