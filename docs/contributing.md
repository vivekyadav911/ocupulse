# STEMM Lab — contribution workflow

This repo follows **CSE3MAD Assessment 4** agile practices: incremental delivery, PR reviews, and traceability to Azure DevOps user stories.

## Per-change routine

1. `git checkout main && git pull`
2. `git checkout -b feat/<initials>-<short-name>` (e.g. `feat/vy-parachute-record`)
3. **Install** — run listed `npm` / `npx expo` commands when adding packages.
4. **Implement** — keep screens under `app/`, shared logic under `services/`, `hooks/`, `lib/`.
5. **Verify** — `npm run lint`, `npm test`, run the app on simulator/device; fix reds before PR.
6. **Document** — update `docs/sprint-*` when a story requires it.
7. **Commit** — [Conventional Commits](https://www.conventionalcommits.org/) + user story ID, e.g. `feat(US3.A1): record parachute drop with slow-mo`
8. **Push** — `git push -u origin HEAD` and open a **Pull Request** on GitHub linked to the Azure DevOps story.
9. The **other** team member **reviews** and approves; **squash-merge** to `main`.
10. On Azure DevOps, move the story to **Done** and paste the merged commit SHA in discussion.

## Branch protection (expected on `main`)

- Require ≥1 approving review before merge.
- Block force-push; prefer linear history where possible.
- No direct commits of secrets — use `.env` (gitignored) and `app.config.ts` `extra`.

## Expo bootstrap in a non-empty repo

If `docs/` already exists, **do not** run `create-expo-app` directly in-place (it may refuse or clobber). Prefer:

```bash
npx create-expo-app@latest stemm-lab-tmp --template blank-typescript
rsync -av --exclude .git stemm-lab-tmp/ ./
rm -rf stemm-lab-tmp
```

Then merge `.gitignore` if needed and commit.

## Secret scan (before every PR)

```bash
rg "AIza|ca-app-pub-" -g '!.env*' -g '!*.md' || true
```

Must return **no matches** in tracked source.
