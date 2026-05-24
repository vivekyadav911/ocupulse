/** Green: 0–60 dB */
export const DB_COLOR_GREEN = '#2ECC71';
/** Amber: 60–85 dB */
export const DB_COLOR_AMBER = '#F39C12';
/** Orange: 85–100 dB */
export const DB_COLOR_ORANGE = '#E67E22';
/** Red: 100+ dB */
export const DB_COLOR_RED = '#E74C3C';

/** Bar / pin fill colour for approximate SPL (0–140 scale). */
export function dbBarColor(db: number): string {
  if (db >= 100) return DB_COLOR_RED;
  if (db >= 85) return DB_COLOR_ORANGE;
  if (db >= 60) return DB_COLOR_AMBER;
  return DB_COLOR_GREEN;
}

/** Marker fill for sound-map pins — same 4-band scale as the live gauge. */
export function markerColorForPeakDb(peakDb: number): string {
  return dbBarColor(peakDb);
}
