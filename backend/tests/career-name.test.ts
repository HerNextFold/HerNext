import { describe, expect, it } from 'vitest';
import {
  invalidCareerNameReason,
  MAX_CAREER_NAME_LENGTH,
  normalizeCareerName,
} from '../src/common/utils/career-name.js';

// Participant-supplied career names are normalised to a single consistent
// surface (trim + collapsed whitespace) before matching or storing, and the
// same validation is reused by the API schemas and the model that persists the
// owner-scoped custom career (docs/PRODUCT_SPEC.md §13).

describe('career name normalisation', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeCareerName('  Health Data Analyst  ')).toBe('Health Data Analyst');
  });

  it('collapses runs of internal whitespace', () => {
    expect(normalizeCareerName('Health   Data\nAnalyst')).toBe('Health Data Analyst');
  });

  it('accepts a normal name', () => {
    expect(invalidCareerNameReason('Health Data Analyst')).toBeNull();
  });

  it('rejects blank names', () => {
    expect(invalidCareerNameReason('   ')).not.toBeNull();
    expect(invalidCareerNameReason('')).not.toBeNull();
  });

  it('rejects names over the allowed length', () => {
    expect(invalidCareerNameReason('x'.repeat(MAX_CAREER_NAME_LENGTH + 1))).not.toBeNull();
    expect(invalidCareerNameReason('x'.repeat(MAX_CAREER_NAME_LENGTH))).toBeNull();
  });

  it('rejects control characters', () => {
    expect(invalidCareerNameReason('Nurse\u0000Supervisor')).not.toBeNull();
    expect(invalidCareerNameReason('Nurse\u007fSupervisor')).not.toBeNull();
  });
});