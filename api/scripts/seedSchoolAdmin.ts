/**
 * Creates a school_admin account for a given school. In production this
 * happens from the Super Admin portal (school creation flow); this script
 * is the CLI equivalent for local dev / first pilot setup.
 *
 * Usage: npm run seed:school-admin -- --school-code SPS-DELHI-01 --email x@y.com --password "Strong-1"
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const schoolCode = arg('school-code');
  const email = arg('email') ?? 'schooladmin@eduai.local';
  const password = arg('password') ?? 'ChangeMe-Now-1';
  const fullName = arg('name') ?? 'School Admin';
  if (!schoolCode) throw new Error('--school-code is required');

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY not set');

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: school, error: schoolError } = await supabase
    .from('schools')
    .select('id, name')
    .eq('code', schoolCode)
    .single();
  if (schoolError || !school) throw new Error(`School not found for code ${schoolCode}`);

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError || !authUser.user) throw new Error(`Failed to create auth user: ${authError?.message}`);

  const { error: profileError } = await supabase.from('user_profiles').insert({
    id: authUser.user.id,
    school_id: school.id,
    role: 'school_admin',
    full_name: fullName,
  });
  if (profileError) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw new Error(`Failed to create profile: ${profileError.message}`);
  }

  console.log(`School admin created for ${school.name} (${schoolCode}):`);
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
