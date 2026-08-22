-- rag_buckets_public_read (20250101000121) made the whole 'ncert' bucket
-- publicly readable — a deliberate, documented tradeoff for the content it
-- held at the time: textbook FIGURES (need unauthenticated <img src=...>
-- rendering in chat) and student chat-upload photos, both low-sensitivity
-- and keyed by unguessable UUIDs.
--
-- 20250101000129_school_content_uploads.sql later started storing each
-- school's own uploaded source PDFs in the same bucket at
-- pdfs/school-{schoolId}/..., a different risk profile the original
-- reasoning never covered — a school's uploaded book now sits in a fully
-- public bucket, protected only by an unguessable path.
--
-- Checked the actual access pattern (api/src/services/superAdminContent.service.ts):
-- the raw source PDF is only ever read via supabaseAdmin.storage...download()
-- during ingestion (service-role, bypasses RLS/bucket-public entirely) —
-- getPublicUrl() is called for extracted `figures/` and `chat-uploads`
-- only, never for `pdfs/`. Nothing legitimate needs the source PDF to be
-- publicly fetchable, so it's excluded from public read below with zero
-- functional impact — figures and chat uploads keep working exactly as
-- documented in 20250101000121.

drop policy if exists rag_buckets_public_read on storage.objects;

create policy rag_buckets_public_read on storage.objects
  for select using (
    bucket_id in ('ncert', 'chat-uploads')
    and not (bucket_id = 'ncert' and name like 'pdfs/%')
  );
