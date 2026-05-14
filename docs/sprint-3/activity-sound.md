# Activity — Sound pollution hunter (S3.9)

## Screen

- `app/activity/sound.tsx`

## Data path

- Uses `useMicrophoneDb` for live level; may combine with `hooks/useLocation.ts` / maps for the teammate-owned map story.
- Extended results and map view: `app/results/sound-map.tsx`.

## UX

- Permission prompts before metering; show current dB and guidance when clipping or silent.
