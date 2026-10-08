import { AppError } from '../common/errors/app-error.js';
import { errorCodes } from '../common/errors/error-codes.js';
import {
  invalidCareerNameReason,
  normalizeCareerName,
} from '../common/utils/career-name.js';
import { getPool, queryRow, queryText, type Db } from '../lib/db.js';
import type { SkillImportance } from '../lib/scoring/career-match.js';

export type SkillCategory =
  | 'FINANCIAL'
  | 'OPERATIONS'
  | 'CUSTOMER_SERVICE'
  | 'DATA_ANALYTICS'
  | 'DIGITAL'
  | 'SOFT_SKILLS';

export interface SkillRow {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  /** True when a participant typed this skill themselves (migration 009). */
  isCustom: boolean;
  createdAt: Date;
}

export interface CareerPathRow {
  id: string;
  name: string;
  industry: string;
  description: string;
  level: string;
  /**
   * True when a participant named this career themselves (migration 010).
   * Custom careers are scoped to their owner, never returned as catalogue
   * options and never ranked by the recommendation engine.
   */
  isCustom: boolean;
  /**
   * Null for an approved catalogue career. The owning participant for a
   * custom career (migration 011); the row is deleted when the owner is.
   */
  ownerUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CareerSkillRow {
  id: string;
  careerPathId: string;
  skillId: string;
  importance: SkillImportance;
}

export interface CareerWithSkills extends CareerPathRow {
  skills: CareerSkillRow[];
}

/**
 * The approved catalogue, which is what the UI offers as suggestions.
 *
 * Participant-typed skills live in the same table (migration 009) but are
 * excluded here, so one person's custom skill is never suggested to anyone
 * else.
 */
export async function listSkills(db: Db | undefined): Promise<SkillRow[]> {
  return queryText<SkillRow>(
    db ?? getPool(),
    'SELECT * FROM "skills" WHERE "isCustom" = false ORDER BY "name" ASC',
  );
}

/** Loads every skill belonging to any of the given categories. */
export async function listSkillsInCategories(
  db: Db | undefined,
  categories: readonly string[],
): Promise<SkillRow[]> {
  if (categories.length === 0) {
    return [];
  }
  return queryText<SkillRow>(
    db ?? getPool(),
    'SELECT * FROM "skills" WHERE "category" = ANY($1::skill_category[]) ORDER BY "name" ASC',
    [categories],
  );
}

/**
 * The approved career catalogue, which is what the UI offers as options and
 * what the recommendation engine ranks.
 *
 * Mirrors listSkills: participant-named careers live in the same table
 * (migration 010) but are excluded here, so one person's custom career is
 * never offered or ranked for anyone else. Lookups by id
 * (findCareerById, findCareerWithSkills) are deliberately unfiltered.
 */
export async function listCareers(db: Db | undefined): Promise<CareerPathRow[]> {
  return queryText<CareerPathRow>(
    db ?? getPool(),
    'SELECT * FROM "career_paths" WHERE "isCustom" = false ORDER BY "name" ASC',
  );
}

export async function findCareerById(
  db: Db | undefined,
  id: string,
): Promise<CareerPathRow | null> {
  return queryRow<CareerPathRow>(db ?? getPool(), 'SELECT * FROM "career_paths" WHERE "id" = $1', [id]);
}

/** Loads a career together with its required skills (references and names). */
export async function findCareerWithSkills(
  db: Db | undefined,
  careerPathId: string,
): Promise<{ career: CareerPathRow; skills: Array<{ skillId: string; skillName: string; importance: SkillImportance }> } | null> {
  const pool = db ?? getPool();
  const career = await queryRow<CareerPathRow>(
    pool,
    'SELECT * FROM "career_paths" WHERE "id" = $1',
    [careerPathId],
  );
  if (career === null) {
    return null;
  }
  const skills = await findCareerSkillsWithNames(pool, careerPathId);
  return { career, skills };
}

export async function findCareerSkills(
  db: Db | undefined,
  careerPathId: string,
): Promise<CareerSkillRow[]> {
  return queryText<CareerSkillRow>(
    db ?? getPool(),
    'SELECT * FROM "career_skills" WHERE "careerPathId" = $1',
    [careerPathId],
  );
}

export async function findCareerSkillsWithNames(
  db: Db | undefined,
  careerPathId: string,
): Promise<Array<{ skillId: string; skillName: string; importance: SkillImportance }>> {
  return queryText(
    db ?? getPool(),
    `SELECT cs."skillId", s."name" AS "skillName", cs."importance"
     FROM "career_skills" cs
     JOIN "skills" s ON s."id" = cs."skillId"
     WHERE cs."careerPathId" = $1`,
    [careerPathId],
  );
}

/** Returns a map of skillId -> SkillRow for a set of IDs, and validates ownership. */
export async function findSkillsByIds(
  db: Db | undefined,
  ids: readonly string[],
): Promise<SkillRow[]> {
  if (ids.length === 0) {
    return [];
  }
  return queryText<SkillRow>(
    db ?? getPool(),
    `SELECT * FROM "skills" WHERE "id" = ANY($1::uuid[])`,
    [ids],
  );
}

export interface SkillIdLookup {
  byId: Map<string, SkillRow>;
}

/**
 * Read-only skill lookup by normalized name (case-insensitive). Unlike
 * findOrCreateSkillByName this never inserts; the learning-resource discovery
 * endpoint uses it to report whether a requested skill is a catalogue skill or
 * a user-created custom skill without mutating anything.
 */
export async function findSkillByName(
  db: Db | undefined,
  rawName: string,
): Promise<SkillRow | null> {
  const name = normalizeCareerName(rawName);
  return queryRow<SkillRow>(
    db ?? getPool(),
    'SELECT * FROM "skills" WHERE lower("name") = lower($1) LIMIT 1',
    [name],
  );
}

/**
 * Resolves a participant-typed skill name to a "skills" row.
 *
 * An approved catalogue skill always wins, matched case-insensitively, so
 * typing "reconciliation" reuses the seeded "Reconciliation" skill and keeps
 * it eligible for career matching instead of creating a look-alike custom row.
 * Only a genuinely new name is inserted, flagged "isCustom" so it is stored and
 * displayed but never offered as a suggestion and never matched to a career.
 *
 * Concurrent submissions of the same new name can collide on the UNIQUE
 * "name" constraint, so the insert falls back to a re-read of the existing row.
 */
export async function findOrCreateSkillByName(
  db: Db,
  rawName: string,
): Promise<SkillRow> {
  const name = rawName.trim();
  const existing = await queryRow<SkillRow>(
    db,
    'SELECT * FROM "skills" WHERE lower("name") = lower($1) LIMIT 1',
    [name],
  );
  if (existing !== null) {
    return existing;
  }
  const created = await queryRow<SkillRow>(
    db,
    `INSERT INTO "skills" ("name", "category", "description", "isCustom")
     VALUES ($1, 'SOFT_SKILLS', $2, true)
     ON CONFLICT ("name") DO UPDATE SET "name" = EXCLUDED."name"
     RETURNING *`,
    [name, `Self-declared skill added by the participant: ${name}.`],
  );
  if (created === null) {
    throw new AppError(
      errorCodes.INTERNAL_SERVER_ERROR,
      'Could not save that skill. Please try again.',
      500,
    );
  }
  return created;
}

/**
 * Validates that every provided skill ID exists in the approved catalogue.
 * Throws an AI_OUTPUT_INVALID error listing the unknown IDs so hallucinated
 * skills are never persisted (docs/SECURITY_SPEC.md §32).
 */
export async function validateSkillIds(
  db: Db | undefined,
  ids: readonly string[],
): Promise<SkillIdLookup> {
  const unique = [...new Set(ids)];
  const found = await findSkillsByIds(db, unique);
  const byId = new Map(found.map((s) => [s.id, s]));
  const unknown = unique.filter((id) => !byId.has(id));
  if (unknown.length > 0) {
    throw new AppError(
      errorCodes.AI_OUTPUT_INVALID,
      'One or more skills are not part of the approved skill catalogue.',
      422,
      { unknownSkillIds: unknown },
    );
  }
  return { byId };
}

/** Verifies a single career exists, throwing 404 if not. */
export async function assertCareerExists(db: Db | undefined, careerPathId: string): Promise<CareerPathRow> {
  const career = await findCareerById(db, careerPathId);
  if (career === null) {
    throw new AppError(errorCodes.RESOURCE_NOT_FOUND, 'Career not found', 404);
  }
  return career;
}

/**
 * Verifies a career exists AND the participant may use it: any catalogue
 * career (ownerUserId is null) is usable by everyone, while a participant's
 * custom career is only usable by its owner. Throws 404 for missing rows and
 * 403 for another participant's custom career (docs/SECURITY_SPEC.md §IDOR).
 */
export async function assertCareerAccessible(
  db: Db | undefined,
  careerPathId: string,
  userId: string,
): Promise<CareerPathRow> {
  const career = await findCareerById(db, careerPathId);
  if (career === null) {
    throw new AppError(errorCodes.RESOURCE_NOT_FOUND, 'Career not found', 404);
  }
  if (career.isCustom && career.ownerUserId !== userId) {
    throw new AppError(
      errorCodes.OWNERSHIP_ERROR,
      'This career belongs to another participant and cannot be used.',
      403,
    );
  }
  return career;
}

/** Finds an approved catalogue career by name, case-insensitively (migration 011). */
export async function findCatalogueCareerByName(
  db: Db | undefined,
  rawName: string,
): Promise<CareerPathRow | null> {
  const name = normalizeCareerName(rawName);
  return queryRow<CareerPathRow>(
    db ?? getPool(),
    'SELECT * FROM "career_paths" WHERE lower("name") = lower($1) AND "ownerUserId" IS NULL LIMIT 1',
    [name],
  );
}

/** Finds a custom career owned by a specific participant, by name, case-insensitively. */
export async function findCustomCareerByName(
  db: Db | undefined,
  rawName: string,
  userId: string,
): Promise<CareerPathRow | null> {
  const name = normalizeCareerName(rawName);
  return queryRow<CareerPathRow>(
    db ?? getPool(),
    'SELECT * FROM "career_paths" WHERE lower("name") = lower($1) AND "ownerUserId" = $2 LIMIT 1',
    [name, userId],
  );
}

export interface CustomCareerMetadata {
  industry?: string | null;
  description?: string | null;
}

/**
 * Resolves a participant-typed target career name to a "career_paths" row.
 *
 * An approved catalogue career always wins, matched case-insensitively, so
 * typing "Fintech Operations Associate" reuses the seeded career and keeps the
 * shared catalogue single-source. A participant's own existing custom career
 * is reused on repeat. Only a genuinely new name becomes a new custom career,
 * scoped to the participant via "ownerUserId" (migration 011) so it is stored
 * and resolved for them but never offered as a catalogue option, never ranked,
 * and never usable by another participant.
 *
 * Concurrent submissions of the same new name by the same participant can
 * collide on the partial unique index (lower(name), ownerUserId), so the
 * insert is conflict-safe and falls back to re-reading the owner's own row.
 */
export async function findOrCreateCareerByName(
  db: Db,
  rawName: string,
  userId: string,
  metadata?: CustomCareerMetadata,
): Promise<CareerPathRow> {
  const reason = invalidCareerNameReason(rawName);
  if (reason !== null) {
    throw new AppError(errorCodes.VALIDATION_ERROR, reason, 400);
  }
  const name = normalizeCareerName(rawName);

  const catalogue = await findCatalogueCareerByName(db, name);
  if (catalogue !== null) {
    return catalogue;
  }
  const own = await findCustomCareerByName(db, name, userId);
  if (own !== null) {
    return own;
  }

  const industry = metadata?.industry?.trim() || 'General';
  const description =
    metadata?.description?.trim() || `Career goal named by the participant: ${name}.`;
  const created = await queryRow<CareerPathRow>(
    db,
    `INSERT INTO "career_paths" ("name", "industry", "description", "level", "isCustom", "ownerUserId")
     VALUES ($1, $2, $3, 'Custom', true, $4)
     ON CONFLICT DO NOTHING
     RETURNING *`,
    [name, industry, description, userId],
  );
  if (created !== null) {
    return created;
  }
  const existing = await findCustomCareerByName(db, name, userId);
  if (existing !== null) {
    return existing;
  }
  throw new AppError(
    errorCodes.INTERNAL_SERVER_ERROR,
    'Could not save that career. Please try again.',
    500,
  );
}

/** Replaces the required-skills mapping for a career with new rows. */
export async function replaceCareerSkills(
  db: Db,
  careerPathId: string,
  items: Array<{ skillId: string; importance: SkillImportance }>,
): Promise<void> {
  await queryText(db, 'DELETE FROM "career_skills" WHERE "careerPathId" = $1', [careerPathId]);
  for (const item of items) {
    await queryText(
      db,
      `INSERT INTO "career_skills" ("careerPathId", "skillId", "importance")
       VALUES ($1, $2, $3::skill_importance)`,
      [careerPathId, item.skillId, item.importance],
    );
  }
}

/** Updates the human-readable description of a career row. */
export async function updateCareerDescription(
  db: Db,
  careerPathId: string,
  description: string,
): Promise<void> {
  await queryText(
    db,
    'UPDATE "career_paths" SET "description" = $1, "updatedAt" = now() WHERE "id" = $2',
    [description, careerPathId],
  );
}
