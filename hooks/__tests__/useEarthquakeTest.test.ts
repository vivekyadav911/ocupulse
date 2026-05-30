import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useEarthquakeTest } from '../useEarthquakeTest';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

jest.mock('expo-sensors', () => ({
  Accelerometer: {
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

describe('useEarthquakeTest', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts down and completes after the selected duration', () => {
    const onComplete = jest.fn();
    const { result } = renderHook(() => useEarthquakeTest(onComplete));

    act(() => {
      result.current.startTest(5);
    });

    expect(result.current.phase).toBe('running');
    expect(result.current.secsLeft).toBe(5);
    expect(result.current.progress).toBe(0);

    act(() => {
      jest.advanceTimersByTime(2500);
    });

    expect(result.current.secsLeft).toBeGreaterThan(0);
    expect(result.current.progress).toBeGreaterThan(0);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.phase).toBe('idle');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(result.current.progress).toBe(0);
  });

  it('resumes countdown after returning to the foreground', () => {
    const onComplete = jest.fn();
    const { result } = renderHook(() => useEarthquakeTest(onComplete));

    act(() => {
      result.current.startTest(5);
      jest.advanceTimersByTime(5000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.startTest(5);
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const handler = (AppState.addEventListener as jest.Mock).mock.calls.at(-1)?.[1];
    expect(typeof handler).toBe('function');

    act(() => {
      jest.setSystemTime(Date.now() + 4000);
      handler('active');
      jest.advanceTimersByTime(3000);
    });

    expect(onComplete).toHaveBeenCalledTimes(2);
  });
});
