-- Proctoring, simplified for the lab-only MVP: teacher is physically present,
-- so there is no webcam/gaze tracking. Only randomization + tab-switch /
-- fullscreen-exit detection, which a lab PC can enforce on its own.
create table proctoring_settings (
  exam_id                 uuid primary key references exams(id) on delete cascade,
  auto_submit_on_switch   boolean not null default true,
  switch_limit            int not null default 3,
  randomize_questions     boolean not null default true,
  shuffle_options         boolean not null default true
);

create table proctoring_events (
  id                    uuid primary key default gen_random_uuid(),
  exam_submission_id    uuid not null references exam_submissions(id) on delete cascade,
  event_type            text not null check (event_type in ('tab_switch', 'fullscreen_exit')),
  occurred_at           timestamptz not null default now()
);

create index on proctoring_events (exam_submission_id, occurred_at);
