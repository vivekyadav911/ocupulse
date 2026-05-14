const G_STD = 9.8;

/**
 * Case 1 — object does not bounce. Δv = impact speed (m/s), t_contact in seconds.
 * g-force = (Δv / t_contact) / g
 */
export function gForceNoBounce(impactSpeedMps: number, contactTimeS: number, g = G_STD): number {
  if (!Number.isFinite(impactSpeedMps) || !Number.isFinite(contactTimeS) || contactTimeS <= 0)
    return 0;
  return impactSpeedMps / contactTimeS / g;
}

/**
 * Case 2 — object bounces. Δv = v_down + v_up.
 */
export function gForceBounce(
  impactSpeedDownMps: number,
  reboundSpeedUpMps: number,
  contactTimeS: number,
  g = G_STD,
): number {
  if (contactTimeS <= 0) return 0;
  const deltaV = impactSpeedDownMps + reboundSpeedUpMps;
  return deltaV / contactTimeS / g;
}
