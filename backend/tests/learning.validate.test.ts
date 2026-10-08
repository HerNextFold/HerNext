import { describe, expect, it } from 'vitest';
import {
  acceptableThumbnailUrl,
  isHttpsUrl,
  isValidYoutubeVideoId,
  parseIso8601DurationToMinutes,
  parseYoutubeVideoId,
} from '../src/modules/learning/validate.js';

describe('learning validation: YouTube video id parsing', () => {
  it('accepts a bare canonical 11-char id', () => {
    expect(parseYoutubeVideoId('aIRcAruvnKk')).toBe('aIRcAruvnKk');
    expect(isValidYoutubeVideoId('aIRcAruvnKk')).toBe(true);
  });

  it('extracts ids from watch, youtu.be, shorts, and embed URLs', () => {
    expect(parseYoutubeVideoId('https://www.youtube.com/watch?v=aIRcAruvnKk')).toBe('aIRcAruvnKk');
    expect(parseYoutubeVideoId('https://youtu.be/aIRcAruvnKk?si=t=2')).toBe('aIRcAruvnKk');
    expect(parseYoutubeVideoId('https://www.youtube.com/shorts/aIRcAruvnKk')).toBe('aIRcAruvnKk');
    expect(parseYoutubeVideoId('https://www.youtube.com/embed/aIRcAruvnKk')).toBe('aIRcAruvnKk');
    expect(parseYoutubeVideoId('https://www.youtube-nocookie.com/embed/aIRcAruvnKk')).toBe('aIRcAruvnKk');
  });

  it('strips query/fragment parameters from extracted ids', () => {
    expect(parseYoutubeVideoId('https://www.youtube.com/watch?v=aIRcAruvnKk&feature=youtu.be')).toBe('aIRcAruvnKk');
    expect(parseYoutubeVideoId('https://youtu.be/aIRcAruvnKk#t=10')).toBe('aIRcAruvnKk');
  });

  it('rejects malformed, unparseable, and non-string input', () => {
    expect(parseYoutubeVideoId(null)).toBeNull();
    expect(parseYoutubeVideoId(undefined)).toBeNull();
    expect(parseYoutubeVideoId('')).toBeNull();
    expect(parseYoutubeVideoId('too-short')).toBeNull();
    expect(parseYoutubeVideoId('https://example.com/not-a-video')).toBeNull();
    expect(isValidYoutubeVideoId('not-a-valid-id-with-symbols%')).toBe(false);
  });
});

describe('learning validation: HTTPS-only URLs', () => {
  it('accepts only https:// URLs', () => {
    expect(isHttpsUrl('https://www.youtube.com/watch?v=aIRcAruvnKk')).toBe(true);
    expect(isHttpsUrl('http://www.youtube.com/watch?v=aIRcAruvnKk')).toBe(false);
    expect(isHttpsUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpsUrl('ftp://example.com/file')).toBe(false);
    expect(isHttpsUrl('not a url')).toBe(false);
    expect(isHttpsUrl(null)).toBe(false);
    expect(isHttpsUrl(undefined)).toBe(false);
  });
});

describe('learning validation: ISO-8601 durations', () => {
  it('converts canonical durations to whole minutes', () => {
    expect(parseIso8601DurationToMinutes('PT1H30M10S')).toBe(90);
    expect(parseIso8601DurationToMinutes('PT45S')).toBe(1);
    expect(parseIso8601DurationToMinutes('PT5M')).toBe(5);
    expect(parseIso8601DurationToMinutes('PT2H')).toBe(120);
  });

  it('returns null for unknown or malformed durations', () => {
    expect(parseIso8601DurationToMinutes('')).toBeNull();
    expect(parseIso8601DurationToMinutes('PT0M')).toBeNull();
    expect(parseIso8601DurationToMinutes('1H30M')).toBeNull();
    expect(parseIso8601DurationToMinutes(null)).toBeNull();
    expect(parseIso8601DurationToMinutes(undefined)).toBeNull();
  });
});

describe('learning validation: thumbnail allowlist', () => {
  it('accepts only ytimg.com over HTTPS', () => {
    expect(acceptableThumbnailUrl('https://i.ytimg.com/vi/aIRcAruvnKk/hqdefault.jpg')).toBe(true);
    expect(acceptableThumbnailUrl('https://i.ytimg.com/vi/aIRcAruvnKk/mqdefault.jpg')).toBe(true);
    expect(acceptableThumbnailUrl('https://ytimg.com/x')).toBe(true);
  });

  it('rejects other hosts, non-HTTPS, and non-strings', () => {
    expect(acceptableThumbnailUrl('http://i.ytimg.com/vi/x/hqdefault.jpg')).toBe(false);
    expect(acceptableThumbnailUrl('https://evil.example.com/image.png')).toBe(false);
    expect(acceptableThumbnailUrl('https://i.ytimg.com.example.com/image.png')).toBe(false);
    expect(acceptableThumbnailUrl(42)).toBe(false);
    expect(acceptableThumbnailUrl(null)).toBe(false);
  });
});