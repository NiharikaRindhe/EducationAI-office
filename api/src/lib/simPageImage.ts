// ─────────────────────────────────────────────────────────────
//  PDF SIMULATOR — page/snip image validation.
//
//  Ported from pdf-simulation-master/server/src/services/sim/ollamaVlm.ts,
//  which bundled this validator together with an Ollama-Cloud-specific HTTP
//  client. Only the validator survives the port: lib/ai.ts's chatCompletion
//  already accepts `images?: string[]` on a message and routes to whichever
//  vision-capable provider the 'vision' tier resolves to (cloud or local
//  Ollama fallback) — a second, Ollama-only image client would just be a
//  second, redundant provider cascade. See simExplain.service.ts.
// ─────────────────────────────────────────────────────────────

/** Ask AI figures are for one turn only — this is well under any provider's
 *  request-size limit, chosen upstream to keep the request fast on a school
 *  lab connection, not to satisfy a provider ceiling. */
export const MAX_VLM_IMAGE_BYTES = 800 * 1024;

export interface ParsedPageImage {
  mime: 'image/jpeg' | 'image/png';
  base64: string;
  byteLength: number;
}

function allowedMime(mime: string): mime is ParsedPageImage['mime'] {
  return mime === 'image/jpeg' || mime === 'image/png';
}

export function stripDataUrlPrefix(raw: string): { mime: string; base64: string } | null {
  const trimmed = (raw || '').trim();
  const match = /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(trimmed);
  if (match) {
    const mime = match[1]!.toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1]!.toLowerCase();
    return { mime, base64: match[2]!.replace(/\s/g, '') };
  }
  // Bare base64 with no data: prefix — the client may send either.
  if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.length > 32) {
    return { mime: 'image/jpeg', base64: trimmed.replace(/\s/g, '') };
  }
  return null;
}

/** Validates and decodes a client-supplied page/snip image. Returns null
 *  (never throws) on anything malformed, oversized, or not JPEG/PNG — the
 *  caller's job is deciding what a null means (400 at the route boundary,
 *  or "skip the image and answer from text" deeper in a service). */
export function parsePageImage(raw: unknown): ParsedPageImage | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const stripped = stripDataUrlPrefix(raw);
  if (!stripped || !allowedMime(stripped.mime)) return null;
  let byteLength: number;
  try {
    byteLength = Buffer.from(stripped.base64, 'base64').byteLength;
  } catch {
    return null;
  }
  if (byteLength < 32 || byteLength > MAX_VLM_IMAGE_BYTES) return null;
  return { mime: stripped.mime, base64: stripped.base64, byteLength };
}
