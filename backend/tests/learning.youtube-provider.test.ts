import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LearningResourceType } from '../src/modules/learning/learning.types.js';
import {
  MAX_YOUTUBE_SEARCH_QUERIES,
  YouTubeProvider,
} from '../src/modules/learning/providers/youtube.provider.js';
import { HttpError } from '../src/modules/learning/http.js';

const SEARCH = 'https://www.googleapis.com/youtube/v3/search';
const VIDEOS = 'https://www.googleapis.com/youtube/v3/videos';

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), { status: 200 });
}

/** Search item payloads mirror the YouTube Data API v3 shape. */
function searchItem(videoId: string, overrides: Record<string, unknown> = {}) {
  return {
    id: { videoId },
    snippet: {
      title: 'Data analysis for beginners',
      channelTitle: 'Finance Academy',
      channelId: 'UCfinance',
      publishedAt: '2024-03-10T00:00:00.000Z',
      thumbnails: { high: { url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` } },
      ...overrides,
    },
  };
}

async function mockedFetch(body: (url: URL) => unknown): Promise<void> {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(String(input));
    if (url.origin === new URL(SEARCH).origin && url.pathname === '/youtube/v3/search') {
      return jsonResponse(body(url));
    }
    if (url.origin === new URL(VIDEOS).origin && url.pathname === '/youtube/v3/videos') {
      return jsonResponse(body(url));
    }
    throw new Error(`Unexpected fetch URL: ${url.toString()}`);
  });
}

const ALL_TYPES: LearningResourceType[] = ['video', 'article', 'course'];

describe('YouTubeProvider (mocked fetch, no network)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports itself unconfigured without an API key', () => {
    expect(new YouTubeProvider({ apiKey: undefined }).configured).toBe(false);
    expect(new YouTubeProvider({ apiKey: '' }).configured).toBe(false);
    expect(new YouTubeProvider({ apiKey: 'test-key' }).configured).toBe(true);
  });

  it('fails safely with 503 when unconfigured', async () => {
    const provider = new YouTubeProvider({ apiKey: undefined });
    await expect(
      provider.search({ queries: ['data analysis'], types: ALL_TYPES, maxPerQuery: 5 }),
    ).rejects.toBeInstanceOf(HttpError);
  });

  it('returns nothing for non-video type requests without calling the API', async () => {
    const provider = new YouTubeProvider({ apiKey: 'test-key' });
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await provider.search({ queries: ['data analysis'], types: ['article', 'course'], maxPerQuery: 5 });
    expect(result).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('searches only the AI queries up to the quota cap, then fetches details once', async () => {
    const urls: URL[] = [];
    await mockedFetch((url) => {
      urls.push(url);
      if (url.pathname === '/youtube/v3/search') {
        if (url.searchParams.get('q') === 'data analysis basics') {
          return { items: [searchItem('aaaaaaaaaaa'), searchItem('bbbbbbbbbbb')] };
        }
        return { items: [searchItem('ccccccccccc')] };
      }
      return { items: [{ id: 'aaaaaaaaaaa', contentDetails: { duration: 'PT14M10S' } }] };
    });

    const provider = new YouTubeProvider({ apiKey: 'test-key' });
    const queries = ['data analysis basics', 'data science tutorials', 'third unused query'];
    const result = await provider.search({ queries, types: ALL_TYPES, maxPerQuery: 5 });

    const searchCalls = urls.filter((u) => u.pathname === '/youtube/v3/search');
    expect(searchCalls).toHaveLength(MAX_YOUTUBE_SEARCH_QUERIES);
    expect(searchCalls.map((u) => u.searchParams.get('q'))).toEqual(queries.slice(0, 2));
    expect(searchCalls.every((u) => u.searchParams.get('videoEmbeddable') === 'true')).toBe(true);
    expect(searchCalls.every((u) => u.searchParams.get('type') === 'video')).toBe(true);
    expect(searchCalls.every((u) => u.searchParams.get('maxResults') === '5')).toBe(true);
    expect(urls.some((u) => u.pathname === '/youtube/v3/videos')).toBe(true);

    expect(result.length).toBeGreaterThan(0);
    const first = result[0];
    expect(first?.dedupeKey).toBe('youtube:aaaaaaaaaaa');
    expect(first?.sourceUrl).toBe('https://www.youtube.com/watch?v=aaaaaaaaaaa');
    expect(first?.embedUrl).toBe('https://www.youtube-nocookie.com/embed/aaaaaaaaaaa');
    expect(first?.creator).toEqual({ name: 'Finance Academy', url: 'https://www.youtube.com/channel/UCfinance' });
    expect(first?.durationMinutes).toBe(14);
    expect(first?.type).toBe('video');
    expect(first?.provider).toBe('YouTube');
    expect(first?.summary).toBeNull();
    expect(first?.level).toBe('BEGINNER');
    expect(first?.isCurated).toBe(false);
  });

  it('drops items with invalid ids or missing required metadata', async () => {
    await mockedFetch((url) => {
      if (url.pathname === '/youtube/v3/videos') return { items: [] };
      return {
        items: [
          // Not a valid 11-char id.
          searchItem('invalidid!skippingthistoo'),
          { id: { videoId: 'ddddddddddd' }, snippet: { title: 'No channel', thumbnails: {} } },
          { id: { videoId: 'eeeeeeeeeee' }, snippet: { channelTitle: 'No title' } },
        ],
      };
    });

    const provider = new YouTubeProvider({ apiKey: 'test-key' });
    const result = await provider.search({ queries: ['q'], types: ALL_TYPES, maxPerQuery: 5 });
    expect(result).toEqual([]);
  });

  it('rejects videos the details call marks as non-embeddable', async () => {
    await mockedFetch((url) => {
      if (url.pathname === '/youtube/v3/videos') {
        return { items: [{ id: 'fffffffffff', status: { embeddable: false } }] };
      }
      return { items: [searchItem('fffffffffff')] };
    });
    const provider = new YouTubeProvider({ apiKey: 'test-key' });
    const result = await provider.search({ queries: ['q'], types: ALL_TYPES, maxPerQuery: 5 });
    expect(result).toEqual([]);
  });

  it('strips thumbnails that are not from the allowlisted hosts', async () => {
    await mockedFetch(() => ({
      items: [
        searchItem('ggggggggggg', {
          thumbnails: {
            high: { url: 'https://evil.example.com/path.jpg' },
            default: { url: 'http://i.ytimg.com/vi/ggggggggggg/default.jpg' },
          },
        }),
        searchItem('hhhhhhhhhhh', {
          thumbnails: { high: { url: 'https://i.ytimg.com/vi/hhhhhhhhhhh/hqdefault.jpg' } },
        }),
      ],
    }));
    const provider = new YouTubeProvider({ apiKey: 'test-key' });
    const result = await provider.search({ queries: ['q'], types: ALL_TYPES, maxPerQuery: 5 });
    expect(result.some((r) => r.dedupeKey === 'youtube:ggggggggggg' && r.thumbnail !== null)).toBe(false);
    expect(result.find((r) => r.dedupeKey === 'youtube:hhhhhhhhhhh')?.thumbnail).toBe(
      'https://i.ytimg.com/vi/hhhhhhhhhhh/hqdefault.jpg',
    );
  });

  it('normalizes raw provider failures into HttpError (never leaking internals)', async () => {
    mockedFetch(() => {
      throw new Error('network refused');
    });
    const provider = new YouTubeProvider({ apiKey: 'test-key' });
    await expect(provider.search({ queries: ['q'], types: ALL_TYPES, maxPerQuery: 5 })).rejects.toMatchObject({
      name: 'HttpError',
    });
  });
});