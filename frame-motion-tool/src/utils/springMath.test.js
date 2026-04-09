import { describe, it, expect } from 'vitest'
import { computeSpringCurve } from './springMath'

describe('computeSpringCurve', () => {
  it('returns 200 [t, position] tuples by default', () => {
    const result = computeSpringCurve({ stiffness: 100, damping: 10, mass: 1 })
    expect(result).toHaveLength(200)
    expect(result[0]).toHaveLength(2)
  })

  it('starts near 0 and ends near 1 for a typical underdamped spring', () => {
    const result = computeSpringCurve({ stiffness: 100, damping: 10, mass: 1 })
    expect(result[0][1]).toBeCloseTo(0, 2)
    expect(result[199][1]).toBeCloseTo(1, 1)
  })

  it('t values range from 0 to 2', () => {
    const result = computeSpringCurve({ stiffness: 100, damping: 10, mass: 1 })
    expect(result[0][0]).toBe(0)
    expect(result[199][0]).toBeCloseTo(2, 5)
  })

  it('overdamped spring ends near 1 without oscillating past 1', () => {
    const result = computeSpringCurve({ stiffness: 10, damping: 100, mass: 1 })
    const positions = result.map(([, p]) => p)
    expect(Math.max(...positions)).toBeLessThanOrEqual(1.001)
    expect(result[199][1]).toBeCloseTo(1, 1)
  })

  it('underdamped spring overshoots 1 before settling', () => {
    const result = computeSpringCurve({ stiffness: 200, damping: 5, mass: 1 })
    const positions = result.map(([, p]) => p)
    expect(Math.max(...positions)).toBeGreaterThan(1)
  })

  it('respects custom steps count', () => {
    const result = computeSpringCurve({ stiffness: 100, damping: 10, mass: 1 }, 50)
    expect(result).toHaveLength(50)
  })
})
