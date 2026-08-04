/**
 * Labels for teacher pickers, disambiguated when two staff share a name.
 *
 * Schools genuinely do employ two people with the same name, and this app
 * makes that actively dangerous: every teacher picker rendered nothing but
 * `full_name`, so two accounts both called "Mr. Rao" were indistinguishable
 * options in the same dropdown. An admin assigning subjects would pick one at
 * random, and the *other* Mr. Rao would then log in to find the class missing
 * from his portal — with nothing on screen to explain why. That is exactly
 * what happened on the Springfield test data.
 *
 * Only duplicated names get a suffix; a school where every name is unique sees
 * clean labels and no extra noise.
 */

export interface LabelableTeacher {
  id: string;
  full_name: string;
  teacher_profiles?: { employee_id?: string | null; specialization?: string | null } | null;
}

/** Names are compared case/space-insensitively so "Mrs. gupta" and "Mrs.Gupta"
 *  are treated as the collision they visually are. */
function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Candidate suffixes, most human-meaningful first. The account-id fragment is
 *  last and always present, so a unique label is always reachable. */
function candidates(teacher: LabelableTeacher): string[] {
  const profile = teacher.teacher_profiles;
  return [
    profile?.employee_id?.trim(),
    profile?.specialization?.trim(),
    `ID ${teacher.id.slice(0, 6)}`,
  ].filter((v): v is string => Boolean(v));
}

/**
 * Builds a `id -> label` map. Pass the full list so collisions can be detected;
 * labels are only decorated for names that appear more than once.
 *
 * A suffix is only accepted if it actually separates the colliding accounts.
 * Two "Mr. Rao" records that *both* have specialization "Science" would
 * otherwise both render as "Mr. Rao (Science)" — decorated, still identical,
 * and no more useful than before. When that happens this falls through to the
 * next candidate, ending at the account-id fragment which is unique by
 * construction.
 */
export function buildTeacherLabels(teachers: LabelableTeacher[]): Map<string, string> {
  const byName = new Map<string, LabelableTeacher[]>();
  for (const t of teachers) {
    const key = normalizeName(t.full_name);
    byName.set(key, [...(byName.get(key) ?? []), t]);
  }

  const labels = new Map<string, string>();
  for (const group of byName.values()) {
    if (group.length === 1) {
      const only = group[0]!;
      labels.set(only.id, only.full_name);
      continue;
    }

    // Pick the first candidate tier that yields a distinct value for everyone
    // in the group; `ID …` is unique per account so this always terminates.
    const tiers = Math.max(...group.map((t) => candidates(t).length));
    let chosen: string[] | null = null;
    for (let tier = 0; tier < tiers; tier++) {
      const values = group.map((t) => candidates(t)[tier] ?? `ID ${t.id.slice(0, 6)}`);
      if (new Set(values).size === group.length) {
        chosen = values;
        break;
      }
    }
    const suffixes = chosen ?? group.map((t) => `ID ${t.id.slice(0, 6)}`);

    group.forEach((t, i) => labels.set(t.id, `${t.full_name} (${suffixes[i]})`));
  }
  return labels;
}

/** Names shared by more than one account — worth warning the admin about,
 *  since the usual cause is an accidentally duplicated account. */
export function duplicateTeacherNames(teachers: LabelableTeacher[]): string[] {
  const counts = new Map<string, { name: string; n: number }>();
  for (const t of teachers) {
    const key = normalizeName(t.full_name);
    const entry = counts.get(key) ?? { name: t.full_name.trim(), n: 0 };
    entry.n += 1;
    counts.set(key, entry);
  }
  return [...counts.values()].filter((e) => e.n > 1).map((e) => e.name);
}
