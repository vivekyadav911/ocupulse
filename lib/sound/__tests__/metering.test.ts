import {
  dbfsToApproxSpl,
  isValidMeteringDbfs,
  pushSplSample,
  splAccumulatorAverages,
  createSplAccumulator,
  SPL_MIN,
} from '../metering';

describe('isValidMeteringDbfs', () => {
  it('rejects undefined, -160, and above 0', () => {
    expect(isValidMeteringDbfs(undefined)).toBe(false);
    expect(isValidMeteringDbfs(-160)).toBe(false);
    expect(isValidMeteringDbfs(1)).toBe(false);
  });

  it('accepts typical recorder levels', () => {
    expect(isValidMeteringDbfs(-45)).toBe(true);
    expect(isValidMeteringDbfs(0)).toBe(true);
  });
});

describe('dbfsToApproxSpl', () => {
  it('maps quiet room dBFS to low SPL band', () => {
    expect(dbfsToApproxSpl(-50)).toBeGreaterThanOrEqual(35);
    expect(dbfsToApproxSpl(-50)).toBeLessThanOrEqual(50);
  });

  it('clamps extreme values', () => {
    expect(dbfsToApproxSpl(-200)).toBe(SPL_MIN);
    expect(dbfsToApproxSpl(10)).toBeLessThanOrEqual(110);
  });
});

describe('splAccumulatorAverages', () => {
  it('returns floor when empty', () => {
    expect(splAccumulatorAverages(createSplAccumulator())).toEqual({
      peakDb: SPL_MIN,
      avgDb: SPL_MIN,
    });
  });

  it('tracks peak and mean', () => {
    let acc = createSplAccumulator();
    acc = pushSplSample(acc, 40);
    acc = pushSplSample(acc, 55);
    acc = pushSplSample(acc, 48);
    expect(splAccumulatorAverages(acc)).toEqual({ peakDb: 55, avgDb: 47.7 });
  });
});
