import { describe, expect, it } from 'vitest';
import { listCareers, findCareerById, findCareerWithSkills } from '../src/models/catalogue.model.js';
import type { Db } from '../src/lib/db.js';

// A participant-named career must never reach the shared catalogue list
// (GET /api/v1/catalogue/careers) or the recommendation engine, which both go
// through listCareers. By-id lookups must stay unfiltered so the foreign keys
// on career_profiles, skill_gaps and roadmaps keep resolving any career row.
// This runs without a database by asserting the SQL the model issues.

interface Captured {
  texts: string[];
}

type RowResponder = (text: string) => Record<string, unknown>[];

function fakeDb(respond: RowResponder = () => []): { db: Db; captured: Captured } {
  const captured: Captured = { texts: [] };
  const db = {
    query: async (config: { text: string }) => {
      captured.texts.push(config.text);
      return { rows: respond(config.text) };
    },
  } as unknown as Db;
  return { db, captured };
}

describe('career catalogue excludes participant-named careers', () => {
  it('filters custom careers out of the catalogue list', async () => {
    const { db, captured } = fakeDb();

    await listCareers(db);

    expect(captured.texts).toHaveLength(1);
    expect(captured.texts[0]).toContain('"isCustom" = false');
  });

  it('resolves a career by id regardless of isCustom', async () => {
    const { db, captured } = fakeDb(() => [{ id: 'career-1', name: 'Nurse', isCustom: true }]);

    const career = await findCareerById(db, 'career-1');

    expect(career?.isCustom).toBe(true);
    expect(captured.texts[0]).not.toContain('isCustom');
  });

  it('resolves a career with its skills regardless of isCustom', async () => {
    const career = { id: 'career-1', name: 'Nurse', isCustom: true };
    const { db, captured } = fakeDb((text) => {
      if (text.includes('"career_skills"')) {
        return [{ skillId: 'skill-1', skillName: 'Patient Triage', importance: 'REQUIRED' }];
      }
      if (text.includes('FROM "career_paths"')) {
        return [career];
      }
      return [];
    });

    const found = await findCareerWithSkills(db, 'career-1');

    expect(found?.career.name).toBe('Nurse');
    expect(found?.skills).toEqual([
      { skillId: 'skill-1', skillName: 'Patient Triage', importance: 'REQUIRED' },
    ]);
    expect(captured.texts.some((text) => text.includes('isCustom'))).toBe(false);
  });
});