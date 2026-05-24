import {
  averageReactionMs,
  combinedReactionScore,
  idealTraceY,
  mean,
  movingWaveY,
  percentSlower,
  rankReactionTimes,
  reactionScoreFromAvgMs,
  standardDeviation,
  traceAccuracyPct,
  traceAvgDelayMs,
  tracePathMse,
  traceScoreFromMse,
  defaultMovingWaveConfig,
  TRACE_ACCURACY_THRESHOLD_PX,
} from '../reactionStats';

describe('averageReactionMs', () => {
  it('averages tap samples', () => {
    expect(averageReactionMs([200, 300, 400])).toBe(300);
  });
});

describe('mean and standardDeviation', () => {
  it('computes mean', () => {
    expect(mean([2, 4, 6])).toBe(4);
  });

  it('computes population std dev', () => {
    expect(standardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2, 0);
  });

  it('returns 0 for single value', () => {
    expect(standardDeviation([100])).toBe(0);
  });
});

describe('percentSlower', () => {
  it('computes percent slower for non-dominant hand', () => {
    expect(percentSlower(300, 250)).toBe(20);
  });
});

describe('rankReactionTimes', () => {
  it('assigns rank by fastest first', () => {
    const ranked = rankReactionTimes([
      { name: 'B', reactionMs: 300 },
      { name: 'A', reactionMs: 200 },
    ]);
    expect(ranked[0]).toEqual({ name: 'A', reactionMs: 200, rank: 1 });
    expect(ranked[1]).toEqual({ name: 'B', reactionMs: 300, rank: 2 });
  });
});

describe('reactionScoreFromAvgMs', () => {
  it('rewards faster typical reaction times', () => {
    expect(reactionScoreFromAvgMs(250)).toBeGreaterThan(reactionScoreFromAvgMs(400));
    expect(reactionScoreFromAvgMs(300)).toBeGreaterThan(50);
  });
});

describe('tracePathMse', () => {
  it('is near zero on the ideal path (screen coordinates)', () => {
    const ideal = Array.from({ length: 20 }, (_, i) => {
      const x = i / 19;
      return { x, y: 1 - idealTraceY(x) };
    });
    expect(tracePathMse(ideal)).toBeLessThan(0.001);
  });

  it('increases with deviation', () => {
    const off = [{ x: 0.5, y: 0.9 }];
    const on = [{ x: 0.5, y: 1 - idealTraceY(0.5) }];
    expect(tracePathMse(off)).toBeGreaterThan(tracePathMse(on));
  });

  it('scores a perfect screen trace highly', () => {
    const screenTrace = Array.from({ length: 20 }, (_, i) => {
      const x = i / 19;
      return { x, y: 1 - idealTraceY(x) };
    });
    expect(traceScoreFromMse(tracePathMse(screenTrace))).toBeGreaterThan(90);
  });
});

describe('traceScoreFromMse', () => {
  it('scores low deviation higher', () => {
    expect(traceScoreFromMse(0.001)).toBeGreaterThan(traceScoreFromMse(0.05));
  });
});

describe('combinedReactionScore', () => {
  it('blends reaction and trace accuracy', () => {
    const score = combinedReactionScore(300, 80);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('movingWaveY', () => {
  it('returns center y at t=0 for center x when offset aligns', () => {
    const config = defaultMovingWaveConfig(300, 160);
    const y = movingWaveY(150, 0, config);
    expect(y).toBeCloseTo(80, 0);
  });
});

describe('traceAccuracyPct', () => {
  it('is near 100% when tracing the moving wave exactly', () => {
    const config = defaultMovingWaveConfig(300, 160);
    const startTs = 1000;
    const touchPoints = Array.from({ length: 20 }, (_, i) => {
      const elapsed = i * 500;
      const x = 150;
      return { x, y: movingWaveY(x, elapsed, config), t: startTs + elapsed };
    });
    const accuracy = traceAccuracyPct(touchPoints, TRACE_ACCURACY_THRESHOLD_PX, config, startTs);
    expect(accuracy).toBeGreaterThan(99);
  });

  it('is low when far from the wave', () => {
    const config = defaultMovingWaveConfig(300, 160);
    const startTs = 1000;
    const touchPoints = [{ x: 150, y: 10, t: startTs }];
    const accuracy = traceAccuracyPct(touchPoints, TRACE_ACCURACY_THRESHOLD_PX, config, startTs);
    expect(accuracy).toBe(0);
  });
});

describe('traceAvgDelayMs', () => {
  it('is near 0 when touch aligns with shape samples', () => {
    const shapeSamples = [
      { x: 150, y: 80, t: 1000 },
      { x: 150, y: 90, t: 1500 },
    ];
    const touchPoints = [{ x: 150, y: 80, t: 1000 }];
    expect(traceAvgDelayMs(touchPoints, shapeSamples)).toBe(0);
  });
});
