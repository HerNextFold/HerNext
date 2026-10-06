-- 011_custom_career_ownership.sql
-- Makes a participant-typed career (migration 010, "isCustom" = true) a private,
-- participant-scoped resource instead of an anonymous row that could be reused
-- by anyone who guessed its id.
--
-- Background: migration 010 added "career_paths"."isCustom" but no owner. A
-- custom row shared the table with the approved catalogue and the UNIQUE "name"
-- constraint, so once a participant named a career that name was taken
-- globally, and every by-id lookup resolved the row for anyone. This migration:
--
--   * adds "ownerUserId" (nullable FK -> "users"."id", ON DELETE CASCADE) so a
--     custom career is deleted with its owner and never orphans child rows;
--   * constrains "isCustom" = ("ownerUserId" IS NOT NULL), so a catalogue
--     career can never gain an owner and a custom career can never lose one;
--   * drops the global UNIQUE "name" constraint and replaces it with two partial
--     unique indexes:
--       - catalogue careers stay unique among themselves (lower(name),
--         ownerUserId IS NULL) - two catalogue entries can never share a name;
--       - a participant's own careers stay unique to them (lower(name),
--         ownerUserId), so two participants may each have their own
--         "Nurse to Health Data Analyst" without colliding.
--
-- The skill parallel (migration 009) keeps a single global name for custom
-- skills because they are shared by name, not owned; careers are deliberately
-- stricter here because a participant's target career is an explicit,
-- personal destination.
--
-- Guarded like 009 and 010 so the migration is safe to re-run against a
-- partially migrated database.

ALTER TABLE "career_paths" ADD COLUMN IF NOT EXISTS "ownerUserId" uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'career_paths_ownerUserId_fkey' AND conrelid = 'career_paths'::regclass
  ) THEN
    ALTER TABLE "career_paths"
      ADD CONSTRAINT "career_paths_ownerUserId_fkey"
      FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'career_paths_custom_owner_check' AND conrelid = 'career_paths'::regclass
  ) THEN
    ALTER TABLE "career_paths"
      ADD CONSTRAINT "career_paths_custom_owner_check"
      CHECK ("isCustom" = ("ownerUserId" IS NOT NULL));
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'career_paths_name_key' AND conrelid = 'career_paths'::regclass
  ) THEN
    ALTER TABLE "career_paths" DROP CONSTRAINT "career_paths_name_key";
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "career_paths_catalogue_name_idx"
  ON "career_paths" (lower("name"))
  WHERE "ownerUserId" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "career_paths_custom_name_idx"
  ON "career_paths" (lower("name"), "ownerUserId")
  WHERE "ownerUserId" IS NOT NULL;

COMMENT ON COLUMN "career_paths"."ownerUserId" IS
  'Null for an approved HerNext catalogue career. The owning participant id for a career the participant named themselves; custom careers are scoped to their owner, deleted when the owner is deleted, and never returned as catalogue options.';