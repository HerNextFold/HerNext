import { describe, expect, it } from 'vitest';
import {
  careerRequirementsOutputSchema,
  type CareerRequirementsOutput,
} from '../src/modules/ai/ai.schemas.js';

// The AI output for a participant's own custom career must be structurally
// valid before the service resolves and persists anything: 3-15 skills with a
// known importance and human-readable reasons (docs/AI_SPEC.md §15).

const validRequirements: CareerRequirementsOutput = {
  careerName: 'Health Data Analyst',
  careerDescription: 'Analyses health data to support clinical and operational decisions.',
  skills: [
    { name: 'Data Analysis', importance: 'REQUIRED', reason: 'Core analytical work.' },
    { name: 'SQL', importance: 'REQUIRED', reason: 'Querying datasets.' },
    { name: 'Data Storytelling', importance: 'IMPORTANT', reason: 'Presenting findings.' },
  ],
};

describe('careerRequirementsOutputSchema', () => {
  it('accepts a valid requirements payload', () => {
    expect(careerRequirementsOutputSchema.safeParse(validRequirements).success).toBe(true);
  });

  it('accepts the maximum of 15 skills', () => {
    const skills = Array.from({ length: 15 }, (_, index) => ({
      name: `Skill ${index}`,
      importance: 'NICE_TO_HAVE',
      reason: 'Extra supporting skill.',
    }));
    expect(careerRequirementsOutputSchema.safeParse({ ...validRequirements, skills }).success).toBe(true);
  });

  it('rejects fewer than 3 skills', () => {
    const result = careerRequirementsOutputSchema.safeParse({
      ...validRequirements,
      skills: validRequirements.skills.slice(0, 2),
    });
    expect(result.success).toBe(false);
  });

  it('rejects more than 15 skills', () => {
    const skills = Array.from({ length: 16 }, (_, index) => ({
      name: `Skill ${index}`,
      importance: 'NICE_TO_HAVE',
      reason: 'Extra supporting skill.',
    }));
    expect(careerRequirementsOutputSchema.safeParse({ ...validRequirements, skills }).success).toBe(false);
  });

  it('rejects an unknown importance value', () => {
    const skills = validRequirements.skills.map((s) => ({ ...s, importance: 'ESSENTIAL' }));
    expect(careerRequirementsOutputSchema.safeParse({ ...validRequirements, skills }).success).toBe(false);
  });

  it('rejects an empty skill name', () => {
    const skills = [{ name: '', importance: 'REQUIRED', reason: 'Missing name.' }, ...validRequirements.skills];
    expect(careerRequirementsOutputSchema.safeParse({ ...validRequirements, skills }).success).toBe(false);
  });

  it('rejects a missing careerName', () => {
    const { careerName, ...rest } = validRequirements;
    expect(careerRequirementsOutputSchema.safeParse(rest).success).toBe(false);
  });
});