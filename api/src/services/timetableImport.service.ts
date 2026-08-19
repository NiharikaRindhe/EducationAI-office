import ExcelJS from 'exceljs';
import { parse as parseCsv } from 'csv-parse/sync';
import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { currentAcademicYear } from '../lib/academicYear.js';
import { writeAuditLog } from './auditLog.service.js';

/**
 * Bulk timetable import.
 *
 * Schools almost never build a timetable in software — they arrive with one
 * already made, in a spreadsheet, and re-keying forty periods a class by hand
 * is the reason the feature went unused. This takes that spreadsheet.
 *
 * Two things make it worth more than a loop over createSlot():
 *
 *  - It resolves names to ids. A school's sheet says "7-A", "Mathematics",
 *    "Mr. Rao", "Physics Lab" — not UUIDs. Every lookup is scoped to the
 *    importing school, so a crafted sheet cannot reach another school's rows.
 *
 *  - It reports per-row instead of failing the file. A ninety-row timetable
 *    with two clashes should import eighty-eight rows and tell the admin about
 *    the two, not roll everything back over a typo.
 */

export interface TimetableImportError {
  row: number;
  reason: string;
  detail?: string;
}

export interface TimetableImportResult {
  created: number;
  replaced: number;
  errors: TimetableImportError[];
}

const DAY_NAMES: Record<string, number> = {
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s.-]+/g, '_');
}

/** Accepts "Mon", "monday", or a plain 1-6. */
function parseDay(raw: string): number | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (DAY_NAMES[v] !== undefined) return DAY_NAMES[v];
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 6 ? n : null;
}

/**
 * Accepts "9:00", "09:00", "9:00 AM", "9.00", or an Excel time serial that
 * ExcelJS has already turned into a Date. Returns "HH:MM:SS".
 */
function parseTime(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;

  // Excel sometimes hands back a full ISO timestamp for a time-only cell.
  const iso = v.match(/T(\d{2}):(\d{2})/);
  if (iso) return `${iso[1]}:${iso[2]}:00`;

  const m = v.match(/^(\d{1,2})[:.](\d{2})\s*(am|pm)?$/i);
  if (!m) return null;

  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const suffix = m[3]?.toLowerCase();

  if (minute > 59) return null;
  if (suffix === 'pm' && hour < 12) hour += 12;
  if (suffix === 'am' && hour === 12) hour = 0;
  if (hour > 23) return null;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

/** "7-A", "7 A", "7A" → { classNum: 7, section: 'A' } */
function parseClassSection(classRaw: string, sectionRaw: string): { classNum: number; section: string } | null {
  const section = sectionRaw.trim().toUpperCase();
  const classText = classRaw.trim();

  if (section) {
    const n = Number(classText.replace(/[^0-9]/g, ''));
    return Number.isInteger(n) && n >= 1 && n <= 10 ? { classNum: n, section } : null;
  }

  // Combined in one cell.
  const m = classText.match(/^(\d{1,2})\s*[-/ ]?\s*([A-Za-z]{1,4})$/);
  if (!m) return null;
  const n = Number(m[1]);
  const label = m[2] ?? '';
  return Number.isInteger(n) && n >= 1 && n <= 10 && label ? { classNum: n, section: label.toUpperCase() } : null;
}

async function sheetToRecords(buffer: Buffer, filename: string): Promise<Record<string, string>[]> {
  const lower = filename.toLowerCase();

  if (lower.endsWith('.xls')) {
    throw new ApiError('VALIDATION_ERROR', 'Old .xls format is not supported — save the file as .xlsx or .csv');
  }

  if (lower.endsWith('.xlsx')) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) return [];

    const headers: string[] = [];
    sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
      headers[col] = normalizeHeader(cell.text ?? '');
    });

    const records: Record<string, string>[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const record: Record<string, string> = {};
      let hasValue = false;
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        const key = headers[col];
        if (!key) return;
        const text = cell.text ?? '';
        record[key] = text;
        if (text.trim()) hasValue = true;
      });
      if (hasValue) records.push(record);
    });
    return records;
  }

  const rows = parseCsv(buffer, {
    columns: (header: string[]) => header.map(normalizeHeader),
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[];
  return rows;
}

/** First non-empty value among a set of accepted column spellings. */
function pick(record: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = record[k];
    if (v !== undefined && String(v).trim()) return String(v).trim();
  }
  return '';
}

export async function importTimetable(
  schoolId: string,
  buffer: Buffer,
  filename: string,
  options: { replaceExisting: boolean },
  actorId: string,
): Promise<TimetableImportResult> {
  const records = await sheetToRecords(buffer, filename);
  if (!records.length) {
    throw new ApiError('VALIDATION_ERROR', 'That file has no rows under its header line');
  }

  const year = currentAcademicYear();
  const errors: TimetableImportError[] = [];

  // Resolve the school's own sections, teachers and labs once. Names in the
  // sheet are matched case-insensitively against these, and nothing outside
  // them is reachable — the school scoping is the authorisation boundary.
  const [sectionsRes, teachersRes, labsRes] = await Promise.all([
    supabaseAdmin
      .from('class_sections')
      .select('id, class_num, section_label')
      .eq('school_id', schoolId)
      .eq('academic_year', year),
    supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, teacher_profiles(employee_id)')
      .eq('school_id', schoolId)
      .eq('role', 'teacher')
      .is('exited_at', null),
    supabaseAdmin.from('labs').select('id, name').eq('school_id', schoolId).eq('is_active', true),
  ]);

  const sectionByKey = new Map<string, string>();
  for (const s of sectionsRes.data ?? []) {
    sectionByKey.set(`${s.class_num}-${String(s.section_label).toUpperCase()}`, s.id as string);
  }

  // Teachers are matched on employee id first (unambiguous) then full name.
  // A name shared by two teachers is recorded as ambiguous rather than guessed.
  const teacherByEmployee = new Map<string, string>();
  const teacherByName = new Map<string, string | null>();
  for (const t of teachersRes.data ?? []) {
    const tp = Array.isArray(t.teacher_profiles) ? t.teacher_profiles[0] : t.teacher_profiles;
    const employeeId = (tp as { employee_id?: string } | null)?.employee_id;
    if (employeeId) teacherByEmployee.set(employeeId.trim().toLowerCase(), t.id as string);

    const nameKey = String(t.full_name).trim().toLowerCase();
    teacherByName.set(nameKey, teacherByName.has(nameKey) ? null : (t.id as string));
  }

  const labByName = new Map<string, string>();
  for (const l of labsRes.data ?? []) {
    labByName.set(String(l.name).trim().toLowerCase(), l.id as string);
  }

  interface PendingSlot {
    row: number;
    classSectionId: string;
    dayOfWeek: number;
    periodNo: number;
    startsAt: string;
    endsAt: string;
    subject: string;
    teacherId: string | null;
    labId: string | null;
  }

  const pending: PendingSlot[] = [];

  records.forEach((rec, i) => {
    const rowNo = i + 2; // header is row 1
    const fail = (reason: string, detail?: string) => errors.push({ row: rowNo, reason, detail });

    const cs = parseClassSection(pick(rec, 'class', 'class_num', 'classnum', 'grade'), pick(rec, 'section', 'sec'));
    if (!cs) return fail('Could not read the class and section', 'Use a Class column like "7" with Section "A", or a single "7-A".');

    const sectionId = sectionByKey.get(`${cs.classNum}-${cs.section}`);
    if (!sectionId) return fail(`Class ${cs.classNum}-${cs.section} does not exist`, 'Create the section under Classes & Sections first.');

    const day = parseDay(pick(rec, 'day', 'day_of_week', 'weekday'));
    if (day === null) return fail('Could not read the day', 'Use Mon–Sat or 1–6.');

    const periodNo = Number(pick(rec, 'period', 'period_no', 'period_number'));
    if (!Number.isInteger(periodNo) || periodNo < 1 || periodNo > 12) {
      return fail('Period must be a whole number from 1 to 12');
    }

    const startsAt = parseTime(pick(rec, 'start', 'starts_at', 'start_time', 'from'));
    const endsAt = parseTime(pick(rec, 'end', 'ends_at', 'end_time', 'to'));
    if (!startsAt) return fail('Could not read the start time', 'Use 09:00 or 9:00 AM.');
    if (!endsAt) return fail('Could not read the end time', 'Use 09:40 or 9:40 AM.');
    if (endsAt <= startsAt) return fail('End time must be after the start time');

    const subject = pick(rec, 'subject', 'sub');
    if (!subject) return fail('Subject is required');

    let teacherId: string | null = null;
    const teacherRaw = pick(rec, 'teacher', 'teacher_name', 'employee_id', 'emp_id');
    if (teacherRaw) {
      const key = teacherRaw.toLowerCase();
      teacherId = teacherByEmployee.get(key) ?? null;
      if (!teacherId) {
        if (!teacherByName.has(key)) {
          return fail(`No teacher matches "${teacherRaw}"`, 'Use their full name as spelled on the Teachers page, or their employee id.');
        }
        const byName = teacherByName.get(key) ?? null;
        if (byName === null) {
          return fail(`More than one teacher is called "${teacherRaw}"`, 'Use the employee id instead.');
        }
        teacherId = byName;
      }
    }

    let labId: string | null = null;
    const labRaw = pick(rec, 'lab', 'lab_name', 'room');
    if (labRaw) {
      labId = labByName.get(labRaw.toLowerCase()) ?? null;
      if (!labId) return fail(`No active lab called "${labRaw}"`, 'Add it under Labs, or leave the column blank.');
    }

    pending.push({ row: rowNo, classSectionId: sectionId, dayOfWeek: day, periodNo, startsAt, endsAt, subject, teacherId, labId });
  });

  // Clashes inside the file itself. The database would catch these anyway, but
  // only one at a time and with a message about a constraint — telling the
  // admin up front which two rows collide is far more useful.
  const seenSection = new Map<string, number>();
  const seenTeacher = new Map<string, number>();
  const seenLab = new Map<string, number>();
  const usable: PendingSlot[] = [];

  for (const p of pending) {
    const slotKey = `${p.dayOfWeek}-${p.periodNo}`;
    const sKey = `${p.classSectionId}-${slotKey}`;
    if (seenSection.has(sKey)) {
      errors.push({ row: p.row, reason: 'Two rows put this class in two places at once', detail: `Clashes with row ${seenSection.get(sKey)}.` });
      continue;
    }
    if (p.teacherId) {
      const tKey = `${p.teacherId}-${slotKey}`;
      if (seenTeacher.has(tKey)) {
        errors.push({ row: p.row, reason: 'That teacher is already teaching in this period', detail: `Clashes with row ${seenTeacher.get(tKey)}.` });
        continue;
      }
      seenTeacher.set(tKey, p.row);
    }
    if (p.labId) {
      const lKey = `${p.labId}-${slotKey}`;
      if (seenLab.has(lKey)) {
        errors.push({ row: p.row, reason: 'That lab is booked twice in this period', detail: `Clashes with row ${seenLab.get(lKey)}.` });
        continue;
      }
      seenLab.set(lKey, p.row);
    }
    seenSection.set(sKey, p.row);
    usable.push(p);
  }

  let replaced = 0;
  if (options.replaceExisting && usable.length) {
    // Clear only the sections this file covers. A file for Class 7 must not
    // wipe Class 8's timetable.
    const sectionIds = [...new Set(usable.map((p) => p.classSectionId))];
    const { count } = await supabaseAdmin
      .from('timetable_slots')
      .delete({ count: 'exact' })
      .eq('school_id', schoolId)
      .eq('academic_year', year)
      .in('class_section_id', sectionIds);
    replaced = count ?? 0;
  }

  // Inserted one at a time so a single clash against a pre-existing slot costs
  // that row and not the whole file.
  let created = 0;
  for (const p of usable) {
    const { error } = await supabaseAdmin.from('timetable_slots').insert({
      school_id: schoolId,
      academic_year: year,
      class_section_id: p.classSectionId,
      day_of_week: p.dayOfWeek,
      period_no: p.periodNo,
      starts_at: p.startsAt,
      ends_at: p.endsAt,
      subject: p.subject,
      teacher_id: p.teacherId,
      lab_id: p.labId,
    });

    if (!error) {
      created += 1;
      continue;
    }

    if (error.code === '23505') {
      const m = error.message;
      const reason = m.includes('teacher_period_uq')
        ? 'That teacher already has a period scheduled at this time'
        : m.includes('lab_period_uq')
          ? 'That lab is already booked at this time'
          : 'This class already has a period scheduled at this time';
      errors.push({ row: p.row, reason, detail: 'Tick "Replace existing timetable" to overwrite, or remove the row.' });
    } else {
      errors.push({ row: p.row, reason: 'Could not save this period', detail: error.message });
    }
  }

  await writeAuditLog({
    schoolId,
    actorId,
    action: 'timetable.imported',
    entity: 'timetable',
    metadata: { created, replaced, failed: errors.length, filename },
  });

  return { created, replaced, errors };
}
