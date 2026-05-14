# Production hook — microphone (S3.6)

## `hooks/useMicrophoneDb.ts`

- Streams estimated dB or level from the device microphone for the **Sound** activity and pollution-style readouts.
- Grants through Expo AV / audio APIs as configured in the hook; deny path should show a clear in-app message.

## Spike

- `app/_spikes/mic.tsx` validates levels in a sandbox screen before production activity wiring.
