# Leaderboard — Firestore subscription (S3.13)

## UI

- `app/(tabs)/leaderboard.tsx` — `FlatList` of ranks, team name, score.

## Backend

- `subscribeLeaderboard(activityKey, onRows)` in `services/firestore.ts` streams `LeaderRow[]` for a fixed activity (default sample: `reaction`).
- Sorting / tie-break rules live in `lib/leaderboardSort.ts` (covered by Jest).

## Empty state

- Copy guides first-time users to complete an activity so scores appear.
