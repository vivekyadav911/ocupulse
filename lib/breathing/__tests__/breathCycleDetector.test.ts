import {
  amplifyBreathingSignal,
  bpmFromPeakCount,
  bpmStatus,
  lowPassSmooth,
  SENSITIVITY_GAIN,
} from '../breathingSignal';
import {
  combinedAxisSignal,
  countBreathsFromWaveform,
  createStreamingBreathDetector,
  processAxisSample,
} from '../breathCycleDetector';

describe('breathCycleDetector', () => {
  it('combines X/Y/Z deviations with axis weights', () => {
    const baseline = { x: 0, y: 0, z: 1 };
    const signal = combinedAxisSignal({ x: 0.02, y: 0.01, z: 1.04 }, baseline);
    expect(signal).toBeGreaterThan(0);
    expect(signal).toBeCloseTo(
      Math.sqrt(0.35 * 0.02 ** 2 + 0.35 * 0.01 ** 2 + 0.55 * 0.04 ** 2),
      5,
    );
  });

  it('counts trough-to-peak breaths from waveform graph', () => {
    const samples: { t: number; z: number }[] = [];
    let t = 0;
    // Synthetic: 4 breaths over 20 s (trough at 0, peak at 0.12)
    for (let breath = 0; breath < 4; breath += 1) {
      const base = breath * 5000;
      for (let i = 0; i <= 25; i += 1) {
        t = base + i * 100;
        const phase = i / 25;
        const z = phase <= 0.5 ? phase * 0.24 : (1 - phase) * 0.24;
        samples.push({ t, z });
      }
    }

    const { breathCount } = countBreathsFromWaveform(samples);
    expect(breathCount).toBeGreaterThanOrEqual(3);
    expect(breathCount).toBeLessThanOrEqual(5);
  });

  it('streams breath detection from axis samples', () => {
    let state = createStreamingBreathDetector({ x: 0, y: 0, z: 1 });
    let breaths = 0;

    for (let i = 0; i < 800; i += 1) {
      const phase = (i % 100) / 100;
      const bump = phase <= 0.5 ? phase * 0.2 : (1 - phase) * 0.2;
      const raw = { x: bump * 0.4, y: bump * 0.3, z: 1 + bump * 0.8 };
      const result = processAxisSample(state, raw, i * 40);
      state = result.state;
      if (result.breathDetected) breaths += 1;
    }

    expect(breaths).toBeGreaterThanOrEqual(2);
  });
});

describe('breathingSignal', () => {
  it('low-pass smooths toward raw value', () => {
    expect(lowPassSmooth(0, 1)).toBeCloseTo(0.15);
    expect(lowPassSmooth(0.5, 0.5)).toBeCloseTo(0.5);
  });

  it('amplifies signal 3× for detection', () => {
    expect(amplifyBreathingSignal(0.02)).toBeCloseTo(0.06);
    expect(SENSITIVITY_GAIN).toBe(3);
  });

  it('computes BPM from peak count in window', () => {
    expect(bpmFromPeakCount(15, 30_000)).toBe(30);
    expect(bpmFromPeakCount(0, 30_000)).toBe(0);
  });

  it('classifies BPM status bands', () => {
    expect(bpmStatus(10)).toBe('low');
    expect(bpmStatus(16)).toBe('normal');
    expect(bpmStatus(24)).toBe('elevated');
    expect(bpmStatus(35)).toBe('high');
  });
});
