/** Web: no device battery API — treat as fully charged so UI stays usable. */
export async function readBatterySnapshot() {
  const updatedAt = Date.now();
  return {
    rawLevel: 1,
    percent: 100,
    lowPowerMode: false,
    available: false,
    updatedAt,
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
    refresh: async () => readBatterySnapshot(),
    warn: false,
    critical: false,
    recordingDisabled: false,
  };
}
