/**
 * Bootstraps the first super_admin account. Run once per environment.
 * auth.users can't be seeded with plain SQL (GoTrue owns invariants like
 * encrypted_password), so this uses the Admin API instead.
 *
 * Usage: npm run seed:super-admin -- --email you@eduai.com --password "Something-Strong-1"
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const email = arg('email') ?? 'admin@eduai.local';
  const password = arg('password') ?? 'ChangeMe-Now-1';
  const fullName = arg('name') ?? 'EduAI Super Admin';

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY not set');

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('role', 'super_admin')
    .limit(1)
    .maybeSingle();

  if (existing) {
    console.log('A super_admin already exists — refusing to create a duplicate. Nothing done.');
    return;
  }

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError || !authUser.user) throw new Error(`Failed to create auth user: ${authError?.message}`);

  const { error: profileError } = await supabase.from('user_profiles').insert({
    id: authUser.user.id,
    school_id: null,
    role: 'super_admin',
    full_name: fullName,
  });
  if (profileError) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw new Error(`Failed to create profile: ${profileError.message}`);
  }

  console.log('Super admin created:');
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  console.log('Change this password after first login.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
