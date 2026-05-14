import * as Battery from 'expo-battery';
import { useEffect, useState } from 'react';

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
