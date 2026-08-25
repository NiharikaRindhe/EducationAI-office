// Partially ported from pdf-simulation-master/server/src/services/sim/__tests__/
// classify.test.ts. The JSON-parsing describe block ports verbatim (zero
// mocking, tests our exact ported functions) and the template-matcher test
// ports verbatim (matchTemplateFromText hits before any LLM call, so it needs
// no mocking either). The provider-cascade describe block does NOT port —
// it mocked @google/generative-ai and openai directly, which no longer exist
// in simClassify.service.ts (see that file's header comment: every provider
// call collapsed into one chatCompletion()). Replaced with an equivalent
// test mocking chatCompletion itself, at api/src/lib/ai.js.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { physicsFixture, mathFixture, chemistryFixture } from '../src/lib/simShared/index.js';

vi.mock('../src/lib/ai.js', () => ({
  chatCompletion: vi.fn(),
}));

const { cleanJsonResponse, parseCandidateResponse, classifyPage, generateCustomSimulation } = await import('../src/services/simClassify.service.js');
const { chatCompletion } = await import('../src/lib/ai.js');

// File-scoped, not per-describe: classifyPage's call count must not leak
// between describe blocks (the matcher-path test below asserts zero calls).
beforeEach(() => {
  vi.clearAllMocks();
});

describe('simClassify: JSON cleaning and parsing', () => {
  it('strips markdown code blocks', () => {
    const raw = '```json\n[{"id": 1}]\n```';
    expect(cleanJsonResponse(raw)).toBe('[{"id": 1}]');
  });

  it('parses valid candidate list', () => {
    const json = JSON.stringify([
      { ...physicsFixture, importance: 9 },
      { ...mathFixture, importance: 8 },
    ]);
    const candidates = parseCandidateResponse(json);
    expect(candidates).toHaveLength(2);
    expect(candidates[0]!.importance).toBe(9);
    expect(candidates[1]!.importance).toBe(8);
  });

  it('extracts candidates from the {candidates:[...]} wrapper — our actual prompt shape', () => {
    const json = JSON.stringify({ candidates: [{ ...chemistryFixture, importance: 7 }] });
    const candidates = parseCandidateResponse(json);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.domain).toBe('chemistry');
  });

  it('parses single candidate object into single-element array', () => {
    const json = JSON.stringify({ ...physicsFixture, importance: 9 });
    const candidates = parseCandidateResponse(json);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.title).toBe(physicsFixture.title);
  });

  it('caps candidates at 3 even if the model produces more', () => {
    const json = JSON.stringify([
      { ...physicsFixture, title: 'Sim 1', importance: 9 },
      { ...physicsFixture, title: 'Sim 2', importance: 8 },
      { ...physicsFixture, title: 'Sim 3', importance: 7 },
      { ...physicsFixture, title: 'Sim 4', importance: 6 },
    ]);
    const candidates = parseCandidateResponse(json);
    expect(candidates).toHaveLength(3);
    expect(candidates.map((c) => c.title)).toEqual(['Sim 1', 'Sim 2', 'Sim 3']);
  });

  it('parses template-only candidates without a stage', () => {
    const json = JSON.stringify([
      {
        version: '2.0',
        title: 'Projectile motion',
        domain: 'physics',
        isSimulatable: true,
        templateId: 'projectile_2d',
        params: { v0: 20, angleDeg: 45, h0: 0, g: 9.81 },
        importance: 9,
      },
    ]);
    const candidates = parseCandidateResponse(json);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.templateId).toBe('projectile_2d');
    expect(candidates[0]!.params?.v0).toBe(20);
    expect(candidates[0]!.stage).toBeUndefined();
  });

  it('silently filters out malformed candidates', () => {
    const json = JSON.stringify([{ ...physicsFixture, importance: 9 }, { invalid: true }, { ...mathFixture, importance: 6 }]);
    const candidates = parseCandidateResponse(json);
    expect(candidates).toHaveLength(2);
    expect(candidates[0]!.importance).toBe(9);
    expect(candidates[1]!.importance).toBe(6);
  });
});

describe('simClassify: classifyPage over chatCompletion', () => {
  it('calls chatCompletion on the qgen tier and parses the candidates array', async () => {
    vi.mocked(chatCompletion).mockResolvedValue(JSON.stringify({ candidates: [{ ...physicsFixture, importance: 9 }] }));

    const candidates = await classifyPage('A ball is launched with initial velocity v0 at angle theta...');

    expect(candidates).toHaveLength(1);
    expect(candidates[0]!.title).toBe(physicsFixture.title);
    expect(chatCompletion).toHaveBeenCalledTimes(1);
    expect(chatCompletion).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ jsonMode: true, tier: 'qgen' }));
  });

  it('returns [] rather than throwing when the AI call fails entirely', async () => {
    vi.mocked(chatCompletion).mockRejectedValue(new Error('every provider is over quota'));
    const candidates = await classifyPage('Some page text with enough words to matter here.');
    expect(candidates).toEqual([]);
  });

  it('filters the curator template offer to the given class', async () => {
    vi.mocked(chatCompletion).mockResolvedValue(JSON.stringify({ candidates: [] }));
    await classifyPage('Class 5 arithmetic page text.', { classNum: 5 });
    const [messages] = vi.mocked(chatCompletion).mock.calls[0]!;
    const systemPrompt = (messages as { role: string; content: string }[])[0]!.content;
    // Class 5 sits below every catalog classBand's minimum (they start at 6),
    // so the class-5 prompt should offer no templateId lines at all.
    expect(systemPrompt).not.toMatch(/`projectile_2d`/);
  });
});

describe('simClassify: generateCustomSimulation matcher path (no LLM call needed)', () => {
  it('binds a series quote to series_parallel without inventing a stage', async () => {
    const candidate = await generateCustomSimulation('Two resistors of 2 Ω and 3 Ω are connected in series across a 10 V battery.');
    expect(candidate.templateId).toBe('series_parallel');
    expect(candidate.params?.R1).toBe(2);
    expect(candidate.params?.R2).toBe(3);
    expect(candidate.params?.V).toBe(10);
    expect(candidate.params?.mode).toBe(0);
    expect(candidate.stage).toBeUndefined();
    expect(candidate.isSimulatable).toBe(true);
    expect(chatCompletion).not.toHaveBeenCalled();
  });
});
