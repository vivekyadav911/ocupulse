/** High-rate relative timestamps (ms) for slow-motion frame alignment. */
export type FrameSampler = {
  start: () => void;
  stop: () => number[];
  readonly samples: readonly number[];
};

export function createFrameSampler(hz = 120): FrameSampler {
  let samples: number[] = [];
  let t0 = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let rafId: number | null = null;

  const push = () => {
    samples.push(performance.now() - t0);
  };

  return {
    get samples() {
      return samples;
    },
    start() {
      samples = [];
      t0 = performance.now();
      const intervalMs = 1000 / hz;
      intervalId = setInterval(push, intervalMs);
      const loop = () => {
        push();
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    },
    stop() {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = null;
      return [...samples];
    },
  };
}
