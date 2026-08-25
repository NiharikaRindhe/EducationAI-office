// Ported from pdf-simulation-master/server/src/services/sim/__tests__/ingest.test.ts
// against api/src/services/simIngest.service.ts. Pure unit tests, no database —
// mirrors src/lib/simShared's own tests, which is why this lives alongside them
// rather than needing the Postgres/GoTrue stack the isolation/security suites use.

import { describe, it, expect } from 'vitest';
import { validateMathExpressions, triageCandidates, computeContentHash, normalizeTemplateCandidate } from '../src/services/simIngest.service.js';
import { physicsFixture, templateProjectileFixture } from '../src/lib/simShared/index.js';
import type { Candidate } from '../src/services/simCandidateSchema.js';

describe('simIngest: validateMathExpressions (Math Guard)', () => {
  it('accepts valid mathjs expressions', () => {
    const validSpec = JSON.parse(JSON.stringify(physicsFixture));
    expect(validateMathExpressions(validSpec)).toBe(true);
  });

  it('rejects candidates with invalid Python power syntax (**)', () => {
    const invalidSpec = JSON.parse(JSON.stringify(physicsFixture));
    invalidSpec.stage.elements[1].props.cy = { $expr: '270 - (120 * time - 30 * time**2)' };
    expect(validateMathExpressions(invalidSpec)).toBe(false);
  });

  it('rejects candidates with malformed syntax (unbalanced parentheses)', () => {
    const invalidSpec = JSON.parse(JSON.stringify(physicsFixture));
    invalidSpec.stage.elements[1].props.cx = { $expr: 'sin(time * 2' };
    expect(validateMathExpressions(invalidSpec)).toBe(false);
  });

  it('validates expressions inside element text', () => {
    const specWithTextExpr = JSON.parse(JSON.stringify(physicsFixture));
    specWithTextExpr.stage.elements.push({
      id: 'timer-label',
      type: 'text',
      role: 'none',
      props: { x: 50, y: 50 },
      text: { $expr: 'concat("t=", round(time, 1), "s")' },
    });
    expect(validateMathExpressions(specWithTextExpr)).toBe(true);

    specWithTextExpr.stage.elements[specWithTextExpr.stage.elements.length - 1].text = { $expr: 'invalid++math(' };
    expect(validateMathExpressions(specWithTextExpr)).toBe(false);
  });

  it('returns true for non-simulatable specs without stage', () => {
    const nonSimSpec = { ...physicsFixture, isSimulatable: false, stage: undefined };
    expect(validateMathExpressions(nonSimSpec)).toBe(true);
  });

  it('returns true for template-only specs with no stage', () => {
    expect(validateMathExpressions(templateProjectileFixture)).toBe(true);
  });
});

describe('simIngest: normalizeTemplateCandidate', () => {
  it('parses a template-only LLM candidate and strips any cartoon stage', () => {
    const cand: Candidate = { ...templateProjectileFixture, importance: 9, stage: physicsFixture.stage };
    const normalized = normalizeTemplateCandidate(cand);
    expect(normalized?.templateId).toBe('projectile_2d');
    expect(normalized?.params?.v0).toBe(20);
    expect(normalized?.stage).toBeUndefined();
    expect(normalized?.isSimulatable).toBe(true);
  });

  it('keeps ingest-time about and howItWorks on a template candidate', () => {
    const cand: Candidate = {
      ...templateProjectileFixture,
      importance: 9,
      about: 'A cricket ball thrown from the ground.',
      howItWorks: '- Horizontal speed stays constant.\n- Gravity pulls the ball down.',
    };
    const normalized = normalizeTemplateCandidate(cand);
    expect(normalized?.about).toContain('cricket');
    expect(normalized?.howItWorks).toContain('Horizontal');
  });

  it('drops unknown templateId when there is no fallback stage', () => {
    const cand: Candidate = { ...templateProjectileFixture, importance: 8, templateId: 'wormhole_drive', stage: undefined };
    expect(normalizeTemplateCandidate(cand)).toBeNull();
  });

  it('drops unknown templateId even when a cartoon stage is present', () => {
    const cand: Candidate = { ...physicsFixture, importance: 8, templateId: 'wormhole_drive' };
    expect(normalizeTemplateCandidate(cand)).toBeNull();
  });

  it('drops simulatable candidates that have no templateId', () => {
    const cand: Candidate = { ...physicsFixture, importance: 8, templateId: undefined };
    expect(normalizeTemplateCandidate(cand)).toBeNull();
  });

  it('drops Fig. 8.5 when the LLM stuffed it into v0', () => {
    const cand: Candidate = {
      ...templateProjectileFixture,
      importance: 9,
      quote: 'A ball is thrown at 20 m/s (see Fig. 8.5).',
      params: { v0: 8.5, angleDeg: 45 },
    };
    const normalized = normalizeTemplateCandidate(cand);
    expect(normalized?.params?.v0).toBe(20);
    expect(normalized?.paramMeta?.v0?.source).toBe('default');
  });

  it('keeps 8.5 m as h0 when Fig. 8.5 is only a caption', () => {
    const cand: Candidate = {
      ...templateProjectileFixture,
      importance: 9,
      templateId: 'free_fall',
      quote: 'A stone is dropped from 8.5 m (Fig. 8.5).',
      params: { h0: 8.5 },
    };
    const normalized = normalizeTemplateCandidate(cand);
    expect(normalized?.params?.h0).toBe(8.5);
    expect(normalized?.paramMeta?.h0?.source).toBe('extracted');
  });
});

describe('simIngest: triageCandidates', () => {
  it('discards candidates with importance < 6', () => {
    const candidates: Candidate[] = [
      { ...physicsFixture, importance: 5 },
      { ...physicsFixture, importance: 4 },
      { ...physicsFixture, importance: 7 },
    ];
    const result = triageCandidates(candidates);
    expect(result).toHaveLength(1);
    expect(result[0]!.importance).toBe(7);
  });

  it('sorts candidates in descending order of importance', () => {
    const candidates: Candidate[] = [
      { ...physicsFixture, title: 'Low', importance: 6 },
      { ...physicsFixture, title: 'High', importance: 10 },
      { ...physicsFixture, title: 'Mid', importance: 8 },
    ];
    const result = triageCandidates(candidates);
    expect(result.map((c) => c.title)).toEqual(['High', 'Mid', 'Low']);
  });

  it('caps output at top 3 candidates', () => {
    const candidates: Candidate[] = [
      { ...physicsFixture, title: 'One', importance: 10 },
      { ...physicsFixture, title: 'Two', importance: 9 },
      { ...physicsFixture, title: 'Three', importance: 8 },
      { ...physicsFixture, title: 'Four', importance: 7 },
      { ...physicsFixture, title: 'Five', importance: 6 },
    ];
    const result = triageCandidates(candidates);
    expect(result).toHaveLength(3);
    expect(result.map((c) => c.title)).toEqual(['One', 'Two', 'Three']);
  });
});

describe('simIngest: computeContentHash', () => {
  it('generates a 16-character hex hash', () => {
    const hash = computeContentHash('This is a test page content for kinematics.');
    expect(hash).toHaveLength(16);
    expect(/^[0-9a-f]{16}$/.test(hash)).toBe(true);
  });

  it('is deterministic for identical content', () => {
    const text = 'Identical page text with formulas.';
    expect(computeContentHash(text)).toBe(computeContentHash(text));
  });

  it('generates different hashes for different texts', () => {
    expect(computeContentHash('Text A')).not.toBe(computeContentHash('Text B'));
  });
});
