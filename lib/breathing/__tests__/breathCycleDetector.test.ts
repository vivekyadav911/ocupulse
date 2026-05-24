import {
  amplifyBreathingSignal,
  bpmFromPeakCount,
  bpmStatus,
  lowPassSmooth,
  SENSITIVITY_GAIN,
} from '../breathingSignal';
import {
  adaptiveWaveDepth,
  breathFromPeak,
  breathsFromPeakTroughPeak,
  collapsePeaksWithinGap,
  combinedAxisSignal,
  countPeaksFromWaveform,
  createStreamingBreathDetector,
  processAxisSample,
  selectBreathPeaksFromExtrema,
  type ConfirmedExtremum,
} from '../breathCycleDetector';

describe('breathCycleDetector', () => {
  it('combines X/Y/Z deviations with axis weights', () => {
    const baseline = { x: 0, y: 0, z: 1 };
    const signal = combinedAxisSignal({ x: 0.02, y: 0.01, z: 1.04 }, baseline);
    expect(signal).toBeGreaterThan(0);
  });

  it('counts one breath when peak is paired with deepest trough', () => {
    const peak: ConfirmedExtremum = { kind: 'peak', value: 0.2, t: 2000 };
    const trough: ConfirmedExtremum = { kind: 'trough', value: 0, t: 1000 };

    const result = breathFromPeak(peak, 0.05, 0, trough);
    expect(result.breathTimes).toHaveLength(1);
    expect(result.breathTimes[0]).toBe(2000);
  });

  it('rejects peaks without a preceding trough', () => {
    const peak: ConfirmedExtremum = { kind: 'peak', value: 0.2, t: 2000 };

    const result = breathFromPeak(peak, 0.05, 0);
    expect(result.breathTimes).toHaveLength(0);
  });

  it('rejects peaks that are too shallow vs trough', () => {
    const peak: ConfirmedExtremum = { kind: 'peak', value: 0.02, t: 2000 };
    const trough: ConfirmedExtremum = { kind: 'trough', value: 0, t: 1000 };

    const result = breathFromPeak(peak, 0.05, 0, trough);
    expect(result.breathTimes).toHaveLength(0);
  });

  it('rejects peaks less than 1 s after previous breath', () => {
    const peak: ConfirmedExtremum = { kind: 'peak', value: 0.2, t: 1500 };
    const trough: ConfirmedExtremum = { kind: 'trough', value: 0, t: 1200 };

    const result = breathFromPeak(peak, 0.05, 1000, trough);
    expect(result.breathTimes).toHaveLength(0);
  });

  it('keeps only the highest peak within a 1 s cluster', () => {
    const peaks: ConfirmedExtremum[] = [
      { kind: 'peak', value: 0.15, t: 2000 },
      { kind: 'peak', value: 0.25, t: 2500 },
      { kind: 'peak', value: 0.18, t: 2800 },
    ];

    const collapsed = collapsePeaksWithinGap(peaks);
    expect(collapsed).toHaveLength(1);
    expect(collapsed[0]!.t).toBe(2500);
    expect(collapsed[0]!.value).toBe(0.25);
  });

  it('selects peaks with deepest trough and 1 s spacing', () => {
    const extrema: ConfirmedExtremum[] = [
      { kind: 'trough', value: 0, t: 500 },
      { kind: 'peak', value: 0.15, t: 2000 },
      { kind: 'peak', value: 0.25, t: 2500 },
      { kind: 'trough', value: -0.02, t: 3200 },
      { kind: 'peak', value: 0.22, t: 4500 },
    ];

    const peaks = selectBreathPeaksFromExtrema(extrema, 0.05);
    expect(peaks).toEqual([2500, 4500]);
  });

  it('deprecated wave helper delegates to peak-trough selection', () => {
    const extrema: ConfirmedExtremum[] = [
      { kind: 'trough', value: 0, t: 0 },
      { kind: 'peak', value: 0.2, t: 2000 },
      { kind: 'trough', value: 0, t: 4000 },
    ];

    const result = breathsFromPeakTroughPeak(extrema, 0.05, 0, []);
    expect(result.breathTimes).toEqual([2000]);
  });

  it('counts ~one breath per synthetic wave from graph', () => {
    const samples: { t: number; z: number }[] = [];
    for (let breath = 0; breath < 5; breath += 1) {
      const base = breath * 4000;
      for (let i = 0; i <= 40; i += 1) {
        const t = base + i * 100;
        const phase = i / 40;
        const z = phase <= 0.5 ? phase * 0.04 : (1 - phase) * 0.04;
        samples.push({ t, z });
      }
    }

    const { peakCount } = countPeaksFromWaveform(samples);
    expect(peakCount).toBeGreaterThanOrEqual(3);
    expect(peakCount).toBeLessThanOrEqual(7);
  });

  it('counts larger waveform breaths from graph', () => {
    const samples: { t: number; z: number }[] = [];
    for (let breath = 0; breath < 4; breath += 1) {
      const base = breath * 5000;
      for (let i = 0; i <= 25; i += 1) {
        const t = base + i * 100;
        const phase = i / 25;
        const z = phase <= 0.5 ? phase * 0.24 : (1 - phase) * 0.24;
        samples.push({ t, z });
      }
    }

    const { peakCount } = countPeaksFromWaveform(samples);
    expect(peakCount).toBeGreaterThanOrEqual(3);
    expect(peakCount).toBeLessThanOrEqual(6);
  });

  it('detects chest motion with frozen baseline', () => {
    let state = createStreamingBreathDetector({ x: 0.02, y: -0.05, z: 0.98 });
    let breaths = 0;

    for (let i = 0; i < 1200; i += 1) {
      const phase = (i % 125) / 125;
      const bump = phase <= 0.5 ? phase * 0.012 : (1 - phase) * 0.012;
      const raw = {
        x: 0.02 + bump * 0.4,
        y: -0.05 + bump * 0.25,
        z: 0.98 + bump * 0.7,
      };
      const result = processAxisSample(state, raw, i * 40, { freezeAxisBaseline: true });
      state = result.state;
      if (result.breathDetected) breaths += 1;
    }

    expect(breaths).toBeGreaterThanOrEqual(2);
  });
});

describe('breathingSignal', () => {
  it('low-pass smooths toward raw value', () => {
    expect(lowPassSmooth(0, 1)).toBeCloseTo(0.22);
  });

  it('amplifies signal for chest sensitivity', () => {
    expect(amplifyBreathingSignal(0.02)).toBeCloseTo(0.16);
    expect(SENSITIVITY_GAIN).toBe(8);
  });

  it('adaptive wave depth scales with graph range', () => {
    const tiny = adaptiveWaveDepth(Array.from({ length: 30 }, (_, i) => Math.sin(i / 3) * 0.004));
    const large = adaptiveWaveDepth(Array.from({ length: 30 }, (_, i) => Math.sin(i / 3) * 0.2));
    expect(large).toBeGreaterThan(tiny);
  });

  it('computes BPM from breath count in window', () => {
    expect(bpmFromPeakCount(15, 30_000)).toBe(30);
  });

  it('classifies BPM status bands', () => {
    expect(bpmStatus(16)).toBe('normal');
    expect(bpmStatus(35)).toBe('high');
  });
});
