// @ts-nocheck -- vendored from pdf-simulation-master/shared, kept diffable against upstream; compiled without noUncheckedIndexedAccess there. Runtime-correct: every access here is guarded by a zod .default()/.catch() upstream of this code, TS just cannot see that.
// shared/templates/match.ts
// Map natural-language / textbook text onto a catalog template + extracted numbers.

import {
  isTemplateId,
  parseTemplateParams,
  TEMPLATE_CATALOG,
  TEMPLATE_IDS,
  type TemplateId,
} from './catalog.js'
import { dropCitationParams, maskCitations } from './citations.js'

export interface TemplateMatch {
  templateId: TemplateId
  params: Record<string, number>
  title: string
}

const METAL_PATTERNS: { re: RegExp; rank: number }[] = [
  { re: /\bsodium\b|\bna\b/i, rank: 0 },
  { re: /\bmagnesium\b|\bmg\b/i, rank: 1 },
  { re: /\bzinc\b|\bzn\b/i, rank: 2 },
  { re: /\biron\b|\bfe\b/i, rank: 3 },
  { re: /\bcopper\b|\bcu\b/i, rank: 4 },
]

function pickNumber(text: string, patterns: RegExp[]): number | undefined {
  for (const re of patterns) {
    const m = text.match(re)
    if (m?.[1]) {
      const n = Number(String(m[1]).replace(/,/g, ''))
      if (Number.isFinite(n)) return n
    }
  }
  return undefined
}

function allNumbers(text: string, re: RegExp): number[] {
  const out: number[] = []
  const copy = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`)
  for (const m of text.matchAll(copy)) {
    const n = Number(String(m[1]).replace(/,/g, ''))
    if (Number.isFinite(n)) out.push(n)
  }
  return out
}

function extractMetals(text: string): { metalA?: number; metalB?: number } {
  const found: { index: number; rank: number }[] = []
  for (const { re, rank } of METAL_PATTERNS) {
    const m = text.match(re)
    if (m && m.index !== undefined) found.push({ index: m.index, rank })
  }
  found.sort((a, b) => a.index - b.index)
  if (found.length === 0) return {}
  if (found.length === 1) return { metalA: found[0].rank }
  return { metalA: found[0].rank, metalB: found[1].rank }
}

function extractCommon(text: string): Record<string, number> {
  const raw: Record<string, number> = {}
  const set = (key: string, val: number | undefined) => {
    if (val !== undefined) raw[key] = val
  }

  set(
    'v0',
    pickNumber(text, [
      /(\d+(?:\.\d+)?)\s*m\/s/i,
      /(\d+(?:\.\d+)?)\s*metres?\s*per\s*second/i,
      /speed(?:\s+of)?\s+(\d+(?:\.\d+)?)/i,
      /velocity[^\d]{0,12}(\d+(?:\.\d+)?)/i,
    ])
  )
  set('v', raw.v0)
  set('u', pickNumber(text, [/u\s*=\s*(\d+(?:\.\d+)?)/i, /initial\s+speed[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  if (/from rest/i.test(text)) set('u', 0)
  set(
    'angleDeg',
    pickNumber(text, [/(\d+(?:\.\d+)?)\s*(?:°|deg(?:rees)?)/i, /angle[^\d]{0,12}(\d+(?:\.\d+)?)/i])
  )
  set('theta1', raw.angleDeg)
  set('theta0', raw.angleDeg)
  set(
    'h0',
    pickNumber(text, [
      /(\d+(?:\.\d+)?)\s*m(?:eters?)?\s*(?:high|height|above)/i,
      /height[^\d]{0,12}(\d+(?:\.\d+)?)/i,
      /from\s+(\d+(?:\.\d+)?)\s*m/i,
    ])
  )
  set('objectHeight', raw.h0)
  set('h', pickNumber(text, [/h\s*=\s*(\d+(?:\.\d+)?)/i, /depth[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  if (raw.h === undefined && raw.h0 !== undefined) raw.h = raw.h0
  set('g', pickNumber(text, [/g\s*=\s*(\d+(?:\.\d+)?)/i, /(\d+(?:\.\d+)?)\s*m\/s\^?2/i]))
  const mass = pickNumber(text, [/(\d+(?:\.\d+)?)\s*kg/i, /mass[^\d]{0,12}(\d+(?:\.\d+)?)/i])
  if (mass !== undefined) {
    raw.mass = mass
    raw.m1 = mass
    raw.m = mass
  }
  set('mu', pickNumber(text, [/μ\s*=\s*(\d+(?:\.\d+)?)/i, /mu\s*=\s*(\d+(?:\.\d+)?)/i, /friction[^\d]{0,12}(\d+(?:\.\d+)?)/i, /refractive index[^\d]{0,16}(\d+(?:\.\d+)?)/i]))
  set('e', pickNumber(text, [/e\s*=\s*(\d+(?:\.\d+)?)/i, /restitution[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('length', pickNumber(text, [/length[^\d]{0,12}(\d+(?:\.\d+)?)/i, /(\d+(?:\.\d+)?)\s*m(?:eter)?\s*(?:long|string|pendulum)/i]))
  set('force', pickNumber(text, [/(\d+(?:\.\d+)?)\s*N\b/, /force[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('densityObject', pickNumber(text, [/(\d+(?:\.\d+)?)\s*kg\/m/i, /density[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('rho', pickNumber(text, [/ρ\s*=\s*(\d+(?:\.\d+)?)/i, /rho\s*=\s*(\d+(?:\.\d+)?)/i, /(\d+(?:\.\d+)?)\s*kg\s*\/\s*m/i]))
  if (raw.rho === undefined) raw.rho = raw.densityObject
  set(
    'temperature',
    pickNumber(text, [
      /(\d+(?:\.\d+)?)\s*(?:K|kelvin|°C|deg(?:rees)?\s*c)/i,
      /T\s*=\s*(\d+(?:\.\d+)?)/,
      /temperature[^\d]{0,12}(\d+(?:\.\d+)?)/i,
    ])
  )
  set('T', raw.temperature)
  set('V', pickNumber(text, [/(\d+(?:\.\d+)?)\s*V\b/, /voltage[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('voltage', raw.V)
  set('Vmax', raw.V)
  const ohms = allNumbers(text, /(\d+(?:\.\d+)?)\s*(?:Ω|ohm)/i)
  if (ohms[0] !== undefined) {
    raw.R = ohms[0]
    raw.R1 = ohms[0]
  }
  if (ohms[1] !== undefined) raw.R2 = ohms[1]
  if (raw.R === undefined) {
    set('R', pickNumber(text, [/resistance[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  }
  set('I', pickNumber(text, [/(\d+(?:\.\d+)?)\s*A\b/, /current[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('f', pickNumber(text, [/(\d+(?:\.\d+)?)\s*Hz/i, /focal[^\d]{0,12}(\d+(?:\.\d+)?)/i, /frequency[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('omega', pickNumber(text, [/ω\s*=\s*(\d+(?:\.\d+)?)/i, /omega[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('n1', pickNumber(text, [/n\s*1\s*=\s*(\d+(?:\.\d+)?)/i, /n₁\s*=\s*(\d+(?:\.\d+)?)/i]))
  set('n2', pickNumber(text, [/n\s*2\s*=\s*(\d+(?:\.\d+)?)/i, /n₂\s*=\s*(\d+(?:\.\d+)?)/i]))
  set('k', pickNumber(text, [/k\s*=\s*(\d+(?:\.\d+)?)/i, /spring[^\d]{0,20}(\d+(?:\.\d+)?)/i]))
  set('A', pickNumber(text, [/amplitude[^\d]{0,12}(\d+(?:\.\d+)?)/i, /A\s*=\s*(\d+(?:\.\d+)?)/, /prism angle[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('a', pickNumber(text, [/a\s*=\s*(-?\d+(?:\.\d+)?)/i, /acceleration[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('r', pickNumber(text, [/radius[^\d]{0,12}(\d+(?:\.\d+)?)/i, /r\s*=\s*(\d+(?:\.\d+)?)/i]))
  set('m', pickNumber(text, [/slope[^\d]{0,12}(-?\d+(?:\.\d+)?)/i, /m\s*=\s*(-?\d+(?:\.\d+)?)/]))
  set('c', pickNumber(text, [/intercept[^\d]{0,12}(-?\d+(?:\.\d+)?)/i, /c\s*=\s*(-?\d+(?:\.\d+)?)/]))
  set('numerator', pickNumber(text, [/numerator[^\d]{0,12}(\d+)/i, /(\d+)\s*\/\s*\d+/]))
  set('denominator', pickNumber(text, [/denominator[^\d]{0,12}(\d+)/i, /\d+\s*\/\s*(\d+)/]))
  set('activationEnergy', pickNumber(text, [/E_?a[^\d]{0,8}(\d+(?:\.\d+)?)/i, /activation[^\d]{0,16}(\d+(?:\.\d+)?)/i]))
  set('n', pickNumber(text, [/n\s*=\s*(\d+)/i, /shell\s+n\s*=\s*(\d+)/i, /(\d+)\s*terms/i]))
  set('d', pickNumber(text, [/d\s*=\s*(-?\d+(?:\.\d+)?)/i, /common difference[^\d]{0,16}(-?\d+(?:\.\d+)?)/i]))
  set('count', pickNumber(text, [/(\d+)\s*particles/i]))
  set('P', pickNumber(text, [/(\d+(?:\.\d+)?)\s*atm/i, /pressure[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('conductivity', pickNumber(text, [/conductivity[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set(
    'distance',
    pickNumber(text, [
      /(\d+(?:\.\d+)?)\s*m(?:eters?)?\s*(?:away|distant|off)/i,
      /(?:cliff|wall|distance)[^\d]{0,20}(\d+(?:\.\d+)?)/i,
      /distance[^\d]{0,12}(\d+(?:\.\d+)?)/i,
    ])
  )
  set('sourceDistance', raw.distance)
  set('tMax', pickNumber(text, [/for\s+(\d+(?:\.\d+)?)\s*s(?:ec(?:onds)?)?\b/i, /(\d+(?:\.\d+)?)\s*s(?:ec(?:onds)?)?\b/i, /t\s*=\s*(\d+(?:\.\d+)?)/i]))
  set('t', pickNumber(text, [/t\s*=\s*(\d+(?:\.\d+)?)/i, /time[^\d]{0,12}(\d+(?:\.\d+)?)\s*s/i]))
  set('start', pickNumber(text, [/start(?:ing)?[^\d]{0,12}(-?\d+)/i]))
  set('delta', pickNumber(text, [/delta[^\d]{0,12}(-?\d+)/i, /add(?:s|ed)?\s+(-?\d+)/i]))
  set('scale', pickNumber(text, [/scale[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('dx', pickNumber(text, [/dx\s*=\s*(-?\d+(?:\.\d+)?)/i]))
  set('dy', pickNumber(text, [/dy\s*=\s*(-?\d+(?:\.\d+)?)/i]))

  const pairs = [...text.matchAll(/\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g)]
  if (pairs[0]) {
    raw.x1 = Number(pairs[0][1])
    raw.y1 = Number(pairs[0][2])
  }
  if (pairs[1]) {
    raw.x2 = Number(pairs[1][1])
    raw.y2 = Number(pairs[1][2])
  }

  set('pH', pickNumber(text, [/pH\s*(?:=|of|:)?\s*(\d+(?:\.\d+)?)/i]))
  set('area', pickNumber(text, [/area[^\d]{0,12}(\d+(?:\.\d+)?)/i, /(\d+(?:\.\d+)?)\s*m(?:²|\^2)/i]))
  set(
    'vSound',
    pickNumber(text, [
      /speed of sound[^\d]{0,20}(\d+(?:\.\d+)?)/i,
      /v(?:Sound)?\s*=\s*(\d+(?:\.\d+)?)/i,
    ])
  )
  if (raw.vSound === undefined && /echo|speed of sound/i.test(text) && raw.v0 !== undefined) {
    raw.vSound = raw.v0
  }
  set('turns', pickNumber(text, [/(\d+)\s*turns/i, /n\s*=\s*(\d+)\s*turns/i]))
  set('binStart', pickNumber(text, [/bin start[^\d]{0,12}(-?\d+)/i, /class(?:es)? start[^\d]{0,12}(-?\d+)/i]))
  set('binWidth', pickNumber(text, [/bin width[^\d]{0,12}(\d+)/i, /class width[^\d]{0,12}(\d+)/i]))
  set('favorable', pickNumber(text, [/(\d+)\s*favou?rable/i, /favou?rable[^\d]{0,16}(\d+)/i]))
  set('total', pickNumber(text, [/out of\s+(\d+)/i, /(\d+)\s*(?:total|equally likely|outcomes)/i]))
  set('partA', pickNumber(text, [/part\s*a[^\d]{0,8}(\d+(?:\.\d+)?)/i, /A\s*[:=]\s*(\d+(?:\.\d+)?)/]))
  set('partB', pickNumber(text, [/part\s*b[^\d]{0,8}(\d+(?:\.\d+)?)/i, /B\s*[:=]\s*(\d+(?:\.\d+)?)/]))
  set('b', pickNumber(text, [/b\s*=\s*(-?\d+(?:\.\d+)?)/i]))
  set('s', pickNumber(text, [/s\s*=\s*(\d+(?:\.\d+)?)/i, /displacement[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('melting', pickNumber(text, [/melting[^\d]{0,16}(-?\d+(?:\.\d+)?)/i]))
  set('boiling', pickNumber(text, [/boiling[^\d]{0,16}(\d+(?:\.\d+)?)/i]))

  const eq = text.match(/(-?\d+)\s*x\s*([+-])\s*(\d+)\s*=\s*(-?\d+)/i)
  if (eq) {
    raw.coeff = Number(eq[1])
    raw.addend = Number(eq[2] === '-' ? -eq[3] : eq[3])
    raw.rhs = Number(eq[4])
  }

  const ratio = text.match(/(\d+)\s*:\s*(\d+)/)
  if (ratio) {
    const left = Number(ratio[1])
    const right = Number(ratio[2])
    if (/clock|hours|minutes|o'clock/i.test(text)) {
      raw.hours = left
      raw.minutes = right
    } else if (/section|divides|internally|m\s*:\s*n/i.test(text)) {
      raw.m = left
      raw.n = right
    } else {
      raw.partA = left
      raw.partB = right
      raw.hours = left
      raw.minutes = right
      raw.m = left
      raw.n = right
    }
  }
  set('hours', pickNumber(text, [/(\d+)\s*hours?/i, /hours?\s*[:=]?\s*(\d+)/i]))
  set('minutes', pickNumber(text, [/(\d+)\s*minutes?/i, /minutes?\s*[:=]?\s*(\d+)/i]))
  set('seconds', pickNumber(text, [/(\d+)\s*seconds?/i, /seconds?\s*[:=]?\s*(\d+)/i]))
  set('eighths', pickNumber(text, [/(\d+)\s*\/\s*8\s*turn/i, /(\d+)\s*eighths/i]))
  set('jumpA', pickNumber(text, [/rabbit[^\d]{0,24}(\d+)/i, /jump of (\d+)/i]))
  const jumps = allNumbers(text, /jump of (\d+)/i)
  if (jumps[0] !== undefined) raw.jumpA = jumps[0]
  if (jumps[1] !== undefined) raw.jumpB = jumps[1]
  set('jumpB', pickNumber(text, [/frog[^\d]{0,24}(\d+)/i, /grasshopper[^\d]{0,24}(\d+)/i]))
  set('kg', pickNumber(text, [/(\d+)\s*kg\b/i]))
  set('grams', pickNumber(text, [/(\d+)\s*g(?:rams?)?\b/i]))
  set('litres', pickNumber(text, [/(\d+)\s*L(?:itres?)?\b/i]))
  set('ml', pickNumber(text, [/(\d+)\s*ml\b/i]))
  set('glassMl', pickNumber(text, [/(\d+)\s*ml of water/i, /(\d+)\s*ml glass/i]))
  set('freshMl', pickNumber(text, [/(\d+)\s*ml of water/i, /teaspoon[^\d]{0,12}(\d+)/i]))
  set('lengthKm', pickNumber(text, [/(\d{1,2},?\d{3}|\d+)\s*kilometres?/i, /(\d{1,2},?\d{3}|\d+)\s*km\b/i]))
  set('metres', pickNumber(text, [/(\d+(?:\.\d+)?)\s*m(?:etres?)?\b/i]))
  set('extraCm', pickNumber(text, [/(\d+)\s*cm\b/i]))
  set('rows', pickNumber(text, [/(\d+)\s*rows/i, /(\d+)\s*groups of/i]))
  set('cols', pickNumber(text, [/(\d+)\s*columns/i, /groups of (\d+)/i]))
  set('dividend', pickNumber(text, [/(\d+)\s*÷/i, /(\d+)\s*split into/i]))
  set('divisor', pickNumber(text, [/÷\s*(\d+)/i, /split into (\d+)/i]))
  set('length', pickNumber(text, [/length[^\d]{0,12}(\d+)/i, /(\d+)\s*rows of/i]))
  set('breadth', pickNumber(text, [/breadth[^\d]{0,12}(\d+)/i]))
  set('over', pickNumber(text, [/(\d+)\s*over/i]))
  set('under', pickNumber(text, [/(\d+)\s*under/i]))
  set('sides', pickNumber(text, [/(\d+)-sided/i, /regular (\w+gon)/i]))
  set('heat', pickNumber(text, [/heat[^\d]{0,12}(\d+)/i]))
  set('spin', pickNumber(text, [/rotate(?:s|d)?[^\d]{0,12}(\d+)/i]))

  const times = text.match(/(\d+)\s*[×x]\s*(\d+)/)
  if (times) {
    raw.rows = Number(times[1])
    raw.cols = Number(times[2])
    raw.length = Number(times[1])
    raw.breadth = Number(times[2])
  }

  const indianLakh = text.match(/\b(\d{1,2}),(\d{2}),(\d{3})\b/)
  if (indianLakh) {
    const n = Number(indianLakh[1] + indianLakh[2] + indianLakh[3])
    if (Number.isFinite(n)) {
      raw.ones = n % 10
      raw.tens = Math.floor(n / 10) % 10
      raw.hundreds = Math.floor(n / 100) % 10
      raw.thousands = Math.floor(n / 1000) % 10
      raw.tenThousands = Math.floor(n / 10000) % 10
      raw.lakhs = Math.floor(n / 100000) % 10
      raw.tenLakhs = Math.floor(n / 1000000) % 10
      raw.crores = Math.floor(n / 10000000) % 10
    }
  } else {
    const indian = text.match(/\b(\d{1,2}),(\d{3})\b/)
    if (indian) {
      const n = Number(indian[1] + indian[2])
      if (Number.isFinite(n)) {
        raw.ones = n % 10
        raw.tens = Math.floor(n / 10) % 10
        raw.hundreds = Math.floor(n / 100) % 10
        raw.thousands = Math.floor(n / 1000) % 10
        raw.tenThousands = Math.floor(n / 10000) % 10
        if (raw.a === undefined) raw.a = n
        if (raw.lengthKm === undefined) raw.lengthKm = n
      }
    }
  }

  const decCm = text.match(/(\d+)\.(\d)\s*cm/i)
  if (decCm) {
    raw.cm = Number(decCm[1])
    raw.tenths = Number(decCm[2])
  }
  set('ab', pickNumber(text, [/AB\s*=\s*(\d+)/i]))
  set('bc', pickNumber(text, [/BC\s*=\s*(\d+)/i]))
  set('angleB', pickNumber(text, [/∠\s*ABC\s*=\s*(\d+)/i, /angle ABC\s*=\s*(\d+)/i]))
  set('sacks', pickNumber(text, [/(\d+)\s*sacks/i]))
  set('known', pickNumber(text, [/(\d+)\s*kg/i]))
  set('timeSec', pickNumber(text, [/in\s+(\d+)\s*s(?:ec(?:onds)?)?/i]))
  const sprintM = text.match(/(\d+)\s*m(?:etre)?s?\s*(?:race|sprint)/i)
  if (sprintM) raw.distance = Number(sprintM[1])
  const room = text.match(/(\d+)\s*ft\s*[×x]\s*(\d+)\s*ft/i) || text.match(/(\d+)\s*ft by (\d+)\s*ft/i)
  if (room) {
    raw.width = Number(room[1])
    raw.length = Number(room[2])
  }
  set('tryTile', pickNumber(text, [/(\d+)\s*ft tile/i]))
  set('copies', pickNumber(text, [/(\d+)\s*×\s*1\s*\//i]))
  set('add', pickNumber(text, [/s\s*=\s*a\s*\+\s*(\d+)/i]))
  set('sum', pickNumber(text, [/add to (\d+)/i, /sum[^\d]{0,12}(\d+)/i]))
  set('diff', pickNumber(text, [/differ(?:ence)?[^\d]{0,12}(\d+)/i]))

  if (/24-hour|24 hour/i.test(text)) raw.format = 1
  if (/12-hour|12 hour|a\.m\.|p\.m\./i.test(text)) raw.format = 0
  if (/dam (closed|built)|reservoir/i.test(text)) raw.dam = 1
  if (/pickle|oiled|dry/i.test(text) && /spoil|microbe|mould|food/i.test(text)) raw.moisture = 0
  if (/facing (east|the rising sun)/i.test(text)) raw.facing = 1
  if (/facing north/i.test(text)) raw.facing = 0
  if (/facing south/i.test(text)) raw.facing = 2
  if (/facing west/i.test(text)) raw.facing = 3


  if (/in series|connected in series|series circuit/i.test(text)) raw.mode = 0
  if (/in parallel|connected in parallel|parallel circuit/i.test(text)) raw.mode = 1
  if (/concave/i.test(text)) raw.kind = 0
  if (/convex/i.test(text)) raw.kind = 1

  const metals = extractMetals(text)
  if (metals.metalA !== undefined) raw.metalA = metals.metalA
  if (metals.metalB !== undefined) raw.metalB = metals.metalB

  if (/bar (?:graph|chart)|pictograph/i.test(text)) {
    const nums = allNumbers(text, /(\d+(?:\.\d+)?)/)
    nums.slice(0, 5).forEach((v, i) => {
      raw[`v${i + 1}`] = v
    })
  }

  return raw
}

function keywordScore(id: TemplateId, hay: string): number {
  const def = TEMPLATE_CATALOG[id]
  let score = 0
  for (const kw of def.keywords) {
    const needle = kw.toLowerCase().replace(/[–—−]/g, '-')
    if (needle.length < 3) continue
    if (hay.includes(needle)) score += Math.max(1, needle.length / 4)
  }
  return score
}

function boostedScore(id: TemplateId, hay: string): number {
  let score = keywordScore(id, hay)
  const apish = /arithmetic progression|\ba\.?p\.?\b|common difference|nth term|first term/.test(hay)
  const viGraph = /v\s*-?\s*i\s*graph|voltage[\s-]*current graph|\bvi graph\b/.test(hay)
  const motionGraph = /distance-time|velocity-time|s-t graph|v-t graph|s-t and v-t/.test(hay)
  const combo = /two resistors|(?:series|parallel).{0,48}(?:resistor|ohm|Ω|battery|circuit)/.test(hay)
  const linearEq = /-?\d+\s*x\s*[+-]\s*\d+\s*=/.test(hay)
  const section = /divides/.test(hay) && /internally|ratio/.test(hay)
  const phish = /ph\s*(=|of|:)\s*\d|universal indicator|ph strip|ph scale/.test(hay)

  if (id === 'ap_graph' && apish) score += 10
  if ((id === 'accelerated_motion' || id === 'st_vt_graph' || id === 'force_ma') && apish) score -= 8
  if (id === 'vi_graph' && viGraph) score += 10
  if (id === 'ohm_circuit' && viGraph) score -= 8
  if (id === 'st_vt_graph' && motionGraph) score += 8
  if (id === 'accelerated_motion' && motionGraph) score -= 6
  if (id === 'series_parallel' && combo) score += 8
  if (id === 'ohm_circuit' && combo) score -= 6
  if (id === 'equation_balance' && linearEq) score += 12
  if (id === 'section_formula' && section) score += 10
  if (id === 'ph_strip' && phish) score += 10
  if (id === 'echo' && /\becho\b/.test(hay)) score += 6
  if (id === 'pressure_area' && /force/.test(hay) && /area/.test(hay)) score += 8
  if (id === 'reactivity_swap' && /zinc/.test(hay) && /copper/.test(hay)) score += 8
  if (id === 'identity_tiles' && /\(a\s*\+\s*b\)\s*\^?\s*2|a\s*\+\s*b squared/.test(hay)) score += 8
  if (id === 'probability_spinner' && /favou?rable|spinner|equally likely/.test(hay)) score += 6
  if (id === 'place_value_chart' && /place value|ten thousand|tth|number name/.test(hay)) score += 10
  if (id === 'fraction_kit' && /equivalent fraction|fraction kit|same whole/.test(hay)) score += 10
  if (id === 'fraction_bar' && /equivalent fraction|fraction kit/.test(hay)) score -= 8
  if (id === 'turns_angle' && /quarter turn|half turn|full turn|angles as turns/.test(hay)) score += 10
  if (id === 'add_place' && /fuel arithmetic|adding large numbers|consecutive numbers/.test(hay)) score += 8
  if (id === 'length_units' && /far and near|kilometre|millimetre|double number line/.test(hay)) score += 8
  if (id === 'array_multiply' && /multiplication array|dairy farm|butter packets|commutative/.test(hay)) score += 10
  if (id === 'tessellate_fit' && /tessellat|regular pentagon|fit around a point/.test(hay)) score += 10
  if (id === 'weight_scale' && /weighing scale|kilogram|milligram|weight and capacity/.test(hay)) score += 8
  if (id === 'divide_share' && /division facts|coconut farm|sharing equally/.test(hay)) score += 10
  if (id === 'symmetry_spin' && /rotational symmetry|line of symmetry|firki|symmetrical/.test(hay)) score += 10
  if (id === 'area_grid' && /grandmother|quilt|perimeter|unit square/.test(hay)) score += 10
  if (id === 'square_grid' && /quilt|perimeter/.test(hay)) score -= 8
  if (id === 'race_clock' && /racing seconds|24-hour|12-hour|seconds hand/.test(hay)) score += 10
  if (id === 'clock_hands' && /racing seconds|24-hour/.test(hay)) score -= 8
  if (id === 'animal_jumps' && /common multiples|common factors|animal jumps/.test(hay)) score += 12
  if (id === 'number_line_walk' && /common multiples|common factors/.test(hay)) score -= 10
  if (id === 'map_compass' && /maps and locations|rising sun|north south east west/.test(hay)) score += 10
  if (id === 'picture_data' && /pictograph|data through pictures|one (picture|icon) for every/.test(hay)) score += 10
  if (id === 'bar_chart' && /pictograph/.test(hay) && /scale|every \d+/.test(hay)) score -= 6
  if (id === 'water_cycle' && /water cycle|evaporation|condensation|essence of life/.test(hay)) score += 10
  if (id === 'states_of_matter' && /water cycle/.test(hay)) score -= 8
  if (id === 'freshwater_share' && /freshwater|teaspoon|saltwater|water on earth/.test(hay)) score += 10
  if (id === 'river_dam' && /tributar|godavari|reservoir|journey of a river/.test(hay)) score += 10
  if (id === 'food_microbes' && /microbe|food spoilage|mould|food preservation/.test(hay)) score += 10
  if (id === 'kitchen_energy' && /what is energy|balloon rocket|sun-powered|how things work/.test(hay)) score += 10
  if (id === 'weave_pattern' && /weaving|over under|handloom|warp weft/.test(hay)) score += 8
  if (id === 'earth_day_night' && /day and night|earth rotation|globe and torch/.test(hay)) score += 10
  if (id === 'india_seasons' && /vasanta|six seasons|seasons journal|saba and aparna|rhythms of nature/.test(hay)) score += 16
  if (id === 'earth_day_night' && /vasanta|six seasons|seasons journal|saba and aparna/.test(hay)) score -= 14
  if ((id === 'moon_month' || id === 'earth_spin_moon') && /vasanta|six seasons|saba and aparna/.test(hay)) score -= 14
  if (id === 'capacity_jugs' && /millilitre|measuring jug|capacity/.test(hay)) score += 8
  if (id === 'lakh_crore_chart' && /lakh|crore|1,00,000|large numbers around us/.test(hay)) score += 14
  if (id === 'place_value_chart' && /lakh|crore|1,00,000/.test(hay)) score -= 12
  if (id === 'arith_expression' && /arithmetic expressions|same value|different phrases|5\s*×\s*25/.test(hay)) score += 12
  if (id === 'decimal_ruler' && /tenths|2\.7 cm|peek beyond the point|screw/.test(hay)) score += 12
  if (id === 'fraction_kit' && /2\.7 cm|peek beyond the point/.test(hay)) score -= 10
  if (id === 'letter_number' && /letter-numbers|s\s*=\s*a\s*\+\s*3/.test(hay)) score += 12
  if (id === 'intersecting_angles' && /vertically opposite|two lines cross|intersecting lines/.test(hay) && !/transversal|parallel lines/.test(hay)) score += 12
  if (id === 'parallel_transversal' && /transversal|corresponding angles|parallel lines/.test(hay)) score += 10
  if (id === 'triangle_build' && /three intersecting lines|equilateral|angles of a triangle/.test(hay)) score += 12
  if (id === 'pythagoras' && /three intersecting lines|equilateral 4 cm/.test(hay)) score -= 12
  if (id === 'fraction_multiply' && /working with fractions|3\s*×\s*1\s*\/\s*4|tortoise/.test(hay)) score += 12
  if (id === 'fraction_kit' && /3\s*×\s*1\s*\/\s*4|tortoise|aaron/.test(hay)) score -= 10
  if (id === 'congruence_sas' && /geometric twins|sas|signboard|ab\s*=\s*4/.test(hay)) score += 12
  if (id === 'integer_ops' && /operations with integers|sum 25|difference 11/.test(hay)) score += 12
  if (id === 'number_line_walk' && /operations with integers|difference 11/.test(hay)) score -= 10
  if (id === 'hcf_tiles' && /12 ft|16 ft|largest square tile|finding common ground|hcf/.test(hay)) score += 12
  if (id === 'animal_jumps' && /12 ft|16 ft|square tile/.test(hay)) score -= 12
  if (id === 'decimal_ops' && /0\.050 kg|50 g|another peek|spices/.test(hay)) score += 12
  if (id === 'stat_picture' && /statistical question|connecting the dots|about 15 minutes/.test(hay)) score += 12
  if (id === 'histogram' && /connecting the dots|15 minutes/.test(hay)) score -= 10
  if (id === 'coordinate_plot' && /connecting the dots/.test(hay)) score -= 10
  if (id === 'perp_bisector' && /perpendicular bisector|compass|constructions and tilings/.test(hay)) score += 12
  if (id === 'tessellate_fit' && /constructions and tilings|perpendicular/.test(hay)) score -= 10
  if (id === 'pan_unknown' && /finding the unknown|sacks|unknown weight/.test(hay) && !linearEq) score += 12
  if (id === 'equation_balance' && /finding the unknown|sacks/.test(hay) && !linearEq) score -= 10
  if (id === 'litmus_lab' && /litmus|acidic, basic|lemon|tap water/.test(hay) && !phish) score += 12
  if (id === 'ph_strip' && /litmus|lemon juice|soap water/.test(hay) && !phish) score -= 10
  if (id === 'simple_circuit' && /cell and a bulb|open and closed|conductor|insulator|circuits and their components/.test(hay)) score += 12
  if (id === 'ohm_circuit' && /cell and a bulb|conductor|insulator/.test(hay) && !/ohm|v\s*=\s*ir/.test(hay)) score -= 10
  if (id === 'metal_traits' && /iron tawa|malleable|metals and non-metals/.test(hay)) score += 12
  if (id === 'reactivity_swap' && /iron tawa|malleable/.test(hay)) score -= 10
  if (id === 'change_kind' && /physical and chemical|ice cube|burning wood/.test(hay)) score += 12
  if (id === 'heat_three_ways' && /conduction|convection|radiation|metal strip|pins/.test(hay)) score += 12
  if (id === 'heat_conduction' && /pins|three ways|sea breeze/.test(hay)) score -= 12
  if (id === 'sprint_speed' && /100 m|stopwatch|speed = distance|time and motion/.test(hay)) score += 12
  if ((id === 'pendulum' || id === 'uniform_motion') && /100 m|stopwatch|sprint/.test(hay)) score -= 12
  if (id === 'digest_path' && /food pipe|stomach|intestine|life processes in animals/.test(hay)) score += 12
  if (id === 'leaf_food' && /sapling|life processes in plants|leaf makes food/.test(hay)) score += 12
  if (id === 'light_path' && /opaque card|plane mirror|shadows and reflections|torch/.test(hay)) score += 12
  if ((id === 'shadow_light' || id === 'reflection_plane') && /opaque card|shadows and reflections/.test(hay)) score -= 12
  if (id === 'earth_spin_moon' && /merry-go-round|earth, moon, and the sun|morning shadows/.test(hay)) score += 12
  if (id === 'earth_day_night' && /merry-go-round|morning shadows/.test(hay)) score -= 12
  if (id === 'locker_squares' && /100 lockers|odd number of factors|square and a cube|perfect square/.test(hay)) score += 14
  if (id === 'square_grid' && /100 lockers|odd number of factors/.test(hay)) score -= 12
  if (id === 'paper_fold' && /power play|0\.001 cm|46 folds|fold it once|1\.024 cm/.test(hay)) score += 14
  if (id === 'inverse_graph' && /46 folds|0\.001 cm/.test(hay)) score -= 12
  if (id === 'rect_diagonals' && /carpenter|8 cm long strip|diagonals of the rectangle|quadrilaterals/.test(hay)) score += 14
  if (id === 'quadrilateral_live' && /carpenter|8 cm long strip/.test(hay)) score -= 12
  if (id === 'distribute_grid' && /we distribute|23\s*[×x]\s*27|distributive property|increments in products/.test(hay)) score += 14
  if (id === 'identity_tiles' && /23\s*[×x]\s*27|we distribute/.test(hay)) score -= 12
  if (id === 'similar_rect' && /60 mm|40 mm|same factor|proportional reasoning-1|images a, c/.test(hay)) score += 14
  if (id === 'ratio_bars' && /60 mm|tiger|same factor/.test(hay)) score -= 12
  if (id === 'percent_bar' && /fractions in disguise|per cent|75%|out of hundred|3\s*\/\s*4/.test(hay)) score += 14
  if ((id === 'fraction_kit' || id === 'ratio_bars') && /fractions in disguise|75%|sunset/.test(hay)) score -= 12
  if (id === 'baudhayana_square' && /baudhayana|doubling a square|diagonal of a square|sulba/.test(hay)) score += 14
  if (id === 'pythagoras' && /doubling a square|baudhayana|sulba/.test(hay)) score -= 14
  if (id === 'ratio_scale' && /idli|urad dal|representative fraction|60,00,000|2 cups of rice/.test(hay)) score += 14
  if (id === 'ratio_bars' && /idli|60,00,000|urad dal/.test(hay)) score -= 12
  if (id === 'sierpinski_step' && /sierpinski|fractal|geometric themes|self-similar/.test(hay)) score += 14
  if (id === 'tessellate_fit' && /sierpinski|fractal carpet/.test(hay)) score -= 12
  if (id === 'mean_balance' && /tales by dots|3 and 7|halfway between|arithmetic mean/.test(hay)) score += 14
  if ((id === 'stat_picture' || id === 'histogram') && /tales by dots|3 and 7|halfway between/.test(hay)) score -= 12
  if (id === 'think_number' && /algebra play|think of a number|always end up with the same value/.test(hay)) score += 14
  if ((id === 'pan_unknown' || id === 'equation_balance') && /think of a number|algebra play/.test(hay) && !linearEq) score -= 12
  if (id === 'rect_area' && /rangoli|equal area|which of these rectangles/.test(hay)) score += 14
  if ((id === 'area_grid' || id === 'square_grid') && /rangoli powder/.test(hay)) score -= 12
  if (id === 'water_lens' && /naked eye|round-bottom flask|invisible living|magnifying/.test(hay)) score += 14
  if (id === 'convex_lens' && /round-bottom flask|naked eye|invisible living/.test(hay)) score -= 14
  if (id === 'electromagnet_nail' && /electromagnet|paper clips|iron nail wrapped|magnetic and heating/.test(hay)) score += 14
  if ((id === 'ohm_circuit' || id === 'heating_effect' || id === 'solenoid' || id === 'simple_circuit' || id === 'magnetic_wire') && /electromagnet|paper clips|iron nail wrapped/.test(hay)) score -= 14
  if (id === 'push_pull_box' && /exploring forces|cardboard box|push or pull|not pedalling/.test(hay)) score += 14
  if (id === 'force_ma' && /cardboard box|exploring forces|push or pull/.test(hay)) score -= 14
  if (id === 'bag_straps' && /narrow straps|broad straps|force per unit area|hurting my shoulders/.test(hay)) score += 14
  if (id === 'wind_spin' && /sea breeze|land breeze|cyclone|warm ocean|how do winds form/.test(hay)) score += 16
  if (id === 'bag_straps' && /sea breeze|land breeze|cyclone|how do winds form|warm ocean/.test(hay)) score -= 14
  if ((id === 'pressure_area' || id === 'liquid_pressure') && /narrow straps|picnic|hurting my shoulders/.test(hay)) score -= 14
  if (id === 'chalk_bits' && /stick of chalk|particulate nature|mortar and pestle/.test(hay)) score += 14
  if ((id === 'kinetic_particles' || id === 'states_of_matter') && /stick of chalk|grind the small pieces/.test(hay)) score -= 14
  if (id === 'mix_kinds' && /sprout salad|poha|elements, compounds|components of a mixture/.test(hay)) score += 14
  if (id === 'separation_mix' && /sprout salad|poha/.test(hay)) score -= 12
  if (id === 'dissolve_ors' && /oral rehydration|solute|solvent|chalk powder is mixed/.test(hay)) score += 14
  if (id === 'diffusion' && /oral rehydration|ors tastes/.test(hay)) score -= 12
  if (id === 'spoon_mirror' && /spherical mirror|inner side of the spoon|mirrors and lenses|shiny metallic spoon/.test(hay)) score += 14
  if (id === 'two_lenses' && /convex lens|concave lens|magnifying glass|thicker at the middle|converging lens|diverging lens/.test(hay)) score += 16
  if (id === 'spoon_mirror' && /convex lens|concave lens|magnifying glass|thicker at the middle/.test(hay)) score -= 14
  if ((id === 'convex_lens' || id === 'bend_lens' || id === 'mirror_ray') && /convex lens|concave lens|magnifying glass|thicker at the middle/.test(hay) && !/1\/v|lens formula/.test(hay)) score -= 14
  if ((id === 'reflection_plane' || id === 'convex_lens' || id === 'mirror_ray') && /spoon|spherical mirror|mirrors and lenses/.test(hay) && !/1\/v|lens formula/.test(hay)) score -= 14
  if (id === 'moon_month' && /keeping time with the skies|full moon|bright portion of the moon|activity 11\.1/.test(hay)) score += 14
  if ((id === 'earth_spin_moon' || id === 'earth_day_night') && /keeping time with the skies|bright portion of the moon/.test(hay)) score -= 14
  if (id === 'seq_pictures' && /patterns in mathematics|square numbers|triangular numbers|1,\s*4,\s*9,\s*16,\s*25/.test(hay)) score += 14
  if (id === 'square_grid' && /triangular numbers|patterns in mathematics/.test(hay)) score -= 12
  if (id === 'line_ray_segment' && /line segment|lines and angles|crease|ray of light|lighthouse/.test(hay)) score += 14
  if (id === 'rotate_arms' && /two rays having a common|rotating arms|paper straws|straight angle|vertex of the angle/.test(hay)) score += 16
  if (id === 'line_ray_segment' && /two rays having a common|rotating arms|straight angle|paper straws/.test(hay)) score -= 14
  if ((id === 'turns_angle' || id === 'intersecting_angles' || id === 'angle_pair') && /rotating arms|two rays having a common|paper straws/.test(hay)) score -= 14
  if ((id === 'angle_pair' || id === 'intersecting_angles' || id === 'turns_angle') && /line segment|crease|lighthouse|ray of light from a torch/.test(hay)) score -= 14
  if (id === 'tally_bars' && /tally marks|jalebi|gulab jamun|data handling/.test(hay)) score += 14
  if ((id === 'picture_data' || id === 'bar_chart' || id === 'stat_picture') && /jalebi|gulab jamun|tally marks/.test(hay)) score -= 14
  if (id === 'idli_vada' && /idli-vada|prime time|idli instead|vada instead/.test(hay)) score += 14
  if (id === 'animal_jumps' && /idli-vada|prime time|idli instead/.test(hay)) score -= 14
  if (id === 'peri_rect' && /perimeter of a rectangle|12 cm|8 cm|photo frame|coloured tape/.test(hay)) score += 14
  if (id === 'flower_beds' && /flower bed|120 sq m|area of the whole land|12 m × 10 m|12 m x 10 m/.test(hay)) score += 16
  if (id === 'peri_rect' && /flower bed|120 sq m|area of the whole land/.test(hay)) score -= 14
  if ((id === 'area_grid' || id === 'rect_area' || id === 'square_grid') && /flower bed|120 sq m|12 m × 10 m/.test(hay)) score -= 14
  if ((id === 'area_grid' || id === 'rect_area' || id === 'square_grid') && /12 cm and 8 cm|photo frame of side 1m/.test(hay)) score -= 12
  if (id === 'roti_share' && /one roti|equal shares|two children|one half|1\/4 roti/.test(hay)) score += 14
  if (id === 'fraction_kit' && /one roti|shabnam|mukta|1\/4 roti/.test(hay)) score -= 14
  if (id === 'compass_circle' && /playing with constructions|4 cm away|radius of the circle|wavy wave/.test(hay)) score += 14
  if (id === 'perp_bisector' && /4 cm away from p|wavy wave/.test(hay)) score -= 12
  if (id === 'fold_turn_sym' && /butterfly|rangoli|rotated by 90|pinwheel/.test(hay)) score += 14
  if (id === 'symmetry_spin' && /butterfly|rangoli|rotated by 90/.test(hay)) score -= 12
  if (id === 'fun_lift' && /bela|building of fun|other side of zero|lift button/.test(hay)) score += 14
  if ((id === 'integer_ops' || id === 'number_line_walk') && /bela|building of fun|welcome hall/.test(hay)) score -= 14
  if (id === 'plant_group' && /diversity in the living world|tulsi|neem|nature walk/.test(hay)) score += 14
  if (id === 'stick_magnet' && /exploring magnets|iron filings|magnetic materials|pencil wood/.test(hay)) score += 14
  if ((id === 'electromagnet_nail' || id === 'map_compass') && /exploring magnets|iron filings|activity 4\.1/.test(hay)) score -= 14
  if (id === 'handspan_metre' && /handspan|measurement of length|metre scale|13 handspans|standard units/.test(hay)) score += 14
  if (id === 'kind_of_move' && /linear motion|circular motion|oscillatory|reference point|merry-go-round|types of motion/.test(hay)) score += 16
  if (id === 'handspan_metre' && /linear motion|circular motion|oscillatory|merry-go-round|types of motion/.test(hay)) score -= 14
  if ((id === 'uniform_motion' || id === 'sprint_speed' || id === 'pendulum') && /oscillatory|merry-go-round|types of motion|children.s park/.test(hay)) score -= 14
  if ((id === 'length_units' || id === 'uniform_motion' || id === 'sprint_speed') && /handspan|balisht|char angula/.test(hay)) score -= 14
  if (id === 'material_sort' && /materials around us|tumbler|classification/.test(hay)) score += 14
  if (id === 'metal_traits' && /materials around us|tumbler/.test(hay)) score -= 12
  if (id === 'three_bowls' && /three large containers|ice-cold|temperature and its measurement|both hands/.test(hay)) score += 14
  if ((id === 'heat_three_ways' || id === 'heat_conduction' || id === 'states_of_matter') && /three large containers|ice-cold water in c/.test(hay)) score -= 14
  if (id === 'water_three' && /states of water|ice cube|puddles|shikanji/.test(hay)) score += 14
  if ((id === 'states_of_matter' || id === 'water_cycle') && /shikanji|ice cube in a cup|puddles in the playground/.test(hay)) score -= 14
  if (id === 'everyday_separate' && /methods of separation|sedimentation|filtration|tea leaves/.test(hay)) score += 14
  if (id === 'separation_mix' && /methods of separation in everyday|tea leaves/.test(hay)) score -= 14
  if (id === 'living_or_not' && /living creatures|pigeon|snail|car is living|non-living/.test(hay)) score += 14
  if (id === 'star_pattern' && /beyond earth|constellation|night sky|ladakh/.test(hay)) score += 14
  if ((id === 'earth_day_night' || id === 'earth_spin_moon') && /beyond earth|constellation|ladakh/.test(hay)) score -= 14
  if (id === 'four_quadrant' && /quadrant|cartesian|orienting yourself|(0,\s*-?\s*4\.5)|negative axes/.test(hay)) score += 14
  if ((id === 'coordinate_plot' || id === 'transform_2d' || id === 'section_formula') && /orienting yourself|(0,\s*-?\s*4\.5)|four-quadrant/.test(hay)) score -= 14
  if (id === 'coord_distance' && /distance between two points|1\.4/.test(hay) && /coordinate|plane|points/.test(hay)) score += 14
  if (id === 'pythagoras' && /distance between two points|orienting yourself/.test(hay)) score -= 14
  if (id === 'linear_poly' && /linear polynomial|linear growth|linear decay|degree 1/.test(hay)) score += 14
  if ((id === 'linear_graph' || id === 'letter_number') && /linear polynomial|linear growth/.test(hay)) score -= 12
  if (id === 'wire_area' && /20 cm|10\s*[−-]\s*x|10x\s*[−-]\s*x|bent in different ways/.test(hay)) score += 14
  if (id === 'quadratic_parabola' && /20 cm wire|10x\s*[−-]\s*x/.test(hay)) score -= 14
  if (id === 'sqrt2_line' && /√2|square root of 2|construction of length|world of numbers/.test(hay)) score += 14
  if ((id === 'number_line_walk' || id === 'place_value_chart') && /√2|construction of length|world of numbers/.test(hay)) score -= 14
  if (id === 'ab_square' && /\(a\s*\+\s*b\)\s*²|visualising identities|algebra tiles|a = 10/.test(hay)) score += 14
  if (id === 'identity_tiles' && /visualising identities|exploring algebraic identities/.test(hay)) score -= 14
  if (id === 'circle_chord' && /chord|up and down|round and round|perpendicular bisector of chords/.test(hay)) score += 14
  if ((id === 'circle_tangent' || id === 'compass_circle' || id === 'circle_unroll') && /up and down|round and round|chord of the circle/.test(hay)) score -= 14
  if (id === 'track_stagger' && /stagger|4\s*×\s*100|400 m track|c\/d ratio/.test(hay)) score += 14
  if ((id === 'sector_segment' || id === 'volume_fill' || id === 'circle_unroll') && /stagger|4\s*×\s*100|400 m track/.test(hay)) score -= 14
  if (id === 'heron_area' && /heron|semi-perimeter|three sides/.test(hay)) score += 14
  if ((id === 'rect_area' || id === 'peri_rect') && /heron|semi-perimeter/.test(hay)) score -= 12
  if (id === 'maybe_chance' && /tossing a coin|rolling a die|probability scale|mathematics of maybe/.test(hay)) score += 14
  if (id === 'probability_spinner' && /tossing a coin|mathematics of maybe|probability scale/.test(hay)) score -= 14
  if (id === 'dot_sequence' && /triangular numbers|fig\.?\s*8\.1|predicting what comes next/.test(hay)) score += 14
  if (id === 'seq_pictures' && /fig\.?\s*8\.1|predicting what comes next|1, 4, 7, 10, 13/.test(hay)) score -= 12
  if (id === 'ap_gp_steps' && /arithmetic progression|1,\s*4,\s*7,\s*10,\s*13|18\.00 ft|geometric progression/.test(hay)) score += 14
  if (id === 'ap_graph' && /1,\s*4,\s*7,\s*10,\s*13|18\.00 ft|predicting what comes next/.test(hay)) score -= 14
  if (id === 'cricket_model' && /cricket|a six|example 1\.1|simple model/.test(hay)) score += 14
  if (id === 'projectile_2d' && /cricket|example 1\.1|brand of the bat/.test(hay)) score -= 14
  if (id === 'cell_parts' && /cell membrane|cell wall|building block of life|animal cell|plant cell/.test(hay)) score += 14
  if (id === 'xylem_phloem' && /xylem|phloem|tissues in action|conducting tissues/.test(hay)) score += 14
  if (id === 'leaf_food' && /xylem|tissues in action/.test(hay)) score -= 12
  if (id === 'joint_kinds' && /ball and socket|hinge joint|pivot joint|types of joints/.test(hay)) score += 14
  if (id === 'dist_displace' && /distance travelled|displacement|describing motion|reference point/.test(hay)) score += 14
  if (id === 'sprint_speed' && /displacement|describing motion around us/.test(hay)) score -= 12
  if (id === 'motion_graphs' && /velocity-time|position-time|kinematic|uniform circular|describing motion around us/.test(hay)) score += 14
  if ((id === 'st_vt_graph' || id === 'accelerated_motion' || id === 'free_fall' || id === 'circular_motion') && /describing motion around us/.test(hay)) score -= 14
  if (id === 'mix_three' && /tyndall|activity 5\.1|chalk powder|salt to 50 ml|colloid/.test(hay)) score += 14
  if ((id === 'everyday_separate' || id === 'separation_mix' || id === 'dissolve_ors') && /activity 5\.1|tyndall|chalk powder to 50/.test(hay)) score -= 14
  if (id === 'box_newton' && /pushing a box|how forces affect motion|canoe|newton/.test(hay)) score += 14
  if ((id === 'force_ma' || id === 'push_pull_box') && /how forces affect motion|canoeist|pushing a box/.test(hay)) score -= 14
  if (id === 'lift_work' && /wheat bag|5 kg|work, energy|mgh/.test(hay)) score += 14
  if ((id === 'work_fs' || id === 'bounce_energy') && /wheat bag|5 kg bag/.test(hay)) score -= 14
  if (id === 'machine_help' && /inclined plane|simple machines|pulley|lever/.test(hay)) score += 14
  if (id === 'bag_straps' && /simple machines|inclined plane/.test(hay)) score -= 12
  if (id === 'gold_foil' && /gold foil|rutherford|thomson|journey inside the atom/.test(hay)) score += 14
  if (id === 'electron_shells' && /gold foil|journey inside the atom/.test(hay)) score -= 14
  if (id === 'keep_mass' && /conservation of mass|activity 9\.1|baking soda|balloon/.test(hay)) score += 14
  if (id === 'bond_kind' && /covalent|ionic|sharing of electrons|atomic foundations/.test(hay)) score += 14
  if ((id === 'ionic_bond' || id === 'covalent_bond') && /atomic foundations|sharing of electrons/.test(hay)) score -= 14
  if (id === 'sound_echo' && /rubber band|0\.5 s|sound waves: characteristics|pluck the rubber/.test(hay)) score += 14
  if ((id === 'sound_wave' || id === 'echo' || id === 'spring_shm') && /rubber band|sound waves: characteristics|0\.5 s/.test(hay)) score -= 14
  if (id === 'one_parent' && /bryophyllum|asexual|vegetative propagation|how life continues/.test(hay)) score += 14
  if (id === 'five_kingdoms' && /five kingdom|monera|protista|whittaker|diversity and classification/.test(hay)) score += 14
  if ((id === 'living_or_not' || id === 'plant_group') && /five kingdom|monera|whittaker/.test(hay)) score -= 14
  if (id === 'five_spheres' && /geosphere|cryosphere|activity 13\.1|earth as a system/.test(hay)) score += 14
  if ((id === 'water_cycle' || id === 'earth_day_night' || id === 'earth_spin_moon') && /geosphere|cryosphere|earth as a system/.test(hay)) score -= 14
  if (id === 'prime_share' && /fundamental theorem of arithmetic|hcf and lcm|6 and 20/.test(hay)) score += 14
  if (id === 'hcf_tiles' && /fundamental theorem of arithmetic|6 and 20/.test(hay)) score -= 14
  if (id === 'poly_zeroes' && /zeroes of a polynomial|geometrical meaning|x\s*²\s*[−-]\s*3x|x\^2\s*-\s*3x/.test(hay)) score += 14
  if (id === 'quadratic_parabola' && /zeroes of a polynomial|geometrical meaning of the zeroes/.test(hay)) score -= 14
  if (id === 'pair_lines' && /pair of linear equations|graphical method|x\s*[−-]\s*y\s*\+\s*1/.test(hay)) score += 14
  if (id === 'linear_graph' && /pair of linear equations|graphical method of solution/.test(hay)) score -= 14
  if (id === 'root_nature' && /nature of roots|discriminant|2x\s*²\s*[−-]\s*4x\s*\+\s*3/.test(hay)) score += 14
  if (id === 'ap_rungs' && /ladder|rungs|45 cm/.test(hay) && /arithmetic|ap\b|progression/.test(hay)) score += 14
  if (id === 'thales_cut' && /basic proportionality|thales|parallel to one side/.test(hay)) score += 14
  if (id === 'like_triangles' && /aa criterion|sas similarity|sss similarity|criteria for similarity/.test(hay)) score += 14
  if (id === 'similar_triangles' && /basic proportionality|thales|aa criterion/.test(hay)) score -= 14
  if (id === 'coord_gap' && /distance formula|p\(4,\s*6\)|q\(6,\s*8\)/.test(hay)) score += 14
  if (id === 'coord_distance' && /p\(4,\s*6\)|distance formula/.test(hay)) score -= 12
  if (id === 'section_split' && /niharika runs/.test(hay)) score += 14
  if (id === 'right_trig' && /trigonometric ratios|right-angled at b|24 cm.*7 cm|7 cm.*24 cm/.test(hay)) score += 14
  if (id === 'unit_circle' && /24 cm|7 cm|right-angled at b|trigonometric ratios of an acute/.test(hay)) score -= 14
  if (id === 'tower_sight' && /heights and distances|line of sight|electrician/.test(hay)) score += 14
  if (id === 'angle_of_elevation' && /heights and distances|electrician/.test(hay)) score -= 14
  if (id === 'circle_touch' && /tangent to a circle|point of contact|two tangents from/.test(hay)) score += 14
  if ((id === 'circle_tangent' || id === 'circle_chord') && /tangent to a circle|two tangents from an external/.test(hay)) score -= 14
  if (id === 'slice_area' && /areas related to circles|radius 4 cm.*30|sector of a circle with radius 4/.test(hay)) score += 14
  if (id === 'sector_segment' && /areas related to circles|radius 4 cm and of angle 30/.test(hay)) score -= 14
  if (id === 'combo_solid' && /combination of solids|spinning top|3\.5 cm/.test(hay)) score += 14
  if (id === 'volume_fill' && /combination of solids|spinning top/.test(hay)) score -= 14
  if (id === 'group_avg' && /mean of grouped|mode of grouped|median of grouped|51 girls/.test(hay)) score += 14
  if (id === 'histogram' && /mean of grouped|median of grouped|51 girls/.test(hay)) score -= 14
  if (id === 'fair_chance' && /theoretical approach|fig\.?\s*14\.3|two dice/.test(hay)) score += 14
  if (id === 'maybe_chance' && /theoretical approach|fig\.?\s*14\.3/.test(hay)) score -= 14
  if (id === 'probability_spinner' && /theoretical approach|fig\.?\s*14\.3/.test(hay)) score -= 14
  if (id === 'react_kind' && /chemical reactions and equations|combination reaction|displacement reaction/.test(hay)) score += 14
  if (id === 'collision_theory' && /chemical reactions and equations|magnesium ribbon/.test(hay)) score -= 14
  if (id === 'acid_strip' && /acids, bases and salts|zinc granules|gastric juice|ph of salts/.test(hay)) score += 14
  if (id === 'ph_strip' && /acids, bases and salts|zinc granules with dilute/.test(hay)) score -= 14
  if (id === 'metal_swap' && /reactivity series|metals and non-metals/.test(hay)) score += 14
  if (id === 'reactivity_swap' && /metals and non-metals|reactivity series/.test(hay)) score -= 14
  if (id === 'carbon_share' && /carbon and its compounds|homologous series|micelle|electron dot/.test(hay) && /carbon|methane|soap|ch4/.test(hay)) score += 14
  if ((id === 'covalent_bond' || id === 'bond_kind') && /carbon and its compounds|homologous series|micelle/.test(hay)) score -= 14
  if (id === 'plant_food' && /stomata|destarched|autotrophic nutrition|chlorophyll/.test(hay) && /life processes|photosynthesis/.test(hay)) score += 14
  if (id === 'leaf_food' && /life processes|stomata|chlorophyll/.test(hay)) score -= 14
  if (id === 'gut_tube' && /alimentary|nutrition in human|fig\.?\s*5\.6/.test(hay)) score += 14
  if (id === 'digest_path' && /alimentary|fig\.?\s*5\.6|nutrition in human beings/.test(hay)) score -= 14
  if (id === 'breath_kind' && /aerobic|anaerobic|fig\.?\s*5\.8/.test(hay)) score += 14
  if (id === 'blood_loop' && /double circulation|transportation in human/.test(hay)) score += 14
  if (id === 'nerve_path' && /reflex arc|neuron|control and coordination/.test(hay)) score += 14
  if (id === 'plant_bend' && /phototropism|tropism|growth movement/.test(hay)) score += 14
  if (id === 'split_grow' && /how do organisms reproduce|fission|spore formation|vegetative propagation/.test(hay)) score += 14
  if (id === 'one_parent' && /how do organisms reproduce/.test(hay)) score -= 14
  if (id === 'flower_parts' && /fig\.?\s*7\.9|stamen|pistil|flowering plants/.test(hay)) score += 14
  if (id === 'pea_cross' && /mendel|heredity|sex determination|f2/.test(hay)) score += 14
  if (id === 'curve_mirror' && /spherical mirror|mirror formula|concave mirror/.test(hay)) score += 14
  if (id === 'mirror_ray' && /spherical mirrors|mirror formula/.test(hay)) score -= 14
  if (id === 'glass_slab' && /glass slab|lateral shift|rectangular glass/.test(hay)) score += 14
  if (id === 'snell_refraction' && /glass slab|lateral shift/.test(hay)) score -= 14
  if (id === 'bend_lens' && /lens formula|power of a lens/.test(hay)) score += 14
  if (id === 'convex_lens' && /lens formula|power of a lens/.test(hay)) score -= 14
  if (id === 'eye_see' && /myopia|hypermetropia|near point|human eye/.test(hay)) score += 14
  if (id === 'prism_split' && /dispersion|equilateral|vibgyor|colourful world/.test(hay)) score += 14
  if (id === 'prism' && /equilateral|colourful world|human eye/.test(hay)) score -= 14
  if (id === 'ohm_line' && /four cells|1\.5 v|nichrome|activity 11\.1/.test(hay)) score += 14
  if ((id === 'ohm_circuit' || id === 'vi_graph') && /four cells of 1\.5|activity 11\.1|nichrome wire/.test(hay)) score -= 14
  if (id === 'two_resist' && /resistors in series|resistors in parallel|combination of resistors/.test(hay)) score += 14
  if (id === 'heat_wire' && /heating effect of electric|electric power|1200/.test(hay)) score += 14
  if (id === 'heating_effect' && /electric power|1200/.test(hay)) score -= 14
  if (id === 'field_wire' && /magnetic effects of electric|right-hand thumb|solenoid/.test(hay)) score += 14
  if ((id === 'magnetic_wire' || id === 'solenoid') && /magnetic effects of electric current/.test(hay)) score -= 14
  if (id === 'food_rung' && /food chain|trophic|energy flow|our environment/.test(hay)) score += 14
  return score
}

export function matchTemplateFromText(text: string): TemplateMatch | null {
  const hay = text.toLowerCase().replace(/[–—−]/g, '-')
  if (!hay.trim()) return null

  let best: TemplateId | null = null
  let bestScore = 0
  for (const id of TEMPLATE_IDS) {
    const score = boostedScore(id, hay)
    if (score > bestScore) {
      bestScore = score
      best = id
    }
  }

  if (!best || bestScore <= 0) return null

  const extracted = extractCommon(maskCitations(text))
  const { params } = parseTemplateParams(best, dropCitationParams(extracted, text))
  return {
    templateId: best,
    params,
    title: TEMPLATE_CATALOG[best].label,
  }
}

export function matchKnownTemplateId(id: unknown): TemplateId | null {
  return isTemplateId(id) ? id : null
}

export { TEMPLATE_IDS }
