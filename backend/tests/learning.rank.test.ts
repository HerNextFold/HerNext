import { describe, expect, it } from 'vitest';
import type { LearningResource } from '../src/modules/learning/learning.types.js';
import { MAX_RESULTS, rankResources } from '../src/modules/learning/rank.js';

const NOW = new Date('2025-06-01T00:00:00.000Z');
const TWO_YEARS_PLUS = '2023-01-01T00:00:00.000Z';
const RECENT = '2025-05-01T00:00:00.000Z';

function item(overrides: Partial<LearningResource> = {}): LearningResource {
  return {
    dedupeKey: `youtube:${Math.random().toString(16).slice(2)}`,
    type: 'video',
    provider: 'YouTube',
    title: 'A generic video',
    creator: { name: 'Creator', url: null },
    sourceUrl: 'https://www.youtube.com/watch?v=x',
    videoId: 'x',
    embedUrl: 'https://www.youtube-nocookie.com/embed/x',
    thumbnail: null,
    durationMinutes: 15,
    summary: null,
    level: 'BEGINNER',
    isCurated: false,
    discoveredAt: NOW.toISOString(),
    publishedAt: RECENT,
    ...overrides,
  };
}

describe('learning resource ranking (deterministic)', () => {
  it('prioritises titles that mention the requested skill', () => {
    const generic = item({ dedupeKey: 'a', title: 'Learn finance essentials' });
    const onTopic = item({ dedupeKey: 'b', title: 'Data analysis for beginners' });
    const ranked = rankResources({
      skillName: 'Data Analysis',
      queries: ['what is data analysis'],
      preferredTypes: ['video'],
      items: [generic, onTopic],
      now: NOW,
    });
    expect(ranked.map((r) => r.dedupeKey)).toEqual(['b', 'a']);
  });

  it('prefers the AI-preferred resource type', () => {
    const video = item({ dedupeKey: 'v', type: 'video', title: 'Reconciliation step by step' });
    const course = item({ dedupeKey: 'c', type: 'course', title: 'Reconciliation step by step' });
    const ranked = rankResources({
      skillName: 'Reconciliation',
      queries: ['how to reconcile accounts'],
      preferredTypes: ['course'],
      items: [video, course],
      now: NOW,
    });
    expect(ranked[0]?.dedupeKey).toBe('c');
  });

  it('prefers recent and sweet-spot-duration videos', () => {
    const old = item({ dedupeKey: 'o', publishedAt: TWO_YEARS_PLUS });
    const recent = item({ dedupeKey: 'r', publishedAt: RECENT });
    const ranked = rankResources({
      skillName: 'Excel',
      queries: ['excel formulas'],
      preferredTypes: ['video'],
      items: [old, recent],
      now: NOW,
    });
    expect(ranked[0]?.dedupeKey).toBe('r');

    const short = item({ dedupeKey: 's', durationMinutes: 1 });
    const sweet = item({ dedupeKey: 'w', durationMinutes: 15 });
    const long = item({ dedupeKey: 'l', durationMinutes: 120 });
    const byDuration = rankResources({
      skillName: 'Excel',
      queries: ['excel formulas'],
      preferredTypes: ['video'],
      items: [short, sweet, long],
      now: NOW,
    });
    expect(byDuration[0]?.dedupeKey).toBe('w');
  });

  it('deduplicates by dedupeKey across provider queries', () => {
    const same = item({ dedupeKey: 'dup', title: 'Reconciliation explained' });
    const other = item({ dedupeKey: 'single', title: 'Reconciliation explained' });
    const ranked = rankResources({
      skillName: 'Reconciliation',
      queries: ['reconciliation'],
      preferredTypes: ['video'],
      items: [same, same, other],
      now: NOW,
    });
    expect(ranked.filter((r) => r.dedupeKey === 'dup')).toHaveLength(1);
  });

  it('caps the result set at MAX_RESULTS', () => {
    const items = Array.from({ length: 30 }, (_, i) =>
      item({ dedupeKey: `k${i}`, title: `Reconciliation topic ${i}` }),
    );
    const ranked = rankResources({
      skillName: 'Reconciliation',
      queries: ['reconciliation'],
      preferredTypes: ['video'],
      items,
      now: NOW,
    });
    expect(ranked.length).toBe(MAX_RESULTS);
  });

  it('breaks ties alphabetically by title for full determinism', () => {
    const a = item({ dedupeKey: '1', title: 'Alpha reconciliation' });
    const b = item({ dedupeKey: '2', title: 'Beta reconciliation' });
    const c = item({ dedupeKey: '3', title: 'Gamma reconciliation' });
    const first = rankResources({
      skillName: 'Reconciliation',
      queries: ['reconciliation'],
      preferredTypes: ['video'],
      items: [c, a, b],
      now: NOW,
    });
    const second = rankResources({
      skillName: 'Reconciliation',
      queries: ['reconciliation'],
      preferredTypes: ['video'],
      items: [b, c, a],
      now: NOW,
    });
    expect(first.map((r) => r.title)).toEqual(second.map((r) => r.title));
    expect(first.map((r) => r.title)).toEqual(['Alpha reconciliation', 'Beta reconciliation', 'Gamma reconciliation']);
  });

  it('is stable across re-runs with the same input', () => {
    const items = [
      item({ dedupeKey: 'k1', title: 'Excel pivot tables', publishedAt: RECENT }),
      item({ dedupeKey: 'k2', title: 'Excel for finance' }),
      item({ dedupeKey: 'k3', title: 'Advanced pivot tables' }),
    ];
    const run = () =>
      rankResources({ skillName: 'Excel', queries: ['excel pivot tables'], preferredTypes: ['video'], items, now: NOW }).map(
        (r) => r.dedupeKey,
      );
    expect(run()).toEqual(run());
  });
});