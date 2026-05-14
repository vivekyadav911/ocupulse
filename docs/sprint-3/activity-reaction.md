# Activity — Reaction board (S3.11)

## Screen

- `app/activity/reaction.tsx`

## Data path

- Timing and statistics via `lib/calc/reactionStats.ts` (tap-to-target latency, simple trace).
- Leaderboard key `reaction` ties into `subscribeLeaderboard` on the **Leaderboard** tab.

## UX

- Large hit targets; respect reduced motion where animations are used on results.
