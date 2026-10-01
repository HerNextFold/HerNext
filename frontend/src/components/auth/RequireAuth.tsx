import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getAccessToken } from '../../lib/session'

/**
 * Route guard for everything under /onboarding and /dashboard.
 *
 * The backend access token is short lived (JWT_EXPIRES_IN, 15 minutes by
 * default) and is not refreshable from the client. So the token being absent
 * here has two possible causes:
 *
 *   - the participant never signed in, or signed out deliberately; or
 *   - the session expired and `endSession()` already cleared the token and is
 *     navigating to sign-in.
 *
 * Both end at the same place, so this guard only has to send the participant to
 * sign-in and carry where they were. The redirect loop is prevented by
 * `endSession()` refusing to navigate while already on an authentication route.
 */
export default function RequireAuth() {
  const location = useLocation()

  if (!getAccessToken()) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
