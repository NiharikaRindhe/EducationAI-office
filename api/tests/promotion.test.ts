import { describe, it, expect, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getPromotionPreview, executePromotion } from '../src/services/promotion.service.js';

/**
 * ACADEMIC YEAR ROLLOVER — end-to-end against real data.
 *
 * Re-enabled in the UI Aug 25 2026 (was hidden behind sheet item #69,
 * "Promotion wizard remove" — but it turned out to be the only feature that
 * handles new Class 1 intake / mid-school promotion / Class 10 pass-out at
 * all, so hiding it left no way to run a real rollover). This suite is what
 * proved it actually works before re-exposing it, and stays as permanent
 * coverage for a feature that irreversibly mutates student records and can
 * only run once per school per year.
 *
 * Self-contained, ZZ-prefixed throwaway school — same convention as
 * simIsolation.test.ts — so this never touches the shared DEMO-2024 school
 * other suites/manual testing rely on (rollover is strictly once-per-year
 * per school; running it against a shared fixture would burn that for good).
 *
 * Calls the service functions directly (real Postgres + GoTrue, no HTTP) —
 * this is the same real database every other DB-backed suite in this repo
 * drives (needs `npx supabase start`, and current migrations applied).
 */

function admin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY must be set to run this suite');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const RUN = Math.random().toString(36).slice(2, 8);
const YEAR = '2026-27';
let schoolId: string;
const studentIds: string[] = [];

async function makeStudent(sb: SupabaseClient, tag: string, classNum: number, section: string): Promise<string> {
  const email = `zz.promo.${tag}.${RUN}@zz-e2e.local`.toLowerCase();
  const { data, error } = await sb.auth.admin.createUser({ email, password: `ZzPromo-${RUN}-1`, email_confirm: true });
  if (error || !data.user) throw new Error(`fixture user failed (${tag}): ${error?.message}`);
  const { error: profileError } = await sb
    .from('user_profiles')
    .insert({ id: data.user.id, school_id: schoolId, role: 'student', full_name: `ZZ Promo ${tag}` });
  if (profileError) throw new Error(`fixture profile failed (${tag}): ${profileError.message}`);
  const { error: spError } = await sb.from('student_profiles').insert({ user_id: data.user.id, class_num: classNum, section, avatar: '⭐' });
  if (spError) throw new Error(`fixture student_profiles failed (${tag}): ${spError.message}`);
  studentIds.push(data.user.id);
  return data.user.id as string;
}

describe('promotion.service — academic year rollover on real data', () => {
  let c4: string;
  let c9: string;
  let c9held: string;
  let c10: string;

  afterAll(async () => {
    const sb = admin();
    // Cascades: schools -> user_profiles/student_profiles/class_sections/promotion_runs.
    if (schoolId) await sb.from('schools').delete().eq('id', schoolId);
    for (const id of studentIds) await sb.auth.admin.deleteUser(id);
  });

  it('provisions a throwaway school and a mixed roster', async () => {
    const sb = admin();
    const { data: school, error } = await sb
      .from('schools')
      .insert({ name: `ZZ Promotion Test ${RUN}`, code: `ZZ-PROMO-${RUN}`.toUpperCase(), plan: 'enterprise', board: 'CBSE' })
      .select('id')
      .single();
    if (error || !school) throw new Error(`fixture school failed: ${error?.message}`);
    schoolId = school.id as string;

    // Class 4->5 target section exists (no decision needed); Class 9's "Z"
    // section deliberately has no counterpart in Class 10 (forces a decision).
    await sb.from('class_sections').insert([
      { school_id: schoolId, academic_year: YEAR, class_num: 4, section_label: 'A' },
      { school_id: schoolId, academic_year: YEAR, class_num: 5, section_label: 'A' },
      { school_id: schoolId, academic_year: YEAR, class_num: 9, section_label: 'Z' },
      { school_id: schoolId, academic_year: YEAR, class_num: 10, section_label: 'A' },
    ]);

    c4 = await makeStudent(sb, 'c4', 4, 'A');
    c9 = await makeStudent(sb, 'c9', 9, 'Z');
    c9held = await makeStudent(sb, 'c9held', 9, 'Z');
    c10 = await makeStudent(sb, 'c10', 10, 'A');
    expect([c4, c9, c9held, c10].every(Boolean)).toBe(true);
  });

  it('preview reflects the real roster, including which section moves need a decision', async () => {
    const preview = await getPromotionPreview(schoolId);
    expect(preview.class4Count).toBe(1);
    expect(preview.class10Count).toBe(1);
    expect(preview.eligibleCount).toBe(4);
    // 9-Z -> 10 has no matching "Z" section in Class 10, so it must be flagged.
    expect(preview.sectionDecisionsNeeded).toBe(1);
    const nineZ = preview.sectionPlan.find((r) => r.fromClass === 9 && r.fromSection === 'Z');
    expect(nineZ?.needsDecision).toBe(true);
    // 4-A -> 5-A already exists, so it must NOT be flagged.
    const fourA = preview.sectionPlan.find((r) => r.fromClass === 4);
    expect(fourA?.needsDecision).toBe(false);
  });

  it('execute promotes, passes out, holds back, merges a section, and issues Class 5 credentials — atomically, on real rows', async () => {
    const result = await executePromotion(schoolId, undefined, [c9held], [{ fromClass: 9, fromSection: 'Z', toSection: 'A' }]);

    expect(result.promotedCount).toBe(2); // c4 -> 5, c9 -> 10
    expect(result.passedOutCount).toBe(1); // c10
    expect(result.heldBackCount).toBe(1); // c9held stays in Class 9
    expect(result.class4To5Credentials).toHaveLength(1);
    expect(result.class4To5Credentials[0]?.classNum).toBe(5);

    const sb = admin();
    const { data: after } = await sb.from('student_profiles').select('user_id, class_num, section').in('user_id', [c4, c9, c9held, c10]);
    const byId = new Map((after ?? []).map((r) => [r.user_id as string, r]));

    expect(byId.get(c4)?.class_num).toBe(5);
    // Merged into the mapped section, not left in "Z" (which doesn't exist in Class 10).
    expect(byId.get(c9)).toMatchObject({ class_num: 10, section: 'A' });
    expect(byId.get(c9held)?.class_num).toBe(9); // untouched — held back
    expect(byId.get(c10)?.class_num).toBe(10); // profile row itself isn't moved; the account is deactivated instead

    const { data: c10Profile } = await sb.from('user_profiles').select('is_active').eq('id', c10).single();
    expect(c10Profile?.is_active).toBe(false);
  });

  it('a second run for the same school-year is rejected, not silently re-applied', async () => {
    await expect(executePromotion(schoolId)).rejects.toThrow(/already been run/i);
  });
});
