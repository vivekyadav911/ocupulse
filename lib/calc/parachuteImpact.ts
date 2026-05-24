/** Impact g above resting level from accelerometer magnitude samples (device at ~1 g at rest). */
export function impactGFromMagnitudes(samples: number[]): number {
  if (!samples.length) return 0;
  const restN = Math.min(12, samples.length);
  const restSum = samples.slice(0, restN).reduce((a, b) => a + b, 0);
  const resting = restSum / restN;
  const peak = Math.max(...samples);
  return Math.max(0, peak - resting);
}
