/**
 * Minimal HTTP helper used by the learning-resource discovery providers
 * (docs/API_CONTRACT.md §21a, docs/SECURITY_SPEC.md §28a). Mirrors the existing
 * backend integration style for external calls: native fetch + AbortController
 * timeout + safe error normalisation. Providers only ever call fixed,
 * allowlisted base URLs with server-side credentials - never client-supplied
 * URLs - so this cannot be turned into an SSRF vector.
 */

export type HttpErrorKind = 'timeout' | 'network' | 'http';

export class HttpError extends Error {
  readonly kind: HttpErrorKind;
  /** HTTP status when the failure was a non-2xx response; null otherwise. */
  readonly status: number | null;

  constructor(message: string, kind: HttpErrorKind, status: number | null = null) {
    super(message);
    this.name = 'HttpError';
    this.kind = kind;
    this.status = status;
  }
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const timeoutMs = init.timeoutMs ?? 10_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new HttpError('External request timed out.', 'timeout');
    }
    throw new HttpError('External request failed.', 'network');
  } finally {
    clearTimeout(timer);
  }
}

/** Throws a typed HttpError for non-2xx responses so callers never see internals. */
export async function assertOk(response: Response): Promise<Response> {
  if (!response.ok) {
    throw new HttpError(
      `External provider returned HTTP ${response.status}.`,
      'http',
      response.status,
    );
  }
  return response;
}