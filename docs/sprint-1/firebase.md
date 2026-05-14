# Azure DevOps board

- Organisation: `https://dev.azure.com/cse3mad-stemm-lab/STEMM-Lab` (update if your org name differs).
- Three iterations: Sprint 1 (16 Mar–5 Apr), Sprint 2 (6–26 Apr), Sprint 3 (27 Apr–17 May).
- Add PNG snapshots: `board-snapshot.png` / `board-final.png` per sprint folders when closing.

# Firebase (Sprint 1)

We use three Firebase products for Assessment 4:

1. **Authentication** — anonymous “quick join” for students and email accounts for teachers; low friction inspired by Kahoot join flows (see A2).
2. **Firestore** — real-time `scores` collection with `onSnapshot` listeners on the leaderboard screen (pub/sub pattern).
3. **Firebase Test Lab** — Robo tests on release APKs built via EAS; one device matrix per team member.

**Why these three:** Auth removes classroom signup friction; Firestore gives live leaderboards without polling; Test Lab provides repeatable device coverage for markers.

**Secrets:** never commit `google-services.json`, `GoogleService-Info.plist`, or raw API keys. Use `.env` + `app.config.ts` `extra` (see [.env.example](../.env.example)).

Limitations: Firestore offline cache is complemented by a local SQLite **outbox** for explicit classroom offline support; security rules must be tightened before production.
