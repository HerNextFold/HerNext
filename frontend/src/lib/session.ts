/**
 * Session lifecycle for the frontend, kept deliberately free of React imports
 * so that `lib/api.ts` can call it from a plain fetch failure path.
 *
 * The backend signs access tokens with a short lifetime (JWT_EXPIRES_IN,
 * 15 minutes by default). Nothing on the client ever extended that, so once a
 * token aged out the app stayed on a dashboard that looked broken: every
 * authenticated request returned 401, the dead token stayed in localStorage,
 * and the failure was rendered as missing user data.
 *
 * This module owns the single place where an ended session is recognised.
 * `lib/api.ts` detects the 401, calls `endSession()`, and the participant is
 * returned to authentication exactly once.
 */

/** Written by SignIn / VerifyEmail. Also the only marker of "signed in". */
export const ACCESS_TOKEN_KEY = 'accessToken';

/** Owned by UserContext; cleared with the token so no stale user lingers. */
export const USER_SESSION_KEY = 'hernext_user_session';

/**
 * Dispatched just before the redirect so UserContext can drop its in-memory
 * copy of the user while it still has a chance to.
 */
export const SESSION_ENDED_EVENT = 'hernext:session-ended';

/** Where an ended session is sent. Must match the route in App.tsx. */
const SIGN_IN_PATH = '/sign-in';

/** The sign-up step may be pending, so /onboarding is treated as the flow too. */
const AUTH_ROUTES = [
  SIGN_IN_PATH,
  '/sign-up',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/onboarding',
] as const;

export type SessionEndReason = 'expired';

export interface SessionEndedDetail {
  reason: SessionEndReason;
  /** The page the participant was on, so they can be returned to it. */
  returnTo: string | null;
}

const isBrowser = typeof window !== 'undefined';

export function getAccessToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function hasActiveSession(): boolean {
  return getAccessToken() !== null;
}

/**
 * True when the page is already part of the authentication flow. Redirecting
 * to sign-in from one of these is what would create a loop.
 */
export function isAuthRoute(pathname: string): boolean {
  return (AUTH_ROUTES as readonly string[]).includes(pathname)
}

/**
 * Only same-origin, non-protocol-relative paths are accepted, so this can
 * never be used as an open redirect to another origin.
 */
export function sanitizeReturnPath(value: string | null | undefined): string | null {
  if (typeof value !== 'string' || value === '') return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  if (value.startsWith('/\\')) return null
  if (value.includes('\n') || value.includes('\r')) return null
  return value
}

export function buildSignInUrl(returnTo: string | null, reason: SessionEndReason): string {
  const params = new URLSearchParams({ reason });
  const safePath = sanitizeReturnPath(returnTo)
  if (safePath !== null) params.set('next', safePath)
  return `${SIGN_IN_PATH}?${params.toString()}`
}

/**
 * Builds the destination for a fresh, authenticated attempt at the same origin.
 * The `_r` parameter stops the browser from replaying a back/forward-cached
 * copy of the expired dashboard once the new session exists.
 */
export function buildReturnUrl(returnTo: string | null): string {
  const safePath = sanitizeReturnPath(returnTo)
  if (safePath !== null) return `${safePath}${safePath.includes('?') ? '&' : '?'}_r=1`
  return '/dashboard'
}

/**
 * Ends the current session: drops the stale token and the stale user/onboarding
 * cache, then returns the participant to sign-in with a return path.
 *
 * Safe to call from many concurrently failing requests. The first call clears
 * the token synchronously, so every later call fails the `hasActiveSession()`
 * check below and does nothing - one navigation, not one per request. Callers
 * inside the authentication flow are ignored outright.
 */
export function endSession(reason: SessionEndReason): void {
  if (!isBrowser) return

  // No token means there was never a session to end; RequireAuth already
  // renders sign-in for that case. Only an *expired* session is announced.
  if (!hasActiveSession()) return

  // Already in the authentication flow: navigating again would loop.
  if (isAuthRoute(window.location.pathname)) return

  const currentPath = `${window.location.pathname}${window.location.search}`

  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(USER_SESSION_KEY)

    // Clear React's in-memory copy while it is still mounted, otherwise the
    // provider's save effect can write the stale user straight back.
    window.dispatchEvent(new Event(SESSION_ENDED_EVENT))
  } catch {
    // Storage being unavailable must not stop the redirect.
  }

  // `replace` keeps the expired page out of history, so Back cannot return the
  // participant to a dashboard they are no longer signed in to.
  window.location.replace(buildSignInUrl(currentPath, reason))
}
