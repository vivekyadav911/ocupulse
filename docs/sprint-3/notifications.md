# Local notifications (S3.14)

## Service

- `services/notifications.ts` — schedules **daily streak** reminders and a **rank-up** stub hook for when leaderboard position improves.

## Integration

- Call initialization from app startup (`app/_layout.tsx` or settings) after permission grant.
- Do not block UI on permission denial; degrade silently with a settings nudge.

## Testing

- Verify on physical device; simulators have limited notification fidelity.
