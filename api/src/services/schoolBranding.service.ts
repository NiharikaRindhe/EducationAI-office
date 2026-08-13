import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';

/**
 * School logo upload / removal.
 *
 * Shared by the School Admin (own school only, scoped by the caller's
 * schoolId) and the Super Admin (any school, id from the path), so the
 * scoping decision stays in the route layer and this stays a pure
 * "set the logo for THIS school id" operation.
 */

export const LOGO_BUCKET = 'school-logos';

/** Deliberately narrow. SVG is excluded despite being the nicest logo
 *  format: it is an executable document, and these render inside every
 *  user's authenticated page from a public bucket, so a crafted SVG
 *  would be a stored-XSS vector. */
const ALLOWED_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/**
 * What the file's own bytes say it is.
 *
 * `file.mimetype` is supplied by the uploading client and is not evidence of
 * anything — curl will happily send `Content-Type: image/png` with an HTML or
 * SVG payload. Since these files land in a PUBLIC bucket and are rendered
 * inside every authenticated page, trusting that header is how a "logo" turns
 * into stored XSS. The magic bytes are checked instead, and the declared type
 * must agree with them.
 *
 *   PNG   89 50 4E 47 0D 0A 1A 0A
 *   JPEG  FF D8 FF
 *   WEBP  "RIFF" .... "WEBP"
 */
function sniffImageType(buffer: Buffer): 'png' | 'jpg' | 'webp' | null {
  if (buffer.length < 12) return null;

  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return 'png';
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }
  return null;
}

export async function setSchoolLogo(schoolId: string, file: Express.Multer.File) {
  const declared = ALLOWED_MIME[file.mimetype];
  if (!declared) {
    throw new ApiError('VALIDATION_ERROR', 'Logo must be a PNG, JPG or WEBP image.');
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new ApiError('VALIDATION_ERROR', 'Logo must be 2MB or smaller.');
  }

  const actual = sniffImageType(file.buffer);
  if (!actual) {
    throw new ApiError('VALIDATION_ERROR', 'That file is not a valid PNG, JPG or WEBP image.');
  }
  // A mismatch means the client lied about the type. Refuse rather than
  // quietly trusting the bytes: nothing legitimate sends a JPEG labelled PNG,
  // so this is either a broken uploader or an attempt at something.
  if (actual !== declared) {
    throw new ApiError(
      'VALIDATION_ERROR',
      `This file is a ${actual.toUpperCase()} but was uploaded as ${file.mimetype}. Re-save it and try again.`,
    );
  }
  const ext = actual;

  const { data: school } = await supabaseAdmin
    .from('schools')
    .select('id, logo_path')
    .eq('id', schoolId)
    .maybeSingle();
  if (!school) throw new ApiError('NOT_FOUND', 'School not found');

  // Cache-bust via the filename. The bucket is public and served through a
  // CDN-ish path, so re-uploading to a fixed name would leave every user
  // staring at the previous logo until their cache expired.
  const storagePath = `${schoolId}/logo-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(LOGO_BUCKET)
    .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: true });
  if (uploadError) {
    throw new ApiError('INTERNAL_ERROR', 'Failed to store logo', uploadError.message);
  }

  const { error: updateError } = await supabaseAdmin
    .from('schools')
    .update({ logo_path: storagePath })
    .eq('id', schoolId);
  if (updateError) {
    throw new ApiError('INTERNAL_ERROR', 'Failed to save logo', updateError.message);
  }

  // Best-effort cleanup of the file this one replaced. A failure here leaves
  // an orphaned object, which is harmless — never fail the request for it.
  const previous = school.logo_path as string | null;
  if (previous && previous !== storagePath) {
    await supabaseAdmin.storage.from(LOGO_BUCKET).remove([previous]);
  }

  return { logoPath: storagePath };
}

export async function removeSchoolLogo(schoolId: string) {
  const { data: school } = await supabaseAdmin
    .from('schools')
    .select('id, logo_path')
    .eq('id', schoolId)
    .maybeSingle();
  if (!school) throw new ApiError('NOT_FOUND', 'School not found');

  const previous = school.logo_path as string | null;

  const { error } = await supabaseAdmin
    .from('schools')
    .update({ logo_path: null })
    .eq('id', schoolId);
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to remove logo', error.message);

  if (previous) {
    await supabaseAdmin.storage.from(LOGO_BUCKET).remove([previous]);
  }

  return { logoPath: null };
}
