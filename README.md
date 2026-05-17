# STEMM Lab (ocupulse)

Cross-platform **STEMM Lab** mobile app — Expo / React Native, Firebase (Auth + Firestore + Test Lab), seven sensor-driven activities, offline-first SQLite outbox, and Azure DevOps–tracked sprints (CSE3MAD Assessment 4).

**Expo SDK**: this repo targets the SDK from `create-expo-app` (≥ 51; currently **SDK 54**).

## Azure DevOps

- **Organisation / project** (update with your live URL): `https://dev.azure.com/cse3mad-stemm-lab/STEMM-Lab`

## Quick start

```bash
cp .env.example .env
# Fill Firebase + AdMob keys (never commit .env)

npm install
npx expo start
```

Place `google-services.json` and `GoogleService-Info.plist` at the **repo root** (gitignored).

## Scripts

- `npm start` — Expo dev server  
- `npm run lint` — ESLint  
- `npm test` — Jest  
- `npm run android` / `npm run ios`

## Docs

- [`docs/contributing.md`](docs/contributing.md) — branch / PR / secret-scan routine  
- [`docs/sprint-1/`](docs/sprint-1/) — A1/A2 imports, capability matrix, Firebase rationale  
- [`docs/sprint-2/`](docs/sprint-2/) — screen flow, spikes, design tokens, [retro](docs/sprint-2/sprint-2-retro.md), [closeout](docs/sprint-2/closeout.md)  
- [`docs/sprint-3/`](docs/sprint-3/) — services / architecture notes  

## Submission checklist (Assessment 4)

- [ ] Both students submit on LMS; source zip excludes `.env` and `google-services.json`.
- [ ] Populate `.env` from `.env.example`; configure Firestore rules before wider trials.
- [ ] Run `eas build --platform android --profile production` and upload to **Firebase Test Lab** (two devices, one per student).
- [ ] Record pitch videos; expand `docs/user-manual-*.md` and testing reports to ~3 pages each.
- [ ] Secret scan: `rg "AIza|ca-app-pub-"` must not match tracked source (except documented placeholders).

## Licence

Educational — La Trobe University CSE3MAD.
