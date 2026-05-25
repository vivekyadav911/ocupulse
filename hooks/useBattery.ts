import * as Battery from 'expo-battery';
import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

const WARN_THRESHOLD = 0.2;
const CRITICAL_THRESHOLD = 0.1;
const POLL_MS = 10_000;

export type BatterySnapshot = {
  /** Raw 0–1 from the OS, or -1 if unknown */
  rawLevel: number;
  percent: number | null;
  lowPowerMode: boolean;
  available: boolean;
  updatedAt: number;
  batteryState: Battery.BatteryState;
  isCharging: boolean;
  chargingLabel: string;
};

function chargingLabelFor(state: Battery.BatteryState): string {
  switch (state) {
    case Battery.BatteryState.CHARGING:
      return 'Charging';
    case Battery.BatteryState.FULL:
      return 'Full (plugged in)';
    case Battery.BatteryState.UNPLUGGED:
      return 'On battery';
    default:
      return 'Unknown';
  }
}

export type BatteryLevelState = BatterySnapshot & {
  /** @deprecated use rawLevel — normalized 0–1 for gates */
  level: number;
  refresh: () => Promise<BatterySnapshot>;
};

function toPercent(level: number): number | null {
  if (!Number.isFinite(level) || level < 0) return null;
  return Math.min(100, Math.max(0, Math.round(level * 100)));
}

/** Read battery — direct level API first (fresher on manual refresh than cached PowerState). */
export async function readBatterySnapshot(): Promise<BatterySnapshot> {
  const updatedAt = Date.now();
  const available = await Battery.isAvailableAsync();
  if (!available) {
    return {
      rawLevel: -1,
      percent: null,
      lowPowerMode: false,
      available: false,
      updatedAt,
      batteryState: Battery.BatteryState.UNKNOWN,
      isCharging: false,
      chargingLabel: 'Unavailable',
    };
  }

  const level = await Battery.getBatteryLevelAsync();
  let lowPowerMode = false;
  let batteryState = Battery.BatteryState.UNKNOWN;
  try {
    lowPowerMode = await Battery.isLowPowerModeEnabledAsync();
  } catch {
    /* optional on some platforms */
  }
  try {
    batteryState = await Battery.getBatteryStateAsync();
  } catch {
    /* optional on some platforms */
  }

  const isCharging =
    batteryState === Battery.BatteryState.CHARGING || batteryState === Battery.BatteryState.FULL;

  return {
    rawLevel: level,
    percent: toPercent(level),
    lowPowerMode,
    available: level >= 0,
    updatedAt,
    batteryState,
    isCharging,
    chargingLabel: chargingLabelFor(batteryState),
  };
}

export function useBatteryLevel(): BatteryLevelState {
  const [snapshot, setSnapshot] = useState<BatterySnapshot>({
    rawLevel: -1,
    percent: null,
    lowPowerMode: false,
    available: false,
    updatedAt: 0,
    batteryState: Battery.BatteryState.UNKNOWN,
    isCharging: false,
    chargingLabel: 'Reading…',
  });

  const refresh = useCallback(async () => {
    const next = await readBatterySnapshot();
    setSnapshot(next);
    return next;
  }, []);

  useEffect(() => {
    void refresh();
    let levelSub: Battery.Subscription | undefined;
    let stateSub: Battery.Subscription | undefined;
    void Battery.isAvailableAsync().then((ok) => {
      if (!ok) return;
      levelSub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
        void Promise.all([
          Battery.isLowPowerModeEnabledAsync().catch(() => false),
          Battery.getBatteryStateAsync().catch(() => Battery.BatteryState.UNKNOWN),
        ]).then(([lowPowerMode, batteryState]) => {
          const isCharging =
            batteryState === Battery.BatteryState.CHARGING ||
            batteryState === Battery.BatteryState.FULL;
          setSnapshot({
            rawLevel: batteryLevel,
            percent: toPercent(batteryLevel),
            lowPowerMode,
            available: batteryLevel >= 0,
            updatedAt: Date.now(),
            batteryState,
            isCharging,
            chargingLabel: chargingLabelFor(batteryState),
          });
        });
      });
      stateSub = Battery.addBatteryStateListener(({ batteryState }) => {
        setSnapshot((prev) => {
          const isCharging =
            batteryState === Battery.BatteryState.CHARGING ||
            batteryState === Battery.BatteryState.FULL;
          return {
            ...prev,
            batteryState,
            isCharging,
            chargingLabel: chargingLabelFor(batteryState),
            updatedAt: Date.now(),
          };
        });
      });
    });

    const poll = setInterval(() => void refresh(), POLL_MS);
    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') void refresh();
    };
    const appSub = AppState.addEventListener('change', onAppState);

    return () => {
      levelSub?.remove();
      stateSub?.remove();
      clearInterval(poll);
      appSub.remove();
    };
  }, [refresh]);

  const level = snapshot.rawLevel < 0 ? 0 : snapshot.rawLevel;

  return {
    ...snapshot,
    level,
    refresh,
  };
}

/** Battery state for banners and recording gate (Issue #35). */
export function useBattery() {
  const bat = useBatteryLevel();
  const normalized = bat.percent != null ? bat.percent / 100 : bat.level;
  const warn = normalized < WARN_THRESHOLD;
  const critical = normalized < CRITICAL_THRESHOLD;
  return {
    ...bat,
    level: normalized,
    warn,
    critical,
    recordingDisabled: critical,
  };
}
