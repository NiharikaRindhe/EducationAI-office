import { supabaseAdmin } from '../lib/supabase.js';
import { chatCompletion, aiConfigured } from '../lib/ai.js';
import { logger } from '../lib/logger.js';
import { ApiError } from '../lib/errors.js';
import type { AiUsageContext } from '../lib/aiUsage.js';

/* Port of EducationAI-Games-master's standalone FastAPI + LangChain + ChatGroq
   backend (Backend/main.py) onto this app's unified AI provider (lib/ai.ts).
   The response shapes below mirror that service's Pydantic models field for
   field — snake_case included — because the ported Chemistry Lab UI consumes
   them directly. Follows the call -> JSON.parse -> defensively default ->
   throw-on-failure pattern already used by grading.service.ts. */

/** Some cloud models wrap jsonMode output in a ```json ... ``` fence despite
 *  response_format:{type:'json_object'} — strip it before JSON.parse rather
 *  than let an otherwise-valid response fail as a 500. */
function stripJsonFence(raw: string): string {
  const trimmed = raw.trim();
  const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(trimmed);
  return match?.[1] ?? trimmed;
}

/** Model output for "string" fields sometimes comes back as a bare number
 *  (e.g. molar_mass: 18.015) — coerce so the response always matches its
 *  declared contract and never renders as "[object Object]"/undefined. */
function asString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    const o = v as { name?: string; formula?: string };
    if (o.name || o.formula) return [o.name, o.formula && `(${o.formula})`].filter(Boolean).join(' ');
    return '';
  }
  return String(v);
}

interface CompoundProperties {
  molar_mass: string;
  state_at_room_temp: string;
  color: string;
  melting_point: string;
  boiling_point: string;
  solubility: string;
  ph: string | null;
}

export interface CompoundInfo {
  success: boolean;
  compound_name: string;
  formula: string;
  balanced_equation: string;
  bond_type: string;
  fun_fact: string;
  real_world_uses: string[];
  properties: CompoundProperties | null;
  safety_info: string;
  failure_reason: string;
}

export interface FreeReactionResult {
  has_reaction: boolean;
  reaction_name: string;
  balanced_equation: string;
  products: string[];
  what_happens: string;
  energy_type: string;
  reaction_type: string;
  fun_fact: string;
  safety_info: string;
  no_reaction_reason: string;
}

async function getStudentClass(studentId: string): Promise<number> {
  const { data: sp, error } = await supabaseAdmin
    .from('student_profiles')
    .select('class_num')
    .eq('user_id', studentId)
    .single();
  if (error || !sp) throw new ApiError('NOT_FOUND', 'Student profile not found');
  return sp.class_num;
}

const AI_OFFLINE_MESSAGE = 'The Chemistry AI Lab is offline right now — please try again in a moment.';

function offlineCompoundInfo(): CompoundInfo {
  return {
    success: false,
    compound_name: '',
    formula: '',
    balanced_equation: '',
    bond_type: '',
    fun_fact: '',
    real_world_uses: [],
    properties: null,
    safety_info: '',
    failure_reason: AI_OFFLINE_MESSAGE,
  };
}

function offlineFreeReaction(): FreeReactionResult {
  return {
    has_reaction: false,
    reaction_name: '',
    balanced_equation: '',
    products: [],
    what_happens: '',
    energy_type: 'No Reaction',
    reaction_type: 'No Reaction',
    fun_fact: '',
    safety_info: '',
    no_reaction_reason: AI_OFFLINE_MESSAGE,
  };
}

export async function craftCompound(
  studentId: string,
  elements: string[],
  attemptedFormula: string,
  usageContext?: AiUsageContext,
): Promise<CompoundInfo> {
  const classNum = await getStudentClass(studentId);
  if (!(await aiConfigured('chat'))) return offlineCompoundInfo();

  try {
    const raw = await chatCompletion(
      [
        {
          role: 'system',
          content: `You are an expert chemistry educator helping a Class ${classNum} student learn through a virtual lab.
A student combined elements in a crafting beaker and pressed 'Craft Compound'.

Your job:
1. Determine if these elements can combine to form a real, stable, well-known compound.
2. If YES: set "success":true and fill in ALL fields with accurate, educational data.
   - compound_name: the compound's common or IUPAC name
   - formula: its chemical formula (e.g. H2O, NaCl)
   - balanced_equation: balanced formation equation using text notation (e.g. "2H2 + O2 -> 2H2O")
   - bond_type: e.g. covalent, ionic, polar covalent
   - fun_fact: one fascinating real-world fact a student would find interesting
   - real_world_uses: 3-4 practical applications, as an array of plain strings
   - properties: an object with the string keys molar_mass, state_at_room_temp, color, melting_point, boiling_point, solubility, ph
   - safety_info: a brief hazard or safety note
   - failure_reason: ""
3. If NO: set "success":false, leave compound_name/formula/balanced_equation/bond_type/fun_fact/safety_info as "",
   real_world_uses as [], properties as null, and write a clear student-friendly failure_reason
   explaining why these elements don't form a stable compound.

Be accurate, concise, and educational. Use simple language suitable for a Class ${classNum} student.
Every field value must be a plain string (or the stated array/object/boolean) — never a nested object where a string is expected.
Return ONLY valid JSON with exactly these keys: success, compound_name, formula, balanced_equation, bond_type, fun_fact, real_world_uses, properties, safety_info, failure_reason.`,
        },
        {
          role: 'user',
          content: `The student combined these elements: ${elements.join(', ')}\nAttempted formula hint: ${attemptedFormula || '(none given)'}`,
        },
      ],
      { jsonMode: true, tier: 'chat', usageContext },
    );

    const parsed = JSON.parse(stripJsonFence(raw)) as {
      success?: boolean;
      compound_name?: unknown;
      formula?: unknown;
      balanced_equation?: unknown;
      bond_type?: unknown;
      fun_fact?: unknown;
      real_world_uses?: unknown[];
      properties?: Record<string, unknown> | null;
      safety_info?: unknown;
      failure_reason?: unknown;
    };

    const success = parsed.success === true;
    return {
      success,
      compound_name: success ? asString(parsed.compound_name) : '',
      formula: success ? asString(parsed.formula) : '',
      balanced_equation: success ? asString(parsed.balanced_equation) : '',
      bond_type: success ? asString(parsed.bond_type) : '',
      fun_fact: success ? asString(parsed.fun_fact) : '',
      real_world_uses: success && Array.isArray(parsed.real_world_uses) ? parsed.real_world_uses.map(asString) : [],
      properties:
        success && parsed.properties
          ? {
              molar_mass: asString(parsed.properties.molar_mass),
              state_at_room_temp: asString(parsed.properties.state_at_room_temp),
              color: asString(parsed.properties.color),
              melting_point: asString(parsed.properties.melting_point),
              boiling_point: asString(parsed.properties.boiling_point),
              solubility: asString(parsed.properties.solubility),
              ph: parsed.properties.ph == null ? null : asString(parsed.properties.ph),
            }
          : null,
      safety_info: success ? asString(parsed.safety_info) : '',
      failure_reason: !success
        ? asString(parsed.failure_reason) || 'These elements do not form a stable, well-known compound.'
        : '',
    };
  } catch (err) {
    logger.error({ err, studentId, elements }, 'Chemistry craft-compound AI call failed');
    throw new ApiError('INTERNAL_ERROR', 'Failed to analyze the compound — please try again.');
  }
}

export async function freeReact(
  studentId: string,
  reactants: string[],
  usageContext?: AiUsageContext,
): Promise<FreeReactionResult> {
  const classNum = await getStudentClass(studentId);
  if (!(await aiConfigured('chat'))) return offlineFreeReaction();

  try {
    const raw = await chatCompletion(
      [
        {
          role: 'system',
          content: `You are an expert chemistry educator for a virtual lab used by a Class ${classNum} student.
A student placed substances into a Free Lab beaker and wants to know what happens.

Your job:
1. Determine if a REAL CHEMICAL REACTION occurs between these substances.
2. If YES (has_reaction=true):
   - reaction_name: short descriptive name
   - balanced_equation: balanced equation in text form (e.g. "2H2 + O2 -> 2H2O")
   - products: array of PLAIN STRINGS, each combining name and formula, e.g. ["Water (H2O)", "Carbon dioxide (CO2)"] — never objects
   - what_happens: describe what the student would OBSERVE (colour, gas, heat, light, precipitate, etc.)
   - energy_type: "Exothermic" or "Endothermic"
   - reaction_type: the category (Combination, Decomposition, Single Displacement, Double Displacement, Combustion, Acid-Base, Redox)
   - fun_fact: one real-world application
   - safety_info: hazard notes
   - no_reaction_reason: ""
3. If NO chemical reaction (has_reaction=false):
   - Describe the physical change (dissolves, mixes, remains unchanged) in what_happens
   - energy_type: "No Reaction" or "Physical Change"
   - reaction_type: "No Reaction" or "Physical Change"
   - no_reaction_reason: explain WHY in student-friendly language
   - Leave reaction_name, balanced_equation, fun_fact as "" and products as []

Be accurate and vivid. Prioritise observable phenomena that make chemistry feel real and exciting.
Use simple language suitable for a Class ${classNum} student.
Return ONLY valid JSON with exactly these keys: has_reaction, reaction_name, balanced_equation, products, what_happens, energy_type, reaction_type, fun_fact, safety_info, no_reaction_reason.`,
        },
        {
          role: 'user',
          content: `The student placed these substances in the Free Lab beaker: ${reactants.join(', ')}`,
        },
      ],
      { jsonMode: true, tier: 'chat', usageContext },
    );

    const parsed = JSON.parse(stripJsonFence(raw)) as {
      has_reaction?: boolean;
      reaction_name?: unknown;
      balanced_equation?: unknown;
      products?: unknown[];
      what_happens?: unknown;
      energy_type?: unknown;
      reaction_type?: unknown;
      fun_fact?: unknown;
      safety_info?: unknown;
      no_reaction_reason?: unknown;
    };

    const hasReaction = parsed.has_reaction === true;
    return {
      has_reaction: hasReaction,
      reaction_name: hasReaction ? asString(parsed.reaction_name) : '',
      balanced_equation: hasReaction ? asString(parsed.balanced_equation) : '',
      products: hasReaction && Array.isArray(parsed.products) ? parsed.products.map(asString).filter(Boolean) : [],
      what_happens: asString(parsed.what_happens),
      energy_type: asString(parsed.energy_type) || (hasReaction ? 'Exothermic' : 'No Reaction'),
      reaction_type: asString(parsed.reaction_type) || (hasReaction ? 'Combination' : 'No Reaction'),
      fun_fact: hasReaction ? asString(parsed.fun_fact) : '',
      safety_info: asString(parsed.safety_info) || 'Safe under normal conditions.',
      no_reaction_reason: !hasReaction
        ? asString(parsed.no_reaction_reason) || 'These substances do not react under normal conditions.'
        : '',
    };
  } catch (err) {
    logger.error({ err, studentId, reactants }, 'Chemistry free-react AI call failed');
    throw new ApiError('INTERNAL_ERROR', 'Failed to analyze the reaction — please try again.');
  }
}
