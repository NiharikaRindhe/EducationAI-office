-- Whitelist of which subjects exist on the platform per class.
-- Every task, exam, quiz, chat scope, and progress row must be validated
-- against this table at the API layer before it's written.
-- has_exams = false for Arts / Physical Education (activity-tracking only in MVP).
create table class_subjects (
  class_num   int  not null check (class_num between 1 and 10),
  subject     text not null,
  has_exams   boolean not null default true,
  primary key (class_num, subject)
);
