/** Marker fill for sound-map: green below 60 dB, amber 60–85, red above 85. */
export function markerColorForPeakDb(peakDb: number): string {
  if (peakDb > 85) return '#E74C3C';
  if (peakDb >= 60) return '#F39C12';
  return '#2ECC71';
}
