import { BASE_SYSTEM_INSTRUCTION } from './base.prompt.js';

export const LEARNING_SEARCH_INTENT_PROMPT_VERSION = 'learning-search-intent-v1';

/**
 * Builds the system + user prompt that translates a skill into a structured
 * search intent for the learning-resource discovery endpoint
 * (docs/AI_SPEC.md §15a, docs/API_CONTRACT.md §21a).
 *
 * The AI owns the "what to learn" (intent, queries, preferred types) but NEVER
 * the resources themselves. It is explicitly forbidden from emitting URLs,
 * video ids, channel names or hostnames; every returned resource is produced
 * by an external provider from the AI's queries, so a hallucinated link is
 * structurally impossible.
 *
 * The prompt is grounded with what is cheaply available on the request path:
 * the skill name, the participant's current roadmap task for that skill (when
 * one exists) with its gap status/priority, and a beginner default level.
 */
export function buildLearningSearchIntentPrompt(input: {
  skillName: string;
  taskTitle?: string;
  taskDescription?: string;
  gapStatus?: string;
  gapPriority?: string;
}): { system: string; user: string } {
  const system = `
${BASE_SYSTEM_INSTRUCTION}

You are generating a search intent for learning-resource discovery.

Your ONLY job is to describe what a beginner learner needs to learn about the
given skill so an external search API can find real, high-quality resources.

Hard rules:
- Return only search queries and a plain-text intent. NEVER include URLs,
  links, video ids, channel names, playlist ids or hostnames in the JSON.
- Query terms follow the search conventions a standard engine recognises (for
  example "SQL tutorial for beginners", "SQL joins explained").
- The queries are for a BEGINNER learner by default.
- Prefer queries likely to surface respected channels/sites and recent content.
- Keep every query between 3 and 200 characters, and return at most 5 queries.
- "preferredTypes" must only contain values from: "video", "article", "course".
- The JSON "skill" must equal the skill name below exactly.
`.trim();

  const user = `
Skill to learn: ${input.skillName}
Learner level: BEGINNER
${input.taskTitle !== undefined ? `Roadmap task: ${input.taskTitle}` : ''}
${input.taskDescription !== undefined ? `Roadmap task description: ${input.taskDescription}` : ''}
${input.gapStatus !== undefined ? `Skill gap status: ${input.gapStatus}` : ''}
${input.gapPriority !== undefined ? `Skill gap priority: ${input.gapPriority}` : ''}

Respond with JSON in exactly this shape (no URLs anywhere):
{
  "skill": "the exact skill name above",
  "intent": "one sentence describing what the learner needs to understand",
  "queries": [
    "a search query",
    "another search query"
  ],
  "preferredTypes": ["video", "article", "course"]
}
`.trim();

  return { system, user };
}