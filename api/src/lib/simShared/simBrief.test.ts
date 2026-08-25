import { describe, it, expect } from 'vitest'
import { physicsFixture } from './simSpec.fixtures.js'
import {
  hasSimBrief,
  storedSimBrief,
  proceduralSimBrief,
  resolveSimBrief,
  mergeSimBrief,
} from './simBrief.js'

describe('sim brief storage', () => {
  it('treats empty about/howItWorks as missing', () => {
    expect(hasSimBrief(physicsFixture)).toBe(false)
    expect(storedSimBrief(physicsFixture)).toBeNull()
  })

  it('returns stored copy when both fields are present', () => {
    const spec = mergeSimBrief(physicsFixture, {
      about: 'You are watching a projectile.',
      howItWorks: '- Horizontal speed stays constant.',
    })
    expect(hasSimBrief(spec)).toBe(true)
    expect(storedSimBrief(spec)).toEqual({
      about: 'You are watching a projectile.',
      howItWorks: '- Horizontal speed stays constant.',
    })
    expect(resolveSimBrief(spec).about).toBe('You are watching a projectile.')
  })

  it('falls back to a procedural brief without stored copy', () => {
    const brief = proceduralSimBrief(physicsFixture, physicsFixture.quote)
    expect(brief.about).toContain('Projectile Motion')
    expect(brief.howItWorks.length).toBeGreaterThan(40)
    expect(resolveSimBrief(physicsFixture).about).toContain('Projectile Motion')
  })
})
