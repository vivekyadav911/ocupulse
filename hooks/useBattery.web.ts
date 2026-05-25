/** Web: no device battery API — treat as fully charged so UI stays usable. */
export async function readBatterySnapshot() {
  const updatedAt = Date.now();
  return {
    rawLevel: 1,
    percent: 100,
    lowPowerMode: false,
    available: false,
    updatedAt,
    batteryState: 0,
    isCharging: false,
    chargingLabel: 'Web preview',
  };
}

export function useBatteryLevel() {
  return {
    rawLevel: 1,
    level: 1,
    percent: 100,
    lowPowerMode: false,
    available: false,
    updatedAt: Date.now(),
    batteryState: 0,
    isCharging: false,
    chargingLabel: 'Web preview',
    refresh: async () => readBatterySnapshot(),
  };
}

export function useBattery() {
  return {
    rawLevel: 1,
    level: 1,
    percent: 100,
    lowPowerMode: false,
    available: false,
    updatedAt: Date.now(),
    batteryState: 0,
    isCharging: false,
    chargingLabel: 'Web preview',
    refresh: async () => readBatterySnapshot(),
    warn: false,
    critical: false,
    recordingDisabled: false,
  };
}
