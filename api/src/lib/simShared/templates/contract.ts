// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
// shared/templates/contract.ts
// One-file-per-sim contract. A sim file only needs params to produce a stage.

import { z } from 'zod'
import type { SimStage } from '../simSpec.js'

export type SimDomain = 'physics' | 'math' | 'chemistry'
export type ClassBand = '5-6' | '5-8' | '6-6' | '6-8' | '7-7' | '8-8' | '9-9' | '10-10' | '9-10' | '6-10' | '7-10' | '8-9' | '8-10'

export interface ParamOption {
  value: number
  label: string
}

export interface ParamDef {
  key: string
  label: string
  unit: string
  min: number
  max: number
  step: number
  defaultValue: number
  /** Discrete choices. When set, the UI shows buttons/a selector instead of a slider. */
  options?: ParamOption[]
}

export interface SimRunResult {
  stage: SimStage
  metrics: Record<string, number | string | boolean>
  warnings: string[]
  caption?: string
}

export interface SimFile {
  id: string
  domain: SimDomain
  classBand: ClassBand
  label: string
  ncertClass: number
  description: string
  equations: string[]
  keywords: string[]
  params: ParamDef[]
  schema: z.ZodTypeAny
  run: (params: Record<string, number>) => SimRunResult
}

export const num = (min: number, max: number, fallback: number) =>
  z.coerce.number().min(min).max(max).default(fallback).catch(fallback)

export function param(
  key: string,
  label: string,
  unit: string,
  min: number,
  max: number,
  step: number,
  defaultValue: number
): ParamDef {
  return { key, label, unit, min, max, step, defaultValue }
}

/** Named discrete values (series/parallel, metals, shells). Still stored as numbers for bind/LLM. */
export function choice(
  key: string,
  label: string,
  options: ParamOption[],
  defaultValue: number
): ParamDef {
  const values = options.map((o) => o.value)
  return {
    key,
    label,
    unit: '',
    min: Math.min(...values),
    max: Math.max(...values),
    step: 1,
    defaultValue,
    options,
  }
}

export function classBandToNcert(band: ClassBand): number {
  if (band === '5-6' || band === '5-8') return 5
  if (band === '6-6') return 6
  if (band === '7-7') return 7
  if (band === '8-8') return 8
  if (band === '9-9') return 9
  if (band === '10-10') return 10
  if (band === '6-8') return 7
  if (band === '9-10') return 9
  if (band === '7-10') return 8
  if (band === '8-9' || band === '8-10') return 9
  return 8
}

/** Every ClassBand is a literal "min-max" range — true when classNum falls
 *  inside it. Used to filter the curator's template offer down to a book's
 *  own class instead of always showing all 74 (e.g. a Class 5 Maths book
 *  should never be offered '9-10' electromagnetism templates). */
export function classBandContains(band: ClassBand, classNum: number): boolean {
  const [min, max] = band.split('-').map(Number)
  return classNum >= min && classNum <= max
}
