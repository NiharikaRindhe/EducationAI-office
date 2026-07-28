const SUPABASE_PUBLIC_URL = import.meta.env.VITE_SUPABASE_PUBLIC_URL ?? 'http://127.0.0.1:54321';

/** Public URL for an object in the 'lab-assets' Supabase Storage bucket
 *  (Class 9-10 STEM lab diagrams — see api/scripts/uploadLabAssets.ts). */
export function labAssetUrl(path: string): string {
  return `${SUPABASE_PUBLIC_URL}/storage/v1/object/public/lab-assets/${path.split('/').map(encodeURIComponent).join('/')}`;
}
