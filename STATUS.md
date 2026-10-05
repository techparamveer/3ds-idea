# STATUS — 1:1 firmware UI

Rewrite this file whenever `HEAD` moves or localhost starts or stops.
If this SHA disagrees with `git rev-parse HEAD`, git wins; rewrite this file before any worker.

Updated: 5 October 2026.

## Product

The page shows only an original **2012 Silver + Black Nintendo 3DS XL (SPR-001)** and its background. Firmware on the two LCDs is **EUR 10.7.0-32E**, English. Eight portfolio apps sit on HOME (Work, Side Projects, Hobbies, Life, HackUK, NVIDIA/Renu, About, Contact). In-scope stock UI: HOME, Settings and helpers, Health, Camera (gallery), Sound, eShop, Zone, Notes, Friends, Notifications, local Browser and Miiverse, amiibo opening, power and launch. Software Keyboard and the six plaza-style titles stay out.

**Done-means:** same inputs in isolated Azahar and the production browser; Azahar 400×480 PNG versus raw LCDs 400×240 / 320×240. Tests, source renders, and a browser look never pass a scenario. Whole-scenario 1:1 is unproven.

**This run:** reconcile (git wins on SHA) then continue from **Next**. Scope fights: [docs/portfolio-ui-scope.md](docs/portfolio-ui-scope.md). Hardware photographs: [GOAL.md](GOAL.md).

## Checkout

| Field | Value |
| --- | --- |
| Path | `/Users/paramveer/.codex/worktrees/3ds-home-fidelity-20261001` |
| Branch | `codex/home-fidelity-20261001` |
| HEAD | `eb501e00` — Record Mac-screen recapture of the A8 blit clamp: scrollbar 1→0. |

Runtime clamp `c8a56cba`. Recapture note `eb501e00`. Camera HNI badge bind `d9ddf309` recaptured (cube `(100,100,100)`). Product `acabb7af` kept. GitHub `/Volumes/DeveloperStorage/GitHub/3ds-idea` on `dev-size-opt` is not this site.

Dead T3 parents `4a686b7b` / `d4492840` / `d1bc835d` / `580fab2c` are not this Coordinator.

## Serving

`127.0.0.1:3000` production Ready at `c8a56cba` with `CAMERA_FIXTURE_SDMC_ROOT` (HNI). User authorized the **Mac built-in** display (Sidecar disconnected). Recheck geometry before each visible window. Pixel acceptance remains Azahar own 400×480 vs raw browser 400×240 / 320×240. Mute unless the user unmutes for audio.

## Seats

| Seat | Who | Cap |
| --- | --- | --- |
| Coordinator | this T3 thread (steered from grilling `a1e53fbc`; Grok 4.6) | one living thread |
| Worker | Camera date-group cell (Grok 4.7, spawning) | two |
| Reviewer | none | one, different model from the worker |

## Evidence on this tree (static stills; input, motion and audio not compared)

| Scenario | Upper | Lower | Artifacts |
| --- | ---: | ---: | --- |
| `notifications-list-unread-dot` vs native `58fff714…` at `c8a56cba` (Mac built-in) | **0** | **0** | `home-fidelity-20261001/notifications-scrollbar-1-clamp-recapture-20261005/` report `34eb7d08…` lower `8a624950…` |
| `camera-readonly-view-photos-page1` HNI vs native `cae793c3…` at `eb501e00` (Mac built-in, SDMC) | **33522** | **12872** | `home-fidelity-20261001/camera-3d-badge-sdmc-recapture-20261005/` report `a6925bfc…` cube `(100,100,100)` / badge box **7** |
| Camera Welcome p3/p4 vs natives `3ad989b5…` / `38c19ca0…` | — | **2480** / **2093** | interiors **1079** / **692** unchanged (byte-identical hashed lowers) |

Unread-dot empty mask, max RGB 2, compare status 0. Camera badge white cube gone. **Static still only.** Whole scenarios still fail.

## Next

**Camera date-group cell leftover** in flight (native centre `(255,161,0)` vs browser `(230,209,173)`; `cameraDateGroupOrange` already sets `ThmbBase` constant 5 to UserBG orange). Unread-dot 0/0 and HNI cube stay closed. Welcome p3/p4 labelled gap stands. HOME idle unmatched. Do not claim 1:1.

## History

Append-only log: `/Volumes/Sandisk1/3ds-claude-codex-handoff/LOG.md`.
It is not the restart prompt.
