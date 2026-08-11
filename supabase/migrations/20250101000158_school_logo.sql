-- ═════════════════════════════════════════════════════════════
--  SCHOOL LOGO / BRANDING
--
--  Schools want their own identity in the portal their students
--  and teachers use every lab period, not a generic "EduAI"
--  wordmark. This stores the logo in a public Storage bucket and
--  keeps only the object PATH on the row.
--
--  Path, not full URL, deliberately: the Supabase public URL
--  differs between local dev, LAN demos and production, so a
--  baked-in absolute URL breaks the moment the host changes.
--  The frontend composes the URL the same way lab assets already
--  do (see src/lib/assets.ts).
-- ═════════════════════════════════════════════════════════════

alter table schools add column logo_path text;

-- ─── Storage bucket ──────────────────────────────────────────
-- Public read: logos render in the sidebar for every signed-in
-- user of that school, and on the login screen before any token
-- exists, so a signed-URL flow would buy nothing here. Writes
-- still go exclusively through the API using the service role.
insert into storage.buckets (id, name, public)
values ('school-logos', 'school-logos', true)
on conflict (id) do nothing;

create policy school_logos_public_read on storage.objects
  for select using (bucket_id = 'school-logos');
