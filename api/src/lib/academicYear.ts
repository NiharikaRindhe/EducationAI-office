// April remains the default, but schools can start their new session in any
// month. July 2026 with an April start -> '2026-27'; February 2027 ->
// '2026-27'. All calculations use IST so the rollover date never changes in
// the middle of a school day.
export function currentAcademicYear(now = new Date(), startMonth = 4): string {
  const safeStartMonth = Number.isInteger(startMonth) && startMonth >= 1 && startMonth <= 12 ? startMonth : 4;
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const startYear = ist.getMonth() + 1 >= safeStartMonth ? ist.getFullYear() : ist.getFullYear() - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}
