import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import type { CreateSchoolInput } from '../schemas/superAdmin.schema.js';

export async function createSchool(input: CreateSchoolInput) {
  const { data: existing } = await supabaseAdmin
    .from('schools')
    .select('id')
    .eq('code', input.code)
    .maybeSingle();

  if (existing) throw new ApiError('SCHOOL_INVALID', `School code "${input.code}" is already in use`);

  const { data, error } = await supabaseAdmin
    .from('schools')
    .insert({
      name: input.name,
      code: input.code,
      city: input.city ?? null,
      state: input.state ?? null,
      board: input.board,
      plan: input.plan,
    })
    .select()
    .single();

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to create school', error.message);
  return data;
}

export async function listSchools() {
  const { data, error } = await supabaseAdmin
    .from('schools')
    .select('id, name, code, city, state, board, plan, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list schools', error.message);
  return data;
}

export async function setSchoolActive(schoolId: string, isActive: boolean) {
  const { data, error } = await supabaseAdmin
    .from('schools')
    .update({ is_active: isActive })
    .eq('id', schoolId)
    .select()
    .single();

  if (error) throw new ApiError('NOT_FOUND', 'School not found', error.message);
  return data;
}
