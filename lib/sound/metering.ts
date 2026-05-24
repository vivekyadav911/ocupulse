/** dBFS floor from expo-av metering (–160 = silence / unsupported). */
export const METERING_DBFS_MIN = -160;
/** Treat readings at or below this as invalid (stuck mic / no amplitude support). */
export const METERING_DBFS_INVALID_FLOOR = -150;
/** Clamp dBFS before SPL mapping — ignores noise-floor jitter. */
export const METERING_DBFS_CLAMP_MIN = -90;
export const METERING_DBFS_CLAMP_MAX = 0;

/** Approximate SPL range for school / urban sound-pollution mapping. */
export const SPL_MIN = 25;
export const SPL_MAX = 110;

/**
 * Offset from dBFS to approximate A-weighted SPL on typical phone mics.
 * Tuned so quiet rooms (~–50 dBFS) land near 35–45 dB and conversation near 55–65 dB.
 */
export const SPL_REFERENCE_OFFSET = 94;

export function isValidMeteringDbfs(dbfs: number | undefined): dbfs is number {
  return (
    typeof dbfs === 'number' &&
    Number.isFinite(dbfs) &&
    dbfs > METERING_DBFS_INVALID_FLOOR &&
    dbfs <= METERING_DBFS_CLAMP_MAX
  );
}

/** Map recorder dBFS to clamped approximate SPL (not lab-grade; consistent across samples). */
export function dbfsToApproxSpl(dbfs: number): number {
  const clamped = Math.max(METERING_DBFS_CLAMP_MIN, Math.min(METERING_DBFS_CLAMP_MAX, dbfs));
  const spl = clamped + SPL_REFERENCE_OFFSET;
  return Math.max(SPL_MIN, Math.min(SPL_MAX, spl));
}

export type SplAccumulator = {
  peak: number;
  sum: number;
  count: number;
};

export function createSplAccumulator(): SplAccumulator {
  return { peak: 0, sum: 0, count: 0 };
}

export function pushSplSample(acc: SplAccumulator, spl: number): SplAccumulator {
  return {
    peak: acc.count === 0 ? spl : Math.max(acc.peak, spl),
    sum: acc.sum + spl,
    count: acc.count + 1,
  };
}

export function splAccumulatorAverages(acc: SplAccumulator): { peakDb: number; avgDb: number } {
  if (acc.count === 0) {
    return { peakDb: SPL_MIN, avgDb: SPL_MIN };
  }
  return {
    peakDb: Math.round(acc.peak * 10) / 10,
    avgDb: Math.round((acc.sum / acc.count) * 10) / 10,
  };
}
