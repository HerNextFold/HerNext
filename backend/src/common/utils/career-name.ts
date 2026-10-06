/**
 * Shared validation/normalisation for participant-supplied career names
 * (docs/PRODUCT_SPEC.md §13). Used both by the request schemas and by the
 * model that persists an owner-scoped custom career, so a name accepted by
 * the API is exactly a name the model can store and match.
 */

export const MAX_CAREER_NAME_LENGTH = 120;

/** Trims and collapses runs of whitespace so names compare and match consistently. */
export function normalizeCareerName(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Returns null when the name is acceptable, otherwise a human-readable reason
 * the schema/model can surface as a VALIDATION_ERROR.
 */
export function invalidCareerNameReason(input: string): string | null {
  if (typeof input !== 'string') {
    return 'A career name is required.';
  }
  const normalized = normalizeCareerName(input);
  if (normalized.length === 0) {
    return 'A career name is required.';
  }
  if (normalized.length > MAX_CAREER_NAME_LENGTH) {
    return `Career names are limited to ${MAX_CAREER_NAME_LENGTH} characters.`;
  }
  if (/[\u0000-\u001f\u007f]/.test(normalized)) {
    return 'Career names cannot contain control characters.';
  }
  return null;
}