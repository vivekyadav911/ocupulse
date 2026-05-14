# Production hook — camera (S3.5)

## `hooks/useCameraRecorder.ts`

- Wraps Expo camera / recording APIs for activities that capture short clips or stills.
- Consumers should request camera (and microphone when recording) permissions before starting capture; see spike route `app/_spikes/camera.tsx` for a minimal wiring reference.

## Usage notes

- Prefer lower resolution / shorter segments on mid-range devices to avoid memory pressure.
- Release recorder subscriptions on unmount to avoid leaks.
