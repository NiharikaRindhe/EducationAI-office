const SUPABASE_PUBLIC_URL = import.meta.env.VITE_SUPABASE_PUBLIC_URL ?? 'http://127.0.0.1:54321';

/** Public URL for an object in the 'lab-assets' Supabase Storage bucket
 *  (Class 9-10 STEM lab diagrams — see api/scripts/uploadLabAssets.ts). */
export function labAssetUrl(path: string): string {
  return `${SUPABASE_PUBLIC_URL}/storage/v1/object/public/lab-assets/${path.split('/').map(encodeURIComponent).join('/')}`;
}

/** Public URL for a school's uploaded logo. Only the storage path is
 *  persisted (schools.logo_path), so the host stays environment-relative —
 *  the same row works on localhost, a LAN demo and production. */
export function schoolLogoUrl(path: string): string {
  return `${SUPABASE_PUBLIC_URL}/storage/v1/object/public/school-logos/${path.split('/').map(encodeURIComponent).join('/')}`;
}
