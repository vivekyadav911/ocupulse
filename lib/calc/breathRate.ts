/**
 * Estimate breaths per minute from peak timestamps (seconds) over a breathing window.
 */
export function breathsPerMinuteFromPeaks(peakTimesS: number[], windowS: number): number {
  if (peakTimesS.length < 2 || windowS <= 0) return 0;
  const count = peakTimesS.length - 1;
  const rate = (count / windowS) * 60;
  return Math.round(rate * 10) / 10;
}
