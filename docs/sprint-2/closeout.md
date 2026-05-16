# Sprint 2 closeout checklist (Issue #18)

| Acceptance item | Status | Evidence |
|-----------------|--------|----------|
| Every rubric capability in `feature-spikes.md` | Done | [`feature-spikes.md`](./feature-spikes.md) — subsection per capability with code pointer |
| Both member signatures in retro | Done | [`sprint-2-retro.md`](./sprint-2-retro.md) |
| All US2.x stories **Done** on Azure DevOps | Verify on board | Iteration: `ocupulse\Sprint 2` |
| Git tag `sprint-2-end` on GitHub | Done | `git tag -l sprint-2-end` / Releases |

## Azure DevOps board screenshot

1. Open project board → filter iteration **Sprint 2**.
2. Confirm all **US2.x** work items are **Done**.
3. Export screenshot as **`docs/sprint-2/board-snapshot.png`** (add to repo if not already present).

## Git tag (already applied at closeout)

```bash
git fetch --tags
git show sprint-2-end
```
