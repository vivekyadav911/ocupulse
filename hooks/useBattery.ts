import * as Battery from 'expo-battery';
import { useEffect, useState } from 'react';

/** expo-battery returns -1 on iOS Simulator and some unsupported environments. */
function clampBatteryLevel(raw: number): number {
  if (raw >= 0 && raw <= 1) return raw;
  return 1;
}

export function useBatteryLevel() {
  const [level, setLevel] = useState(1);
  const [lowPower, setLow] = useState(false);

  useEffect(() => {
    let sub: Battery.Subscription | undefined;
    void (async () => {
      const l = await Battery.getBatteryLevelAsync();
      setLevel(clampBatteryLevel(l));
      const m = await Battery.isLowPowerModeEnabledAsync();
      setLow(m);
      sub = Battery.addBatteryLevelListener(({ batteryLevel }) =>
        setLevel(clampBatteryLevel(batteryLevel)),
      );
    })();
    return () => sub?.remove();
  }, []);

  return { level, lowPowerMode: lowPower };
}
