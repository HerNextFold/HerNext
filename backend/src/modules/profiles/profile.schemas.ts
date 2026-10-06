import { z } from 'zod';
import { employmentTypeSchema, optionalDate } from '../experiences/experiences.schemas.js';
import {
  MAX_CAREER_NAME_LENGTH,
  invalidCareerNameReason,
} from '../../common/utils/career-name.js';

export const upsertProfileSchema = z
  .object({
    currentOccupation: z.string().trim().min(1, 'currentOccupation is required').max(200),
    industry: z.string().trim().min(1, 'industry is required').max(200),
    yearsOfExperience: z.number().min(0, 'yearsOfExperience cannot be negative').max(100),
    education: z.string().trim().max(300).nullable().optional(),
    employmentType: employmentTypeSchema,
    careerInterests: z.array(z.string().trim().min(1).max(200)).max(20).nullable().optional(),
    targetCareerId: z.string().uuid('targetCareerId must be a valid UUID').nullable().optional(),
    /**
     * Alternative to targetCareerId: a career the participant names themselves
     * (docs/PRODUCT_SPEC.md §13). It is matched against the approved catalogue
     * first and otherwise stored as a participant-scoped custom career. Both
     * fields cannot be set together; send null/omit both to clear the target.
     */
    targetCareerName: z
      .string()
      .trim()
      .min(1, 'targetCareerName cannot be empty')
      .max(MAX_CAREER_NAME_LENGTH)
      .nullable()
      .optional(),
    skillIds: z.array(z.string().uuid('skillIds must be valid UUIDs')).max(50).optional(),
    /**
     * Skills the participant typed themselves that are not in the approved
     * catalogue. Suggestions are not an allowlist, so a real skill must always
     * be recordable. See the identical field on completeOnboardingSchema.
     */
    customSkills: z
      .array(z.string().trim().min(1, 'customSkills cannot contain blank entries').max(120))
      .max(30)
      .optional(),
    country: z.string().trim().min(1, 'country cannot be empty').max(100).optional(),
    state: z.string().trim().min(1).max(100).nullable().optional(),
  })
  .strict()
  .refine((data) => !(data.targetCareerId != null && data.targetCareerName != null), {
    message: 'Provide either targetCareerId or targetCareerName, not both.',
    path: ['targetCareerId'],
  })
  .refine(
    (data) =>
      data.targetCareerName == null || invalidCareerNameReason(data.targetCareerName) === null,
    {
      message: 'targetCareerName contains characters that are not allowed.',
      path: ['targetCareerName'],
    },
  );

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
     * Approved catalogue career id the participant is aiming at. Exactly ONE of
     * targetCareerId / targetCareerName is required: either the participant
     * picks from the catalogue, or names their own career
     * (docs/PRODUCT_SPEC.md §13), which is stored as a participant-scoped
     * custom career. A catalogue default can never stand in for user intent.
     */
    targetCareerId: z.string().uuid('targetCareerId must be a valid catalogue UUID').optional(),
    targetCareerName: z
      .string()
      .trim()
      .min(1, 'targetCareerName cannot be empty')
      .max(MAX_CAREER_NAME_LENGTH)
      .optional(),
    /**
     * Approved catalogue skill ids the participant actually reported. May be
     * empty, but is never populated with defaults on the client's behalf.
     */
    skillIds: z.array(z.string().uuid('skillIds must be valid UUIDs')).max(50).default([]),
    /**
     * Skills the participant typed themselves that are not in the approved
     * catalogue. Suggestions are not an allowlist: a real skill must always be
     * recordable, so these are stored as custom skills and displayed on the
     * profile. Each name is trimmed, de-duplicated case-insensitively, and
     * resolved to an existing catalogue skill when one matches.
     */
    customSkills: z
      .array(z.string().trim().min(1, 'customSkills cannot contain blank entries').max(120))
      .max(30)
      .optional(),
    /** Omit or leave out for a participant with no real experience to record. */
    experience: onboardingExperienceSchema.nullable().optional(),
  })
  .strict()
  .refine(
    (data) =>
      (data.targetCareerId !== undefined) !== (data.targetCareerName !== undefined),
    {
      message: 'Provide exactly one of targetCareerId or targetCareerName.',
      path: ['targetCareerId'],
    },
  )
  .refine(
    (data) =>
      data.targetCareerName === undefined ||
      invalidCareerNameReason(data.targetCareerName) === null,
    {
      message: 'targetCareerName contains characters that are not allowed.',
      path: ['targetCareerName'],
    },
  );

export type CompleteOnboardingBody = z.infer<typeof completeOnboardingSchema>;
