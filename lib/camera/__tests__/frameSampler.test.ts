import { createFrameSampler } from '../frameSampler';

describe('createFrameSampler', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('captures at least 120 timestamps in 1s at 120 Hz', () => {
    const sampler = createFrameSampler(120);
    sampler.start();
    jest.advanceTimersByTime(1000);
    const times = sampler.stop();
    expect(times.length).toBeGreaterThanOrEqual(120);
    expect(times[0]).toBeGreaterThanOrEqual(0);
    expect(times[times.length - 1]).toBeLessThanOrEqual(1100);
  });
});
