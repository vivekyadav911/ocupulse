import {
  computeStats,
  estimateHz,
  pushRingSample,
  RING_WINDOW_MS,
  targetHzFromIntervalMs,
  trimByWindow,
} from '../ringBuffer';

describe('ringBuffer', () => {
  const t0 = 1_000_000;

  it('trimByWindow keeps only samples within 5 seconds', () => {
    const samples = [
      { t: t0 - 6000, magnitude: 1 },
      { t: t0 - 4000, magnitude: 2 },
      { t: t0 - 1000, magnitude: 3 },
      { t: t0, magnitude: 4 },
    ];
    const trimmed = trimByWindow(samples, t0, RING_WINDOW_MS);
    expect(trimmed.map((s) => s.magnitude)).toEqual([2, 3, 4]);
  });

  it('pushRingSample drops samples older than the window', () => {
    let buf = [{ t: t0 - 6000, magnitude: 1 }];
    buf = pushRingSample(buf, { t: t0, magnitude: 2 }, t0);
    expect(buf).toHaveLength(1);
    expect(buf[0]!.magnitude).toBe(2);
  });

  it('computeStats returns mean, peak, and RMS', () => {
    expect(computeStats([2, 4, 4])).toEqual({
      mean: 10 / 3,
      peak: 4,
      rms: Math.sqrt((4 + 16 + 16) / 3),
    });
    expect(computeStats([])).toEqual({ mean: 0, peak: 0, rms: 0 });
  });

  it('estimateHz derives rate from timestamps', () => {
    const hz = estimateHz([0, 16, 32, 48, 64]);
    expect(hz).toBeCloseTo(62.5, 1);
  });

  it('targetHzFromIntervalMs matches configured interval', () => {
    expect(targetHzFromIntervalMs(1000 / 60)).toBeCloseTo(60, 5);
  });
});
