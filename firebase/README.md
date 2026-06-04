# Firebase console artefacts (not committed secrets)

| File | Purpose |
|------|---------|
| [`firestore.rules`](./firestore.rules) | Firestore security rules |
| [`firestore.indexes.json`](./firestore.indexes.json) | Composite indexes |
| `google-services.json` | Android native config — **gitignored**, place at repo root if using prebuild |
| `GoogleService-Info.plist` | iOS native config — **gitignored**, place at repo root if using prebuild |

Runtime keys for the Expo JS SDK come from **`.env`** → **`app.config.ts` `extra`**. See the root [README](../README.md#firebase) for setup steps.
