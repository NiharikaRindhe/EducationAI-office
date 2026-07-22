-- ═════════════════════════════════════════════════════════════
--  SUPPORT TICKETS — cross-role issue reporting.
--
--  Any authenticated user can raise a ticket. Students/teachers/lab
--  in-charges raise into their own school; a School Admin triages
--  and resolves, or escalates to the Super Admin when it's beyond
--  their reach (platform bug, billing, content issue). Super Admin
--  can also raise a ticket against a school directly.
-- ═════════════════════════════════════════════════════════════

create table support_tickets (
  id                  uuid primary key default gen_random_uuid(),
  school_id           uuid references schools(id) on delete cascade,
  raised_by           uuid not null references user_profiles(id) on delete cascade,
  raised_role         text not null check (raised_role in ('student', 'teacher', 'school_admin', 'lab_incharge', 'super_admin')),
  category            text not null check (category in ('account', 'content', 'technical', 'ai', 'other')),
  subject             text not null check (char_length(subject) between 1 and 200),
  body                text not null check (char_length(body) between 1 and 5000),
  status              text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority            text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  escalated_to_super  boolean not null default false,
  created_at          timestamptz not null default now(),
  resolved_at         timestamptz
);

create index on support_tickets (school_id, status);
create index on support_tickets (raised_by);
create index on support_tickets (escalated_to_super) where escalated_to_super;

create table ticket_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references support_tickets(id) on delete cascade,
  sender_id   uuid not null references user_profiles(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 5000),
  created_at  timestamptz not null default now()
);

create index on ticket_messages (ticket_id, created_at);

-- ─── RLS ─────────────────────────────────────────────────────
alter table support_tickets enable row level security;

-- Everyone can see tickets they raised themselves.
create policy support_tickets_own on support_tickets
  for select using (raised_by = auth.uid());

-- Everyone can raise a ticket for their own school (or, for a
-- super_admin, for any school / no school).
create policy support_tickets_insert on support_tickets
  for insert with check (
    raised_by = auth.uid()
    and (
      jwt_role() = 'super_admin'
      or school_id = jwt_school_id()
    )
  );

-- School staff manage their own school's tickets.
create policy support_tickets_school_admin_all on support_tickets
  for all using (jwt_role() = 'school_admin' and school_id = jwt_school_id());

-- Super admin sees + manages escalated tickets and any ticket it raised itself.
create policy support_tickets_super_admin_all on support_tickets
  for all using (jwt_role() = 'super_admin');

alter table ticket_messages enable row level security;

create policy ticket_messages_participants on ticket_messages
  for select using (
    exists (
      select 1 from support_tickets t
      where t.id = ticket_messages.ticket_id
        and (
          t.raised_by = auth.uid()
          or jwt_role() = 'super_admin'
          or (jwt_role() = 'school_admin' and t.school_id = jwt_school_id())
        )
    )
  );

create policy ticket_messages_insert on ticket_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from support_tickets t
      where t.id = ticket_messages.ticket_id
        and (
          t.raised_by = auth.uid()
          or jwt_role() = 'super_admin'
          or (jwt_role() = 'school_admin' and t.school_id = jwt_school_id())
        )
    )
  );

-- ─── Grants ──────────────────────────────────────────────────
grant all privileges on support_tickets, ticket_messages to postgres, service_role;
grant select, insert, update, delete on support_tickets, ticket_messages to authenticated;
