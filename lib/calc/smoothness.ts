/** Jerk RMS from gyro magnitude samples (rad/s²). Lower = smoother. */
export function jerkRmsFromSamples(gyroSamples: number[], dt = 1 / 60): number {
  if (gyroSamples.length < 3) return 0;
  let jerkSum = 0;
  let count = 0;
  for (let i = 2; i < gyroSamples.length; i++) {
    const a0 = gyroSamples[i - 2];
    const a1 = gyroSamples[i - 1];
    const a2 = gyroSamples[i];
    if (a0 === undefined || a1 === undefined || a2 === undefined) continue;
    const j = Math.abs((a2 - 2 * a1 + a0) / (dt * dt));
    jerkSum += j * j;
    count++;
  }
  if (!count) return 0;
  return Math.sqrt(jerkSum / count);
}

/** Jerk RMS from gyro samples (rad/s). Lower jerk → smoother motion → higher score. */
export function smoothnessScore(gyroSamples: number[], dt = 1 / 60): number {
  const rms = jerkRmsFromSamples(gyroSamples, dt);
  if (!gyroSamples.length) return 0;
  if (rms === 0 && gyroSamples.length < 3) return 0;
  const score = 100 - Math.min(100, rms * 10);
  return Math.max(0, Math.round(score));
}
