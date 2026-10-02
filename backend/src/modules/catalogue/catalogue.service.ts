import { listCareers, listSkills, type CareerPathRow, type SkillRow } from '../../models/catalogue.model.js';

/**
 * Read-only view of the approved HerNext catalogue.
 *
 * The catalogue is backend-owned (docs/AGENTS.md §16, §20): careers and skills
 * may only ever be referenced by their approved ids. Exposing the catalogue is
 * what allows a client to map a genuine user selection to the correct UUID
 * instead of inventing an id, defaulting to a catalogue entry, or skipping
 * persistence entirely.
 *
 * These are unauthenticated read-only lookups over non-personal, non-secret
 * reference data. They expose no participant data.
 */
export interface CatalogueCareerView {
  id: string;
  name: string;
  industry: string;
  description: string;
  level: string;
}

export interface CatalogueSkillView {
  id: string;
  name: string;
  category: SkillRow['category'];
  description: string;
}

function toCareerView(career: CareerPathRow): CatalogueCareerView {
  return {
    id: career.id,
    name: career.name,
    industry: career.industry,
    description: career.description,
    level: career.level,
  };
}

function toSkillView(skill: SkillRow): CatalogueSkillView {
  return {
    id: skill.id,
    name: skill.name,
    category: skill.category,
    description: skill.description,
  };
}

export class CatalogueService {
  /** All approved career paths, ordered by name for a stable UI list. */
  async listCareers(): Promise<CatalogueCareerView[]> {
    return (await listCareers(undefined)).map(toCareerView);
  }

  /** All approved skills, ordered by name for a stable UI list. */
  async listSkills(): Promise<CatalogueSkillView[]> {
    return (await listSkills(undefined)).map(toSkillView);
  }
}
