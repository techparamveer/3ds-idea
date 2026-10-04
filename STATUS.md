# STATUS — 1:1 firmware UI

Rewrite this file whenever `HEAD` moves or localhost starts or stops.
If this SHA disagrees with `git rev-parse HEAD`, git wins; rewrite this file before any worker.

Updated: 4 October 2026.

## Product

The page shows only an original **2012 Silver + Black Nintendo 3DS XL (SPR-001)** and its background. Firmware on the two LCDs is **EUR 10.7.0-32E**, English. Eight portfolio apps sit on HOME (Work, Side Projects, Hobbies, Life, HackUK, NVIDIA/Renu, About, Contact). In-scope stock UI: HOME, Settings and helpers, Health, Camera (gallery), Sound, eShop, Zone, Notes, Friends, Notifications, local Browser and Miiverse, amiibo opening, power and launch. Software Keyboard and the six plaza-style titles stay out.

**Done-means:** same inputs in isolated Azahar and the production browser; Azahar 400×480 PNG versus raw LCDs 400×240 / 320×240. Tests, source renders, and a browser look never pass a scenario. Whole-scenario 1:1 is unproven.

**This run:** reconcile (git wins on SHA) then continue from **Next**. Scope fights: [docs/portfolio-ui-scope.md](docs/portfolio-ui-scope.md). Hardware photographs: [GOAL.md](GOAL.md).

## Checkout

| Field | Value |
| --- | --- |
| Path | `/Users/paramveer/.codex/worktrees/3ds-home-fidelity-20261001` |
| Branch | `codex/home-fidelity-20261001` |
| HEAD | `3e65107a` — Rewrite STATUS HEAD to a65b1385 after the Product slice. |

Runtime bind `9da8dd25` plus nits `73dcc174`. `acabb7af` Product/pointers and `a65b1385` STATUS SHA rewrite are docs-only. GitHub `/Volumes/DeveloperStorage/GitHub/3ds-idea` on `dev-size-opt` is not this site.

Dead T3 parents `4a686b7b` / `d4492840` / `d1bc835d` / `580fab2c` are not this Coordinator.

## Serving

`127.0.0.1:3000` at `73dcc174` (production `npx next start --hostname 127.0.0.1 -p 3000`). Isolated Azahar and this browser go on **iPad Sidecar** only (Quartz `1800,367,1164×802`). Recheck geometry before each visible window. If Sidecar is disconnected, ask; do not fall back to the laptop. Pixel acceptance remains Azahar own 400×480 vs raw browser 400×240 / 320×240. Mute unless the user unmutes for audio.

## Seats

| Seat | Who | Cap |
| --- | --- | --- |
| Coordinator | this T3 thread (steered from grilling `a1e53fbc`; Grok 4.6) | one living thread |
| Worker | none in flight | two |
| Reviewer | none in flight | one, different model from the worker |

## Evidence on this tree (static stills; input, motion and audio not compared)

| Scenario | Upper | Lower | Artifacts |
| --- | ---: | ---: | --- |
| `notifications-list-unread-dot` vs native `58fff714…` at `73dcc174` | **0** | **1094** (was 1431): scrollbar **34**, Close **240** (was 577), list **820** max 18 | `home-fidelity-20261001/notifications-close-list-recapture-20261004/` report `556401d1…` |

Sidecar recapture reused frozen native PNG; Azahar was not relaunched. Contact sheets inspected: upper heatmap all black; remaining lower red is Close shadow/seam plus list title fringe and scrollbar 34. One muted-browser 404 in the capture log. Whole scenario still fail.

## Next

Recapture of Close **240** / list **820** / scrollbar **34** is done for `73dcc174` (this Coordinator). Remaining on that pair stay labelled; do not reopen HUD (upper 0) or the bound Close 0x110 writer without a new dump owner. Next leftover unpicked.

## History

Append-only log: `/Volumes/Sandisk1/3ds-claude-codex-handoff/LOG.md`.
It is not the restart prompt.
