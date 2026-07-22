-- ═════════════════════════════════════════════════════════════
--  SCHOOL DETAILS — full onboarding profile for a school.
--  The create-school form captures the complete record (address,
--  pincode, primary contact) instead of just name + code.
-- ═════════════════════════════════════════════════════════════

alter table schools add column address        text;
alter table schools add column pincode        text;
alter table schools add column contact_name   text;
alter table schools add column contact_email  text;
alter table schools add column contact_phone  text;
