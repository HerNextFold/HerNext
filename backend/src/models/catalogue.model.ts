import { AppError } from '../common/errors/app-error.js';
import { errorCodes } from '../common/errors/error-codes.js';
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

export async function listCareers(db: Db | undefined): Promise<CareerPathRow[]> {
  return queryText<CareerPathRow>(
    db ?? getPool(),
    'SELECT * FROM "career_paths" ORDER BY "name" ASC',
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
