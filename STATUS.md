# STATUS — 1:1 firmware UI

Rewrite this file whenever `HEAD` moves or localhost starts or stops.
If this SHA disagrees with `git rev-parse HEAD`, git wins; rewrite this file before any worker.

Updated: 4 October 2026.

## Checkout

| Field | Value |
| --- | --- |
| Path | `/Users/paramveer/.codex/worktrees/3ds-home-fidelity-20261001` |
| Branch | `codex/home-fidelity-20261001` |
| HEAD | `2adda8fa` — Record the Notifications upper LCD at 0 pixels over 2/255. |

This GitHub folder `/Volumes/DeveloperStorage/GitHub/3ds-idea` on `dev-size-opt` is a different checkout. It is not this site.

## Serving

**none.** Ignore any memory of preview `3021` on `605f39fe`.

Start localhost for this HEAD:

1. Confirm `pwd` is the checkout path and `git rev-parse --short HEAD` is `2adda8fa`.
2. Run `npm run build` if `.next` is missing or older than this commit.
3. Run `npx next start --hostname 127.0.0.1 -p 3000`.
4. Print path, branch, SHA, and `http://127.0.0.1:3000`.
5. Change this section to: `127.0.0.1:3000 at 2adda8fa`.

## Seats

| Seat | Who | Cap |
| --- | --- | --- |
| Coordinator | vacant (bind this folder, paste `RESTART.md`) | one living thread |
| Worker | none in flight | two |
| Reviewer | none in flight | one, different model from the worker |

Quota failover: whichever of Grok, Codex, or Claude still has usage sits in the vacant seat. The job stays the same.

## Next

Unpicked. First coordinator action: write one named leftover into this section from `git log` and `docs/feature-map.md`, then spawn at most the cap.

Whole-scenario 1:1 is unproven. Latest recorded on this SHA: Notifications upper LCD 0 pixels over 2/255; HUD 0 after the battery bind (`7f1e1fed`); generic text origin `8dc72ac6`.

## History

Append-only log: `/Volumes/Sandisk1/3ds-claude-codex-handoff/LOG.md`.
It is not the restart prompt.
