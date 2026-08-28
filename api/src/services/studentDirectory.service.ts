import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { getTeachingScope } from './teacher.service.js';

/**
 * Shared, server-side paged/filtered/sorted student roster.
 *
 * All three portals that show a student table (School Admin, Teacher,
 * Super Admin) read through here so they stay consistent and none of them
 * pulls the whole school into Node to filter it there. Reads the flattened
 * `student_directory` view (migration 20250101000149) so filter, sort and
 * range all happen in Postgres.
 *
 * Scoping is applied explicitly per caller — the service-role key bypasses
 * RLS, so "which students may this account see" is enforced here, never
 * assumed.
 */

export const SORT_KEYS = ['name', 'class', 'roll', 'xp', 'streak', 'lastSeen', 'school'] as const;
export type SortKey = (typeof SORT_KEYS)[number];

/** View column backing each UI-facing sort key. */
const SORT_COLUMN: Record<SortKey, string> = {
  name: 'full_name',
  class: 'class_sort',
  roll: 'roll_number',
  xp: 'xp',
  streak: 'streak',
  lastSeen: 'last_seen_at',
  school: 'school_name',
};

export const MAX_PAGE_SIZE = 200;
/** Ceiling on a "select every student matching this filter" request. Bulk
 *  actions are per-section workflows in practice; this stops a stray
 *  unfiltered select-all from turning into a multi-thousand-row write. */
export const MAX_BULK_IDS = 2000;

export interface DirectoryFilters {
  search?: string;
  classNum?: number;
  section?: string;
  /** 'active' = has logged in at least once; 'never' = never signed in. */
  status?: 'all' | 'active' | 'never';
  /** Account enabled/disabled, independent of whether they ever logged in. */
  enabled?: 'all' | 'enabled' | 'disabled';
  /**
   * Whether students who have left the school are included. Defaults to
   * 'current' everywhere — a roster that quietly counts leavers is wrong for
   * headcount, section capacity and every report built on top of it.
   * 'graduated' is a leaver sub-case: a Class 10 pass-out from Academic Year
   * Rollover, which sets student_enrollments.outcome (not exited_at) — see
   * the student_directory view's `graduated` column.
   */
  enrolment?: 'current' | 'left' | 'all' | 'graduated';
  schoolId?: string;
  batchId?: number;
}

export interface DirectoryQuery extends DirectoryFilters {
  page?: number;
  pageSize?: number;
  sortKey?: SortKey;
  sortDir?: 'asc' | 'desc';
}

export interface TeacherScopeLimit {
  sections: { classNum: number; section: string }[];
  classNums: number[];
  legacyFallback: boolean;
}

export interface DirectoryRow {
  id: string;
  school_id: string;
  school_name: string;
  school_code: string;
  full_name: string;
  is_active: boolean;
  has_logged_in_ever: boolean;
  last_seen_at: string | null;
  class_num: number;
  section: string;
  batch_id: number | null;
  roll_number: string | null;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
  longest_streak: number;
  graduated: boolean;
}

/** Minimal structural view of a PostgREST builder. Selecting '*' vs 'id'
 *  yields differently-parameterised builder types, so the filter helpers are
 *  generic over "something chainable" rather than pinned to one of them. */
interface FilterableQuery<Self> {
  eq(column: string, value: unknown): Self;
  or(filters: string): Self;
  in(column: string, values: readonly unknown[]): Self;
}

/** Applies every filter that is common to all three portals. */
function applyFilters<Q extends FilterableQuery<Q>>(query: Q, filters: DirectoryFilters): Q {
  let q = query;

  if (filters.schoolId) q = q.eq('school_id', filters.schoolId);
  if (filters.classNum !== undefined) q = q.eq('class_num', filters.classNum);
  if (filters.section) q = q.eq('section', filters.section);
  if (filters.batchId !== undefined) q = q.eq('batch_id', filters.batchId);

  if (filters.status === 'active') q = q.eq('has_logged_in_ever', true);
  else if (filters.status === 'never') q = q.eq('has_logged_in_ever', false);

  if (filters.enabled === 'enabled') q = q.eq('is_active', true);
  else if (filters.enabled === 'disabled') q = q.eq('is_active', false);

  // Leavers are hidden unless explicitly asked for. 'current' is also the
  // behaviour when the caller sends nothing, so existing clients keep the
  // roster they expect without being updated.
  if (filters.enrolment === 'left') q = q.eq('has_left', true);
  else if (filters.enrolment === 'graduated') q = q.eq('graduated', true);
  else if (filters.enrolment !== 'all') q = q.eq('has_left', false);

  if (filters.search) {
    // Escape PostgREST's or() delimiters so a name with a comma or paren
    // can't break out of the filter expression.
    const safe = filters.search.replace(/[,()]/g, ' ').trim();
    if (safe) q = q.or(`full_name.ilike.%${safe}%,roll_number.ilike.%${safe}%`);
  }

  return q;
}

/** Restricts to the (class, section) pairs a teacher actually teaches.
 *  Mirrors the RLS rule that service-role queries bypass. */
function applyTeacherScope<Q extends FilterableQuery<Q>>(query: Q, scope: TeacherScopeLimit): Q {
  if (scope.legacyFallback) {
    // Teacher predates section mapping — fall back to whole classes.
    return query.in('class_num', scope.classNums);
  }
  const clauses = scope.sections.map((s) => `and(class_num.eq.${s.classNum},section.eq.${s.section})`);
  return query.or(clauses.join(','));
}

export interface DirectoryPage {
  rows: DirectoryRow[];
  total: number;
  page: number;
  pageSize: number;
  /** True when the request was withheld because it wasn't narrowed to a
   *  school or a search term. Lets the UI prompt for a search rather than
   *  render a misleading "no students found". */
  gated?: boolean;
}

/**
 * Does this request identify *who* it is looking for?
 *
 * The Super Admin directory exists so support can answer "Riya in 4-B can't
 * log in" without first knowing her school. That is a lookup. Landing on the
 * page and being handed every child on the platform — name, class, school,
 * and behavioural columns like XP, streak and last-seen — is not the same
 * thing, and browsing minors' activity across schools with no stated purpose
 * is exactly the pattern India's DPDP Act 2023 §9 restricts.
 *
 * So the cross-school view answers questions but does not browse: it returns
 * nothing until narrowed to a school or given something to search for.
 */
function isNarrowed(query: DirectoryFilters): boolean {
  return Boolean(query.schoolId || (query.search && query.search.trim().length > 0));
}

/** One page of the roster, plus the exact total for the current filter. */
export async function listStudentDirectory(
  query: DirectoryQuery,
  scope?: TeacherScopeLimit,
  options: { requireNarrowing?: boolean } = {},
): Promise<DirectoryPage> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? 50));
  const sortKey: SortKey = query.sortKey && SORT_KEYS.includes(query.sortKey) ? query.sortKey : 'class';
  const ascending = query.sortDir !== 'desc';

  // Cross-school reads must name a school or a search term first.
  if (options.requireNarrowing && !isNarrowed(query)) {
    return { rows: [], total: 0, page, pageSize, gated: true };
  }

  // A teacher with no mapped sections and no legacy classes teaches nobody —
  // returning early avoids emitting an empty or() that would match everyone.
  if (scope && !scope.legacyFallback && scope.sections.length === 0) {
    return { rows: [], total: 0, page, pageSize };
  }
  if (scope && scope.legacyFallback && scope.classNums.length === 0) {
    return { rows: [], total: 0, page, pageSize };
  }

  let q = supabaseAdmin.from('student_directory').select('*', { count: 'exact' });
  q = applyFilters(q, query);
  if (scope) q = applyTeacherScope(q, scope);

  const from = (page - 1) * pageSize;
  const { data, error, count } = await q
    .order(SORT_COLUMN[sortKey], { ascending, nullsFirst: false })
    // Deterministic tiebreak so paging can't show or skip a row when many
    // students share a sort value (very common on class/xp/streak).
    .order('id', { ascending: true })
    .range(from, from + pageSize - 1);

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list students', error.message);

  return {
    rows: (data ?? []) as DirectoryRow[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

/** Every id matching the current filter — backs the table's
 *  "select all N matching" control without shipping full rows. */
export async function listStudentDirectoryIds(
  filters: DirectoryFilters,
  scope?: TeacherScopeLimit,
): Promise<string[]> {
  if (scope && !scope.legacyFallback && scope.sections.length === 0) return [];
  if (scope && scope.legacyFallback && scope.classNums.length === 0) return [];

  let q = supabaseAdmin.from('student_directory').select('id');
  q = applyFilters(q, filters);
  if (scope) q = applyTeacherScope(q, scope);

  const { data, error } = await q.limit(MAX_BULK_IDS);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list student ids', error.message);
  return (data ?? []).map((r) => (r as { id: string }).id);
}

/** Resolves a teacher's scope in the shape this service expects. */
export async function teacherScopeFor(teacherId: string, schoolId: string): Promise<TeacherScopeLimit> {
  const scope = await getTeachingScope(teacherId, schoolId);
  return {
    sections: scope.sections.map((s) => ({ classNum: s.classNum, section: s.section })),
    classNums: scope.classNums,
    legacyFallback: scope.legacyFallback,
  };
}

/** Guards every bulk write: the ids must all be students the caller's school
 *  actually owns. Prevents a crafted id list from touching another school. */
export async function assertStudentsInSchool(studentIds: string[], schoolId: string): Promise<void> {
  if (studentIds.length === 0) throw new ApiError('VALIDATION_ERROR', 'No students selected');
  if (studentIds.length > MAX_BULK_IDS) {
    throw new ApiError('VALIDATION_ERROR', `Cannot act on more than ${MAX_BULK_IDS} students at once`);
  }

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .in('id', studentIds);

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to verify students', error.message);
  if ((data ?? []).length !== studentIds.length) {
    throw new ApiError('FORBIDDEN', 'One or more selected students are not in your school');
  }
}

/** CSV of the full current filter (not just the visible page). */
export async function exportStudentDirectoryCsv(
  filters: DirectoryFilters,
  scope?: TeacherScopeLimit,
  options: { includeSchool?: boolean } = {},
): Promise<string> {
  if (scope && !scope.legacyFallback && scope.sections.length === 0) return '';
  if (scope && scope.legacyFallback && scope.classNums.length === 0) return '';

  let q = supabaseAdmin.from('student_directory').select('*');
  q = applyFilters(q, filters);
  if (scope) q = applyTeacherScope(q, scope);

  const { data, error } = await q.order('class_sort').order('full_name').limit(MAX_BULK_IDS);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to export students', error.message);

  const rows = (data ?? []) as DirectoryRow[];
  const headers = [
    ...(options.includeSchool ? ['School', 'School Code'] : []),
    'Full Name', 'Class', 'Section', 'Roll Number',
    'XP', 'Level', 'Streak', 'Longest Streak',
    'Account Status', 'Ever Logged In', 'Last Seen',
  ];

  // Prefix formula-triggering leads so a name like "=cmd" can't execute when
  // the export is opened in Excel.
  const cell = (value: unknown): string => {
    const s = value === null || value === undefined ? '' : String(value);
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };

  const lines = rows.map((r) =>
    [
      ...(options.includeSchool ? [r.school_name, r.school_code] : []),
      r.full_name, r.class_num, r.section, r.roll_number ?? '',
      r.xp, r.level, r.streak, r.longest_streak,
      r.is_active ? 'Active' : 'Deactivated',
      r.has_logged_in_ever ? 'Yes' : 'No',
      r.last_seen_at ? new Date(r.last_seen_at).toISOString() : '',
    ].map(cell).join(','),
  );

  return [headers.map(cell).join(','), ...lines].join('\n');
}
