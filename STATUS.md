# STATUS — 1:1 firmware UI

Rewrite this file whenever `HEAD` moves or localhost starts or stops.
If this SHA disagrees with `git rev-parse HEAD`, git wins; rewrite this file before any worker.

Updated: 4 October 2026, 23:00 BST.

## Checkout

| Field | Value |
| --- | --- |
| Path | `/Users/paramveer/.codex/worktrees/3ds-home-fidelity-20261001` |
| Branch | `codex/home-fidelity-20261001` |
| HEAD | see `git rev-parse HEAD` (last runtime change `7b773b71` — HOME entry banner) |

This GitHub folder `/Volumes/DeveloperStorage/GitHub/3ds-idea` on `dev-size-opt` is a different checkout. It is not this site.

## Serving

`127.0.0.1:3000` at `7b773b71` (production build, `npx next start --hostname 127.0.0.1 -p 3000`).

Start localhost for a new HEAD:

1. Confirm `pwd` is the checkout path and `git rev-parse --short HEAD` matches.
2. Run `npm run build` if `.next` is missing or older than this commit.
3. Run `npx next start --hostname 127.0.0.1 -p 3000`.
4. Print path, branch, SHA, and `http://127.0.0.1:3000`.
5. Update this section.

## Seats

| Seat | Who | Cap |
| --- | --- | --- |
| Coordinator | Claude Opus 5.5, T3 thread `4a686b7b` | one living thread |
| Worker | Grok 4.6 xhigh via `cursor-agent` CLI (see below) | two |
| Reviewer | Claude (different model from the Grok workers) | one |

Quota failover: whichever of Grok, Codex, or Claude still has usage sits in the vacant seat. The job stays the same.
Worker launcher: `/Users/paramveer/.codex/3ds-artifact-overflow/coord-logs/launch-worker.sh <worktree-name> <target-file>` (sparse worktree from this HEAD, no `model/`).

## Evidence on this tree (static stills; input, motion and audio not compared)

| Scenario | Upper | Lower | Artifacts |
| --- | ---: | ---: | --- |
| `notifications-list-unread-dot` vs native `58fff714…` | **0** (was 6239) | **1431** (was 3876): scrollbar 34, Close 577 (labelled AA), list 820 (labelled AA) | `home-fidelity-20261001/notifications-scrollbar-recapture-20261004/` |
| `browser-start-menu-local` first pair vs native `4bfffefe…` | 95571 | 76728 | `native-new-apps-captures-20261004/browser-start-menu-local/` — native first launch is the first-run welcome dialog with HUD; ours opens the start menu without HUD |

## Next

1. Review (Claude) the integrated runtime slices: scrollbar `0x13a160` (`8cc26b05`), HOME Design rows (`ed167d5b`), Browser Manual footer (`7466b4e4`), HOME entry banner (`7b773b71`).
2. Browser app: native start menu still needs a capture (native first-run is now completed in the `native-new-apps-20261004` clone); Browser upper HUD is missing in ours (native shows `HudMenu_00`).
3. eShop and Miiverse first native pairs (runbook `coord-logs/native-new-apps-runbook-20261004.md`).
4. Regression recapture of earlier static passes after the float32 text-origin change (`8dc72ac6`): Settings Other page 1, Health Usage initial / 8 px.

Whole-scenario 1:1 is unproven.

## History

Append-only log: `/Volumes/Sandisk1/3ds-claude-codex-handoff/LOG.md`.
It is not the restart prompt.
