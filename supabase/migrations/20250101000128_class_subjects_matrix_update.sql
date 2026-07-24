-- Finalize the class_subjects whitelist to the confirmed book-hierarchy
-- subject list: English, Mathematics, Science, World Around Us, Social
-- Science, ICT. Arts and Physical Education are dropped (never had exams
-- and are out of scope for the AI tutor / content plan); Hindi and Sanskrit
-- were never seeded. ICT is added for Class 9 only, per the confirmed matrix.
delete from class_subjects where subject in ('Arts', 'Physical Education');

insert into class_subjects (class_num, subject, has_exams) values
  (9, 'ICT', true)
on conflict (class_num, subject) do nothing;
