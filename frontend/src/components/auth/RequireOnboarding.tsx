import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getOnboardingStatus } from '../../lib/api'
import { useUserContext } from '../../context/UserContext'

/**
 * Sends participants who have not completed onboarding to the onboarding flow
 * before they reach the dashboard.
 *
 * The source of truth is the server (`career_profiles.onboarding_completed_at`),
 * not anything cached in the browser, because:
 *
 *   - a previous participant's cached `isOnboarded` would otherwise let the next
 *     user straight into a dashboard full of the wrong account's data; and
 *   - a participant whose onboarding half-saved in the old flow has no
 *     completion marker, so the server is the only thing that knows.
 *
 * While the status is being fetched nothing is rendered and nothing is
 * redirected. Guessing "not completed" during the request would bounce an
 * already-onboarded participant to onboarding on every hard refresh, and the
 * fetch is cancelled on unmount so a fast navigation cannot apply a stale
 * answer.
 *
 * This guard sits *inside* `RequireAuth`, so by the time it runs a token exists
 * and the status request cannot fail with 401.
 */
export default function RequireOnboarding() {
  const location = useLocation()
  const { onboardingCompleted, setOnboardingCompleted } = useUserContext()
  const [isResolving, setIsResolving] = useState(onboardingCompleted === null)

  useEffect(() => {
    // A sign-in or an in-app completion already resolved this; do not re-request.
    if (onboardingCompleted !== null) {
      setIsResolving(false)
      return
    }

    let cancelled = false
    setIsResolving(true)

    getOnboardingStatus()
      .then(({ completed }) => {
        if (cancelled) return
        setOnboardingCompleted(completed)
      })
      .catch(() => {
        if (cancelled) return
        // On a network/server failure the honest state is "unknown". Sending the
        // participant to onboarding is the safe answer: that page writes real
        // data rather than assuming any, and onboarding is re-runnable. A 401
        // here is already impossible - RequireAuth has just confirmed a token -
        // so this cannot mask a session problem.
        setOnboardingCompleted(false)
      })
      .finally(() => {
        if (!cancelled) setIsResolving(false)
      })

    return () => {
      cancelled = true
    }
  }, [onboardingCompleted, setOnboardingCompleted])

  if (onboardingCompleted === null || isResolving) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-plum-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Checking your profile…</p>
        </div>
      </div>
    )
  }

  if (!onboardingCompleted) {
    // `replace` so the dashboard they were denied is not in history and Back
    // cannot bounce them between the two pages.
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
