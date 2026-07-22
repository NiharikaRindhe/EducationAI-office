import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import { currentAcademicYear } from '../lib/academicYear.js';
import { generatePassword } from '../lib/credentials.js';

function getNextAcademicYear(currentYear: string): string {
  const parts = currentYear.split('-');
  const startStr = parts[0] || '2026';
  const endStr = parts[1] || '27';
  const start = parseInt(startStr, 10);
  const nextStart = start + 1;
  const nextEnd = (parseInt(endStr, 10) + 1) % 100;
  return `${nextStart}-${String(nextEnd).padStart(2, '0')}`;
}

export async function getPromotionPreview(schoolId: string) {
  const currentYear = currentAcademicYear();
  const nextYear = getNextAcademicYear(currentYear);

  // Get active student profiles in this school
  const { data: students, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, student_profiles!inner(class_num)')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .eq('is_active', true);

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to fetch student counts', error.message);

  const byClass: Record<number, number> = {};
  for (let c = 1; c <= 10; c++) {
    byClass[c] = 0;
  }

  students?.forEach((s) => {
    const sp = Array.isArray(s.student_profiles) ? s.student_profiles[0] : s.student_profiles;
    if (sp && sp.class_num >= 1 && sp.class_num <= 10) {
      byClass[sp.class_num] = (byClass[sp.class_num] ?? 0) + 1;
    }
  });

  const eligibleCount = students?.length ?? 0;
  const class4Count = byClass[4] ?? 0;
  const class10Count = byClass[10] ?? 0;

  return {
    currentYear,
    nextYear,
    byClass,
    eligibleCount,
    class4Count,
    class10Count,
  };
}

export async function executePromotion(schoolId: string) {
  const currentYear = currentAcademicYear();
  const nextYear = getNextAcademicYear(currentYear);

  // 1. Get all active students in the school
  const { data: students, error: sErr } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, student_profiles!inner(class_num, section)')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .eq('is_active', true);

  if (sErr) throw new ApiError('INTERNAL_ERROR', 'Failed to fetch students for promotion', sErr.message);

  if (!students || students.length === 0) {
    return {
      message: 'No active students to promote',
      oldYear: currentYear,
      newYear: nextYear,
      passedOutCount: 0,
      promotedCount: 0,
      class4To5Credentials: [],
    };
  }

  // 2. Identify Class 10, Class 4, and Class 1-9 students
  const class10Students = students.filter((s) => {
    const sp = Array.isArray(s.student_profiles) ? s.student_profiles[0] : s.student_profiles;
    return sp?.class_num === 10;
  });

  const class4Students = students.filter((s) => {
    const sp = Array.isArray(s.student_profiles) ? s.student_profiles[0] : s.student_profiles;
    return sp?.class_num === 4;
  });

  const class1To9Students = students.filter((s) => {
    const sp = Array.isArray(s.student_profiles) ? s.student_profiles[0] : s.student_profiles;
    return sp && sp.class_num >= 1 && sp.class_num < 10;
  });

  // 3. Mark Class 10 as passed-out (is_active = false)
  if (class10Students.length > 0) {
    const class10Ids = class10Students.map((s) => s.id);
    const { error: deactErr } = await supabaseAdmin
      .from('user_profiles')
      .update({ is_active: false })
      .in('id', class10Ids);

    if (deactErr) throw new ApiError('INTERNAL_ERROR', 'Failed to deactivate Class 10 students', deactErr.message);
  }

  // 4. Convert Class 4 to Class 5: PIN -> Password transition
  const class4To5Credentials = [];
  for (const student of class4Students) {
    const sp = Array.isArray(student.student_profiles) ? student.student_profiles[0] : student.student_profiles;
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(student.id);
    const username = authUser?.user?.email ?? '';

    // Generate new password
    const newPassword = generatePassword(8);
    const { error: pwErr } = await supabaseAdmin.auth.admin.updateUserById(student.id, { password: newPassword });
    if (pwErr) throw new ApiError('INTERNAL_ERROR', `Failed to set password for student ${student.full_name}`, pwErr.message);

    // Set pin_hash to null on their student profile
    const { error: updatePinErr } = await supabaseAdmin
      .from('student_profiles')
      .update({ pin_hash: null })
      .eq('user_id', student.id);

    if (updatePinErr) throw new ApiError('INTERNAL_ERROR', `Failed to clear PIN for student ${student.full_name}`, updatePinErr.message);

    class4To5Credentials.push({
      fullName: student.full_name,
      username,
      password: newPassword,
      classNum: 5,
      section: sp?.section ?? 'A',
    });
  }

  // 5. Increment Class 1-9 to Class + 1 (descending order to avoid any constraint trigger logic issues)
  // Since we are incrementing their classes, we can run them in batches class by class
  for (let c = 9; c >= 1; c--) {
    const classStudents = class1To9Students.filter((s) => {
      const sp = Array.isArray(s.student_profiles) ? s.student_profiles[0] : s.student_profiles;
      return sp?.class_num === c;
    });
    if (classStudents.length === 0) continue;

    const ids = classStudents.map((s) => s.id);
    const { error: incErr } = await supabaseAdmin
      .from('student_profiles')
      .update({ class_num: c + 1 })
      .in('user_id', ids);

    if (incErr) throw new ApiError('INTERNAL_ERROR', `Failed to promote Class ${c} students`, incErr.message);
  }

  // 6. Carry forward sections from current academic year to next academic year
  const { data: currentSections, error: secErr } = await supabaseAdmin
    .from('class_sections')
    .select('class_num, section_label')
    .eq('school_id', schoolId)
    .eq('academic_year', currentYear);

  if (secErr) throw new ApiError('INTERNAL_ERROR', 'Failed to fetch current year sections', secErr.message);

  if (currentSections && currentSections.length > 0) {
    const newSectionsData = currentSections.map((s) => ({
      school_id: schoolId,
      academic_year: nextYear,
      class_num: s.class_num,
      section_label: s.section_label,
      is_active: true,
    }));

    const { error: carryErr } = await supabaseAdmin
      .from('class_sections')
      .upsert(newSectionsData, { onConflict: 'school_id,academic_year,class_num,section_label' });

    if (carryErr) throw new ApiError('INTERNAL_ERROR', 'Failed to carry forward sections', carryErr.message);
  }

  return {
    message: 'Promotion completed successfully',
    oldYear: currentYear,
    newYear: nextYear,
    passedOutCount: class10Students.length,
    promotedCount: class1To9Students.length,
    class4To5Credentials,
  };
}
