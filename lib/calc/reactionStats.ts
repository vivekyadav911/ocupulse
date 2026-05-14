export function averageReactionMs(samples: number[]): number {
  if (!samples.length) return 0;
  return samples.reduce((a, b) => a + b, 0) / samples.length;
}

/** Mean squared error vs ideal path (normalized 0–1 inputs). Lower error → higher score. */
export function traceScoreFromMse(mse: number): number {
  if (!Number.isFinite(mse) || mse < 0) return 0;
  const score = 100 - Math.min(100, mse * 5000);
  return Math.max(0, Math.round(score));
}
