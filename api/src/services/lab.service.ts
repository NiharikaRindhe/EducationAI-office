import { supabaseAdmin } from '../lib/supabase.js';
import { ApiError } from '../lib/errors.js';
import type { CreateLabInput, UpdateLabInput } from '../schemas/lab.schema.js';

export async function listLabs(schoolId: string) {
  const { data, error } = await supabaseAdmin
    .from('labs')
    .select('id, name, seat_capacity, location, is_active, created_at')
    .eq('school_id', schoolId)
    .order('name');
  if (error) throw new ApiError('INTERNAL_ERROR', 'Failed to list labs', error.message);
  return data ?? [];
}

export async function createLab(schoolId: string, input: CreateLabInput) {
  const { data, error } = await supabaseAdmin
    .from('labs')
    .insert({
      school_id: schoolId,
      name: input.name,
      seat_capacity: input.seatCapacity,
      location: input.location ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new ApiError('VALIDATION_ERROR', `A lab named "${input.name}" already exists`);
    throw new ApiError('INTERNAL_ERROR', 'Failed to create lab', error.message);
  }
  return data;
}

export async function updateLab(schoolId: string, labId: string, patch: UpdateLabInput) {
  const updates: Record<string, unknown> = {};
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.seatCapacity !== undefined) updates.seat_capacity = patch.seatCapacity;
  if (patch.location !== undefined) updates.location = patch.location;
  if (patch.isActive !== undefined) updates.is_active = patch.isActive;

  const { data, error } = await supabaseAdmin
    .from('labs')
    .update(updates)
    .eq('id', labId)
    .eq('school_id', schoolId)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new ApiError('VALIDATION_ERROR', `A lab named "${patch.name}" already exists`);
    throw new ApiError('NOT_FOUND', 'Lab not found');
  }
  return data;
}
