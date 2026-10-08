import { describe, expect, it } from 'vitest';
import { AppError } from '../src/common/errors/app-error.js';
import {
  learningResourcesDataSchema,
  learningResourceSchema,
  learningResourcesQuerySchema,
  parseLearningTypes,
} from '../src/modules/learning/learning.schemas.js';

function sampleResource(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    dedupeKey: 'youtube:aIRcAruvnKk',
    type: 'video',
    provider: 'YouTube',
    title: 'Reconciliation Basics for Beginners',
    creator: { name: 'Finance Academy', url: 'https://www.youtube.com/channel/UCx123' },
    sourceUrl: 'https://www.youtube.com/watch?v=aIRcAruvnKk',
    videoId: 'aIRcAruvnKk',
    embedUrl: 'https://www.youtube-nocookie.com/embed/aIRcAruvnKk',
    thumbnail: 'https://i.ytimg.com/vi/aIRcAruvnKk/hqdefault.jpg',
    durationMinutes: 14,
    summary: 'Understand how to reconcile ledgers by hand.',
    level: 'BEGINNER',
    isCurated: false,
    discoveredAt: '2025-06-01T10:00:00.000Z',
    publishedAt: '2024-03-10T00:00:00.000Z',
    ...overrides,
  };
}

describe('learning query schema (GET /api/v1/learning/resources)', () => {
  it('parses a valid query with all optional fields', () => {
    expect(learningResourcesQuerySchema.parse({ skill: 'Data Analysis', types: 'video,article', refresh: 'true' })).toEqual({
      skill: 'Data Analysis',
      types: 'video,article',
      refresh: true,
    });
  });

  it('requires a non-empty skill capped at 120 characters', () => {
    expect(() => learningResourcesQuerySchema.parse({})).toThrow();
    expect(() => learningResourcesQuerySchema.parse({ skill: '' })).toThrow();
    expect(() => learningResourcesQuerySchema.parse({ skill: 'x'.repeat(121) })).toThrow();
    expect(learningResourcesQuerySchema.parse({ skill: 'Excel' })).toEqual({ skill: 'Excel' });
  });
});

describe('learning type parsing', () => {
  it('defaults to every supported type', () => {
    expect(parseLearningTypes(undefined)).toEqual(['video', 'article', 'course']);
    expect(parseLearningTypes('  ')).toEqual(['video', 'article', 'course']);
    expect(parseLearningTypes('')).toEqual(['video', 'article', 'course']);
  });

  it('parses and normalizes CSV values', () => {
    expect(parseLearningTypes('video')).toEqual(['video']);
    expect(parseLearningTypes(' video , article ')).toEqual(['video', 'article']);
    expect(parseLearningTypes('video,article,course')).toEqual(['video', 'article', 'course']);
  });

  it('rejects unsupported types explicitly instead of ignoring them', () => {
    expect(() => parseLearningTypes('podcast')).toThrow(AppError);
    expect(() => parseLearningTypes('video,podcast')).toThrow(/Unsupported resource type: podcast/);
    try {
      parseLearningTypes('video,podcast');
    } catch (error) {
      const appError = error as AppError;
      expect(appError.code).toBe('VALIDATION_ERROR');
      expect(appError.statusCode).toBe(400);
    }
  });
});

describe('learning resource response schema', () => {
  it('accepts a fully valid resource', () => {
    expect(learningResourceSchema.safeParse(sampleResource()).success).toBe(true);
  });

  it('rejects invalid types, non-HTTPS links, and wrong level flags', () => {
    expect(learningResourceSchema.safeParse(sampleResource({ type: 'podcast' })).success).toBe(false);
    expect(learningResourceSchema.safeParse(sampleResource({ sourceUrl: 'http://insecure.example.com/x' })).success).toBe(false);
    expect(learningResourceSchema.safeParse(sampleResource({ embedUrl: 'javascript:alert(1)' })).success).toBe(false);
    expect(learningResourceSchema.safeParse(sampleResource({ level: 'ADVANCED' })).success).toBe(false);
    expect(learningResourceSchema.safeParse(sampleResource({ isCurated: true })).success).toBe(true);
  });

  it('accepts nullable optional metadata', () => {
    const nullable = sampleResource({ creator: { name: 'No URL', url: null }, publishedAt: null, durationMinutes: null });
    expect(learningResourceSchema.safeParse(nullable).success).toBe(true);
  });

  it('validates the full data envelope', () => {
    const data = {
      skill: { name: 'Data Analysis', isCustom: false },
      source: 'discovered',
      freshness: 'fresh',
      resources: [sampleResource()],
    };
    expect(learningResourcesDataSchema.safeParse(data).success).toBe(true);
    expect(learningResourcesDataSchema.safeParse({ ...data, source: 'curated' }).success).toBe(true);
    expect(learningResourcesDataSchema.safeParse({ ...data, freshness: 'stale' }).success).toBe(true);
  });
});