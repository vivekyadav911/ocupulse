# Firebase console artefacts (not committed secrets)

| File | Purpose |
|------|---------|
| [`firestore.rules`](./firestore.rules) | Sprint 1 **test mode** rules template — open read/write for dev |
| `google-services.json` | Android native config — **gitignored**, place at repo root if using prebuild |
| `GoogleService-Info.plist` | iOS native config — **gitignored**, place at repo root if using prebuild |

Runtime keys for the Expo JS SDK come from **`.env`** → **`app.config.ts` `extra`** (see [`docs/sprint-1/firebase.md`](../docs/sprint-1/firebase.md)).
