import { describe, expect, it } from 'vitest';
import { currentAcademicYear } from '../src/lib/academicYear.js';

describe('currentAcademicYear', () => {
  it('keeps April as the backward-compatible default', () => {
    expect(currentAcademicYear(new Date('2027-02-15T12:00:00Z'))).toBe('2026-27');
    expect(currentAcademicYear(new Date('2027-04-15T12:00:00Z'))).toBe('2027-28');
  });

  it('supports a school whose new session begins in June', () => {
    expect(currentAcademicYear(new Date('2027-05-15T12:00:00Z'), 6)).toBe('2026-27');
    expect(currentAcademicYear(new Date('2027-06-15T12:00:00Z'), 6)).toBe('2027-28');
  });

  it('supports a school whose new session begins late in the calendar year', () => {
    expect(currentAcademicYear(new Date('2027-11-15T12:00:00Z'), 12)).toBe('2026-27');
    expect(currentAcademicYear(new Date('2027-12-15T12:00:00Z'), 12)).toBe('2027-28');
  });

  it('falls back to April for an invalid month', () => {
    expect(currentAcademicYear(new Date('2027-03-15T12:00:00Z'), 13)).toBe('2026-27');
  });
});
