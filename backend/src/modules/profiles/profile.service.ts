import { AppError } from "../../common/errors/app-error.js";
import { errorCodes } from "../../common/errors/error-codes.js";
import { withTransaction, type Db } from "../../lib/db.js";
import {
  findCareerProfileByUserId,
  findOnboardingStatusByUserId,
  upsertCareerProfile,
  type CareerProfileRow,
} from "../../models/career-profile.model.js";
import {
  assertCareerExists,
  findCareerById,
  findOrCreateSkillByName,
  findSkillsByIds,
} from "../../models/catalogue.model.js";
import { replaceCareerRecommendations } from "../../models/careers.model.js";
import {
  insertExperience,
  type CreateExperienceInput,
} from "../../models/experience.model.js";
import {
  findParticipantProfileByUserId,
  findUserById,
  lockParticipantProfileByUserId,
  updateUserLocation,
} from "../../models/user.model.js";
import {
  listUserSkillsWithNames,
  upsertUserSkill,
} from "../../models/user-skill.model.js";
import type {
  CompleteOnboardingBody,
  UpsertProfileBody,
} from "./profile.schemas.js";
import { toProfileView, type CareerProfileView } from "./profile.types.js";

/**
 * Career profile business logic. Ownership is always derived from the
 * authenticated user id passed in by the controller - never from the request
 * body (docs/AGENTS.md §8).
 */
export class ProfileService {
  async getProfile(userId: string): Promise<CareerProfileView> {
    const profile = await findCareerProfileByUserId(undefined, userId);
    if (profile === null) {
      throw new AppError(
        errorCodes.RESOURCE_NOT_FOUND,
        "Career profile not found",
        404,
      );
    }
    return this.buildView(userId, profile);
  }

  /**
   * Creates or updates the participant's career profile in one transaction.
   * The optional `skillIds` are validated against the approved skill catalogue
   * and stored as SELF_REPORTED user skills (docs/PRODUCT_SPEC.md §8).
   * Optional `country`/`state` are written to the authenticated user's own
   * "users" row in the same transaction. Location is only touched when the
   * caller actually sends it, so a client that omits it keeps the stored value.
   */
  async saveProfile(
    userId: string,
    input: UpsertProfileBody,
  ): Promise<CareerProfileView> {
    const profile = await withTransaction(async (client) => {
      const participantProfile = await findParticipantProfileByUserId(
        client,
        userId,
      );
      if (participantProfile === null) {
        throw new AppError(
          errorCodes.RESOURCE_NOT_FOUND,
          "Participant profile not found",
          404,
        );
      }

      if (input.country !== undefined || input.state !== undefined) {
        const updated = await updateUserLocation(client, userId, {
          ...(input.country === undefined ? {} : { country: input.country }),
          ...(input.state === undefined ? {} : { state: input.state }),
        });
        if (updated === null) {
          throw new AppError(
            errorCodes.RESOURCE_NOT_FOUND,
            "Account not found",
            404,
          );
        }
      }

      if (input.targetCareerId !== null && input.targetCareerId !== undefined) {
        await assertCareerExists(client, input.targetCareerId);
      }

      const saved = await upsertCareerProfile(client, {
        participantProfileId: participantProfile.id,
        currentOccupation: input.currentOccupation,
        industry: input.industry,
        yearsOfExperience: input.yearsOfExperience,
        education: input.education ?? null,
        employmentType: input.employmentType,
        careerInterests: input.careerInterests ?? null,
        targetCareerId: input.targetCareerId ?? null,
      });

      if (input.skillIds !== undefined && input.skillIds.length > 0) {
        await this.saveSelfReportedSkills(client, userId, input.skillIds);
      }

      await this.saveCustomSkills(client, userId, input.customSkills);

      return saved;
    });

    return this.buildView(userId, profile);
  }

  /**
   * Completes onboarding for the authenticated participant atomically.
   *
   * The whole submission is validated up front by Zod, then written inside a
   * single transaction: profile, self-reported skills, target career, the
   * optional experience, and the explicit onboarding completion marker. If any
   * step throws, the whole transaction rolls back, so a failed submission can
   * never leave a half-written profile behind (the bug this replaces).
   *
   * Experience handling: an experience row is inserted only when the client
   * supplied real, non-empty title and description text. A participant with no
   * genuine work history simply omits "experience" and onboarding still
   * completes; nothing is invented to fill the gap.
   *
   * Ownership always comes from the authenticated user id, never the body
   * (docs/AGENTS.md §8).
   */
  async completeOnboarding(
    userId: string,
    input: CompleteOnboardingBody,
  ): Promise<CareerProfileView> {
    const profile = await withTransaction(async (client) => {
      const participantProfile = await lockParticipantProfileByUserId(
        client,
        userId,
      );
      if (participantProfile === null) {
        throw new AppError(
          errorCodes.RESOURCE_NOT_FOUND,
          "Participant profile not found",
          404,
        );
      }

      const onboardingStatus = await findOnboardingStatusByUserId(
        client,
        userId,
      );
      if (
        onboardingStatus !== null &&
        onboardingStatus.onboardingCompletedAt !== null
      ) {
        throw new AppError(
          errorCodes.RESOURCE_ALREADY_EXISTS,
          "Onboarding has already been completed.",
          409,
        );
      }

      if (input.country !== undefined || input.state !== undefined) {
        const updated = await updateUserLocation(client, userId, {
          ...(input.country === undefined ? {} : { country: input.country }),
          ...(input.state === undefined ? {} : { state: input.state }),
        });
        if (updated === null) {
          throw new AppError(
            errorCodes.RESOURCE_NOT_FOUND,
            "Account not found",
            404,
          );
        }
      }

      // Validate the catalogue references BEFORE writing anything, so an
      // unknown career or skill aborts the transaction instead of persisting
      // a partial submission.
      await assertCareerExists(client, input.targetCareerId);

      if (input.skillIds.length > 0) {
        await this.saveSelfReportedSkills(client, userId, input.skillIds);
      }

      await this.saveCustomSkills(client, userId, input.customSkills);

      const saved = await upsertCareerProfile(client, {
        participantProfileId: participantProfile.id,
        currentOccupation: input.currentOccupation,
        industry: input.industry,
        yearsOfExperience: input.yearsOfExperience,
        education: input.education ?? null,
        employmentType: input.employmentType,
        careerInterests: input.careerInterests ?? null,
        targetCareerId: input.targetCareerId,
        markOnboardingCompleted: true,
      });

      const experience = input.experience;
      if (experience !== undefined && experience !== null) {
        const record: CreateExperienceInput = {
          userId,
          title: experience.title,
          description: experience.description,
          employmentType: experience.employmentType,
        };
        if (experience.organization !== undefined)
          record.organization = experience.organization;
        if (experience.years !== undefined) record.years = experience.years;
        if (experience.startDate !== undefined)
          record.startDate = experience.startDate;
        if (experience.endDate !== undefined)
          record.endDate = experience.endDate;
        await insertExperience(client, record);
      }

      // Drop any previously stored ranking. It was computed from the old,
      // incomplete inputs, and the read path returns stored rows in preference
      // to recomputing, so leaving it would keep serving a stale "top match"
      // after the participant has supplied real data.
      await replaceCareerRecommendations(client, userId, []);

      return saved;
    });

    return this.buildView(userId, profile);
  }

  /**
   * Explicit onboarding completion state for the authenticated participant.
   * Never infers completion from the mere existence of a profile row.
   */
  async getOnboardingStatus(
    userId: string,
  ): Promise<{ completed: boolean; completedAt: string | null }> {
    const status = await findOnboardingStatusByUserId(undefined, userId);
    const completedAt = status?.onboardingCompletedAt ?? null;
    return {
      completed: completedAt !== null,
      completedAt: completedAt === null ? null : completedAt.toISOString(),
    };
  }

  private async saveSelfReportedSkills(
    db: Db,
    userId: string,
    skillIds: string[],
  ): Promise<void> {
    const uniqueSkillIds = [...new Set(skillIds)];
    const found = await findSkillsByIds(db, uniqueSkillIds);
    const known = new Set(found.map((s) => s.id));
    const unknown = uniqueSkillIds.filter((id) => !known.has(id));
    if (unknown.length > 0) {
      throw new AppError(
        errorCodes.VALIDATION_ERROR,
        "One or more skills are not part of the approved skill catalogue.",
        400,
        { unknownSkillIds: unknown },
      );
    }
    for (const skillId of uniqueSkillIds) {
      await upsertUserSkill(db, {
        userId,
        skillId,
        source: "SELF_REPORTED",
        confidence: 1,
        proficiency: 0,
      });
    }
  }

  /**
   * Stores skills the participant typed that are not in the approved catalogue.
   *
   * Suggested skills are suggestions, not an allowlist, so a genuine skill must
   * always be recordable. Names are trimmed and de-duplicated case-insensitively
   * (so "React" and "react" cannot both be stored), then resolved against the
   * catalogue first: a name that matches an approved skill reuses that skill and
   * keeps it eligible for career matching, and only a genuinely new name becomes
   * a custom skill that is displayed but ignored by catalogue matching.
   *
   * Custom skills are saved with the same SELF_REPORTED source as catalogue
   * picks, so nothing downstream treats them as verified or AI-derived.
   */
  private async saveCustomSkills(
    db: Db,
    userId: string,
    names: readonly string[] | undefined,
  ): Promise<void> {
    if (names === undefined || names.length === 0) {
      return;
    }
    const seen = new Set<string>();
    for (const rawName of names) {
      const name = rawName.trim();
      if (name === "") {
        continue;
      }
      const key = name.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      const skill = await findOrCreateSkillByName(db, name);
      await upsertUserSkill(db, {
        userId,
        skillId: skill.id,
        source: "SELF_REPORTED",
        confidence: 1,
        proficiency: 0,
      });
    }
  }

  private async buildView(
    userId: string,
    profile: CareerProfileRow,
  ): Promise<CareerProfileView> {
    const [targetCareer, skills, user] = await Promise.all([
      profile.targetCareerId === null
        ? null
        : findCareerById(undefined, profile.targetCareerId),
      listUserSkillsWithNames(undefined, userId),
      findUserById(undefined, userId),
    ]);
    if (user === null) {
      throw new AppError(
        errorCodes.RESOURCE_NOT_FOUND,
        "Account not found",
        404,
      );
    }
    return toProfileView(profile, targetCareer, skills, user);
  }
}
