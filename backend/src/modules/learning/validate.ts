/**
 * Deterministic validation for learning-resource discovery
 * (docs/API_CONTRACT.md §21a, docs/SECURITY_SPEC.md §28a).
 *
 * The AI never produces URLs, and providers only construct URLs from
 * provider-returned identifiers against fixed allowlisted base hosts, so there
 * is no client-supplied URL anywhere on the path. These pure helpers still
 * validate every provider-returned value before it becomes a resource:
 * HTTPS-only links, a valid YouTube video id, required metadata, and
 * embeddability when it is known.
 */

const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
/** Canonical host names the backend is allowed to build resource links for. */
const HTTPS_PROTOCOL = 'https:';

/**
 * Extracts a canonical 11-char YouTube video id from common canonical forms:
 * watch?v=..., youtu.be/..., shorts/..., embed/... and a bare id. Returns null
 * for anything else (never guessed, never derived from AI output).
 */
export function parseYoutubeVideoId(input: string | null | undefined): string | null {
  if (input === undefined || input === null) return null;
  const candidate = input.trim();
  if (YOUTUBE_VIDEO_ID.test(candidate)) {
    return candidate;
  }
  for (const pattern of ['v=', 'shorts/', 'embed/', 'e/']) {
    const at = candidate.indexOf(pattern);
    if (at === -1) continue;
    const tail = candidate.slice(at + pattern.length).split(/[?&#]/)[0];
    if (tail !== undefined && YOUTUBE_VIDEO_ID.test(tail)) {
      return tail;
    }
  }
  const hostIndex = candidate.indexOf('youtu.be/');
  if (hostIndex !== -1) {
    const tail = candidate.slice(hostIndex + 'youtu.be/'.length).split(/[?&#]/)[0];
    if (tail !== undefined && YOUTUBE_VIDEO_ID.test(tail)) {
      return tail;
    }
  }
  return null;
}

export function isValidYoutubeVideoId(id: string): boolean {
  return YOUTUBE_VIDEO_ID.test(id);
}

/**
 * Lowercased hostname with a leading `www.` stripped, or null when the value
 * is not a parseable absolute URL. Used to derive/verify `provider` so it can
 * only ever name the host a resource actually came from.
 */
export function hostnameOf(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname.startsWith('www.') ? hostname.slice(4) : hostname;
  } catch {
    return null;
  }
}

const YOUTUBE_HOSTS = new Set(['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be']);

/** true only for a URL on a YouTube watch/short-link host (https enforced elsewhere). */
export function isYoutubeHost(value: string | null | undefined): boolean {
  const host = hostnameOf(value);
  return host !== null && YOUTUBE_HOSTS.has(host);
}

/** true only for an https YouTube no-cookie embed URL built from a video id. */
export function isYoutubeNocookieEmbedUrl(value: string | null | undefined): boolean {
  if (!isHttpsUrl(value)) return false;
  const url = new URL(value);
  const host = url.hostname.toLowerCase().startsWith('www.')
    ? url.hostname.toLowerCase().slice(4)
    : url.hostname.toLowerCase();
  if (host !== 'youtube-nocookie.com') return false;
  return /^\/embed\/[A-Za-z0-9_-]{11}$/.test(url.pathname);
}

/** true when the source URL resolves to exactly this video id. */
export function sourceMatchesVideoId(sourceUrl: string, videoId: string): boolean {
  return parseYoutubeVideoId(sourceUrl) === videoId;
}

/** true only for an https:// URL. Non-HTTPS and malformed URLs are rejected. */
export function isHttpsUrl(value: string | null | undefined): value is string {
  if (typeof value !== 'string') return false;
  try {
    return new URL(value).protocol === HTTPS_PROTOCOL;
  } catch {
    return false;
  }
}

/**
 * Converts an ISO-8601 duration ("PT1H30M10S") into whole minutes. Returns 0
 * for unknown/empty durations; only positive values are meaningful for the
 * ranking's duration-suitability signal.
 */
export function parseIso8601DurationToMinutes(value: string | null | undefined): number | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value.trim());
  if (match === null) return null;
  const hours = match[1] === undefined ? 0 : Number(match[1]);
  const minutes = match[2] === undefined ? 0 : Number(match[2]);
  const seconds = match[3] === undefined ? 0 : Number(match[3]);
  if (hours === 0 && minutes === 0 && seconds === 0) return null;
  return Math.max(1, Math.round((hours * 3600 + minutes * 60 + seconds) / 60));
}

/**
 * Validates a thumbnail URL. Thumbnails are optional decoration; when present
 * they must be HTTPS and come from a fixed allowlist host (YouTube covers
 * i.ytimg.com). Anything else is dropped rather than surfaced in the response.
 */
export function acceptableThumbnailUrl(value: unknown): boolean {
  if (typeof value !== 'string' || !isHttpsUrl(value)) {
    return false;
  }
  const hostname = new URL(value).hostname;
  return hostname === 'i.ytimg.com' || hostname === 'ytimg.com';
}