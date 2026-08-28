-- Schools do not all begin their academic session in April. Keep April as
-- the backward-compatible default while allowing each school to configure
-- the month used by its rollover workflow.
alter table public.schools
  add column if not exists academic_year_start_month smallint not null default 4;

alter table public.schools
  drop constraint if exists schools_academic_year_start_month_check;

alter table public.schools
  add constraint schools_academic_year_start_month_check
  check (academic_year_start_month between 1 and 12);
