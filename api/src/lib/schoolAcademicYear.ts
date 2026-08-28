import { ApiError } from './errors.js';
import { supabaseAdmin } from './supabase.js';
import { currentAcademicYear } from './academicYear.js';

export async function getSchoolAcademicYearSettings(schoolId: string, now = new Date()) {
  const { data, error } = await supabaseAdmin
    .from('schools')
    .select('academic_year_start_month')
    .eq('id', schoolId)
    .single();
  if (error || !data) throw new ApiError('NOT_FOUND', 'School not found');

  const academicYearStartMonth = Number(data.academic_year_start_month) || 4;
  return {
    academicYearStartMonth,
    currentYear: currentAcademicYear(now, academicYearStartMonth),
  };
}

export async function currentAcademicYearForSchool(schoolId: string, now = new Date()) {
  return (await getSchoolAcademicYearSettings(schoolId, now)).currentYear;
}
