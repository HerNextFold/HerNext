-- 010_custom_careers.sql
-- Prepares the career reference table for a participant-supplied target
-- career, using exactly the same pattern migration 009 introduced for skills.
--
-- Background: "career_paths" was treated as a curated catalogue. Unlike
-- "skills", it had no flag, so any future row written from participant input
-- would immediately become globally visible through
-- GET /api/v1/catalogue/careers and would be ranked by the career
-- recommendation engine. This migration adds the flag that makes such rows
-- distinguishable, so a participant-typed career can be stored and resolved
-- without ever polluting the shared catalogue.
--
-- This migration deliberately adds NO endpoint, NO service behaviour and NO
-- insert path for participant-typed careers. It is purely the schema
-- prerequisite:
--   * "isCustom" = false -> an approved HerNext catalogue career. Returned by
--     GET /api/v1/catalogue/careers and ranked by career recommendations.
--   * "isCustom" = true  -> reserved for a career a participant named
--     themselves. Every existing row-level lookup ("findCareerById",
--     "findCareerWithSkills") still resolves these by id, so foreign keys on
--     "career_profiles", "skill_gaps", "roadmaps" and "career_recommendations"
--     keep working unchanged.
--
-- Defaults to false, so every existing row is an approved catalogue career,
-- no backfill is required, and current API behaviour is byte-for-byte identical.
--
-- Guarded exactly like 006, 007, 008 and 009 so the migration is safe to re-run
-- against a partially migrated database.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'career_paths' AND column_name = 'isCustom'
  ) THEN
    ALTER TABLE "career_paths"
      ADD COLUMN "isCustom" boolean NOT NULL DEFAULT false;
  END IF;
END
$$;

COMMENT ON COLUMN "career_paths"."isCustom" IS
  'False for an approved HerNext catalogue career. True for a career a participant named themselves; custom careers are never returned as catalogue options and are not ranked by career recommendations.';