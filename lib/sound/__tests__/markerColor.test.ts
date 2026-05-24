import {
  DB_COLOR_AMBER,
  DB_COLOR_GREEN,
  DB_COLOR_ORANGE,
  DB_COLOR_RED,
  dbBarColor,
  markerColorForPeakDb,
} from '../markerColor';

describe('dbBarColor', () => {
  it('uses green below 60 dB', () => {
    expect(dbBarColor(0)).toBe(DB_COLOR_GREEN);
    expect(dbBarColor(45)).toBe(DB_COLOR_GREEN);
    expect(dbBarColor(59)).toBe(DB_COLOR_GREEN);
  });

  it('uses amber from 60 to below 85 dB', () => {
    expect(dbBarColor(60)).toBe(DB_COLOR_AMBER);
    expect(dbBarColor(84)).toBe(DB_COLOR_AMBER);
  });

  it('uses orange from 85 to below 100 dB', () => {
    expect(dbBarColor(85)).toBe(DB_COLOR_ORANGE);
    expect(dbBarColor(99)).toBe(DB_COLOR_ORANGE);
  });

  it('uses red at 100 dB and above', () => {
    expect(dbBarColor(100)).toBe(DB_COLOR_RED);
    expect(dbBarColor(140)).toBe(DB_COLOR_RED);
  });
});

describe('markerColorForPeakDb', () => {
  it('delegates to dbBarColor', () => {
    expect(markerColorForPeakDb(45)).toBe(DB_COLOR_GREEN);
    expect(markerColorForPeakDb(70)).toBe(DB_COLOR_AMBER);
    expect(markerColorForPeakDb(92)).toBe(DB_COLOR_ORANGE);
    expect(markerColorForPeakDb(105)).toBe(DB_COLOR_RED);
  });
});
