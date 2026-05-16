import { markerColorForPeakDb } from '../markerColor';

describe('markerColorForPeakDb', () => {
  it('uses green below 60 dB', () => {
    expect(markerColorForPeakDb(45)).toBe('#2ECC71');
  });

  it('uses amber from 60 to 85 dB', () => {
    expect(markerColorForPeakDb(60)).toBe('#F39C12');
    expect(markerColorForPeakDb(85)).toBe('#F39C12');
  });

  it('uses red above 85 dB', () => {
    expect(markerColorForPeakDb(86)).toBe('#E74C3C');
  });
});
