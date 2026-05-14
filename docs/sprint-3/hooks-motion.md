# Production hooks — motion (S3.4)

## Accelerometer — `hooks/useAccelerometer.ts`

- Uses `expo-sensors` `Accelerometer` at ~60 Hz (`setUpdateInterval`).
- Returns current vector `{ x, y, z }`, derived `magnitude`, and a rolling `buffer` (last 300 samples with timestamps) for activities that need short traces (e.g. parachute g-force).

## Gyroscope — `hooks/useGyroscope.ts`

- Same pattern as accelerometer: `Gyroscope` listener, configurable interval, magnitude and buffer for rotation-rate based UI or calculations.

## Permissions / lifecycle

- Callers should handle unavailable hardware gracefully; spikes under `app/_spikes/sensors.tsx` exercise the stream in isolation.
