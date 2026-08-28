import { createClient } from '@supabase/supabase-js';
const admin = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU');
const { data, error } = await admin
  .from('user_profiles')
  .select('id, full_name, role, student_profiles!inner(class_num, section)')
  .eq('role', 'student')
  .gte('student_profiles.class_num', 5)
  .lte('student_profiles.class_num', 8)
  .limit(3);
console.log(JSON.stringify({ data, error }, null, 2));
