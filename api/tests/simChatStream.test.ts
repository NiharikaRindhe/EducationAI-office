// Covers the real-streaming restoration in simExplain.service.ts:
// extractStreamingJsonField() (ported verbatim from pdf-simulation-master)
// and the "already streamed -> don't fall through" cascade rule in
// generateChatReplyStream() / tryStreamedChatAttempt(). Mocks
// chatCompletionStream at api/src/lib/ai.js the same way simClassify.test.ts
// mocks chatCompletion — StreamInterruptedError is kept as the real class
// (via importOriginal) so the service's `instanceof` check still works.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/lib/ai.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/ai.js')>();
  return {
    ...actual,
    chatCompletion: vi.fn(),
    chatCompletionStream: vi.fn(),
  };
});

const { generateChatReplyStream, extractStreamingJsonField } = await import('../src/services/simExplain.service.js');
const { chatCompletionStream, StreamInterruptedError } = await import('../src/lib/ai.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('extractStreamingJsonField', () => {
  it('returns empty string before the target field has started', () => {
    expect(extractStreamingJsonField('{"inSyllabus":true,', 'reply')).toBe('');
  });

  it('extracts the growing value of a partial string field', () => {
    expect(extractStreamingJsonField('{"reply":"Hello wor', 'reply')).toBe('Hello wor');
  });

  it('stops at the closing quote once the field is complete', () => {
    expect(extractStreamingJsonField('{"reply":"Hello world","relatedFormulas":[]}', 'reply')).toBe('Hello world');
  });

  it('decodes standard JSON escapes as they complete', () => {
    expect(extractStreamingJsonField('{"reply":"line1\\nline2', 'reply')).toBe('line1\nline2');
  });

  it('decodes \\u escapes', () => {
    expect(extractStreamingJsonField('{"reply":"caf\\u00e9', 'reply')).toBe('café');
  });

  it('degrades gracefully on a dangling escape at the very end of the partial text', () => {
    expect(extractStreamingJsonField('{"reply":"Hello\\', 'reply')).toBe('Hello');
  });

  it('degrades gracefully on a dangling incomplete \\u escape', () => {
    expect(extractStreamingJsonField('{"reply":"Hello \\u00', 'reply')).toBe('Hello ');
  });
});

// A GREETING-matching question always clears the zero-LLM syllabus firewall
// regardless of book context, so these tests can focus purely on the
// streaming cascade without engineering token-overlap scoring.
const GREETING_TURNS = [{ role: 'user' as const, content: 'Hi' }];

describe('generateChatReplyStream — streaming cascade', () => {
  it('stops at the first attempt once real reply text has streamed, even if that attempt then fails', async () => {
    vi.mocked(chatCompletionStream).mockImplementation(async (_messages, _opts, onChunk) => {
      onChunk('{"reply":"Hello');
      throw new StreamInterruptedError('connection dropped', '{"reply":"Hello');
    });

    const events: unknown[] = [];
    await generateChatReplyStream(GREETING_TURNS, {}, (e) => events.push(e));

    expect(chatCompletionStream).toHaveBeenCalledTimes(1); // no fallback/retry after real text was shown
    expect(events[0]).toEqual({ type: 'delta', text: 'Hello' });
    expect(events[events.length - 1]).toMatchObject({ type: 'done' });
  });

  it('falls through to the procedural reply when nothing was ever shown', async () => {
    vi.mocked(chatCompletionStream).mockRejectedValue(new Error('provider unreachable'));

    const events: { type: string; text?: string }[] = [];
    await generateChatReplyStream(GREETING_TURNS, {}, (e) => events.push(e as { type: string; text?: string }));

    expect(chatCompletionStream).toHaveBeenCalledTimes(1); // text tier only — no image attached, so no vision attempt
    const delta = events.find((e) => e.type === 'delta');
    expect(delta?.text).toContain('local fallback');
    expect(events[events.length - 1]).toMatchObject({ type: 'done' });
  });

  it('forwards only genuinely new reply text across multiple chunks, in order', async () => {
    vi.mocked(chatCompletionStream).mockImplementation(async (_messages, _opts, onChunk) => {
      onChunk('{"reply":"Hel');
      onChunk('lo wor');
      onChunk('ld","relatedFormulas":[],"keyTakeaways":[]}');
    });

    const deltas: string[] = [];
    await generateChatReplyStream(GREETING_TURNS, {}, (e) => {
      if (e.type === 'delta') deltas.push(e.text);
    });

    expect(deltas).toEqual(['Hel', 'lo wor', 'ld']);
    expect(deltas.join('')).toBe('Hello world');
  });
});
