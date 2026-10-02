-- 009_custom_skills.sql
-- Allows a participant to declare a real skill that is not in the approved
-- HerNext catalogue, instead of being forced to pick a near-enough substitute.
--
-- Background: onboarding persisted "skillIds" only, and the service rejected any
-- id outside the approved catalogue with a 400. The UI reinforced this by
-- telling the participant they could only pick a suggested skill. That made it
-- impossible to record a genuine skill, so participants either picked a skill
-- they did not have or left the step incomplete.
--
-- This migration does not add a parallel skills table and does not relax the
-- "user_skills"."skillId" foreign key, so every existing join, gap calculation
-- and readiness query keeps working untouched. A custom skill is simply a
-- "skills" row that no career is mapped to, flagged so it is never offered to
-- anyone else as a suggestion:
--   * "isCustom" = false -> an approved catalogue skill, returned by
--     GET /api/v1/catalogue/skills and usable for career matching.
--   * "isCustom" = true  -> a participant-supplied skill. Stored, displayed on
--     the profile/Career Passport, and deliberately ignored by catalogue
--     matching because no "career_skills" row can point at it.
--
-- Defaults to false, so every existing row is an approved catalogue skill and
-- no backfill is required.
--
-- Guarded exactly like 006, 007 and 008 so the migration is safe to re-run
-- against a partially migrated database.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'skills' AND column_name = 'isCustom'
  ) THEN
    ALTER TABLE "skills"
      ADD COLUMN "isCustom" boolean NOT NULL DEFAULT false;
  END IF;
END
$$;

COMMENT ON COLUMN "skills"."isCustom" IS
  'False for an approved HerNext catalogue skill. True for a skill a participant typed themselves; custom skills are never returned as catalogue suggestions and are ignored by career matching.';
