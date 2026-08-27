import { describe, it, expect } from 'vitest'
import { bindTemplate, createTemplateSpec } from './bind.js'
import { analyticFlatRange, solveCollision1d, solveProjectile } from './physics.js'
import { isTemplateId, parseTemplateParams, randomizeTemplateParams, TEMPLATE_CATALOG, TEMPLATE_IDS, allowedTemplatePrompt } from './catalog.js'
import { matchTemplateFromText } from './match.js'

describe('bindTemplate projectile accuracy', () => {
  it('matches flat-ground analytic range for 20 m/s at 45°', () => {
    const v0 = 20
    const angleDeg = 45
    const g = 9.81
    const bound = bindTemplate('projectile_2d', { v0, angleDeg, h0: 0, g })
    const expected = analyticFlatRange(v0, angleDeg, g)
    const sol = solveProjectile(v0, angleDeg, 0, g)
    expect(sol.range).toBeCloseTo(expected, 5)
    expect(bound.metrics.range as number).toBeCloseTo(expected, 2)
    expect(bound.metrics.flightTime as number).toBeCloseTo(sol.flightTime, 3)
    expect(bound.warnings).toHaveLength(0)
    expect(bound.spec.stage?.elements.length).toBeGreaterThan(0)
    expect(bound.spec.templateId).toBe('projectile_2d')
  })

  it('uses textbook params rather than silently replacing them', () => {
    const bound = bindTemplate('projectile_2d', { v0: 28, angleDeg: 30, h0: 2, g: 9.81 })
    expect(bound.spec.params?.v0).toBe(28)
    expect(bound.spec.params?.angleDeg).toBe(30)
    expect(bound.spec.params?.h0).toBe(2)
  })
})

describe('bindTemplate collision energy', () => {
  it('conserves kinetic energy when e = 1', () => {
    const bound = bindTemplate('collision_1d', { m1: 2, m2: 3, u1: 6, u2: -2, e: 1 })
    const sol = solveCollision1d(2, 3, 6, -2, 1)
    expect(bound.metrics.energyLoss as number).toBeCloseTo(0, 5)
    expect(bound.metrics.keAfter as number).toBeCloseTo(sol.keBefore, 5)
  })

  it('loses energy when e = 0 (perfectly inelastic)', () => {
    const bound = bindTemplate('collision_1d', { m1: 2, m2: 2, u1: 8, u2: -4, e: 0 })
    expect(bound.metrics.energyLoss as number).toBeGreaterThan(0)
    expect(bound.metrics.v1).toBe(bound.metrics.v2)
  })
})

describe('bindTemplate ramp', () => {
  it('slides at 30° with μ=0 at a = g/2 and stays put when μ is too large', () => {
    const ice = bindTemplate('ramp_friction', { angleDeg: 30, mu: 0, mass: 5 })
    expect(ice.metrics.willSlide).toBe(true)
    expect(ice.metrics.acceleration as number).toBeCloseTo(9.81 / 2, 3)
    const stuck = bindTemplate('ramp_friction', { angleDeg: 30, mu: 1, mass: 5 })
    expect(stuck.metrics.willSlide).toBe(false)
    expect(stuck.metrics.acceleration).toBe(0)
  })
})

describe('createTemplateSpec', () => {
  it('stores templateId + params without a stage', () => {
    const spec = createTemplateSpec('free_fall', { h0: 12 })
    expect(spec.templateId).toBe('free_fall')
    expect(spec.params?.h0).toBe(12)
    expect(spec.params?.g).toBe(9.81)
    expect(spec.stage).toBeUndefined()
    expect(spec.isSimulatable).toBe(true)
  })

  it('preserves ingest-time about and howItWorks on bind', () => {
    const bound = bindTemplate(
      'free_fall',
      { h0: 12 },
      {
        about: 'A ball dropping from a roof.',
        howItWorks: '- Gravity speeds it up each second.',
      }
    )
    expect(bound.spec.about).toBe('A ball dropping from a roof.')
    expect(bound.spec.howItWorks).toBe('- Gravity speeds it up each second.')
  })
})

describe('parseTemplateParams', () => {
  it('fills defaults for missing keys', () => {
    const { params, paramMeta } = parseTemplateParams('projectile_2d', { v0: 15 })
    expect(params.v0).toBe(15)
    expect(params.angleDeg).toBe(45)
    expect(paramMeta.v0?.source).toBe('extracted')
    expect(paramMeta.angleDeg?.source).toBe('default')
  })
})

describe('isTemplateId', () => {
  it('accepts catalog ids and rejects unknown', () => {
    expect(isTemplateId('projectile_2d')).toBe(true)
    expect(isTemplateId('wormhole')).toBe(false)
  })
})

describe('randomizeTemplateParams', () => {
  it('stays inside slider min/max for every catalog template', () => {
    for (const id of TEMPLATE_IDS) {
      const params = randomizeTemplateParams(id)
      for (const def of TEMPLATE_CATALOG[id].params) {
        expect(params[def.key]).toBeGreaterThanOrEqual(def.min)
        expect(params[def.key]).toBeLessThanOrEqual(def.max)
      }
    }
  })
})

describe('catalog coverage', () => {
  it('keeps known templates and only allows physics, chemistry, math domains', () => {
    expect(TEMPLATE_IDS).toContain('projectile_2d')
    expect(TEMPLATE_IDS.length).toBeGreaterThanOrEqual(41)
    expect(new Set(TEMPLATE_IDS).size).toBe(TEMPLATE_IDS.length)
    const domains = TEMPLATE_IDS.map((id) => TEMPLATE_CATALOG[id].domain)
    expect(domains.every((d) => d === 'physics' || d === 'chemistry' || d === 'math')).toBe(true)
  })

  it('runs every sim file to a valid stage from defaults', () => {
    for (const id of TEMPLATE_IDS) {
      const bound = bindTemplate(id, {})
      expect(bound.spec.isSimulatable).toBe(true)
      expect(bound.spec.stage?.elements.length).toBeGreaterThan(0)
      expect(bound.spec.templateId).toBe(id)
      expect(bound.spec.domain).toBe(TEMPLATE_CATALOG[id].domain)
      for (const def of TEMPLATE_CATALOG[id].params) {
        expect(bound.spec.paramMeta?.[def.key]?.source).toBe('default')
      }
    }
  })

  it('marks extracted book values vs defaults', () => {
    const spec = createTemplateSpec('snell_refraction', { n1: 1, theta1: 30 })
    expect(spec.paramMeta?.n1?.source).toBe('extracted')
    expect(spec.paramMeta?.n2?.source).toBe('default')
    expect(spec.params?.n2).toBe(1.5)
    expect(spec.stage).toBeUndefined()
  })
})

describe('matchTemplateFromText', () => {
  it('maps a projectile sentence to projectile_2d with extracted numbers', () => {
    const m = matchTemplateFromText('A ball is thrown at 20 m/s at 45 degrees.')
    expect(m?.templateId).toBe('projectile_2d')
    expect(m?.params.v0).toBe(20)
    expect(m?.params.angleDeg).toBe(45)
  })

  it('maps chemistry and maths textbook lines', () => {
    expect(matchTemplateFromText('Kinetic theory of gas particles at 400 K')?.templateId).toBe(
      'kinetic_particles'
    )
    expect(matchTemplateFromText('Shade the fraction 3/5 on the bar')?.templateId).toBe('fraction_bar')
    expect(matchTemplateFromText('Snell refraction at the air to glass boundary')?.templateId).toBe(
      'snell_refraction'
    )
  })

  it('returns null when no keyword matches', () => {
    expect(matchTemplateFromText('Photosynthesis in green leaves')).toBeNull()
  })
})

describe('phase 1 graph templates', () => {
  it('st_vt_graph uses u=0, a=2, tMax=5 → sMax 25 and vEnd 10', () => {
    const bound = bindTemplate('st_vt_graph', { u: 0, a: 2, tMax: 5 })
    expect(bound.spec.params?.u).toBe(0)
    expect(bound.spec.params?.a).toBe(2)
    expect(bound.metrics.sMax).toBe(25)
    expect(bound.metrics.vEnd).toBe(10)
    expect(bound.spec.stage?.elements.length).toBeGreaterThan(0)
  })

  it('vi_graph uses R=4, Vmax=12 → I = 3', () => {
    const bound = bindTemplate('vi_graph', { R: 4, Vmax: 12 })
    expect(bound.spec.params?.R).toBe(4)
    expect(bound.metrics.I_at_Vmax).toBe(3)
    expect(bound.metrics.slope).toBe(0.25)
  })

  it('ap_graph uses a=2, d=3, n=5 → tn 14 and Sn 40', () => {
    const bound = bindTemplate('ap_graph', { a: 2, d: 3, n: 5 })
    expect(bound.metrics.tn).toBe(14)
    expect(bound.metrics.Sn).toBe(40)
  })

  it('bar_chart hides zero bars and totals the rest', () => {
    const bound = bindTemplate('bar_chart', { v1: 8, v2: 12, v3: 5, v4: 0, v5: 0 })
    expect(bound.metrics.total).toBe(25)
    expect(bound.metrics.max).toBe(12)
  })
})

describe('phase 2A geometry templates', () => {
  it('section_formula 1:1 from (0,0) to (4,2) is the midpoint (2,1)', () => {
    const bound = bindTemplate('section_formula', { x1: 0, y1: 0, x2: 4, y2: 2, m: 1, n: 1 })
    expect(bound.metrics.x).toBe(2)
    expect(bound.metrics.y).toBe(1)
  })

  it('section_formula drawn P splits AB in m:n', () => {
    const bound = bindTemplate('section_formula', { x1: 0, y1: 0, x2: 6, y2: 0, m: 2, n: 1 })
    expect(bound.metrics.x).toBe(4)
    const A = bound.spec.stage?.elements.find((el) => el.id === 'A')
    const B = bound.spec.stage?.elements.find((el) => el.id === 'B')
    const P = bound.spec.stage?.elements.find((el) => el.id === 'R')
    const ax = Number(A?.props.cx)
    const bx = Number(B?.props.cx)
    const px = Number(P?.props.cx)
    expect((px - ax) / (bx - ax)).toBeCloseTo(2 / 3, 3)
  })

  it('triangle_angles computes C = 180 − A − B and warns when invalid', () => {
    const ok = bindTemplate('triangle_angles', { A: 50, B: 60 })
    expect(ok.metrics.C).toBe(70)
    expect(ok.warnings).toHaveLength(0)
    const bad = bindTemplate('triangle_angles', { A: 100, B: 90 })
    expect(bad.metrics.C).toBe(-10)
    expect(bad.warnings.length).toBeGreaterThan(0)
  })

  it('triangle_angles drawn angle at A matches slider (tall 80-80-20 is not squashed)', () => {
    const bound = bindTemplate('triangle_angles', { A: 80, B: 80 })
    const ab = bound.spec.stage?.elements.find((el) => el.id === 'ab')
    const ca = bound.spec.stage?.elements.find((el) => el.id === 'ca')
    expect(ab?.type).toBe('line')
    expect(ca?.type).toBe('line')
    const Ax = Number(ab?.props.x1)
    const Ay = Number(ab?.props.y1)
    const Bx = Number(ab?.props.x2)
    const By = Number(ab?.props.y2)
    const Cx = Number(ca?.props.x1)
    const Cy = Number(ca?.props.y1)
    const angAB = (Math.atan2(-(By - Ay), Bx - Ax) * 180) / Math.PI
    const angAC = (Math.atan2(-(Cy - Ay), Cx - Ax) * 180) / Math.PI
    let diff = angAC - angAB
    while (diff < 0) diff += 360
    while (diff >= 360) diff -= 360
    expect(diff).toBeCloseTo(80, 0)
  })

  it('quadrilateral_live D = 360 − A − B − C and drawn angle A matches', () => {
    const ok = bindTemplate('quadrilateral_live', { A: 80, B: 100, C: 90 })
    expect(ok.metrics.D).toBe(90)
    expect(ok.warnings).toHaveLength(0)
    const ab = ok.spec.stage?.elements.find((el) => el.id === 'ab')
    const da = ok.spec.stage?.elements.find((el) => el.id === 'da')
    const Ax = Number(ab?.props.x1)
    const Ay = Number(ab?.props.y1)
    const Bx = Number(ab?.props.x2)
    const By = Number(ab?.props.y2)
    const Dx = Number(da?.props.x1)
    const Dy = Number(da?.props.y1)
    const angAB = (Math.atan2(-(By - Ay), Bx - Ax) * 180) / Math.PI
    const angAD = (Math.atan2(-(Dy - Ay), Dx - Ax) * 180) / Math.PI
    let diff = angAD - angAB
    while (diff < 0) diff += 360
    while (diff >= 360) diff -= 360
    expect(diff).toBeCloseTo(80, 0)
    const bad = bindTemplate('quadrilateral_live', { A: 150, B: 150, C: 150 })
    expect(bad.metrics.D).toBe(-90)
    expect(bad.warnings.length).toBeGreaterThan(0)
  })

  it('circle_tangent length is 4 for r=3, d=5 and warns when inside', () => {
    const ok = bindTemplate('circle_tangent', { r: 3, d: 5 })
    expect(ok.metrics.length).toBe(4)
    expect(ok.metrics.real).toBe(true)
    const oa = ok.spec.stage?.elements.find((el) => el.id === 'oa')
    const pa = ok.spec.stage?.elements.find((el) => el.id === 'pa')
    const ox = Number(oa?.props.x1)
    const oy = Number(oa?.props.y1)
    const ax = Number(oa?.props.x2)
    const ay = Number(oa?.props.y2)
    const px = Number(pa?.props.x1)
    const py = Number(pa?.props.y1)
    expect((ax - ox) * (ax - px) + (ay - oy) * (ay - py)).toBeCloseTo(0, 4)
    const inside = bindTemplate('circle_tangent', { r: 5, d: 3 })
    expect(inside.metrics.real).toBe(false)
    expect(inside.warnings.length).toBeGreaterThan(0)
  })

  it('angle_pair reports complement and supplement', () => {
    const bound = bindTemplate('angle_pair', { angleDeg: 30 })
    expect(bound.metrics.complement).toBe(60)
    expect(bound.metrics.supplement).toBe(150)
  })
})

describe('phase 2B number and data templates', () => {
  it('identity_tiles a=3, b=2 → (a+b)² = 25', () => {
    const bound = bindTemplate('identity_tiles', { a: 3, b: 2 })
    expect(bound.metrics.expanded).toBe(25)
  })

  it('equation_balance 2x + 3 = 11 → x = 4', () => {
    const bound = bindTemplate('equation_balance', { coeff: 2, addend: 3, rhs: 11 })
    expect(bound.metrics.x).toBe(4)
  })

  it('probability_spinner clamps favourable and reports P', () => {
    const bound = bindTemplate('probability_spinner', { favorable: 2, total: 6 })
    expect(bound.metrics.P).toBeCloseTo(1 / 3, 3)
    const clamped = bindTemplate('probability_spinner', { favorable: 9, total: 6 })
    expect(clamped.metrics.favorable).toBe(6)
    expect(clamped.metrics.P).toBe(1)
  })

  it('clock_hands at 3:00 is 90°', () => {
    const bound = bindTemplate('clock_hands', { hours: 3, minutes: 0 })
    expect(bound.metrics.angle).toBe(90)
  })
})

describe('phase 3 physics templates', () => {
  it('shadow_light similar triangles H/h = D/u', () => {
    const bound = bindTemplate('shadow_light', { objectHeight: 10, sourceDistance: 40 })
    expect(bound.metrics.D).toBe(120)
    expect(bound.metrics.shadowHeight).toBe(30)
  })

  it('ohm_circuit V=6, R=3 → I = 2', () => {
    const bound = bindTemplate('ohm_circuit', { V: 6, R: 3 })
    expect(bound.metrics.I).toBe(2)
    const types = (bound.spec.stage?.elements ?? []).map((el) => el.type)
    expect(types).toContain('path')
    expect(types.filter((t) => t === 'circle').length).toBeGreaterThanOrEqual(5)
  })

  it('series_parallel series R1=2, R2=3, V=10 → I = 2', () => {
    const bound = bindTemplate('series_parallel', { V: 10, R1: 2, R2: 3, mode: 0 })
    expect(bound.metrics.Req).toBe(5)
    expect(bound.metrics.I).toBe(2)
    expect(bound.metrics.I1).toBe(2)
    expect(bound.metrics.I2).toBe(2)
  })

  it('series_parallel parallel equal 2 Ω on 10 V → Req = 1, I = 10', () => {
    const bound = bindTemplate('series_parallel', { V: 10, R1: 2, R2: 2, mode: 1 })
    expect(bound.metrics.Req).toBe(1)
    expect(bound.metrics.I).toBe(10)
    expect(bound.metrics.I1).toBe(5)
    expect(bound.metrics.I2).toBe(5)
  })

  it('echo d=340, v=340 → t = 2', () => {
    const bound = bindTemplate('echo', { distance: 340, vSound: 340 })
    expect(bound.metrics.t).toBe(2)
    const wall = bound.spec.stage?.elements.find((el) => el.id === 'wall')
    const pulse = bound.spec.stage?.elements.find((el) => el.id === 'pulse')
    expect(wall?.type).toBe('line')
    expect(pulse?.role).toBe('projectile')
  })

  it('pressure_area F=10, A=2 → P = 5', () => {
    const bound = bindTemplate('pressure_area', { force: 10, area: 2 })
    expect(bound.metrics.P).toBe(5)
  })

  it('heating_effect I=2, R=3, t=4 → H = 48', () => {
    const bound = bindTemplate('heating_effect', { I: 2, R: 3, t: 4 })
    expect(bound.metrics.H).toBe(48)
  })

  it('work_fs F=10, s=2, θ=0 → W = 20', () => {
    const bound = bindTemplate('work_fs', { force: 10, s: 2, angleDeg: 0 })
    expect(bound.metrics.W).toBe(20)
  })

  it('work_fs θ=90° → W = 0', () => {
    const bound = bindTemplate('work_fs', { force: 10, s: 2, angleDeg: 90 })
    expect(bound.metrics.W).toBeCloseTo(0, 8)
    const els = bound.spec.stage?.elements ?? []
    expect(els.some((el) => el.id === 'F')).toBe(true)
    expect(els.some((el) => el.id === 's')).toBe(true)
    expect(els.some((el) => el.id === 'th-arc')).toBe(true)
  })

  it('mirror_ray concave u=30, f=10 → v = 15, real inverted image', () => {
    const bound = bindTemplate('mirror_ray', { u: 30, f: 10, kind: 0 })
    expect(bound.metrics.v).toBeCloseTo(15, 5)
    expect(bound.metrics.real).toBe(true)
    expect(bound.metrics.m).toBeCloseTo(-0.5, 5)
    const els = bound.spec.stage?.elements ?? []
    expect(els.some((el) => el.id === 'mirror')).toBe(true)
    expect(els.some((el) => el.id === 'Cdot')).toBe(true)
    expect(els.some((el) => el.id === 'Fdot')).toBe(true)
    expect(els.some((el) => el.id === 'ray1-in')).toBe(true)
    expect(els.some((el) => el.id === 'object')).toBe(true)
    expect(els.some((el) => el.id === 'image')).toBe(true)
  })

  it('mirror_ray convex forms a virtual erect image', () => {
    const bound = bindTemplate('mirror_ray', { u: 20, f: 10, kind: 1 })
    expect(bound.metrics.real).toBe(false)
    expect(Number(bound.metrics.v)).toBeLessThan(0)
    expect(Number(bound.metrics.m)).toBeGreaterThan(0)
    const els = bound.spec.stage?.elements ?? []
    expect(els.some((el) => el.id === 'ray1-virt')).toBe(true)
    expect(els.some((el) => el.id === 'mirror')).toBe(true)
  })

  it('prism A=6, μ=1.5 → δ = 3', () => {
    const bound = bindTemplate('prism', { A: 6, mu: 1.5 })
    expect(bound.metrics.delta).toBe(3)
    const els = bound.spec.stage?.elements ?? []
    expect(els.filter((el) => el.id.startsWith('out-'))).toHaveLength(7)
    expect(els.some((el) => el.id === 'in')).toBe(true)
    expect(els.some((el) => el.id === 'inside')).toBe(true)
    const p1 = els.find((el) => el.id === 'p1')
    const p2 = els.find((el) => el.id === 'p2')
    expect(Number(p1?.props.cx)).not.toBe(Number(p2?.props.cx))
  })

  it('prism second-face hit stays put between μ=1.50 and 1.54', () => {
    const a = bindTemplate('prism', { A: 6, mu: 1.5 })
    const b = bindTemplate('prism', { A: 6, mu: 1.54 })
    const p2a = a.spec.stage?.elements.find((el) => el.id === 'p2')
    const p2b = b.spec.stage?.elements.find((el) => el.id === 'p2')
    expect(Number(p2a?.props.cx)).toBeCloseTo(Number(p2b?.props.cx), 5)
    expect(Number(p2a?.props.cy)).toBeCloseTo(Number(p2b?.props.cy), 5)
    expect(a.spec.stage?.elements.filter((el) => el.id.startsWith('out-'))).toHaveLength(7)
    expect(b.spec.stage?.elements.filter((el) => el.id.startsWith('out-'))).toHaveLength(7)
  })

  it('solenoid nI = turns × I and draws that many windings', () => {
    const bound = bindTemplate('solenoid', { I: 5, turns: 8 })
    expect(bound.metrics.field).toBe(40)
    expect(bound.metrics.turns).toBe(8)
    const els = bound.spec.stage?.elements ?? []
    expect(els.filter((el) => el.id.startsWith('turn-'))).toHaveLength(8)
    expect(els.some((el) => el.id === 'N')).toBe(true)
    expect(els.some((el) => el.id === 'S')).toBe(true)
  })
})

describe('phase 4 chemistry templates', () => {
  it('catalog is 233 with 49 chemistry templates', () => {
    expect(TEMPLATE_IDS).toHaveLength(233)
    expect(TEMPLATE_IDS.filter((id) => TEMPLATE_CATALOG[id].domain === 'chemistry')).toHaveLength(49)
    expect(TEMPLATE_IDS.filter((id) => TEMPLATE_CATALOG[id].classBand === '10-10')).toHaveLength(39)
  })

  it('ph_strip pH 3 is acid', () => {
    const bound = bindTemplate('ph_strip', { pH: 3 })
    expect(bound.metrics.kind).toBe('acid')
    expect(bindTemplate('ph_strip', { pH: 7 }).metrics.kind).toBe('neutral')
    expect(bindTemplate('ph_strip', { pH: 10 }).metrics.kind).toBe('base')
  })

  it('separation_mix methods 0/1/2 are settle, filter, magnet', () => {
    expect(bindTemplate('separation_mix', { method: 0 }).metrics.name).toBe('sedimentation')
    expect(bindTemplate('separation_mix', { method: 1 }).metrics.name).toBe('filtration')
    expect(bindTemplate('separation_mix', { method: 2 }).metrics.name).toBe('magnetic separation')
    const filter = bindTemplate('separation_mix', { method: 1 })
    expect(filter.spec.stage?.elements.some((el) => el.id === 'funnel')).toBe(true)
    expect(filter.spec.stage?.elements.some((el) => el.id === 'residue')).toBe(true)
  })

  it('reactivity_swap Zn vs Cu displaces; Cu vs Zn does not', () => {
    const znCu = bindTemplate('reactivity_swap', { metalA: 2, metalB: 4 })
    expect(znCu.metrics.nameA).toBe('Zn')
    expect(znCu.metrics.nameB).toBe('Cu')
    expect(znCu.metrics.willDisplace).toBe(true)
    const cuZn = bindTemplate('reactivity_swap', { metalA: 4, metalB: 2 })
    expect(cuZn.metrics.willDisplace).toBe(false)
  })

  it('state_change_curve uses melting and boiling for the phase label', () => {
    expect(bindTemplate('state_change_curve', { T: -10, melting: 0, boiling: 100 }).metrics.phase).toBe('solid')
    expect(bindTemplate('state_change_curve', { T: 25, melting: 0, boiling: 100 }).metrics.phase).toBe('liquid')
    expect(bindTemplate('state_change_curve', { T: 120, melting: 0, boiling: 100 }).metrics.phase).toBe('gas')
  })

  it('electron_shells n=2 → 8 on L, 10 total, E=−3.4 eV', () => {
    const bound = bindTemplate('electron_shells', { n: 2 })
    expect(bound.metrics.n).toBe(2)
    expect(bound.metrics.r).toBe(4)
    expect(bound.metrics.electrons).toBe(8)
    expect(bound.metrics.total).toBe(10)
    expect(bound.metrics.E).toBeCloseTo(-3.4, 2)
    const eDots = (bound.spec.stage?.elements ?? []).filter((el) => el.id.startsWith('e-'))
    expect(eDots).toHaveLength(10)
  })

  it('electron_shells n=1 → 2 electrons on K', () => {
    const bound = bindTemplate('electron_shells', { n: 1 })
    expect(bound.metrics.electrons).toBe(2)
    expect(bound.metrics.total).toBe(2)
  })

  it('angle of elevation 30° and d=20 → h = 20/√3', () => {
    const bound = bindTemplate('angle_of_elevation', { angleDeg: 30, distance: 20 })
    expect(bound.metrics.height).toBeCloseTo(20 / Math.sqrt(3), 4)
  })

  it('pythagoras 3-4-5: a² + b² = c²', () => {
    const bound = bindTemplate('pythagoras', { a: 3, b: 4 })
    expect(bound.metrics.c).toBeCloseTo(5, 4)
    expect(Number(bound.metrics.a2) + Number(bound.metrics.b2)).toBeCloseTo(Number(bound.metrics.c2), 6)
  })

  it('circle_unroll C = 2πr', () => {
    const bound = bindTemplate('circle_unroll', { r: 2 })
    expect(bound.metrics.C).toBeCloseTo(4 * Math.PI, 3)
  })

  it('parallel_transversal 70° → corresponding = alternate = 70, co-interior = 180', () => {
    const bound = bindTemplate('parallel_transversal', { angleDeg: 70 })
    expect(bound.metrics.corresponding).toBe(70)
    expect(bound.metrics.alternateInterior).toBe(70)
    expect(bound.metrics.coInterior).toBe(180)
    expect(bound.metrics.adjacent).toBe(110)
  })

  it('volume_fill cylinder V=πr²h, cone is one third', () => {
    const cyl = bindTemplate('volume_fill', { r: 2, h: 5, shape: 0 })
    const cone = bindTemplate('volume_fill', { r: 2, h: 5, shape: 1 })
    expect(cyl.metrics.volume).toBeCloseTo(Math.PI * 20, 3)
    expect(cone.metrics.volume).toBeCloseTo((Math.PI * 20) / 3, 3)
  })

  it('unit_circle 60° → cos 1/2, sin √3/2', () => {
    const bound = bindTemplate('unit_circle', { angleDeg: 60 })
    expect(bound.metrics.cos).toBeCloseTo(0.5, 5)
    expect(bound.metrics.sin).toBeCloseTo(Math.sqrt(3) / 2, 5)
  })

  it('number_line_walk 2 + 3 = 5', () => {
    const bound = bindTemplate('number_line_walk', { start: 2, delta: 3 })
    expect(bound.metrics.end).toBe(5)
  })

  it('collision_theory: higher T increases k; head-on collision is effective only if E ≥ Ea', () => {
    const low = bindTemplate('collision_theory', { temperature: 300, activationEnergy: 40 })
    const high = bindTemplate('collision_theory', { temperature: 700, activationEnergy: 40 })
    expect(Number(high.metrics.fraction)).toBeGreaterThan(Number(low.metrics.fraction))
    expect(bindTemplate('collision_theory', { temperature: 350, activationEnergy: 40 }).metrics.effective).toBe(true)
    expect(bindTemplate('collision_theory', { temperature: 250, activationEnergy: 80 }).metrics.effective).toBe(false)
  })

  it('ionic_bond has Na, Cl, 7 Cl valence electrons, and one transferring e⁻', () => {
    const bound = bindTemplate('ionic_bond', { duration: 3 })
    const ids = (bound.spec.stage?.elements ?? []).map((el) => el.id)
    expect(ids).toContain('na')
    expect(ids).toContain('cl')
    expect(ids).toContain('e')
    expect(ids.filter((id) => id.startsWith('cl-e'))).toHaveLength(7)
  })

  it('gas_piston V = T/(300 P)', () => {
    expect(bindTemplate('gas_piston', { T: 300, P: 1 }).metrics.V).toBe(1)
    expect(bindTemplate('gas_piston', { T: 300, P: 2 }).metrics.V).toBe(0.5)
    expect(bindTemplate('gas_piston', { T: 450, P: 1 }).metrics.V).toBe(1.5)
  })

  it('diffusion speed doubles when T is quadrupled', () => {
    const a = bindTemplate('diffusion', { temperature: 200 })
    const b = bindTemplate('diffusion', { temperature: 800 })
    expect(Number(b.metrics.speed) / Number(a.metrics.speed)).toBeCloseTo(2, 4)
  })
})

describe('Class 5 NCERT templates', () => {
  it('place_value_chart 1,3,5,2,0 → 13,520', () => {
    const bound = bindTemplate('place_value_chart', {
      tenThousands: 1,
      thousands: 3,
      hundreds: 5,
      tens: 2,
      ones: 0,
    })
    expect(bound.metrics.value).toBe(13520)
    expect(bound.metrics.written).toBe('13,520')
  })

  it('fraction_kit 1/2 ×2 → 2/4', () => {
    const bound = bindTemplate('fraction_kit', { numerator: 1, denominator: 2, k: 2 })
    expect(bound.metrics.equivalentNum).toBe(2)
    expect(bound.metrics.equivalentDen).toBe(4)
    expect(bound.metrics.value).toBe(0.5)
  })

  it('turns_angle 2 eighths is a right angle', () => {
    const bound = bindTemplate('turns_angle', { eighths: 2 })
    expect(bound.metrics.eighths).toBe(2)
    expect(String(bound.metrics.kind)).toMatch(/right/)
  })

  it('add_place 28 + 75 = 103 from the fuel tank example', () => {
    const bound = bindTemplate('add_place', { a: 28, b: 75, mode: 0 })
    expect(bound.metrics.result).toBe(103)
  })

  it('animal_jumps 4 and 3 meet first at 12', () => {
    const bound = bindTemplate('animal_jumps', { jumpA: 4, jumpB: 3 })
    expect(bound.metrics.lcm).toBe(12)
    expect(bound.metrics.gcd).toBe(1)
  })

  it('area_grid 6 × 4 = 24 with perimeter 20', () => {
    const bound = bindTemplate('area_grid', { length: 6, breadth: 4 })
    expect(bound.metrics.area).toBe(24)
    expect(bound.metrics.perimeter).toBe(20)
  })

  it('divide_share 35 ÷ 7 = 5 remainder 0', () => {
    const bound = bindTemplate('divide_share', { dividend: 35, divisor: 7 })
    expect(bound.metrics.quotient).toBe(5)
    expect(bound.metrics.remainder).toBe(0)
  })

  it('freshwater_share 5 ml of 200 ml is 2.5%', () => {
    const bound = bindTemplate('freshwater_share', { glassMl: 200, freshMl: 5 })
    expect(bound.metrics.percentFresh).toBeCloseTo(2.5, 5)
  })

  it('weight_scale 3 kg 500 g = 3500 g and the needle sits between 3 and 4 on a 5 kg dial', () => {
    const bound = bindTemplate('weight_scale', { kg: 3, grams: 500 })
    expect(bound.metrics.totalGrams).toBe(3500)
    expect(bound.metrics.maxKg).toBe(5)
    expect(Number(bound.metrics.needleFrac)).toBeCloseTo(3.5 / 5, 5)
    const needle = bound.spec.stage?.elements.find((el) => el.id === 'needle')
    const hub = bound.spec.stage?.elements.find((el) => el.id === 'hub')
    const x2 = Number(needle?.props.x2)
    const y2 = Number(needle?.props.y2)
    const cx = Number(hub?.props.cx)
    const cy = Number(hub?.props.cy)
    // 3.5 kg on a 5 kg top-arc: past 12 o'clock, so right of centre and above the hub.
    expect(x2).toBeGreaterThan(cx)
    expect(y2).toBeLessThan(cy)
  })

  it('weight_scale empty bag points to the left (0 kg)', () => {
    const bound = bindTemplate('weight_scale', { kg: 0, grams: 0 })
    const needle = bound.spec.stage?.elements.find((el) => el.id === 'needle')
    const hub = bound.spec.stage?.elements.find((el) => el.id === 'hub')
    expect(Number(needle?.props.x2)).toBeLessThan(Number(hub?.props.cx))
    expect(Number(needle?.props.y2)).toBeCloseTo(Number(hub?.props.cy), 5)
  })

  it('tessellate_fit: pentagons leave a gap, squares fill around a point', () => {
    const pent = bindTemplate('tessellate_fit', { sides: 5 })
    expect(pent.metrics.tessellates).toBe(false)
    expect(pent.metrics.fit).toBe(3)
    const square = bindTemplate('tessellate_fit', { sides: 4 })
    expect(square.metrics.tessellates).toBe(true)
    expect(square.metrics.fit).toBe(4)
  })

  it('india_seasons default is Vasanta (spring)', () => {
    const bound = bindTemplate('india_seasons', { look: 0, season: 0 })
    expect(bound.metrics.name).toBe('Vasanta')
    expect(bound.metrics.english).toBe('Spring')
    expect(bindTemplate('india_seasons', { look: 0, season: 5 }).metrics.fest).toMatch(/Pongal/)
  })
})

describe('Class 7 NCERT templates — book numbers', () => {
  it('lakh_crore_chart default is 1,00,000', () => {
    const bound = bindTemplate('lakh_crore_chart', { lakhs: 1 })
    expect(bound.metrics.value).toBe(100000)
    expect(bound.metrics.written).toBe('1,00,000')
  })

  it('decimal_ruler 2.7 cm screw', () => {
    const bound = bindTemplate('decimal_ruler', { cm: 2, tenths: 7 })
    expect(bound.metrics.cm).toBeCloseTo(2.7, 5)
  })

  it('intersecting_angles 120° → opposite 120, neighbour 60', () => {
    const bound = bindTemplate('intersecting_angles', { angleDeg: 120 })
    expect(bound.metrics.opposite).toBe(120)
    expect(bound.metrics.neighbour).toBe(60)
  })

  it('triangle_build equilateral 4 cm sums to 180°', () => {
    const bound = bindTemplate('triangle_build', { side: 4, angleA: 60, angleB: 60 })
    expect(bound.metrics.angleSum).toBe(180)
    expect(bound.metrics.angleC).toBe(60)
    expect(bound.metrics.side).toBe(4)
    expect(Number(bound.metrics.ab)).toBeCloseTo(4, 5)
    expect(Number(bound.metrics.bc)).toBeCloseTo(4, 5)
    expect(Number(bound.metrics.ac)).toBeCloseTo(4, 5)
  })

  it('fraction_multiply tortoise 3 × 1/4 = 3/4', () => {
    const bound = bindTemplate('fraction_multiply', { copies: 3, den: 4, story: 0 })
    expect(bound.metrics.numerator).toBe(3)
    expect(bound.metrics.denominator).toBe(4)
  })

  it('congruence_sas signboard AB=4, BC=8, 80°', () => {
    const bound = bindTemplate('congruence_sas', { ab: 4, bc: 8, angleB: 80 })
    expect(bound.metrics.ab).toBe(4)
    expect(bound.metrics.bc).toBe(8)
    expect(bound.metrics.angleB).toBe(80)
    const els = bound.spec.stage?.elements ?? []
    const A = els.find((el) => el.id === 'pa')
    const B = els.find((el) => el.id === 'pb')
    const C = els.find((el) => el.id === 'pc')
    const v1x = Number(A?.props.cx) - Number(B?.props.cx)
    const v1y = Number(A?.props.cy) - Number(B?.props.cy)
    const v2x = Number(C?.props.cx) - Number(B?.props.cx)
    const v2y = Number(C?.props.cy) - Number(B?.props.cy)
    const deg =
      (Math.acos((v1x * v2x + v1y * v2y) / (Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y))) * 180) /
      Math.PI
    expect(deg).toBeCloseTo(80, 5)
  })

  it('hcf_tiles 12 ft × 16 ft → 4 ft tile', () => {
    const bound = bindTemplate('hcf_tiles', { width: 12, length: 16, tryTile: 4 })
    expect(bound.metrics.hcf).toBe(4)
    expect(bound.metrics.fits).toBe(true)
  })

  it('integer_ops sum 25 difference 11 → 18 and 7', () => {
    const bound = bindTemplate('integer_ops', { sum: 25, diff: 11 })
    expect(bound.metrics.a).toBe(18)
    expect(bound.metrics.b).toBe(7)
  })

  it('pan_unknown 2 sacks balance 10 kg → 5 kg each', () => {
    const bound = bindTemplate('pan_unknown', { sacks: 2, known: 10 })
    expect(bound.metrics.eachSack).toBe(5)
  })

  it('decimal_ops 50 g = 0.050 kg', () => {
    const bound = bindTemplate('decimal_ops', { grams: 50, op: 0 })
    expect(bound.metrics.kg).toBeCloseTo(0.05, 5)
  })

  it('litmus_lab lemon on blue paper is acid', () => {
    const bound = bindTemplate('litmus_lab', { sample: 0, paper: 0 })
    expect(bound.metrics.kind).toBe('acid')
  })

  it('simple_circuit closed metal path glows', () => {
    expect(bindTemplate('simple_circuit', { switch: 1, gap: 0 }).metrics.glowing).toBe(true)
    expect(bindTemplate('simple_circuit', { switch: 0, gap: 0 }).metrics.glowing).toBe(false)
    expect(bindTemplate('simple_circuit', { switch: 1, gap: 1 }).metrics.glowing).toBe(false)
  })

  it('heat_three_ways default is conduction with four pins', () => {
    const bound = bindTemplate('heat_three_ways', { way: 0 })
    expect(bound.metrics.name).toBe('conduction')
    expect((bound.spec.stage?.elements ?? []).filter((el) => el.id.startsWith('pin-'))).toHaveLength(4)
  })

  it('sprint_speed 100 m in 12 s', () => {
    const bound = bindTemplate('sprint_speed', { distance: 100, timeSec: 12, pace: 0 })
    expect(bound.metrics.speed).toBeCloseTo(100 / 12, 5)
  })

  it('letter_number s = a + 3', () => {
    const bound = bindTemplate('letter_number', { a: 4, add: 3 })
    expect(bound.metrics.s).toBe(7)
  })

  it('arith_expression book compare 10+2 > 7+1', () => {
    const bound = bindTemplate('arith_expression', { op: 2, c: 10, d: 2, e: 7, f: 1 })
    expect(bound.metrics.left).toBe(12)
    expect(bound.metrics.right).toBe(8)
    expect(bound.metrics.sameValue).toBe(false)
  })

  it('parallel_transversal book 120° still has matching corners 120 and straight line 180', () => {
    const bound = bindTemplate('parallel_transversal', { angleDeg: 120 })
    expect(bound.metrics.corresponding).toBe(120)
    expect(bound.metrics.adjacent).toBe(60)
    expect(bound.metrics.coInterior).toBe(180)
  })
})

describe('Class 8 NCERT templates — book numbers', () => {
  it('locker_squares 100 lockers → 10 open (the squares)', () => {
    const bound = bindTemplate('locker_squares', { lockers: 100 })
    expect(bound.metrics.openCount).toBe(10)
    expect(bound.metrics.lastOpen).toBe(100)
  })

  it('paper_fold 10 folds of 0.001 cm is 1.024 cm', () => {
    const bound = bindTemplate('paper_fold', { folds: 10 })
    expect(bound.metrics.thicknessCm).toBeCloseTo(1.024, 5)
  })

  it('rect_diagonals two 8 cm strips make a rectangle', () => {
    const bound = bindTemplate('rect_diagonals', { d1: 8, d2: 8, tilt: 70 })
    expect(bound.metrics.equal).toBe(true)
    expect(bound.metrics.isRectangle).toBe(true)
  })

  it('distribute_grid 23 × 27, bump b by 1, grows by 23', () => {
    const bound = bindTemplate('distribute_grid', { a: 23, b: 27, bump: 1 })
    expect(bound.metrics.ab).toBe(621)
    expect(bound.metrics.product).toBe(644)
    expect(bound.metrics.extra).toBe(23)
  })

  it('similar_rect C 30×20 is the same factor as A 60×40', () => {
    const bound = bindTemplate('similar_rect', { other: 2 })
    expect(bound.metrics.similar).toBe(true)
    expect(bound.metrics.w).toBe(30)
    expect(bound.metrics.h).toBe(20)
    expect(bindTemplate('similar_rect', { other: 1 }).metrics.similar).toBe(false)
  })

  it('percent_bar 3/4 is 75%', () => {
    const bound = bindTemplate('percent_bar', { num: 3, den: 4 })
    expect(bound.metrics.percent).toBe(75)
  })

  it('baudhayana_square side 4 doubles from 16 to 32', () => {
    const bound = bindTemplate('baudhayana_square', { side: 4, look: 0 })
    expect(bound.metrics.origArea).toBe(16)
    expect(bound.metrics.newArea).toBe(32)
  })

  it('ratio_scale 2:1 matches 6:3; 1 cm on the map is 60 km', () => {
    const idli = bindTemplate('ratio_scale', { mode: 0, rice: 2, dal: 1, rice2: 6, dal2: 3 })
    expect(idli.metrics.proportional).toBe(true)
    const map = bindTemplate('ratio_scale', { mode: 1, mapCm: 1 })
    expect(map.metrics.km).toBe(60)
  })

  it('sierpinski_step 2 → 64 remaining squares and 9 holes', () => {
    const bound = bindTemplate('sierpinski_step', { step: 2 })
    expect(bound.metrics.remaining).toBe(64)
    expect(bound.metrics.holes).toBe(9)
  })

  it('mean_balance 3 and 7 → 5', () => {
    const bound = bindTemplate('mean_balance', { a: 3, b: 7, c: 0 })
    expect(bound.metrics.mean).toBe(5)
  })

  it('think_number always ends at 2', () => {
    expect(bindTemplate('think_number', { x: 5 }).metrics.result).toBe(2)
    expect(bindTemplate('think_number', { x: 12 }).metrics.result).toBe(2)
  })

  it('electromagnet_nail holds clips only when the switch is closed', () => {
    expect(bindTemplate('electromagnet_nail', { look: 0, switch: 1, clips: 5 }).metrics.holding).toBe(5)
    expect(bindTemplate('electromagnet_nail', { look: 0, switch: 0, clips: 5 }).metrics.holding).toBe(0)
  })

  it('bag_straps narrower strap means higher pressure', () => {
    const narrow = bindTemplate('bag_straps', { weight: 40, width: 2 })
    const broad = bindTemplate('bag_straps', { weight: 40, width: 8 })
    expect(narrow.metrics.pressure).toBeGreaterThan(Number(broad.metrics.pressure))
    expect(narrow.metrics.hurt).toBe(true)
    expect(broad.metrics.hurt).toBe(false)
  })

  it('dissolve_ors salt dissolves; chalk does not', () => {
    expect(bindTemplate('dissolve_ors', { stuff: 0, amount: 3 }).metrics.dissolves).toBe(true)
    expect(bindTemplate('dissolve_ors', { stuff: 2, amount: 4 }).metrics.dissolves).toBe(false)
  })

  it('spoon_mirror inner close is inverted; outer is erect and smaller', () => {
    const inner = bindTemplate('spoon_mirror', { side: 0, distance: 8 })
    expect(inner.metrics.inverted).toBe(true)
    expect(inner.metrics.kind).toBe('concave')
    const outer = bindTemplate('spoon_mirror', { side: 1, distance: 8 })
    expect(outer.metrics.erect).toBe(true)
    expect(outer.metrics.small).toBe(true)
    expect(outer.metrics.kind).toBe('convex')
  })

  it('moon_month day 1 after full Moon is waning', () => {
    const bound = bindTemplate('moon_month', { day: 1 })
    expect(bound.metrics.waning).toBe(true)
    expect(bound.metrics.day).toBe(1)
  })

  it('two_lenses convex close is erect and enlarged; concave is always small', () => {
    const close = bindTemplate('two_lenses', { kind: 0, distance: 8 })
    expect(close.metrics.kind).toBe('convex')
    expect(close.metrics.enlarged).toBe(true)
    expect(close.metrics.inverted).toBe(false)
    expect(close.metrics.converges).toBe(true)
    const far = bindTemplate('two_lenses', { kind: 0, distance: 22 })
    expect(far.metrics.inverted).toBe(true)
    const cave = bindTemplate('two_lenses', { kind: 1, distance: 8 })
    expect(cave.metrics.kind).toBe('concave')
    expect(cave.metrics.small).toBe(true)
    expect(cave.metrics.erect).toBe(true)
  })

  it('wind_spin day is sea breeze; cyclone spins over warm ocean', () => {
    const sea = bindTemplate('wind_spin', { look: 0 })
    expect(sea.metrics.name).toBe('sea breeze')
    expect(sea.metrics.fromSea).toBe(true)
    const storm = bindTemplate('wind_spin', { look: 2 })
    expect(storm.metrics.name).toBe('cyclone')
    expect(storm.metrics.spinning).toBe(true)
  })
})

describe('Class 6 NCERT templates — book numbers', () => {
  it('seq_pictures five squares end at 25', () => {
    const bound = bindTemplate('seq_pictures', { kind: 0, n: 5 })
    expect(bound.metrics.last).toBe(25)
    expect(bound.metrics.values).toBe('1,4,9,16,25')
  })

  it('idli_vada 3 and 5 → first both is 15', () => {
    const bound = bindTemplate('idli_vada', { a: 3, b: 5, upto: 30 })
    expect(bound.metrics.first).toBe(15)
  })

  it('peri_rect 12 cm × 8 cm is 40 cm around', () => {
    const bound = bindTemplate('peri_rect', { shape: 0, length: 12, breadth: 8 })
    expect(bound.metrics.perimeter).toBe(40)
  })

  it('roti_share two children → 1/2', () => {
    const bound = bindTemplate('roti_share', { children: 2 })
    expect(bound.metrics.shareDen).toBe(2)
    expect(bindTemplate('roti_share', { children: 4 }).metrics.shareDen).toBe(4)
  })

  it('tally_bars jalebi 6 gulab 9', () => {
    const bound = bindTemplate('tally_bars', { jalebi: 6, gulab: 9 })
    expect(bound.metrics.jalebi).toBe(6)
    expect(bound.metrics.gulab).toBe(9)
  })

  it('fun_lift from 0 press +2 lands on +2', () => {
    const bound = bindTemplate('fun_lift', { start: 0, move: 2 })
    expect(bound.metrics.dest).toBe(2)
    expect(bindTemplate('fun_lift', { start: 0, move: -2 }).metrics.dest).toBe(-2)
  })

  it('compass_circle default radius is 4 cm', () => {
    expect(bindTemplate('compass_circle', { radius: 4, look: 0 }).metrics.radius).toBe(4)
  })

  it('stick_magnet iron sticks; wood does not', () => {
    expect(bindTemplate('stick_magnet', { look: 0, object: 0 }).metrics.sticks).toBe(true)
    expect(bindTemplate('stick_magnet', { look: 0, object: 1 }).metrics.sticks).toBe(false)
  })

  it('handspan_metre Padma counts 13', () => {
    const bound = bindTemplate('handspan_metre', { who: 1 })
    expect(bound.metrics.name).toBe('Padma')
    expect(bound.metrics.spans).toBe(13)
  })

  it('three_bowls both hands in B — touch lies', () => {
    expect(bindTemplate('three_bowls', { step: 1 }).metrics.touchLies).toBe(true)
  })

  it('water_three ice is still water as a substance', () => {
    expect(bindTemplate('water_three', { state: 0 }).metrics.name).toBe('ice')
  })

  it('living_or_not pigeon lives; car does not', () => {
    expect(bindTemplate('living_or_not', { thing: 0 }).metrics.living).toBe(true)
    expect(bindTemplate('living_or_not', { thing: 2 }).metrics.living).toBe(false)
  })

  it('everyday_separate default is sedimentation', () => {
    expect(bindTemplate('everyday_separate', { method: 0 }).metrics.name).toBe('sedimentation')
  })

  it('rotate_arms 90° is a right angle at vertex O', () => {
    const bound = bindTemplate('rotate_arms', { angleDeg: 90 })
    expect(bound.metrics.kind).toBe('right')
    expect(bound.metrics.angleDeg).toBe(90)
    expect(bindTemplate('rotate_arms', { angleDeg: 180 }).metrics.kind).toBe('straight')
  })

  it('flower_beds 12 m × 10 m land is 120; four 4 m beds leave 56', () => {
    const land = bindTemplate('flower_beds', { look: 0, length: 12, width: 10, side: 4 })
    expect(land.metrics.land).toBe(120)
    expect(land.metrics.one).toBe(16)
    expect(land.metrics.four).toBe(64)
    expect(land.metrics.grass).toBe(56)
  })

  it('kind_of_move orange drop is linear; swing is oscillatory and periodic', () => {
    expect(bindTemplate('kind_of_move', { look: 1 }).metrics.name).toBe('linear')
    const swing = bindTemplate('kind_of_move', { look: 3 })
    expect(swing.metrics.name).toBe('oscillatory')
    expect(swing.metrics.periodic).toBe(true)
    expect(bindTemplate('kind_of_move', { look: 0 }).metrics.name).toBe('rest')
  })
})

describe('Class 9 NCERT templates — book numbers', () => {
  it('four_quadrant (3,4) is quadrant I; (0,−4.5) is the negative y-axis', () => {
    expect(bindTemplate('four_quadrant', { x: 3, y: 4 }).metrics.quadrant).toBe('quadrant I')
    expect(bindTemplate('four_quadrant', { x: 0, y: -4.5 }).metrics.quadrant).toBe('the negative y-axis')
  })

  it('coord_distance (1,2) to (4,6) is 5', () => {
    expect(bindTemplate('coord_distance', { x1: 1, y1: 2, x2: 4, y2: 6 }).metrics.d).toBe(5)
  })

  it('linear_poly y=2x+3 at x=0,1,4', () => {
    const bound = bindTemplate('linear_poly', { a: 2, b: 3 })
    expect(bound.metrics.y0).toBe(3)
    expect(bound.metrics.y1).toBe(5)
    expect(bound.metrics.y4).toBe(11)
  })

  it('wire_area 7 cm × 3 cm is 21', () => {
    const bound = bindTemplate('wire_area', { x: 7 })
    expect(bound.metrics.width).toBe(3)
    expect(bound.metrics.area).toBe(21)
    expect(bound.metrics.degree).toBe(2)
  })

  it('sqrt2_line unit square diagonal is √2', () => {
    const bound = bindTemplate('sqrt2_line', { side: 1 })
    expect(Number(bound.metrics.diagonal)).toBeCloseTo(Math.SQRT2, 5)
  })

  it('ab_square a=10 b=2 → 144', () => {
    const bound = bindTemplate('ab_square', { a: 10, b: 2, look: 0 })
    expect(bound.metrics.expanded).toBe(144)
    expect(bound.metrics.a2).toBe(100)
  })

  it('heron_area 13,14,15 → 84', () => {
    const bound = bindTemplate('heron_area', { a: 13, b: 14, c: 15 })
    expect(bound.metrics.s).toBe(21)
    expect(Number(bound.metrics.area)).toBeCloseTo(84, 5)
  })

  it('track_stagger 1.22 m lane on 400 m', () => {
    const bound = bindTemplate('track_stagger', { laneWidth: 1.22, track: 400 })
    expect(Number(bound.metrics.stagger)).toBeCloseTo(2 * Math.PI * 1.22, 5)
  })

  it('maybe_chance coin theoretical 1/2', () => {
    const bound = bindTemplate('maybe_chance', { kind: 0, trials: 50, seen: 26 })
    expect(bound.metrics.theoretical).toBe(0.5)
    expect(bound.metrics.experimental).toBe(0.52)
  })

  it('dot_sequence five triangular numbers end at 15', () => {
    const bound = bindTemplate('dot_sequence', { kind: 0, n: 5 })
    expect(bound.metrics.last).toBe(15)
    expect(bound.metrics.values).toBe('1,3,6,10,15')
  })

  it('ap_gp_steps AP 1,4,7… sixth term 16; GP starts at 18', () => {
    expect(bindTemplate('ap_gp_steps', { look: 0, n: 6 }).metrics.last).toBe(16)
    expect(bindTemplate('ap_gp_steps', { look: 1, n: 6 }).metrics.terms.toString().startsWith('18')).toBe(true)
  })

  it('dist_displace out 100 back 40', () => {
    const bound = bindTemplate('dist_displace', { out: 100, back: 40 })
    expect(bound.metrics.distance).toBe(140)
    expect(bound.metrics.displacement).toBe(60)
  })

  it('motion_graphs u=0 a=9.8 t=3', () => {
    const bound = bindTemplate('motion_graphs', { u: 0, a: 9.8, t: 3, look: 0 })
    expect(Number(bound.metrics.v)).toBeCloseTo(29.4, 5)
    expect(Number(bound.metrics.s)).toBeCloseTo(0.5 * 9.8 * 9, 5)
  })

  it('mix_three salt has no Tyndall; chalk does', () => {
    expect(bindTemplate('mix_three', { look: 0, laser: 1 }).metrics.tyndall).toBe(false)
    expect(bindTemplate('mix_three', { look: 1, laser: 1 }).metrics.tyndall).toBe(true)
    expect(bindTemplate('mix_three', { look: 1, laser: 1 }).metrics.residue).toBe(true)
  })

  it('box_newton 10 N vs 10 N is balanced', () => {
    const bound = bindTemplate('box_newton', { look: 0, mass: 2, force: 10, friction: 10 })
    expect(bound.metrics.balanced).toBe(true)
    expect(bound.metrics.net).toBe(0)
  })

  it('lift_work 5 kg 1 m is 49 J', () => {
    const bound = bindTemplate('lift_work', { mass: 5, h: 1, bags: 1, look: 0 })
    expect(Number(bound.metrics.W)).toBeCloseTo(49, 5)
  })

  it('sound_echo 340 m/s 0.5 s is 85 m', () => {
    const bound = bindTemplate('sound_echo', { look: 0, v: 340, t: 0.5, f: 2 })
    expect(bound.metrics.d).toBe(85)
  })

  it('keep_mass is conserved; bond_kind H2 is covalent', () => {
    expect(bindTemplate('keep_mass', { look: 0 }).metrics.conserved).toBe(true)
    expect(bindTemplate('bond_kind', { look: 0 }).metrics.kind).toBe('covalent')
    expect(bindTemplate('bond_kind', { look: 1 }).metrics.kind).toBe('ionic')
  })

  it('five_kingdoms bacterium is Monera; one_parent has one parent', () => {
    expect(bindTemplate('five_kingdoms', { org: 0 }).metrics.kingdom).toBe('Monera')
    expect(bindTemplate('one_parent', { look: 0 }).metrics.parents).toBe(1)
  })
})

describe('Class 10 NCERT templates — book numbers', () => {
  it('prime_share 6 and 20 is HCF 2 LCM 60', () => {
    const bound = bindTemplate('prime_share', { a: 6, b: 20 })
    expect(bound.metrics.hcf).toBe(2)
    expect(bound.metrics.lcm).toBe(60)
    expect(bound.metrics.check).toBe(120)
  })

  it('poly_zeroes x²−3x−4 has sum 3 and product −4', () => {
    const bound = bindTemplate('poly_zeroes', { look: 0, a: 1, b: -3, c: -4 })
    expect(bound.metrics.sum).toBe(3)
    expect(bound.metrics.product).toBe(-4)
    expect(bound.metrics.z0).toBe(-1)
    expect(bound.metrics.z1).toBe(4)
  })

  it('pair_lines unique meet at (2, 3)', () => {
    const bound = bindTemplate('pair_lines', { look: 0 })
    expect(bound.metrics.kind).toBe('unique')
    expect(bound.metrics.x).toBe(2)
    expect(bound.metrics.y).toBe(3)
  })

  it('root_nature 2x²−4x+3 has D = −8', () => {
    const bound = bindTemplate('root_nature', { a: 2, b: -4, c: 3 })
    expect(bound.metrics.D).toBe(-8)
    expect(bound.metrics.nature).toBe('no real')
  })

  it('ap_rungs a=45 d=−2 n=10 last is 27', () => {
    const bound = bindTemplate('ap_rungs', { look: 0, a: 45, d: -2, n: 10 })
    expect(bound.metrics.last).toBe(27)
  })

  it('coord_gap P(4,6) Q(6,8) is 2√2', () => {
    const bound = bindTemplate('coord_gap', { x1: 4, y1: 6, x2: 6, y2: 8 })
    expect(Number(bound.metrics.d)).toBeCloseTo(Math.sqrt(8), 5)
  })

  it('right_trig 24 and 7 has hyp 25', () => {
    const bound = bindTemplate('right_trig', { adj: 24, opp: 7 })
    expect(Number(bound.metrics.hyp)).toBeCloseTo(25, 5)
  })

  it('slice_area r=4 θ=30 sector is 4π/3', () => {
    const bound = bindTemplate('slice_area', { r: 4, thetaDeg: 30 })
    expect(Number(bound.metrics.sector)).toBeCloseTo((30 / 360) * Math.PI * 16, 5)
  })

  it('fair_chance two dice sum 8 is 5/36', () => {
    const bound = bindTemplate('fair_chance', { look: 2 })
    expect(bound.metrics.fav).toBe(5)
    expect(bound.metrics.total).toBe(36)
  })

  it('metal_swap Zn vs Cu displaces', () => {
    const bound = bindTemplate('metal_swap', { metalA: 5, metalB: 9 })
    expect(bound.metrics.nameA).toBe('Zn')
    expect(bound.metrics.nameB).toBe('Cu')
    expect(bound.metrics.willDisplace).toBe(true)
  })

  it('ohm_line four 1.5 V cells on 6 Ω', () => {
    const bound = bindTemplate('ohm_line', { cells: 4, R: 6 })
    expect(bound.metrics.V).toBe(6)
    expect(bound.metrics.I).toBe(1)
  })

  it('heat_wire 220 V 1200 Ω', () => {
    const bound = bindTemplate('heat_wire', { V: 220, R: 1200, t: 10 })
    expect(Number(bound.metrics.I)).toBeCloseTo(220 / 1200, 5)
  })

  it('eye_see myopia; prism A=60', () => {
    expect(bindTemplate('eye_see', { look: 1 }).metrics.kind).toBe('myopia')
    expect(bindTemplate('prism_split', { A: 60, mu: 1.5 }).metrics.A).toBe(60)
  })

  it('pea_cross F2 is 3:1; food_rung 10%', () => {
    expect(bindTemplate('pea_cross', { look: 0 }).metrics.f2tall).toBe(3)
    expect(bindTemplate('food_rung', { look: 0, energy: 1000 }).metrics.e1).toBe(100)
  })

  it('Class 10 curator catalog is only 10-10', () => {
    const prompt = allowedTemplatePrompt(10)
    expect(prompt).toMatch(/`prime_share`/)
    expect(prompt).toMatch(/`ohm_line`/)
    expect(prompt).toMatch(/`eye_see`/)
    expect(prompt).not.toMatch(/`ohm_circuit`/)
    expect(prompt).not.toMatch(/`convex_lens`/)
    expect(prompt).not.toMatch(/`four_quadrant`/)
    expect(prompt).not.toMatch(/`place_value_chart`/)
    const nine = allowedTemplatePrompt(9)
    expect(nine).toMatch(/`four_quadrant`/)
    expect(nine).not.toMatch(/`prime_share`/)
  })
})

