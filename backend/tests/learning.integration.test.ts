import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { checkDatabaseConnection, closeDb, getPool, initDb, queryText } from '../src/lib/db.js';
import { deleteUserByEmail, type UserRow } from '../src/models/user.model.js';
import { AiService } from '../src/modules/ai/ai.service.js';
import type { LLMProvider } from '../src/modules/ai/providers/llm.provider.js';
import { LearningService } from '../src/modules/learning/learning.service.js';
import type {
  LearningResource,
  LearningResourceType,
  ResourceSearchProvider,
} from '../src/modules/learning/learning.types.js';
import { HttpError } from '../src/modules/learning/http.js';
import { readLatestOtp, TEST_PASSWORD } from './helpers/auth.js';

// Endpoint behaviour against a real database with the LLM and the resource
// provider fully mocked - never a live AI/YouTube call (docs/AGENTS.md §37).
// Run with npm run test:db.
const runDbTests = process.env.RUN_DB_TESTS === '1';

const createdEmails: string[] = [];
const createdCustomSkills: string[] = [];

function randomEmail(): string {
  const email = `learning-${randomUUID()}@example.com`;
  createdEmails.push(email);
  return email;
}

class FakeLlm implements LLMProvider {
  responder: (input: { system: string; user: string }) => unknown = () => ({});
  calls = 0;
  async completeStructured(input: { system: string; user: string }): Promise<unknown> {
    this.calls += 1;
    return this.responder(input);
  }
}

class FakeResourceProvider implements ResourceSearchProvider {
  readonly name = 'FakeYouTube';
  configured: boolean;
  searchCalls = 0;
  responder: (input: { queries: string[]; maxPerQuery: number }) => LearningResource[];
  constructor(input: { configured?: boolean } = {}) {
    this.configured = input.configured ?? true;
    this.responder = () => [];
  }
  async search(input: { queries: string[]; types: LearningResourceType[]; maxPerQuery: number }): Promise<LearningResource[]> {
    this.searchCalls += 1;
    return this.responder(input);
  }
}

function fixtureResource(videoId: string, title: string): LearningResource {
  return {
    dedupeKey: `youtube:${videoId}`,
    type: 'video',
    provider: 'YouTube',
    title,
    creator: { name: 'Finance Academy', url: 'https://www.youtube.com/channel/UCfinance' },
    sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
    videoId,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    durationMinutes: 14,
    summary: null,
    level: 'BEGINNER',
    isCurated: false,
    discoveredAt: '2025-06-01T10:00:00.000Z',
    publishedAt: '2024-03-10T00:00:00.000Z',
  };
}

async function registerUser(app: FastifyInstance): Promise<{ user: UserRow; token: string }> {
  const email = randomEmail();
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: {
      firstName: 'Learning',
      lastName: 'Tester',
      email,
      password: TEST_PASSWORD,
      country: 'Nigeria',
    },
  });
  expect(response.statusCode).toBe(201);
  const code = readLatestOtp(app, email, 'EMAIL_VERIFICATION');
  const verify = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/verify-email-otp',
    payload: { email, code },
  });
  expect(verify.statusCode).toBe(200);
  const body = verify.json();
  return { user: body.data.user as UserRow, token: body.data.accessToken as string };
}

function discover(query: string, token: string) {
  return (app: FastifyInstance) =>
    app.inject({ method: 'GET', url: `/api/v1/learning/resources?${query}`, headers: { authorization: `Bearer ${token}` } });
}

describe.runIf(runDbTests)('learning resources endpoint (integration, mocked AI + provider)', () => {
  let app: FastifyInstance;
  let unconfiguredApp: FastifyInstance;
  let llm: FakeLlm;
  let provider: FakeResourceProvider;

  beforeAll(async () => {
    const config = loadEnv();
    initDb(config);
    if (!(await checkDatabaseConnection())) {
      throw new Error('Database is not reachable. Apply migrations and try again.');
    }
    llm = new FakeLlm();
    provider = new FakeResourceProvider();
    const learning = new LearningService(new AiService(llm), provider);
    app = buildApp({ config, logger: false, ai: new AiService(llm), learning });

    const unconfiguredProvider = new FakeResourceProvider({ configured: false });
    unconfiguredApp = buildApp({
      config,
      logger: false,
      learning: new LearningService(new AiService(new FakeLlm()), unconfiguredProvider),
    });
  });

  afterAll(async () => {
    if (app !== undefined) await app.close();
    if (unconfiguredApp !== undefined) await unconfiguredApp.close();
    for (const email of createdEmails) {
      await deleteUserByEmail(undefined, email).catch(() => undefined);
    }
    for (const name of createdCustomSkills) {
      await queryText(getPool(), 'DELETE FROM "skills" WHERE "name" = $1', [name]).catch(() => undefined);
    }
    await closeDb();
  });

  it('returns 401 without a bearer token', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/learning/resources?skill=Excel' });
    expect(response.statusCode).toBe(401);
  });

  it('discovers and caches resources for a catalogue skill', async () => {
    const { token } = await registerUser(app);
    llm.responder = () => ({
      skill: 'Data Analysis',
      intent: 'Understand how to analyse datasets using spreadsheets.',
      queries: ['data analysis for beginners', 'spreadsheet data analysis tutorial'],
      preferredTypes: ['video'],
    });
    provider.responder = () => [
      fixtureResource('aaaaaaaaaaa', 'Data analysis for total beginners'),
      fixtureResource('bbbbbbbbbbb', 'Spreadsheet data analysis explained'),
    ];

    const first = await app.inject({
      method: 'GET',
      url: '/api/v1/learning/resources?skill=Data%20Analysis',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(first.statusCode).toBe(200);
    const body = first.json();
    expect(body.success).toBe(true);
    expect(body.data.skill).toEqual({ name: 'Data Analysis', isCustom: false });
    expect(body.data.source).toBe('discovered');
    expect(body.data.freshness).toBe('fresh');
    expect(body.data.resources).toHaveLength(2);
    const resource = body.data.resources[0];
    expect(resource.dedupeKey).toBe('youtube:aaaaaaaaaaa');
    expect(resource.provider).toBe('YouTube');
    expect(resource.type).toBe('video');
    expect(resource.level).toBe('BEGINNER');
    expect(resource.isCurated).toBe(false);
    expect(resource.summary).toBe('Understand how to analyse datasets using spreadsheets.');
    expect(resource.sourceUrl).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
    expect(resource.embedUrl).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\//);
    expect(resource.creator.url).toMatch(/^https:\/\/www\.youtube\.com\/channel\//);

    // A second call is served from the 24h cache: no extra AI or provider work.
    const callsAfterFirst = { llm: llm.calls, provider: provider.searchCalls };
    const second = await app.inject({
      method: 'GET',
      url: '/api/v1/learning/resources?skill=Data%20Analysis',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(second.statusCode).toBe(200);
    expect(second.json().data.freshness).toBe('fresh');
    expect(second.json().data.resources).toHaveLength(2);
    expect(llm.calls).toBe(callsAfterFirst.llm);
    expect(provider.searchCalls).toBe(callsAfterFirst.provider);

    // refresh=true forces a fresh discovery run (still provider-backed).
    const refreshed = await app.inject({
      method: 'GET',
      url: '/api/v1/learning/resources?skill=Data%20Analysis&refresh=true',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(refreshed.statusCode).toBe(200);
    expect(refreshed.json().data.freshness).toBe('fresh');
    expect(provider.searchCalls).toBe(callsAfterFirst.provider + 1);
  });

  it('serves an honest empty result without caching it', async () => {
    const { token } = await registerUser(app);
    llm.responder = () => ({
      skill: 'Digital Payments',
      intent: 'Learn how digital payments work.',
      queries: ['digital payments explained'],
      preferredTypes: ['video'],
    });
    provider.responder = () => [];

    const first = await app.inject({
      method: 'GET',
      url: '/api/v1/learning/resources?skill=Digital%20Payments',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(first.statusCode).toBe(200);
    expect(first.json().data.source).toBe('empty');
    expect(first.json().data.freshness).toBe('fresh');
    expect(first.json().data.resources).toEqual([]);

    const callsAfterFirst = provider.searchCalls;
    const second = await app.inject({
      method: 'GET',
      url: '/api/v1/learning/resources?skill=Digital%20Payments',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(second.json().data.source).toBe('empty');
    expect(provider.searchCalls).toBe(callsAfterFirst + 1);
  });

  it('fails safely with 503 when the provider is temporarily down and nothing is cached', async () => {
    const { token } = await registerUser(app);
    llm.responder = () => ({
      skill: 'Risk Management',
      intent: 'Understand core risk management concepts.',
      queries: ['risk management basics'],
      preferredTypes: ['video'],
    });
    provider.responder = () => {
      throw new HttpError('upstream down', 'http', 503);
    };

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/learning/resources?skill=Risk%20Management',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.statusCode).toBe(503);
    expect(response.json().error.code).toBe('LEARNING_SERVICE_UNAVAILABLE');
  });

  it('serves stale cached data when a refresh attempt fails', async () => {
    const { token } = await registerUser(app);
    llm.responder = () => ({
      skill: 'Fraud Awareness',
      intent: 'Learn to spot payment fraud.',
      queries: ['fraud awareness for payments'],
      preferredTypes: ['video'],
    });
    provider.responder = () => [fixtureResource('ccccccccccc', 'Fraud awareness for payment operations')];

    const first = await app.inject({
      method: 'GET',
      url: '/api/v1/learning/resources?skill=Fraud%20Awareness',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(first.statusCode).toBe(200);

    provider.responder = () => {
      throw new HttpError('upstream down', 'http', 503);
    };
    const second = await app.inject({
      method: 'GET',
      url: '/api/v1/learning/resources?skill=Fraud%20Awareness&refresh=true',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(second.statusCode).toBe(200);
    expect(second.json().data.freshness).toBe('stale');
    expect(second.json().data.resources).toHaveLength(1);
    expect(second.json().data.resources[0].dedupeKey).toBe('youtube:ccccccccccc');
  });

  it('returns 422 when the AI targets the wrong skill (ungrounded intent)', async () => {
    const { token } = await registerUser(app);
    llm.responder = () => ({
      skill: 'Something Else',
      intent: 'Off-topic.',
      queries: ['off topic'],
      preferredTypes: ['video'],
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/learning/resources?skill=Reconciliation',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe('AI_OUTPUT_INVALID');
  });

  it('marks user-created custom skills as isCustom in the response', async () => {
    const { user, token } = await registerUser(app);
    const customName = `Custom Skill ${randomUUID().slice(0, 8)}`;
    await queryText(
      getPool(),
      `INSERT INTO "skills" ("name", "category", "description", "isCustom")
       VALUES ($1, 'SOFT_SKILLS', $2, true)`,
      [customName, `Skill created by ${user.id} for the learning test.`],
    );
    createdCustomSkills.push(customName);

    llm.responder = () => ({
      skill: customName.toLowerCase(),
      intent: 'Learn this custom skill.',
      queries: ['custom skill basics'],
      preferredTypes: ['video'],
    });
    provider.responder = () => [fixtureResource('ddddddddddd', 'Custom skill resources')];

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/learning/resources?skill=${encodeURIComponent(customName)}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().data.skill.isCustom).toBe(true);
    expect(response.json().data.skill.name).toBe(customName);
  });

  it('rejects invalid queries: missing/oversized skill and unsupported types', async () => {
    const { token } = await registerUser(app);
    const missing = await app.inject({
      method: 'GET',
      url: '/api/v1/learning/resources',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(missing.statusCode).toBe(400);

    const oversized = await app.inject({
      method: 'GET',
      url: `/api/v1/learning/resources?skill=${encodeURIComponent('x'.repeat(121))}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(oversized.statusCode).toBe(400);

    const unsupported = await app.inject({
      method: 'GET',
      url: '/api/v1/learning/resources?skill=Excel&types=podcast',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(unsupported.statusCode).toBe(400);
    expect(unsupported.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('fails safely with 503 when dynamic discovery is not configured', async () => {
    const { token } = await registerUser(app);
    const response = await discover('skill=Financial%20Record%20Keeping', token)(unconfiguredApp);
    expect(response.statusCode).toBe(503);
    expect(response.json().error.code).toBe('LEARNING_SERVICE_UNAVAILABLE');
  });

  it('includes skillName on roadmap tasks (LEFT JOIN skills)', async () => {
    const { token } = await registerUser(app);
    const careers = await queryText<{ id: string }>(getPool(), 'SELECT "id" FROM "career_paths" LIMIT 1');
    const careerId = careers[0]?.id;
    expect(careerId).toBeDefined();
    const requirementRows = await queryText<{ name: string }>(
      getPool(),
      'SELECT s."name" FROM "career_skills" cs JOIN "skills" s ON s."id" = cs."skillId" WHERE cs."careerPathId" = $1 ORDER BY s."name"',
      [careerId],
    );
    const requirementNames = requirementRows.map((row) => row.name);
    expect(requirementNames.length).toBeGreaterThan(0);

    const task = (i: number) => {
      const skillName = requirementNames[i % requirementNames.length]!;
      return { title: `Task ${i}`, description: `Work on ${skillName}.`, skillName, estimatedMinutes: 90 };
    };
    llm.responder = () => ({
      title: 'Roadmap with skill names',
      description: 'Skill names must resolve from the catalogue.',
      phases: {
        30: [task(1), task(1), task(2)],
        60: [task(2), task(2), task(3)],
        90: [task(3), task(4), task(0)],
      },
    });

    const generate = await app.inject({
      method: 'POST',
      url: '/api/v1/roadmaps/generate',
      headers: { authorization: `Bearer ${token}` },
      payload: { careerPathId: careerId },
    });
    expect(generate.statusCode).toBe(200);

    const current = await app.inject({
      method: 'GET',
      url: '/api/v1/roadmaps/current',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(current.statusCode).toBe(200);
    const tasks = [...current.json().data.phases.DAY_30, ...current.json().data.phases.DAY_60, ...current.json().data.phases.DAY_90] as Array<{
      title: string;
      skillId: string | null;
      skillName: string | null;
    }>;
    expect(tasks.length).toBeGreaterThan(0);
    for (const populated of tasks.filter((t) => t.skillId !== null)) {
      expect(populated.skillName).toBeTruthy();
    }
    const excelTask = tasks.find((t) => t.title === 'Task 1');
    expect(excelTask?.skillName).toBe(requirementNames[1 % requirementNames.length]);
  });
});