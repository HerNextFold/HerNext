import {
  type LearningResource,
  type LearningResourceType,
  type ResourceSearchProvider,
} from '../learning.types.js';
import { HttpError, assertOk, fetchWithTimeout } from '../http.js';
import {
  acceptableThumbnailUrl,
  isValidYoutubeVideoId,
  parseIso8601DurationToMinutes,
} from '../validate.js';

/**
 * YouTube Data API v3 provider (docs/API_CONTRACT.md §24, docs/AI_SPEC.md §15a).
 *
 * Uses only the official API over native fetch (no SDK): `search.list` with
 * `part=snippet&type=video&videoEmbeddable=true` to find embeddable videos for
 * the AI's queries, then `videos.list` with `part=contentDetails,status` to
 * attach duration and embeddability for the surviving ids. Video ids and watch
 * URLs always derive from the provider response - never from AI output.
 *
 * Quota: search.list = 100 units/call, videos.list = 1 unit for up to 50 ids.
 * The service caps the number of searches per uncached skill
 * (MAX_SEARCH_QUERIES below) and caches successful results for 24h, so the
 * default 10,000 units/day budget is not exhausted by routine browsing.
 */
export const YOUTUBE_SEARCH_BASE_URL =
  'https://www.googleapis.com/youtube/v3';
export const YOUTUBE_WATCH_URL = 'https://www.youtube.com/watch';
export const YOUTUBE_NOCOOKIE_EMBED_URL = 'https://www.youtube-nocookie.com/embed';
export const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/channel';

/** Cap on search.list calls per uncached skill (200 quota units). */
export const MAX_YOUTUBE_SEARCH_QUERIES = 2;

interface YoutubeSearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    channelId?: string;
    publishedAt?: string;
    thumbnails?: Record<string, { url?: string }>;
  };
}

interface YoutubeVideoItem {
  id?: string;
  contentDetails?: { duration?: string };
  status?: { embeddable?: boolean };
}

interface YoutubeListResponse<T> {
  items?: T[];
  error?: { message?: string };
}

export class YouTubeProvider implements ResourceSearchProvider {
  readonly name = 'YouTube';
  private readonly apiKey: string | undefined;
  private readonly timeoutMs: number;

  constructor(input: { apiKey: string | undefined; timeoutMs?: number }) {
    this.apiKey = input.apiKey;
    this.timeoutMs = input.timeoutMs ?? 10_000;
  }

  get configured(): boolean {
    return this.apiKey !== undefined && this.apiKey.length > 0;
  }

  async search(input: {
    queries: string[];
    types: LearningResourceType[];
    maxPerQuery: number;
  }): Promise<LearningResource[]> {
    const wantVideo = input.types.includes('video');
    if (!this.configured) {
      throw new HttpError('YouTube provider is not configured.', 'http', 503);
    }
    if (!wantVideo) {
      return [];
    }

    const queries = input.queries.slice(0, MAX_YOUTUBE_SEARCH_QUERIES);
    if (queries.length === 0) {
      return [];
    }

    const candidates: YoutubeSearchItem[] = [];
    for (const query of queries) {
      const items = await this.searchForQuery(query, input.maxPerQuery);
      candidates.push(...items);
    }

    const ids = uniqueVideoIds(candidates);
    if (ids.length === 0) {
      return [];
    }
    const details = await this.fetchVideoDetails(ids);

    const resources: LearningResource[] = [];
    for (const item of candidates) {
      const resource = this.toResource(item, details);
      if (resource !== null) {
        resources.push(resource);
      }
    }
    return resources;
  }

  private async searchForQuery(query: string, maxPerQuery: number): Promise<YoutubeSearchItem[]> {
    const apiKey = this.apiKey;
    if (apiKey === undefined || apiKey.length === 0) {
      throw new HttpError('YouTube provider is not configured.', 'http', 503);
    }
    const url = new URL(`${YOUTUBE_SEARCH_BASE_URL}/search`);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('videoEmbeddable', 'true');
    url.searchParams.set('maxResults', String(maxPerQuery));
    url.searchParams.set('q', query);
    url.searchParams.set('key', apiKey);

    const response = await assertOk(await fetchWithTimeout(url.toString(), { timeoutMs: this.timeoutMs }));
    const data = (await response.json()) as YoutubeListResponse<YoutubeSearchItem>;
    if (data.error?.message !== undefined) {
      throw new HttpError('YouTube search failed.', 'http');
    }
    return data.items ?? [];
  }

  private async fetchVideoDetails(ids: string[]): Promise<Map<string, YoutubeVideoItem>> {
    const apiKey = this.apiKey;
    if (apiKey === undefined || apiKey.length === 0) {
      throw new HttpError('YouTube provider is not configured.', 'http', 503);
    }
    const url = new URL(`${YOUTUBE_SEARCH_BASE_URL}/videos`);
    url.searchParams.set('part', 'contentDetails,status');
    url.searchParams.set('id', ids.join(','));
    url.searchParams.set('key', apiKey);

    const response = await assertOk(await fetchWithTimeout(url.toString(), { timeoutMs: this.timeoutMs }));
    const data = (await response.json()) as YoutubeListResponse<YoutubeVideoItem>;
    if (data.error?.message !== undefined) {
      throw new HttpError('YouTube video details failed.', 'http');
    }
    return new Map((data.items ?? []).map((item) => [item.id ?? '', item]));
  }

  private toResource(
    item: YoutubeSearchItem,
    details: Map<string, YoutubeVideoItem>,
  ): LearningResource | null {
    const videoId = item.id?.videoId;
    if (videoId === undefined || !isValidYoutubeVideoId(videoId)) {
      return null;
    }
    const title = item.snippet?.title?.trim();
    const channelName = item.snippet?.channelTitle?.trim();
    const channelId = item.snippet?.channelId;
    if (title === undefined || title.length === 0) {
      return null;
    }
    if (channelName === undefined || channelName.length === 0) {
      return null;
    }
    const publishedAt = item.snippet?.publishedAt;

    const detail = details.get(videoId);
    // When the videos.list metadata is available, non-embeddable videos are
    // excluded (search already filters videoEmbeddable=true; this is the
    // authoritative re-check). When metadata is missing the video is kept but
    // flagged for the ranker purely by its (null) duration.
    if (detail?.status?.embeddable === false) {
      return null;
    }

    const thumbnail = pickThumbnail(item.snippet?.thumbnails);

    return {
      dedupeKey: `youtube:${videoId}`,
      type: 'video',
      provider: 'YouTube',
      title,
      creator: {
        name: channelName,
        url: channelId !== undefined && channelId.length > 0 ? `${YOUTUBE_CHANNEL_URL}/${channelId}` : null,
      },
      sourceUrl: `${YOUTUBE_WATCH_URL}?v=${videoId}`,
      videoId,
      embedUrl: `${YOUTUBE_NOCOOKIE_EMBED_URL}/${videoId}`,
      thumbnail,
      durationMinutes: parseIso8601DurationToMinutes(detail?.contentDetails?.duration),
      summary: null,
      level: 'BEGINNER',
      isCurated: false,
      discoveredAt: new Date().toISOString(),
      publishedAt: publishedAt ?? null,
    };
  }
}

function uniqueVideoIds(candidates: YoutubeSearchItem[]): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const item of candidates) {
    const videoId = item.id?.videoId;
    if (videoId !== undefined && !seen.has(videoId)) {
      seen.add(videoId);
      ids.push(videoId);
    }
  }
  return ids;
}

function pickThumbnail(
  thumbnails: Record<string, { url?: string }> | undefined,
): string | null {
  if (thumbnails === undefined) return null;
  for (const key of ['high', 'medium', 'default'] as const) {
    const url = thumbnails[key]?.url;
    if (url !== undefined && acceptableThumbnailUrl(url)) {
      return url;
    }
  }
  return null;
}