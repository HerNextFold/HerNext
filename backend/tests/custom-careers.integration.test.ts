import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { checkDatabaseConnection, closeDb, getPool, initDb, queryRow, queryText } from '../src/lib/db.js';
import { deleteUserByEmail } from '../src/models/user.model.js';
import { AiService } from '../src/modules/ai/ai.service.js';
import {
  UnconfiguredProvider,
  type LLMProvider,
} from '../src/modules/ai/providers/llm.provider.js';
import { readLatestOtp, TEST_PASSWORD } from './helpers/auth.js';

// End-to-end custom career support (migration 011 + Phase 2):
//
//  A. A participant names their own target career during onboarding; it is
//     stored as an owner-scoped custom career and never appears in the
//     catalogue list.
//  B. A catalogue target career id keeps working unchanged (not custom).
//  C. Two participants may each have their own career with the same name.
//  D. Guards: id+name together / neither rejected on onboarding; a foreign
//     custom career is 403; GET skill-gaps on a custom career with no
//     generated requirements is read-only and empty.
//  E. PUT /profile accepts (and can clear) a participant-named career.
//  F. AI-derived requirements are generated once for a custom career, then
//     skill gaps and the roadmap work against them (including custom skills).
//  G. When the AI provider is unavailable, lazy generation fails safely.
//  H. The shared catalogue stays intact and recommendations stay catalogue-only.
//
// Run with npm run test:db. Participants are cleaned up on the way out;
// custom careers cascade-delete with their owner.
const runDbTests = process.env.RUN_DB_TESTS === '1';

const createdEmails: string[] = [];

function randomEmail(): string {
  const email = `cc-${randomUUID()}@example.com`;
  createdEmails.push(email);
  return email;
}

class FakeProvider implements LLMProvider {
  callCount = 0;
  responder: (input: { system: string; user: string }) => unknown = () => ({});
  async completeStructured(input: { system: string; user: string }): Promise<unknown> {
    this.callCount += 1;
    return this.responder(input);
  }
}

const CUSTOM_CAREER_A = `Nurse to Health Data Analyst ${randomUUID()}`;
const CUSTOM_CAREER_B = `Operations Data Analyst ${randomUUID()}`;
const CUSTOM_CAREER_SHARED = `Health Data Analyst ${randomUUID()}`;

interface CareerRow {
  id: string;
  name: string;
  isCustom: boolean;
  ownerUserId: string | null;
}

async function firstCatalogueCareer(): Promise<CareerRow> {
  const rows = await queryText<CareerRow>(
    getPool(),
    'SELECT "id", "name", "isCustom", "ownerUserId" FROM "career_paths" WHERE "isCustom" = false AND "ownerUserId" IS NULL ORDER BY "name" ASC LIMIT 1',
  );
  const career = rows[0];
  if (career === undefined) {
    throw new Error('No seeded catalogue career found. Run npm run db:seed before the DB tests.');
  }
  return career;
}

describe.runIf(runDbTests)(
  'custom target careers (integration)',
  () => {
  let app: FastifyInstance;
  let catalogueCareer: CareerRow;

  beforeAll(async () => {
    const config = loadEnv();
    initDb(config);
    if (!(await checkDatabaseConnection())) {
      throw new Error('Database is not reachable. Apply migrations and try again.');
    }
    app = buildApp({ config, logger: false });
    catalogueCareer = await firstCatalogueCareer();
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

  /** Registers, verifies, signs in and returns the authenticated user + token. */
  async function registerUser(): Promise<{ user: { id: string }; token: string }> {
    const email = randomEmail();
    const registered = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        firstName: 'Custom',
        lastName: 'Career',
        email,
        password: TEST_PASSWORD,
        country: 'Nigeria',
        state: 'Lagos',
      },
    });
    expect(registered.statusCode).toBe(201);

    const code = readLatestOtp(app, email, 'EMAIL_VERIFICATION');
    const verify = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/verify-email-otp',
      payload: { email, code },
    });
    expect(verify.statusCode).toBe(200);
    return { user: verify.json().data.user as { id: string }, token: verify.json().data.accessToken as string };
  }

  function onboard(token: string, payload: Record<string, unknown>) {
    return app.inject({
      method: 'POST',
      url: '/api/v1/onboarding',
      headers: { authorization: `Bearer ${token}` },
      payload,
    });
  }

  function customOnboardPayload(targetCareerName: string): Record<string, unknown> {
    return {
      currentOccupation: 'Registered Nurse',
      industry: 'Healthcare',
      yearsOfExperience: 4,
      employmentType: 'EMPLOYED',
      targetCareerName,
      skillIds: [],
    };
  }

  it('A. names a custom career during onboarding; it is scoped and excluded from the catalogue', async () => {
    const { user, token } = await registerUser();
    const response = await onboard(token, customOnboardPayload(CUSTOM_CAREER_A));
    expect(response.statusCode).toBe(200);
    const data = response.json().data as {
      targetCareerId: string;
      targetCareer: { id: string; name: string; isCustom: boolean };
    };
    expect(data.targetCareer.name).toBe(CUSTOM_CAREER_A);
    expect(data.targetCareer.isCustom).toBe(true);

    const row = await queryRow<CareerRow>(
      getPool(),
      'SELECT "id", "name", "isCustom", "ownerUserId" FROM "career_paths" WHERE "id" = $1',
      [data.targetCareerId],
    );
    expect(row?.isCustom).toBe(true);
    expect(row?.ownerUserId).toBe(user.id);

    const profile = await app.inject({
      method: 'GET',
      url: '/api/v1/profile',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(profile.statusCode).toBe(200);
    expect(profile.json().data.targetCareer.isCustom).toBe(true);
  });

  it('B. a catalogue target id on onboarding remains a normal catalogue career', async () => {
    const { token } = await registerUser();
    const response = await onboard(token, {
      currentOccupation: 'Bank Teller',
      industry: 'Financial Services',
      yearsOfExperience: 2,
      employmentType: 'EMPLOYED',
      targetCareerId: catalogueCareer.id,
    });
    expect(response.statusCode).toBe(200);
    const data = response.json().data as { targetCareer: { id: string; isCustom: boolean } };
    expect(data.targetCareer.id).toBe(catalogueCareer.id);
    expect(data.targetCareer.isCustom).toBe(false);
  });

  it('C. two participants may each hold their own same-named custom career', async () => {
    const first = await registerUser();
    const second = await registerUser();
    const responseOne = await onboard(first.token, customOnboardPayload(CUSTOM_CAREER_SHARED));
    const responseTwo = await onboard(second.token, customOnboardPayload(CUSTOM_CAREER_SHARED));
    expect(responseOne.statusCode).toBe(200);
    expect(responseTwo.statusCode).toBe(200);
    const idOne = responseOne.json().data.targetCareerId as string;
    const idTwo = responseTwo.json().data.targetCareerId as string;
    expect(idOne).not.toBe(idTwo);

    const rows = await queryText<CareerRow>(
      getPool(),
      'SELECT "id", "name", "isCustom", "ownerUserId" FROM "career_paths" WHERE lower("name") = lower($1) AND "isCustom" = true',
      [CUSTOM_CAREER_SHARED],
    );
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((row) => row.ownerUserId))).toEqual(new Set([first.user.id, second.user.id]));
  });

  it('D. rejects both and neither target fields, and blocks use of a foreign custom career', async () => {
    const { token } = await registerUser();

    const both = await onboard(token, {
      ...customOnboardPayload(CUSTOM_CAREER_B),
      targetCareerId: catalogueCareer.id,
    });
    expect(both.statusCode).toBe(400);

    const neither = await onboard(token, {
      currentOccupation: 'Call Centre Agent',
      industry: 'Telecoms',
      yearsOfExperience: 3,
      employmentType: 'EMPLOYED',
      skillIds: [],
    });
    expect(neither.statusCode).toBe(400);
  });

  it('D2. a foreign custom career id is rejected with a 403 on every endpoint', async () => {
    const first = await registerUser();
    const foreign = await registerUser();
    const firstOnboard = await onboard(first.token, customOnboardPayload(CUSTOM_CAREER_B));
    expect(firstOnboard.statusCode).toBe(200);
    const foreignCustomCareerId = firstOnboard.json().data.targetCareerId as string;

    const gaps = await app.inject({
      method: 'GET',
      url: `/api/v1/careers/${foreignCustomCareerId}/skill-gaps`,
      headers: { authorization: `Bearer ${foreign.token}` },
    });
    expect(gaps.statusCode).toBe(403);
    expect((gaps.json().error as { code: string }).code).toBe('OWNERSHIP_ERROR');

    const putProfile = await app.inject({
      method: 'PUT',
      url: '/api/v1/profile',
      headers: { authorization: `Bearer ${foreign.token}` },
      payload: {
        currentOccupation: 'Data Entry Clerk',
        industry: 'Administration',
        yearsOfExperience: 2,
        employmentType: 'EMPLOYED',
        targetCareerId: foreignCustomCareerId,
      },
    });
    expect(putProfile.statusCode).toBe(403);
  });

  it('D3. GET skill-gaps on a custom career without requirements is read-only and empty', async () => {
    const { token } = await registerUser();
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/onboarding',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        currentOccupation: 'Lab Technician',
        industry: 'Healthcare',
        yearsOfExperience: 3,
        employmentType: 'EMPLOYED',
        targetCareerName: CUSTOM_CAREER_SHARED,
        skillIds: [],
      },
    });
    expect(response.statusCode).toBe(200);
    const customId = response.json().data.targetCareerId as string;

    const gaps = await app.inject({
      method: 'GET',
      url: `/api/v1/careers/${customId}/skill-gaps`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(gaps.statusCode).toBe(200);
    expect(gaps.json().data.skills).toEqual([]);
  });

  it('E. PUT /profile accepts then clears a participant-named career', async () => {
    const { token } = await registerUser();
    const upsert = await app.inject({
      method: 'PUT',
      url: '/api/v1/profile',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        currentOccupation: 'Bookkeeper',
        industry: 'Administration',
        yearsOfExperience: 3,
        employmentType: 'EMPLOYED',
        targetCareerName: CUSTOM_CAREER_SHARED,
        skillIds: [],
      },
    });
    expect(upsert.statusCode).toBe(200);
    const saved = upsert.json().data as { targetCareer: { name: string; isCustom: boolean } };
    expect(saved.targetCareer.name).toBe(CUSTOM_CAREER_SHARED);
    expect(saved.targetCareer.isCustom).toBe(true);

    const cleared = await app.inject({
      method: 'PUT',
      url: '/api/v1/profile',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        currentOccupation: 'Bookkeeper',
        industry: 'Administration',
        yearsOfExperience: 3,
        employmentType: 'EMPLOYED',
        targetCareerId: null,
        skillIds: [],
      },
    });
    expect(cleared.statusCode).toBe(200);
    expect(cleared.json().data.targetCareerId).toBeNull();
    expect(cleared.json().data.targetCareer).toBeNull();
  });

  it('F. generates custom career requirements once; skill gaps and roadmap then work', async () => {
    const provider = new FakeProvider();
    const service = new AiService(provider);

    const { user, token } = await registerUser();
    const onboarded = await onboard(token, {
      currentOccupation: 'Registered Nurse',
      industry: 'Healthcare',
      yearsOfExperience: 4,
      employmentType: 'EMPLOYED',
      targetCareerName: CUSTOM_CAREER_A,
      skillIds: [],
    });
    expect(onboarded.statusCode).toBe(200);
    const customId = onboarded.json().data.targetCareerId as string;

    // First AI call: the requirements for the participant's own custom career.
    const REQUIREMENT_NAMES = ['Health Data Analysis', 'SQL', 'Data Storytelling'];
    provider.responder = () => ({
      careerName: CUSTOM_CAREER_A,
      careerDescription: 'Analyses health data to support clinical and operational decisions.',
      skills: REQUIREMENT_NAMES.map((name) => ({
        name,
        importance: name === 'Data Storytelling' ? 'IMPORTANT' : 'REQUIRED',
        reason: 'Grounded in the skills a health data analyst needs.',
      })),
    });

    const generated = await service.generateCareerRequirements(user.id, customId);
    expect(generated.career.name).toBe(CUSTOM_CAREER_A);
    expect(new Set(generated.skills.map((s) => s.skillName))).toEqual(new Set(REQUIREMENT_NAMES));
    expect(provider.callCount).toBe(1);

    // At least the names outside the approved catalogue are stored as custom skills.
    const customSkillRows = await queryText<{ name: string; isCustom: boolean }>(
      getPool(),
      `SELECT s."name", s."isCustom"
       FROM "career_skills" cs JOIN "skills" s ON s."id" = cs."skillId"
       WHERE cs."careerPathId" = $1 AND s."isCustom" = true`,
      [customId],
    );
    expect(customSkillRows.length).toBeGreaterThanOrEqual(2);

    // Idempotent: a second ensure does not call the AI again.
    provider.responder = () => {
      throw new Error('The provider should not be called a second time.');
    };
    const cached = await service.generateCareerRequirements(user.id, customId);
    expect(new Set(cached.skills.map((s) => s.skillName))).toEqual(new Set(REQUIREMENT_NAMES));
    expect(provider.callCount).toBe(1);

    // Skill gaps computed from the custom requirements, persisted.
    const gaps = await service.runSkillGaps(user.id, customId);
    expect(gaps.career.id).toBe(customId);
    expect(gaps.skills).toHaveLength(REQUIREMENT_NAMES.length);
    expect(gaps.skills.every((g) => g.status !== undefined && g.priority !== undefined)).toBe(true);

    // Roadmap generation resolves task skills against the custom career's
    // requirements (including custom skills), which the catalogue-filtered
    // name map would previously have rejected.
    provider.responder = () => ({
      title: 'Transition from nursing to health data analysis',
      description: 'Build the missing data skills over 90 days.',
      phases: {
        30: REQUIREMENT_NAMES.map((skillName, index) => ({
          title: `Task 1-${index + 1}`,
          description: `Learn ${skillName}.`,
          skillName,
        })),
        60: REQUIREMENT_NAMES.map((skillName, index) => ({
          title: `Task 2-${index + 1}`,
          description: `Practise ${skillName}.`,
          skillName,
        })),
        90: REQUIREMENT_NAMES.map((skillName, index) => ({
          title: `Task 3-${index + 1}`,
          description: `Apply ${skillName}.`,
          skillName,
        })),
      },
    });
    const roadmap = await service.runRoadmap(user.id, customId);
    expect(roadmap.roadmap.careerPathId).toBe(customId);
    expect(roadmap.phases.DAY_30).toHaveLength(3);
    expect(roadmap.phases.DAY_60).toHaveLength(3);
    expect(roadmap.phases.DAY_90).toHaveLength(3);

    const stored = await queryText<{ skillId: string }>(
      getPool(),
      'SELECT "skillId" FROM "roadmap_tasks" WHERE "roadmapId" = $1',
      [roadmap.roadmap.id],
    );
    expect(stored.length).toBeGreaterThanOrEqual(9);
  });

  it('G. lazy generation fails safely when the AI provider is unavailable', async () => {
    const service = new AiService(new UnconfiguredProvider());
    const { user, token } = await registerUser();
    const onboarded = await onboard(token, {
      currentOccupation: 'Ward Clerk',
      industry: 'Healthcare',
      yearsOfExperience: 2,
      employmentType: 'EMPLOYED',
      targetCareerName: `Health Records Analyst ${randomUUID()}`,
      skillIds: [],
    });
    expect(onboarded.statusCode).toBe(200);
    const customId = onboarded.json().data.targetCareerId as string;

    await expect(service.generateCareerRequirements(user.id, customId)).rejects.toMatchObject({
      code: 'AI_SERVICE_ERROR',
      statusCode: 503,
    });
    await expect(service.runSkillGaps(user.id, customId)).rejects.toMatchObject({
      code: 'AI_SERVICE_ERROR',
      statusCode: 503,
    });
  });

  it('H. leaves the shared catalogue intact and recommendations catalogue-only', async () => {
    const { token } = await registerUser();
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/catalogue/careers',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.statusCode).toBe(200);
    const careers = response.json().data as Array<{ name: string }>;
    expect(careers.length).toBeGreaterThan(0);
    const names = new Set(careers.map((career) => career.name));
    for (const custom of [CUSTOM_CAREER_A, CUSTOM_CAREER_B, CUSTOM_CAREER_SHARED]) {
      expect(names.has(custom)).toBe(false);
    }

    const recommendations = await app.inject({
      method: 'GET',
      url: '/api/v1/careers/recommendations',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(recommendations.statusCode).toBe(200);
    const body = recommendations.json().data as { recommendations: Array<{ careerName: string }> };
    expect(body.recommendations.some((item) => names.has(item.careerName))).toBe(false);
  });

}, 180_000);