import { BASE_SYSTEM_INSTRUCTION } from './base.prompt.js';

export const CAREER_REQUIREMENTS_PROMPT_VERSION = 'career-requirements-v1';

export const MIN_CAREER_REQUIREMENT_SKILLS = 3;
export const MAX_CAREER_REQUIREMENT_SKILLS = 15;

/**
 * Builds the system + user prompt that derives the skill requirements for a
 * participant's OWN custom target career (docs/AI_SPEC.md §15,
 * docs/PRODUCT_SPEC.md §13).
 *
 * This is the one operation where the AI names skills freely, because the
 * career itself is not in the approved catalogue: there are no catalogue
 * requirement rows to reuse. Names are still grounded - the participant's real
 * current occupation, industry and recorded skills are provided - and the
 * backend resolves each name against the approved skill catalogue, storing
 * only genuinely new names as custom skills. The AI never inserts careers,
 * skills or ids into the catalogue, never overrides catalogues elsewhere, and
 * never fabricates qualifications or guarantees.
 */
export function buildCareerRequirementsPrompt(input: {
  careerName: string;
  currentOccupation: string;
  industry: string;
  skillsKnown: string[];
}): { system: string; user: string } {
  const system = `
${BASE_SYSTEM_INSTRUCTION}

You are defining the skills a participant needs for a target career they named
themselves.

This career is NOT part of the approved HerNext catalogue, so there are no
catalogue requirement rows to reuse. You choose real, generic workplace skill
names (for example "Data Analysis", "SQL", "Health Data Analysis"). The
backend resolves each name against the approved catalogue and the
participant's own recorded skills, and stores any genuinely new name as a
custom skill scoped to that career. You never create or edit catalogue
entries.

Follow these rules:
- Return between 3 and 15 skills.
- Reuse the participant's real transferable skills when they genuinely apply,
  so their experience counts rather than being ignored.
- Mark each skill REQUIRED (essential for the career), IMPORTANT (strongly
  helpful) or NICE_TO_HAVE (a bonus).
- The JSON "careerName" must equal the target career exactly.
- Never invent qualifications, certifications, employment history or job
  guarantees.
`.trim();

  const user = `
Target career named by the participant: ${input.careerName}
Participant current occupation: ${input.currentOccupation}
Participant declared industry: ${input.industry}

Participant skills already recorded:
${input.skillsKnown.map((s) => `- ${s}`).join('\n')}

Respond with JSON in exactly this shape:
{
  "careerName": "the exact target career name above",
  "careerDescription": "one to two sentences summarising what this career involves",
  "skills": [
    {
      "name": "Skill name",
      "importance": "REQUIRED",
      "reason": "Why this skill matters for the career"
    }
  ]
}
`.trim();

  return { system, user };
}