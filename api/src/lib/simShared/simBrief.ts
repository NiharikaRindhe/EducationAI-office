// shared/simBrief.ts
// Student brief stored on SimSpec at ingest and reused at read — no live LLM.

import type { SimSpec } from './simSpec.js'

export interface SimBrief {
  about: string
  howItWorks: string
}

export function hasSimBrief(spec: SimSpec): spec is SimSpec & { about: string; howItWorks: string } {
  return Boolean(spec.about?.trim() && spec.howItWorks?.trim())
}

export function storedSimBrief(spec: SimSpec): SimBrief | null {
  if (!hasSimBrief(spec)) return null
  return { about: spec.about.trim(), howItWorks: spec.howItWorks.trim() }
}

function formatBookNumbers(spec: SimSpec): string {
  const params = spec.params || {}
  const meta = spec.paramMeta || {}
  const paramBits = Object.entries(params).map(([k, v]) => {
    const src = meta[k]?.source === 'extracted' ? 'from the textbook' : 'catalog default'
    return `${k} = ${v} (${src})`
  })
  return paramBits.length ? `Textbook / slider params: ${paramBits.join(', ')}` : ''
}

/** Offline fallback when a spec was mapped before briefs were stored. */
export function proceduralSimBrief(spec: SimSpec, quote?: string): SimBrief {
  const title = spec.title || 'this concept'
  const excerpt = (quote || spec.quote || '').trim()
  const aboutBits = [
    `This simulation is about **${title}**${spec.subtitle ? `: ${spec.subtitle}` : '.'}`,
    spec.caption || spec.topicExplanation || 'Watch the moving parts to see how the idea plays out over time.',
  ]
  const howBits = [
    spec.topicExplanation
      ? spec.topicExplanation
      : `In this animation, the on-screen motion follows the same rules as ${title} in the textbook.`,
    spec.equations && spec.equations.length > 0
      ? `The key relationship is $${spec.equations[0]}$. When a value in that formula changes, the animation path changes with it.`
      : 'Each moving piece stands for a real quantity (position, speed, or force). As time ticks, those quantities update together.',
    excerpt ? `The textbook says: "${excerpt}"` : '',
    formatBookNumbers(spec) || '',
    'Try changing a slider if you have one: that is the same as changing a number in the formula and watching what nature would do.',
  ]

  return {
    about: aboutBits.filter(Boolean).join('\n\n'),
    howItWorks: howBits.filter(Boolean).join('\n\n'),
  }
}

export function resolveSimBrief(spec: SimSpec, quote?: string): SimBrief {
  return storedSimBrief(spec) ?? proceduralSimBrief(spec, quote)
}

export function mergeSimBrief(spec: SimSpec, brief: SimBrief): SimSpec {
  return { ...spec, about: brief.about, howItWorks: brief.howItWorks }
}
