-- ═════════════════════════════════════════════════════════════
--  LAB ASSETS BUCKET — static diagram/simulation images for the
--  Class 9-10 STEM labs (ported from EducationAI-Games-master).
--  Public read, same rationale as the ncert/chat-uploads buckets:
--  these are static curriculum diagrams, not personal data, and
--  rendering them as plain <img> URLs avoids signed-URL churn.
--  Writes are service-role only (uploaded once via a one-off script).
-- ═════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('lab-assets', 'lab-assets', true)
on conflict (id) do nothing;

drop policy if exists lab_assets_public_read on storage.objects;
create policy lab_assets_public_read on storage.objects
  for select using (bucket_id = 'lab-assets');
