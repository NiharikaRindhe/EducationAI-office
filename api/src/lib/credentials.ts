import crypto from 'node:crypto';

// Avoids visually ambiguous characters (0/O, 1/l/I) since these end up on a printed card.
const PASSWORD_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

export function generatePassword(length = 8): string {
  return Array.from(crypto.randomBytes(length))
    .map((byte) => PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length])
    .join('');
}

export function generatePin(): string {
  // 4-digit PIN, zero-padded, never starts implying a 3-digit code.
  return String(crypto.randomInt(0, 10000)).padStart(4, '0');
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 24) || 'user';
}

/**
 * Supabase Auth is email-shaped even for accounts that will never receive
 * real mail. This generates a stable, readable pseudo-email used as the
 * login username — printed on the credential card, not delivered to anyone.
 */
export function generateUsername(fullName: string, schoolCode: string, disambiguator: string): string {
  const namePart = slugify(fullName);
  const schoolPart = slugify(schoolCode);
  const shortId = disambiguator.replace(/-/g, '').slice(0, 6);
  return `${namePart}.${shortId}@${schoolPart}.eduai.local`;
}
