-- Chapter practice for Classes 5–8 uses the same games catalog/API as
-- Batch 1, so the entitlement is no longer Class 1–4 only.
update public.feature_catalog
set description = 'Interactive games for Classes 1–4 and chapter practice for Classes 5–8.'
where key = 'games';
