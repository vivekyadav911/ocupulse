import {
  averageReactionMs,
  combinedReactionScore,
  idealTraceY,
  reactionScoreFromAvgMs,
  tracePathMse,
  traceScoreFromMse,
} from '../reactionStats';

describe('averageReactionMs', () => {
  it('averages tap samples', () => {
    expect(averageReactionMs([200, 300, 400])).toBe(300);
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
  it('blends reaction and trace scores', () => {
    const score = combinedReactionScore(300, 80);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
