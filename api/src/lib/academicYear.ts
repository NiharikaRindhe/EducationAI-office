// Indian academic year runs April-March. July 2026 -> '2026-27',
// February 2027 -> still '2026-27'. Mirrors current_academic_year() in
// the database (both computed in IST so they can never disagree).
export function currentAcademicYear(now = new Date()): string {
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const startYear = ist.getMonth() + 1 >= 4 ? ist.getFullYear() : ist.getFullYear() - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}
