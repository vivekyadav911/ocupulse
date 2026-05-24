/** F ≈ k × θ where θ is in radians. */
export function forceFromStiffness(angleDeg: number, k: number): number {
  if (!Number.isFinite(angleDeg) || !Number.isFinite(k)) return 0;
  const thetaRad = (angleDeg * Math.PI) / 180;
  return k * thetaRad;
}
