-- 008_onboarding_completion.sql
-- Adds an explicit onboarding completion marker to "career_profiles".
--
-- Background: onboarding completion was previously inferred from the mere
-- existence of a "career_profiles" row. The onboarding screen performed three
-- independent writes (profile, experience, local cache). When the experience
-- write failed validation, the profile row survived while the rest of the
-- journey data was never written, so the user was treated as "onboarded" with
-- an effectively empty profile. A partially-created profile must not count as
-- completed onboarding.
--
-- "onboardingCompletedAt" is nullable and requires no data backfill:
--   * NULL  -> onboarding has not been completed through POST /api/v1/onboarding;
--   * value -> onboarding completed at that instant (idempotent; re-running
--              onboarding refreshes it to the latest completion time).
-- Existing rows therefore read as "not completed" until the user completes
-- onboarding again, which is the safe direction: it re-collects real data
-- instead of trusting a possibly half-written profile.
--
-- Guarded exactly like 006_auth_otps_and_email_verification.sql and
-- 007_user_state_location.sql so the migration is safe to re-run against a
-- partially migrated database.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'career_profiles' AND column_name = 'onboardingCompletedAt'
  ) THEN
    ALTER TABLE "career_profiles"
      ADD COLUMN "onboardingCompletedAt" timestamptz;
  END IF;
END
$$;

COMMENT ON COLUMN "career_profiles"."onboardingCompletedAt" IS
  'Set by POST /api/v1/onboarding when the full onboarding submission commits. NULL means onboarding is incomplete, even if the profile row exists.';
