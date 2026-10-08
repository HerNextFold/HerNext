/**
 * Shared normalisation for learning-resource discovery input
 * (docs/API_CONTRACT.md §24). The learning endpoint keys by a normalized
 * skill name regardless of where the skill came from - catalogue skill,
 * AI-generated requirement for a custom career, or a user-created custom
 * skill - so discovery never assumes catalogue membership.
 */

export const MAX_SKILL_NAME_LENGTH = 120;

/** Trims and collapses runs of whitespace so names compare and match consistently. */
export function normalizeSkillName(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

/** The normalized, lowercased form used as a stable cache key. */
export function skillCacheKeyFragment(input: string): string {
  return normalizeSkillName(input).toLowerCase();
}