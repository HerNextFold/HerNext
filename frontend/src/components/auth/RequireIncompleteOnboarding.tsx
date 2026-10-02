import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getOnboardingStatus } from "../../lib/api";
import { useUserContext } from "../../context/UserContext";

type AccessState = "checking" | "allowed" | "completed" | "error";

export default function RequireIncompleteOnboarding() {
  const { setOnboardingCompleted } = useUserContext();
  const [accessState, setAccessState] = useState<AccessState>("checking");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setAccessState("checking");

    getOnboardingStatus()
      .then(({ completed }) => {
        if (cancelled) return;
        setOnboardingCompleted(completed);
        setAccessState(completed ? "completed" : "allowed");
      })
      .catch(() => {
        if (!cancelled) setAccessState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [retry, setOnboardingCompleted]);

  if (accessState === "completed") {
    return <Navigate to="/dashboard" replace />;
  }

  if (accessState === "allowed") {
    return <Outlet />;
  }

  if (accessState === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-sm space-y-4 text-center">
          <p className="text-sm text-slate-700">
            We couldn&apos;t verify your onboarding status. Your answers are
            unchanged; try again to continue.
          </p>
          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            className="rounded-lg bg-plum-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-plum-600 border-t-transparent" />
        <p className="text-sm text-slate-500">
          Checking your onboarding status…
        </p>
      </div>
    </div>
  );
}
