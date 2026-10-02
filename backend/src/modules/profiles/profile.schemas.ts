import { z } from 'zod';
import { employmentTypeSchema, optionalDate } from '../experiences/experiences.schemas.js';

export const upsertProfileSchema = z
  .object({
    currentOccupation: z.string().trim().min(1, 'currentOccupation is required').max(200),
    industry: z.string().trim().min(1, 'industry is required').max(200),
    yearsOfExperience: z.number().min(0, 'yearsOfExperience cannot be negative').max(100),
    education: z.string().trim().max(300).nullable().optional(),
    employmentType: employmentTypeSchema,
    careerInterests: z.array(z.string().trim().min(1).max(200)).max(20).nullable().optional(),
    targetCareerId: z.string().uuid('targetCareerId must be a valid UUID').nullable().optional(),
    skillIds: z.array(z.string().uuid('skillIds must be valid UUIDs')).max(50).optional(),
    country: z.string().trim().min(1, 'country cannot be empty').max(100).optional(),
    state: z.string().trim().min(1).max(100).nullable().optional(),
  })
  .strict();

export type UpsertProfileBody = z.infer<typeof upsertProfileSchema>;

/**
 * Atomic onboarding submission (POST /api/v1/onboarding).
 *
 * Replaces the previous three independent client-side writes (PUT /profile,
 * POST /experiences, then a local-only "onboarded" flag) which could leave a
 * half-written profile behind. Everything below is validated up front and then
 * committed in a single transaction by ProfileService.completeOnboarding.
 *
 * "experience" is optional by design: a participant who has genuinely never
 * worked is not forced to invent an employment history. The backend only
 * inserts an experience row when the client supplies real, non-empty
 * title + description text; an absent or blank experience is skipped rather
 * than fabricated.
 */
const onboardingExperienceSchema = z
  .object({
    title: z.string().trim().min(1, 'experience.title is required').max(200),
    description: z.string().trim().min(1, 'experience.description is required').max(5000),
    organization: z.string().trim().max(200).nullable().optional(),
    years: z.number().min(0).max(100).nullable().optional(),
    employmentType: employmentTypeSchema,
    startDate: optionalDate,
    endDate: optionalDate,
  })
  .strict();

export const completeOnboardingSchema = z
  .object({
    currentOccupation: z.string().trim().min(1, 'currentOccupation is required').max(200),
    industry: z.string().trim().min(1, 'industry is required').max(200),
    yearsOfExperience: z.number().min(0, 'yearsOfExperience cannot be negative').max(100),
    employmentType: employmentTypeSchema,
    education: z.string().trim().max(300).nullable().optional(),
    careerInterests: z.array(z.string().trim().min(1).max(200)).max(20).nullable().optional(),
    country: z.string().trim().min(1, 'country cannot be empty').max(100).optional(),
    state: z.string().trim().min(1).max(100).nullable().optional(),
    /**
     * Approved catalogue career id the participant is aiming at. Required for a
     * meaningful recommendation score, so onboarding requires it explicitly
     * rather than letting a catalogue default stand in for user intent.
     */
    targetCareerId: z.string().uuid('targetCareerId must be a valid catalogue UUID'),
    /**
     * Approved catalogue skill ids the participant actually reported. May be
     * empty, but is never populated with defaults on the client's behalf.
     */
    skillIds: z.array(z.string().uuid('skillIds must be valid UUIDs')).max(50).default([]),
    /** Omit or leave out for a participant with no real experience to record. */
    experience: onboardingExperienceSchema.nullable().optional(),
  })
  .strict();

export type CompleteOnboardingBody = z.infer<typeof completeOnboardingSchema>;
