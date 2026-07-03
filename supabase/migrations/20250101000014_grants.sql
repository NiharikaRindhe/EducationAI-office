-- Base table GRANTs. RLS restricts which ROWS a role can see; it says
-- nothing about whether that role may touch the TABLE at all — that's a
-- separate, ordinary Postgres GRANT. Tables created in later migrations
-- inherit none of Supabase's initial-setup grants automatically, so every
-- table added above needs this, and ALTER DEFAULT PRIVILEGES covers
-- anything created after this migration too.

grant usage on schema public to postgres, anon, authenticated, service_role;

-- service_role: full access (it also has BYPASSRLS, so this is the
-- Node API's service-role key path — school creation, CSV import, etc.)
grant all privileges on all tables in schema public to postgres, service_role;
grant all privileges on all sequences in schema public to postgres, service_role;
grant all privileges on all functions in schema public to postgres, service_role;

-- authenticated: RLS policies above are the real gate; this just allows
-- the role to attempt the operation so RLS gets a chance to evaluate it.
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- anon: effectively unused post-login in this app (login goes through
-- GoTrue's password grant, not a PostgREST table query), kept minimal.
grant select on class_subjects, badges, english_assessment_items to anon;

alter default privileges in schema public
  grant all privileges on tables to postgres, service_role;
alter default privileges in schema public
  grant all privileges on sequences to postgres, service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;
