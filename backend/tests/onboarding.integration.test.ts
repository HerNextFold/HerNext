import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { checkDatabaseConnection, closeDb, getPool, initDb, queryText } from '../src/lib/db.js';
import { deleteUserByEmail } from '../src/models/user.model.js';
import { readLatestOtp, TEST_PASSWORD } from './helpers/auth.js';

// Exercises POST /onboarding, GET /onboarding/status and the catalogue
// endpoints against the real database. Requires migration 008.
const runDbTests = process.env.RUN_DB_TESTS === '1';

const createdEmails: string[] = [];

function randomEmail(): string {
  const email = `onb-${randomUUID()}@example.com`;
  createdEmails.push(email);
  return email;
}

interface CareerRow {
  id: string;
  name: string;
}
interface SkillRow {
  id: string;
  name: string;
}

describe.runIf(runDbTests)('onboarding API (integration)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const config = loadEnv();
    initDb(config);
    if (!(await checkDatabaseConnection())) {
      throw new Error('Database is not reachable. Apply migrations and try again.');
    }
    app = buildApp({ config, logger: false });
  });

  afterAll(async () => {
    if (app !== undefined) {
      await app.close();
    }
    for (const email of createdEmails) {
      await deleteUserByEmail(undefined, email).catch(() => undefined);
    }
    await closeDb();
  });

  /** Registers, verifies the email, signs in and returns an access token. */
  async function verifiedToken(): Promise<{ token: string; email: string }> {
    const email = randomEmail();
    const registered = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        firstName: 'Onb',
        lastName: 'Tester',
        email,
        password: TEST_PASSWORD,
        country: 'Nigeria',
        state: 'Lagos',
      },
    });
    expect(registered.statusCode).toBe(201);

    const code = readLatestOtp(app, email, 'EMAIL_VERIFICATION');
    const verified = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/verify-email-otp',
      payload: { email, code },
    });
    expect(verified.statusCode).toBe(200);

    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password: TEST_PASSWORD },
    });
    expect(login.statusCode).toBe(200);
    return { token: login.json().data.accessToken as string, email };
  }

  async function firstCareerAndSkill(): Promise<{ career: CareerRow; skills: SkillRow[] }> {
    const careers = await queryText<CareerRow>(
      getPool(),
      'SELECT "id", "name" FROM "career_paths" ORDER BY "name" ASC LIMIT 1',
    );
    const skills = await queryText<SkillRow>(
      getPool(),
      'SELECT "id", "name" FROM "skills" ORDER BY "name" ASC LIMIT 2',
    );
    expect(careers.length).toBeGreaterThan(0);
    expect(skills.length).toBeGreaterThan(0);
    return { career: careers[0]!, skills };
  }

  const basePayload = (careerId: string, skillIds: string[]) => ({
    currentOccupation: 'Software Developer',
    industry: 'Technology & Software',
    yearsOfExperience: 4,
    employmentType: 'EMPLOYED' as const,
    targetCareerId: careerId,
    skillIds,
  });

  it('reports a brand new participant as not onboarded', async () => {
    const { token } = await verifiedToken();
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/onboarding/status',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().data).toEqual({ completed: false, completedAt: null });
  });

  it('requires authentication', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/onboarding/status' });
    expect(response.statusCode).toBe(401);
  });

  it('persists the whole profile, skills, target and experience in one call', async () => {
    const { token } = await verifiedToken();
    const { career, skills } = await firstCareerAndSkill();

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/onboarding',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        ...basePayload(career.id, skills.map((s) => s.id)),
        experience: {
          title: 'Software Developer',
          description: 'Built and shipped customer-facing web applications end to end.',
          employmentType: 'EMPLOYED',
        },
      },
    });
    expect(response.statusCode).toBe(200);

    const profile = response.json().data;
    expect(profile.currentOccupation).toBe('Software Developer');
    expect(profile.targetCareer.id).toBe(career.id);
    // The selected catalogue skills are stored, not free text.
    const storedNames = profile.existingSkills.map((s: { skillName: string }) => s.skillName).sort();
    expect(storedNames).toEqual(skills.map((s) => s.name).sort());

    const status = await app.inject({
      method: 'GET',
      url: '/api/v1/onboarding/status',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(status.json().data.completed).toBe(true);
    expect(status.json().data.completedAt).not.toBeNull();
  });

  it('completes without an experience when the participant has none to give', async () => {
    const { token } = await verifiedToken();
    const { career, skills } = await firstCareerAndSkill();

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/onboarding',
      headers: { authorization: `Bearer ${token}` },
      payload: basePayload(career.id, skills.map((s) => s.id)),
    });
    expect(response.statusCode).toBe(200);

    const status = await app.inject({
      method: 'GET',
      url: '/api/v1/onboarding/status',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(status.json().data.completed).toBe(true);

    const experiences = await app.inject({
      method: 'GET',
      url: '/api/v1/experiences',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(experiences.json().data.experiences).toEqual([]);
  });

  it('rejects an unknown target career and leaves the participant incomplete', async () => {
    const { token } = await verifiedToken();
    const { skills } = await firstCareerAndSkill();

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/onboarding',
      headers: { authorization: `Bearer ${token}` },
      payload: basePayload(randomUUID(), skills.map((s) => s.id)),
    });
    // A well-formed UUID that names no catalogue career is a missing reference
    // (404). A malformed one is rejected earlier by the schema (400).
    expect(response.statusCode).toBe(404);

    // The transaction must not have stamped completion.
    const status = await app.inject({
      method: 'GET',
      url: '/api/v1/onboarding/status',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(status.json().data.completed).toBe(false);
  });

  it('rejects a malformed target career id at the schema boundary', async () => {
    const { token } = await verifiedToken();
    const { skills } = await firstCareerAndSkill();

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/onboarding',
      headers: { authorization: `Bearer ${token}` },
      payload: basePayload('not-a-uuid', skills.map((s) => s.id)),
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an empty experience description rather than storing a blank', async () => {
    const { token } = await verifiedToken();
    const { career, skills } = await firstCareerAndSkill();

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/onboarding',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        ...basePayload(career.id, skills.map((s) => s.id)),
        experience: { title: 'Software Developer', description: '   ', employmentType: 'EMPLOYED' },
      },
    });
    expect(response.statusCode).toBe(400);

    const status = await app.inject({
      method: 'GET',
      url: '/api/v1/onboarding/status',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(status.json().data.completed).toBe(false);
  });

  it('clears a previously stored ranking so stale advice is not reused', async () => {
    const { token } = await verifiedToken();
    const { career, skills } = await firstCareerAndSkill();

    // Seed a stored ranking, then complete onboarding over the top of it.
    const seeded = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/career-recommendations',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(seeded.statusCode).toBe(200);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/onboarding',
      headers: { authorization: `Bearer ${token}` },
      payload: basePayload(career.id, skills.map((s) => s.id)),
    });
    expect(response.statusCode).toBe(200);

    const recommendations = await app.inject({
      method: 'GET',
      url: '/api/v1/careers/recommendations',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(recommendations.statusCode).toBe(200);
    // Either a genuine ranking from the new data, or an honest refusal.
    // Never a ranking computed from the pre-onboarding state.
    const body = recommendations.json().data;
    expect(['READY', 'INSUFFICIENT_DATA']).toContain(body.status);
    if (body.status === 'INSUFFICIENT_DATA') {
      expect(body.recommendations).toEqual([]);
    }
  });

  it('serves the approved catalogue to authenticated participants only', async () => {
    const { token } = await verifiedToken();

    const careers = await app.inject({
      method: 'GET',
      url: '/api/v1/catalogue/careers',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(careers.statusCode).toBe(200);
    // The catalogue endpoints return a bare ordered array in `data`.
    const careerList = careers.json().data as CareerRow[];
    expect(careerList.length).toBeGreaterThan(0);
    for (const career of careerList) {
      expect(typeof career.id).toBe('string');
      expect(career.name.length).toBeGreaterThan(0);
    }

    const skills = await app.inject({
      method: 'GET',
      url: '/api/v1/catalogue/skills',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(skills.statusCode).toBe(200);
    expect((skills.json().data as SkillRow[]).length).toBeGreaterThan(0);

    const anonymous = await app.inject({ method: 'GET', url: '/api/v1/catalogue/careers' });
    expect(anonymous.statusCode).toBe(401);
    // Registering, verifying and signing in a participant is three sequential
    // round trips to a remote database, which exceeds the default budget.
  }, 120_000);
});

describe.runIf(runDbTests)('challenge relevance (integration)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const config = loadEnv();
    initDb(config);
    app = buildApp({ config, logger: false });
  });

  afterAll(async () => {
    if (app !== undefined) await app.close();
    await closeDb();
  });

  it('labels challenges from the participant own data without hiding the catalogue', async () => {
    const email = randomEmail();
    const registered = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        firstName: 'Rel',
        lastName: 'Tester',
        email,
        password: TEST_PASSWORD,
        country: 'Nigeria',
        state: 'Lagos',
      },
    });
    expect(registered.statusCode).toBe(201);
    const code = readLatestOtp(app, email, 'EMAIL_VERIFICATION');
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/verify-email-otp',
      payload: { email, code },
    });
    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password: TEST_PASSWORD },
    });
    const token = login.json().data.accessToken as string;

    const before = await app.inject({
      method: 'GET',
      url: '/api/v1/challenges',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(before.statusCode).toBe(200);
    const beforeList = before.json().data.challenges as Array<{ id: string; relevance: string }>;
    // No profile yet: everything is honestly EXPLORING, and nothing is removed.
    for (const challenge of beforeList) {
      expect(challenge.relevance).toBe('EXPLORING');
    }

    // Target a career whose required skills overlap a real challenge.
    const target = await queryText<{ id: string }>(
      getPool(),
      `SELECT cs."careerPathId" AS "id"
       FROM "career_skills" cs
       JOIN "challenge_skills" chs ON chs."skillId" = cs."skillId"
       GROUP BY cs."careerPathId"
       ORDER BY COUNT(*) DESC
       LIMIT 1`,
    );
    expect(target.length).toBeGreaterThan(0);

    const skills = await queryText<SkillRow>(getPool(), 'SELECT "id", "name" FROM "skills" ORDER BY "name" ASC LIMIT 1');
    const onboarding = await app.inject({
      method: 'POST',
      url: '/api/v1/onboarding',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        currentOccupation: 'Operations Officer',
        industry: 'Financial Services',
        yearsOfExperience: 3,
        employmentType: 'EMPLOYED',
        targetCareerId: target[0]!.id,
        skillIds: skills.map((s) => s.id),
      },
    });
    expect(onboarding.statusCode).toBe(200);

    const after = await app.inject({
      method: 'GET',
      url: '/api/v1/challenges',
      headers: { authorization: `Bearer ${token}` },
    });
    const afterList = after.json().data.challenges as Array<{
      id: string
      relevance: string
      relevanceReason: string
    }>;

    // The catalogue is intact - relevance must never remove a real challenge.
    expect(afterList.length).toBe(beforeList.length);
    // At least one challenge now genuinely overlaps the target career.
    expect(afterList.some((c) => c.relevance === 'RECOMMENDED')).toBe(true);
    // RECOMMENDED sorts ahead of EXPLORING.
    const firstExploring = afterList.findIndex((c) => c.relevance === 'EXPLORING');
    const lastRecommended = afterList.map((c) => c.relevance).lastIndexOf('RECOMMENDED');
    if (firstExploring !== -1 && lastRecommended !== -1) {
      expect(lastRecommended).toBeLessThan(firstExploring);
    }
    for (const challenge of afterList) {
      expect(challenge.relevanceReason.length).toBeGreaterThan(0);
    }
  });
});
