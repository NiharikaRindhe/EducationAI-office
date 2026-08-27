import { z } from 'zod'
import { mirrorImage } from '../physics.js'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, arrow, circle, label, line, n, pathEl, tLoop } from '../stage.js'
import type { SimElement } from '../../simSpec.js'

type Pt = { x: number; y: number }

function fmt(x: number, d = 1): string {
  const r = Math.round(x * 10 ** d) / 10 ** d
  return Number.isInteger(r) ? String(r) : r.toFixed(d)
}

function arcD(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const x1 = cx + r * Math.cos(rad(startDeg))
  const y1 = cy + r * Math.sin(rad(startDeg))
  const x2 = cx + r * Math.cos(rad(endDeg))
  const y2 = cy + r * Math.sin(rad(endDeg))
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
  const sweep = endDeg > startDeg ? 1 : 0
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 ${large} ${sweep} ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

function hitAtHeight(c: Pt, r: number, y: number, concave: boolean): Pt | null {
  const dy = y - c.y
  const inner = r * r - dy * dy
  if (inner <= 4) return null
  const dx = Math.sqrt(inner)
  return { x: concave ? c.x + dx : c.x - dx, y }
}

function lerp(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

function extend(from: Pt, through: Pt, extra: number): Pt {
  const dx = through.x - from.x
  const dy = through.y - from.y
  const L = Math.hypot(dx, dy) || 1
  return { x: through.x + (dx / L) * extra, y: through.y + (dy / L) * extra }
}

function nature(real: boolean, m: number): string {
  const size =
    Math.abs(m) > 1.08 ? 'magnified' : Math.abs(m) < 0.92 ? 'diminished' : 'same size'
  return `${real ? 'Real' : 'Virtual'}, ${m < 0 ? 'inverted' : 'erect'}, ${size}`
}

const schema = z.object({
  u: num(1, 200, 30),
  f: num(1, 80, 10),
  kind: num(0, 1, 0),
})

export const mirror_ray: SimFile = {
  id: 'mirror_ray',
  domain: 'physics',
  classBand: '9-10',
  ncertClass: 10,
  label: 'Spherical mirror',
  description:
    'Ray diagram for a concave (kind 0, converging) or convex (kind 1, diverging) spherical mirror. School-book distances: u > 0, |f| > 0.',
  equations: ['\\frac{1}{v} + \\frac{1}{u} = \\frac{1}{f}', 'm = -v/u'],
  keywords: [
    'concave mirror',
    'convex mirror',
    'mirror formula',
    'focal length mirror',
    'spherical mirror',
    'ray diagram mirror',
  ],
  params: [
    param('u', 'Object distance u', 'cm', 6, 80, 1, 30),
    param('f', '|f|', 'cm', 6, 36, 1, 10),
    choice(
      'kind',
      'Mirror',
      [
        { value: 0, label: 'Concave' },
        { value: 1, label: 'Convex' },
      ],
      0
    ),
  ],
  schema,
  run(rawParams: Record<string, number>) {
    const params = schema.parse(rawParams)
    const { u, f } = params
    const concave = params.kind < 0.5
    const { v, m, real } = mirrorImage(u, f, concave ? 0 : 1)
    const atInfinity = !Number.isFinite(v) || Math.abs(v) > 120
    const Rcm = 2 * Math.abs(f)
    const vShow = atInfinity ? (concave ? 90 : -20) : v
    const rel = [
      -u,
      concave ? -Math.abs(f) : Math.abs(f),
      concave ? -Rcm : Rcm,
      atInfinity ? 0 : -v,
      0,
    ]
    const minRel = Math.min(...rel) - 8
    const maxRel = Math.max(...rel) + 10
    const scale = Math.min(5.4, 420 / Math.max(maxRel - minRel, 24))
    const pxP = 36 + (0 - minRel) * scale
    const axisY = 168
    const c: Pt = {
      x: pxP + (concave ? -Rcm : Rcm) * scale,
      y: axisY,
    }
    const rPx = Rcm * scale
    const fPt: Pt = {
      x: pxP + (concave ? -Math.abs(f) : Math.abs(f)) * scale,
      y: axisY,
    }
    const pPt: Pt = { x: pxP, y: axisY }
    const objX = pxP - u * scale
    const objH = Math.min(40, rPx * 0.42)
    const objTip: Pt = { x: objX, y: axisY - objH }
    const objBase: Pt = { x: objX, y: axisY }
    const imgH = Math.max(8, Math.min(64, Math.abs(m) * objH))
    const imgX = pxP - vShow * scale
    const imgTip: Pt = {
      x: imgX,
      y: m < 0 ? axisY + imgH : axisY - imgH,
    }
    const ink = '#334155'
    const mirrorColor = concave ? '#0284c7' : '#7c3aed'
    const aperture = 46
    const mirrorD = concave
      ? arcD(c.x, c.y, rPx, -aperture, aperture)
      : arcD(c.x, c.y, rPx, 180 - aperture, 180 + aperture)
    const silverR = concave ? rPx + 5 : Math.max(12, rPx - 5)
    const silverD = concave
      ? arcD(c.x, c.y, silverR, -aperture, aperture)
      : arcD(c.x, c.y, silverR, 180 - aperture, 180 + aperture)

    const hit1 = hitAtHeight(c, rPx, objTip.y, concave) ?? {
      x: pxP - (concave ? 6 : -6),
      y: objTip.y,
    }

    const far = 90
    const parRefEnd = real
      ? extend(hit1, imgTip, 28)
      : extend(fPt, hit1, far)
    const poleRefEnd = real
      ? extend(pPt, imgTip, 28)
      : extend(imgTip, pPt, far)

    const tt = tLoop(2.6, 2.2)
    const elements: SimElement[] = [
      line('axis', {
        x1: 16,
        y1: axisY,
        x2: 484,
        y2: axisY,
        stroke: '#94a3b8',
        strokeWidth: 1.2,
      }),
      pathEl('silver', { d: silverD, fill: 'none', stroke: '#94a3b8', strokeWidth: 7 }),
      pathEl('mirror', { d: mirrorD, fill: 'none', stroke: mirrorColor, strokeWidth: 3.2 }),
      circle('Cdot', { cx: c.x, cy: axisY, r: 3.5, fill: '#0f172a' }),
      circle('Fdot', { cx: fPt.x, cy: axisY, r: 3.5, fill: '#d97706' }),
      circle('Pdot', { cx: pxP, cy: axisY, r: 3.5, fill: mirrorColor }),
      label('Clab', c.x - 6, axisY + 18, 'C', '#0f172a'),
      label('Flab', fPt.x - 5, axisY + 18, 'F', '#d97706'),
      label('Plab', pxP - 5, axisY + 18, 'P', mirrorColor),
      arrow('object', {
        x1: objBase.x,
        y1: objBase.y,
        x2: objTip.x,
        y2: objTip.y,
        stroke: '#15803d',
        strokeWidth: 3,
        label: 'O',
      }),
      line('ray1-in', {
        x1: objTip.x,
        y1: objTip.y,
        x2: hit1.x,
        y2: hit1.y,
        stroke: '#ea580c',
        strokeWidth: 2,
      }),
      line('ray1-out', {
        x1: hit1.x,
        y1: hit1.y,
        x2: parRefEnd.x,
        y2: parRefEnd.y,
        stroke: '#ea580c',
        strokeWidth: 2,
      }),
      line('ray2-in', {
        x1: objTip.x,
        y1: objTip.y,
        x2: pPt.x,
        y2: pPt.y,
        stroke: '#2563eb',
        strokeWidth: 2,
      }),
      line('ray2-out', {
        x1: pPt.x,
        y1: pPt.y,
        x2: poleRefEnd.x,
        y2: poleRefEnd.y,
        stroke: '#2563eb',
        strokeWidth: 2,
      }),
    ]

    if (!real) {
      elements.push(
        line('ray1-virt', {
          x1: hit1.x,
          y1: hit1.y,
          x2: imgTip.x,
          y2: imgTip.y,
          stroke: '#ea580c',
          strokeWidth: 1.5,
          strokeDasharray: '6 4',
        }),
        line('ray2-virt', {
          x1: pPt.x,
          y1: pPt.y,
          x2: imgTip.x,
          y2: imgTip.y,
          stroke: '#2563eb',
          strokeWidth: 1.5,
          strokeDasharray: '6 4',
        })
      )
    }

    if (!atInfinity) {
      elements.push(
        arrow('image', {
          x1: imgX,
          y1: axisY,
          x2: imgTip.x,
          y2: imgTip.y,
          stroke: real ? '#be185d' : '#7c3aed',
          strokeWidth: 3,
          label: "I",
        })
      )
    }

    const photonEnd = real ? lerp(hit1, imgTip, 0.92) : parRefEnd
    elements.push(
      circle(
        'photon',
        {
          cx: {
            $expr: `${n(objTip.x)} + min(${tt},1)*${n(hit1.x - objTip.x)} + max(${tt}-1,0)*${n(photonEnd.x - hit1.x)}`,
          },
          cy: {
            $expr: `${n(objTip.y)} + min(${tt},1)*${n(hit1.y - objTip.y)} + max(${tt}-1,0)*${n(photonEnd.y - hit1.y)}`,
          },
          r: 5,
          fill: '#f97316',
          stroke: '#fff',
          strokeWidth: 1,
        },
        'projectile'
      ),
      label('kind', 20, 24, concave ? 'Concave mirror' : 'Convex mirror', ink),
      label(
        'vm',
        20,
        42,
        atInfinity
          ? `u = ${fmt(u)} cm   |f| = ${fmt(f)} cm   image at infinity`
          : `u = ${fmt(u)} cm   v = ${fmt(v)} cm   m = ${fmt(m, 2)}`,
        ink
      ),
      label('nat', 20, 58, atInfinity ? 'Rays emerge parallel after reflection' : nature(real, m), '#475569')
    )

    const warnings: string[] = []
    if (atInfinity) warnings.push('Object is at the focus — the image is at infinity.')
    if (concave && u < f && !atInfinity) warnings.push('Object inside F: the image is virtual, erect and magnified.')

    return {
      stage: { viewBox: VIEW, elements },
      metrics: {
        u,
        f,
        kind: concave ? 0 : 1,
        v: Number(v.toFixed(4)),
        m: Number(m.toFixed(4)),
        real,
      },
      warnings,
    }
  },
}
