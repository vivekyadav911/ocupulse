import { useBattery } from './useBattery';

/** True when battery is below 10% — block recording starts across activities. */
export function useRecordingGate() {
  const { recordingDisabled, warn, critical, level } = useBattery();
  return { recordingDisabled, warn, critical, level };
}
