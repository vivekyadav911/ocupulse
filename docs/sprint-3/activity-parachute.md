# Activity — Parachute (S3.7)

## Screen

- `app/activity/parachute.tsx`

## Data path

- Reads motion from `useAccelerometer` (and related calcs under `lib/calc/gforce.ts`) to score the simulated drop / landing.
- Results should flow through the session / local persistence layer agreed with the team (SQLite + optional sync).

## UX

- Clear “start / stop” affordance; show live g-force or summary stats consistent with `StatReadout` patterns.
