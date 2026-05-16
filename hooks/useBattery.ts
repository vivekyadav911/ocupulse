import * as Battery from 'expo-battery';
import { useEffect, useState } from 'react';

const WARN_THRESHOLD = 0.2;
const CRITICAL_THRESHOLD = 0.1;

export function useBatteryLevel() {
  const [level, setLevel] = useState(1);
  const [lowPower, setLow] = useState(false);

  useEffect(() => {
    let sub: Battery.Subscription | undefined;
    void (async () => {
      const l = await Battery.getBatteryLevelAsync();
      setLevel(l);
      const m = await Battery.isLowPowerModeEnabledAsync();
      setLow(m);
      sub = Battery.addBatteryLevelListener(({ batteryLevel }) => setLevel(batteryLevel));
    })();
    return () => sub?.remove();
  }, []);

  return { level, lowPowerMode: lowPower };
}

/** Battery state for banners and recording gate (Issue #35). */
export function useBattery() {
  const { level, lowPowerMode } = useBatteryLevel();
  const warn = level < WARN_THRESHOLD;
  const critical = level < CRITICAL_THRESHOLD;
  return {
    level,
    lowPowerMode,
    warn,
    critical,
    recordingDisabled: critical,
  };
}
