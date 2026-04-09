/**
 * Computes a damped harmonic oscillator (spring) curve.
 *
 * Returns an array of [t, position] tuples where:
 *   - t is a normalized progress value ranging from 0 to 2
 *   - position ranges from 0 (start) to 1 (equilibrium target)
 *
 * Internally the physics runs over the natural settling time of the spring
 * (at least 5 time constants of the slowest mode), ensuring the curve always
 * reaches near-equilibrium regardless of damping regime. The t axis is then
 * normalized to [0, 2] so callers get a consistent domain.
 *
 * Handles all three spring regimes via closed-form math:
 *   - Underdamped  (discriminant < 0): oscillates past target
 *   - Critically damped (discriminant = 0): fastest non-oscillating approach
 *   - Overdamped   (discriminant > 0): slow approach, no overshoot
 */
export function computeSpringCurve({ stiffness, damping, mass }, steps = 200) {
  const tPhysMax = settlingTime(stiffness, damping, mass)
  const tNormMax = 2
  const points = []

  for (let i = 0; i < steps; i++) {
    const tNorm = (i / (steps - 1)) * tNormMax
    const tPhys = (i / (steps - 1)) * tPhysMax
    points.push([tNorm, springPosition(stiffness, damping, mass, tPhys)])
  }

  return points
}

/**
 * Returns the physical settling time: 5 time constants of the slowest mode.
 * Guarantees the spring reaches > 99% of equilibrium by t = tMax.
 * Always returns at least 2 (seconds) so lightly-damped springs still have
 * enough time for visible oscillation in the curve.
 */
function settlingTime(stiffness, damping, mass) {
  const wn = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))
  const discriminant = damping * damping - 4 * stiffness * mass

  if (discriminant <= 0) {
    // Underdamped / critically damped: envelope decays as exp(-zeta*wn*t)
    return Math.max(2, 5 / (zeta * wn))
  }

  // Overdamped: slowest mode is r1 = wn*(zeta - sqrt(zeta²-1))
  const sqrtTerm = Math.sqrt(zeta * zeta - 1)
  const r1 = wn * (zeta - sqrtTerm) // positive — the smaller decay rate
  return Math.max(2, 5 / r1)
}

function springPosition(stiffness, damping, mass, t) {
  const discriminant = damping * damping - 4 * stiffness * mass

  if (discriminant < 0) {
    // Underdamped: oscillates around equilibrium
    const wn = Math.sqrt(stiffness / mass)
    const zeta = damping / (2 * Math.sqrt(stiffness * mass))
    const wd = wn * Math.sqrt(1 - zeta * zeta)
    return 1 - Math.exp(-zeta * wn * t) * (
      Math.cos(wd * t) + (zeta * wn / wd) * Math.sin(wd * t)
    )
  }

  if (discriminant === 0) {
    // Critically damped: fastest non-oscillating convergence
    const wn = Math.sqrt(stiffness / mass)
    return 1 - Math.exp(-wn * t) * (1 + wn * t)
  }

  // Overdamped: two real exponential modes, no oscillation
  const wn = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))
  const sqrtTerm = Math.sqrt(zeta * zeta - 1)
  const r1 = -wn * (zeta - sqrtTerm)
  const r2 = -wn * (zeta + sqrtTerm)
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1)
}
