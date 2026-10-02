import { getPool, queryText, type Db } from '../lib/db.js';

export type ChallengeDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface ChallengeRow {
  id: string;
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  createdAt: Date;
  updatedAt: Date;
}

export async function listChallenges(
  db: Db | undefined,
  filters: { skillId?: string; difficulty?: ChallengeDifficulty } = {},
): Promise<ChallengeRow[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filters.skillId !== undefined) {
    params.push(filters.skillId);
    conditions.push(
      `EXISTS (SELECT 1 FROM "challenge_skills" cs WHERE cs."challengeId" = c."id" AND cs."skillId" = $${params.length})`,
    );
  }
  if (filters.difficulty !== undefined) {
    params.push(filters.difficulty);
    conditions.push(`c."difficulty" = $${params.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return queryText<ChallengeRow>(
    db ?? getPool(),
    `SELECT c.* FROM "challenges" c ${where} ORDER BY c."title" ASC`,
    params,
  );
}

export async function findChallengeById(db: Db | undefined, id: string): Promise<ChallengeRow | null> {
  const rows = await queryText<ChallengeRow>(
    db ?? getPool(),
    'SELECT * FROM "challenges" WHERE "id" = $1',
    [id],
  );
  return rows[0] ?? null;
}

export interface ChallengeSkillRow {
  challengeId: string;
  skillId: string;
  skillName: string;
}

/** Loads the skill ids/names linked to the given challenges in one query. */
export async function listChallengeSkills(
  db: Db | undefined,
  challengeIds: string[],
): Promise<ChallengeSkillRow[]> {
  if (challengeIds.length === 0) {
    return [];
  }
  return queryText<ChallengeSkillRow>(
    db ?? getPool(),
    `SELECT cs."challengeId", s."id" AS "skillId", s."name" AS "skillName"
     FROM "challenge_skills" cs
     JOIN "skills" s ON s."id" = cs."skillId"
     WHERE cs."challengeId" = ANY($1::uuid[])
     ORDER BY s."name" ASC`,
    [challengeIds],
  );
}

export interface ChallengeWithSkills extends ChallengeRow {
  skills: Array<{ skillId: string; skillName: string }>;
}

export interface ChallengeRelevanceRow {
  challengeId: string;
  /** Skills the challenge builds that the participant's target career also requires. */
  targetSkillNames: string[];
  /** Skills the challenge builds that the participant already has. */
  existingSkillNames: string[];
}

/**
 * Scores each challenge's relevance to one participant, from existing tables only.
 *
 * There is no challenge-to-career table in the schema, so relevance is derived
 * through `challenge_skills`, which links every challenge to the approved skills
 * it builds. Two overlaps are counted:
 *
 *   - target: the challenge builds a skill the participant's `targetCareerId`
 *     requires (`career_skills`). This is the strong signal - the challenge
 *     produces evidence for the career they are actually moving toward.
 *   - existing: the challenge builds a skill they already hold (`user_skills`).
 *     A weaker signal - it plays to strengths they can already demonstrate.
 *
 * Nothing is invented and no catalogue row is filtered out: this only annotates
 * and orders the list. `targetCareerId` may be null, in which case only the
 * `existing` overlap is counted.
 */
export async function listChallengeRelevance(
  db: Db | undefined,
  userId: string,
  targetCareerId: string | null,
  challengeIds: string[],
): Promise<ChallengeRelevanceRow[]> {
  if (challengeIds.length === 0) {
    return [];
  }
  return queryText<ChallengeRelevanceRow>(
    db ?? getPool(),
    `SELECT cs."challengeId",
            COALESCE(
              array_agg(DISTINCT s."name") FILTER (WHERE tgt."skillId" IS NOT NULL),
              ARRAY[]::text[]
            ) AS "targetSkillNames",
            COALESCE(
              array_agg(DISTINCT s."name") FILTER (WHERE own."skillId" IS NOT NULL),
              ARRAY[]::text[]
            ) AS "existingSkillNames"
     FROM "challenge_skills" cs
     JOIN "skills" s ON s."id" = cs."skillId"
     LEFT JOIN "career_skills" tgt
       ON tgt."skillId" = cs."skillId"
      AND tgt."careerPathId" = $1::uuid
     LEFT JOIN "user_skills" own
       ON own."skillId" = cs."skillId"
      AND own."userId" = $2::uuid
     WHERE cs."challengeId" = ANY($3::uuid[])
     GROUP BY cs."challengeId"`,
    [targetCareerId, userId, challengeIds],
  );
}

/** Interface shared by challenge list responses so skills are attached once. */
export function attachSkills(
  challenges: ChallengeRow[],
  skillRows: ChallengeSkillRow[],
): ChallengeWithSkills[] {
  const byChallenge = new Map<string, Array<{ skillId: string; skillName: string }>>();
  for (const row of skillRows) {
    const list = byChallenge.get(row.challengeId) ?? [];
    list.push({ skillId: row.skillId, skillName: row.skillName });
    byChallenge.set(row.challengeId, list);
  }
  return challenges.map((challenge) => ({
    ...challenge,
    skills: byChallenge.get(challenge.id) ?? [],
  }));
}