import { z } from 'zod';

/**
 * Zod schemas that validate structured AI output (docs/AI_SPEC.md §18–§20).
 * Every AI response must pass the relevant schema before any business matching
 * or persistence. Malformed/missing/invalid output fails here.
 */

export const careerImpactOutputSchema = z.object({
  automationTasks: z.array(z.string().min(1)).max(50).default([]),
  augmentedTasks: z.array(z.string().min(1)).max(50).default([]),
  humanStrengths: z.array(z.string().min(1)).max(50).default([]),
  emergingSkills: z.array(z.string().min(1)).max(20).default([]),
  explanation: z.string().min(1).max(2000),
});

export const transferableSkillsOutputSchema = z.object({
  skills: z
    .array(
      z.object({
        skillName: z.string().min(1),
        reason: z.string().min(1).max(1000),
        confidence: z.number().min(0).max(1),
      }),
    )
    .max(40),
});

export const roadmapOutputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  phases: z.object({
    30: z.array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(2000),
        skillName: z.string().min(1),
        estimatedMinutes: z.number().min(1).max(600).optional(),
      }),
    ),
    60: z.array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(2000),
        skillName: z.string().min(1),
        estimatedMinutes: z.number().min(1).max(600).optional(),
      }),
    ),
    90: z.array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(2000),
        skillName: z.string().min(1),
        estimatedMinutes: z.number().min(1).max(600).optional(),
      }),
    ),
  }),
});

/**
 * Skill requirements for a participant's OWN custom target career
 * (docs/AI_SPEC.md §15, PRODUCT_SPEC.md §13). Unlike the other AI outputs this
 * is only ever produced for a career the participant named themselves; it is
 * never part of the shared catalogue. Names are generic real-world skills that
 * the backend resolves or stores as participant/custom skills, so the result
 * drives the exact same skill-gap and roadmap machinery as a catalogue career.
 */
export const careerRequirementsOutputSchema = z.object({
  careerName: z.string().min(1).max(200),
  careerDescription: z.string().min(1).max(2000),
  skills: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        importance: z.enum(['REQUIRED', 'IMPORTANT', 'NICE_TO_HAVE']),
        reason: z.string().min(1).max(1000),
      }),
    )
    .min(3)
    .max(15),
});

/**
 * Learning-resource search intent (docs/AI_SPEC.md §15a, docs/API_CONTRACT.md
 * §21a). The AI produces ONLY the search intent - the skill it was asked about,
 * a plain-text learning goal, and search queries. It must never return URLs,
 * video ids or hostnames: actual resources always come from an external
 * provider (YouTube Data API v3) using the provider-returned identifiers, so
 * the AI can never fabricate a link.
 */
export const learningSearchIntentOutputSchema = z.object({
  skill: z.string().min(1).max(120),
  intent: z.string().min(1).max(300),
  queries: z.array(z.string().min(3).max(200)).min(1).max(5),
  preferredTypes: z.array(z.enum(['video', 'article', 'course'])).min(1).max(3),
});

export type CareerImpactOutput = z.infer<typeof careerImpactOutputSchema>;
export type TransferableSkillsOutput = z.infer<typeof transferableSkillsOutputSchema>;
export type RoadmapOutput = z.infer<typeof roadmapOutputSchema>;
export type CareerRequirementsOutput = z.infer<typeof careerRequirementsOutputSchema>;
export type LearningSearchIntentOutput = z.infer<typeof learningSearchIntentOutputSchema>;

/* Request validation schemas (docs/API_CONTRACT.md §7). */
export const aiExperienceIdParamsSchema = z.object({
  experienceId: z.string().uuid('A valid experience id is required'),
});

export const aiCareerIdParamsSchema = z.object({
  careerId: z.string().uuid('A valid career id is required'),
});

/** `?regenerate=true` forces a fresh AI analysis instead of reusing persisted output. */
export const regenerateQuerySchema = z.object({
  regenerate: z.coerce.boolean().optional(),
});

export const limitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

export const roadmapGenerateSchema = z.object({
  careerPathId: z.string().uuid('A valid career id is required'),
});

export type AiExperienceIdParams = z.infer<typeof aiExperienceIdParamsSchema>;
export type AiCareerIdParams = z.infer<typeof aiCareerIdParamsSchema>;
export type RegenerateQuery = z.infer<typeof regenerateQuerySchema>;
export type LimitQuery = z.infer<typeof limitQuerySchema>;
export type RoadmapGenerateBody = z.infer<typeof roadmapGenerateSchema>;