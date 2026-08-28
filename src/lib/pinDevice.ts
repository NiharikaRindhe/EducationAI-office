/**
 * Class 1-4 PIN login normally starts with an adult typing an alphanumeric
 * school code and picking a class/section before a child ever sees their own
 * name (see Login.tsx's `pin-setup` step). That's fine for the first setup
 * of a shared classroom computer, but asking a 6-9 year old to repeat it
 * every day is the actual friction the "make login easier" ask was about.
 *
 * This remembers which school/class/section a *device* belongs to — not who
 * the student is. It never touches PIN verification: a child still has to
 * tap their own name and enter their own correct PIN every time. Cleared via
 * the "Not your class?" link on the roster screen for the rare case a shared
 * device gets reassigned to a different section.
 */

const KEY = 'eduai_pin_device_class';

export interface RememberedClass {
  schoolCode: string;
  classNum: number;
  section: string;
}

export function getRememberedClass(): RememberedClass | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RememberedClass>;
    if (
      typeof parsed.schoolCode === 'string' && parsed.schoolCode &&
      typeof parsed.classNum === 'number' &&
      typeof parsed.section === 'string' && parsed.section
    ) {
      return { schoolCode: parsed.schoolCode, classNum: parsed.classNum, section: parsed.section };
    }
    return null;
  } catch {
    // Private-browsing/blocked storage — fall back to the normal setup step.
    return null;
  }
}

export function rememberClass(next: RememberedClass): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — the setup step just runs again next time */
  }
}

export function forgetClass(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}
