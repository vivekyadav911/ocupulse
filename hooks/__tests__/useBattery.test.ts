import { renderHook, waitFor } from '@testing-library/react-native';
import * as Battery from 'expo-battery';
import { readBatterySnapshot, useBattery } from '../useBattery';

jest.mock('expo-battery', () => ({
  BatteryState: {
    UNKNOWN: 0,
    UNPLUGGED: 1,
    CHARGING: 2,
    FULL: 3,
  },
  isAvailableAsync: jest.fn(),
  getBatteryLevelAsync: jest.fn(),
  getBatteryStateAsync: jest.fn(),
  isLowPowerModeEnabledAsync: jest.fn(),
  addBatteryLevelListener: jest.fn(),
  addBatteryStateListener: jest.fn(),
}));

describe('useBattery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Battery.isAvailableAsync as jest.Mock).mockResolvedValue(false);
    (Battery.getBatteryLevelAsync as jest.Mock).mockResolvedValue(-1);
    (Battery.getBatteryStateAsync as jest.Mock).mockResolvedValue(Battery.BatteryState.UNKNOWN);
    (Battery.isLowPowerModeEnabledAsync as jest.Mock).mockResolvedValue(false);
    (Battery.addBatteryLevelListener as jest.Mock).mockReturnValue({ remove: jest.fn() });
    (Battery.addBatteryStateListener as jest.Mock).mockReturnValue({ remove: jest.fn() });
  });

  it('does not block recording when battery level is unknown', async () => {
    const snapshot = await readBatterySnapshot();
    expect(snapshot.available).toBe(false);
    expect(snapshot.rawLevel).toBe(-1);

    const { result } = renderHook(() => useBattery());

    await waitFor(() => {
      expect(result.current.recordingDisabled).toBe(false);
    });
    expect(result.current.critical).toBe(false);
  });

  it('blocks recording only when battery is known and below 10%', async () => {
    (Battery.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (Battery.getBatteryLevelAsync as jest.Mock).mockResolvedValue(0.05);

    const snapshot = await readBatterySnapshot();
    expect(snapshot.percent).toBe(5);

    const { result } = renderHook(() => useBattery());

    await waitFor(() => {
      expect(result.current.recordingDisabled).toBe(true);
    });
    expect(result.current.critical).toBe(true);
  });

  it('allows recording when battery is known and above 10%', async () => {
    (Battery.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (Battery.getBatteryLevelAsync as jest.Mock).mockResolvedValue(0.42);

    const { result } = renderHook(() => useBattery());

    await waitFor(() => {
      expect(result.current.recordingDisabled).toBe(false);
    });
    expect(result.current.warn).toBe(false);
  });
});
