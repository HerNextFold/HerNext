import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { checkDatabaseConnection, closeDb, getPool, initDb, queryText } from '../src/lib/db.js';
import { loadEnv } from '../src/config/env.js';
import { listCareers, findCareerById } from '../src/models/catalogue.model.js';

// Verifies against real SQL that a participant-named career (migrations 010/011,
// isCustom = true + ownerUserId) is never returned by the shared catalogue list,
// while by-id lookups still resolve it so the career_profile / skill_gap /
// roadmap foreign keys keep working.
//
// The row is inserted inside a transaction and rolled back, so the seeded
// catalogue is never modified. Run with npm run test:db.
const runDbTests = process.env.RUN_DB_TESTS === '1';

const CUSTOM_NAME = `Participant-named career ${randomUUID()}`;

describe.runIf(runDbTests)('career catalogue custom-career filtering (integration)', () => {
  beforeAll(async () => {
    initDb(loadEnv());
    if (!(await checkDatabaseConnection())) {
      throw new Error('Database is not reachable. Apply migrations and try again.');
    }
  });

  afterAll(async () => {
    await closeDb();
  });

  it('excludes a custom career from the catalogue but resolves it by id', async () => {
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');

      // Migration 011 ties isCustom to a non-null ownerUserId.
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO "career_paths" ("name", "industry", "description", "level", "isCustom", "ownerUserId")
         SELECT $1, 'Healthcare', 'Inserted by a participant during onboarding.', 'Entry', true, "id"
         FROM "users" ORDER BY "createdAt" DESC LIMIT 1
         RETURNING "id"`,
        [CUSTOM_NAME],
      );
      const customId = inserted.rows[0]?.id;
      expect(customId).toBeDefined();
      if (customId === undefined) {
        throw new Error('Expected the custom career insert to return an id.');
      }

      const catalogue = await listCareers(client);
      expect(catalogue.length).toBeGreaterThan(0);
      expect(catalogue.some((career) => career.name === CUSTOM_NAME)).toBe(false);
      expect(catalogue.every((career) => career.isCustom === false)).toBe(true);

      const resolved = await findCareerById(client, customId);
      expect(resolved?.name).toBe(CUSTOM_NAME);
      expect(resolved?.isCustom).toBe(true);
    } finally {
      await client.query('ROLLBACK').catch(() => undefined);
      client.release();
    }
  });

  it('leaves the seeded catalogue unchanged after rollback', async () => {
    const rows = await queryText<{ total: string; custom: string }>(
      getPool(),
      'SELECT count(*)::text AS total, count(*) FILTER (WHERE "isCustom")::text AS custom FROM "career_paths"',
    );
    const summary = rows[0];
    expect(summary).toBeDefined();
    expect(Number(summary?.custom ?? '1')).toBe(0);
    expect(Number(summary?.total ?? '0')).toBeGreaterThan(0);
  });
});