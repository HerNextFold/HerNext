import { Navigate, Outlet } from 'react-router-dom'

/**
 * Minimal, temporary route guard: only checks whether an access token
 * exists in localStorage. No JWT decoding, expiry checking, or backend
 * session validation yet - that lands with full session handling later.
 * Remove/replace this check in one place once that's built.
 */
function hasAccessToken(): boolean {
  return Boolean(localStorage.getItem('accessToken'))
}

export default function RequireAuth() {
  if (!hasAccessToken()) {
    return <Navigate to="/sign-in" replace />
  }

  return <Outlet />
}
