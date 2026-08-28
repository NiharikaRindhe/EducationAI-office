import { createClient } from '@supabase/supabase-js';
const admin = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU');
const id = '202e2dd2-c7e5-4002-b2d4-55969fe00ef0';
const { data: userData, error: getErr } = await admin.auth.admin.getUserById(id);
if (getErr) { console.log('GET_ERR', getErr.message); process.exit(1); }
console.log('email:', userData.user?.email);
const { error } = await admin.auth.admin.updateUserById(id, { password: 'Qa-Reset-2026!' });
console.log(error ? 'UPDATE_ERR ' + error.message : 'OK');

// Check feature entitlement for ai_tutor on this student's school
const { data: sp } = await admin.from('user_profiles').select('school_id').eq('id', id).single();
console.log('school_id', sp?.school_id);
const { data: ent } = await admin.from('school_feature_entitlements').select('*').eq('school_id', sp.school_id).eq('feature_key', 'ai_tutor');
console.log('entitlement', JSON.stringify(ent));
