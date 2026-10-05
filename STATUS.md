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
| HEAD | `78206164` — Record Mac-screen recapture of Sound empty-entry: battery plug 183->1, lower unchanged. |

Runtime clamp `c8a56cba`. Recapture note `eb501e00`. Camera HNI badge bind `d9ddf309` recaptured (cube `(100,100,100)`). Product `acabb7af` kept. GitHub `/Volumes/DeveloperStorage/GitHub/3ds-idea` on `dev-size-opt` is not this site.

Dead T3 parents `4a686b7b` / `d4492840` / `d1bc835d` / `580fab2c` are not this Coordinator.

## Serving

`127.0.0.1:3000` production Ready at `c8a56cba` with `CAMERA_FIXTURE_SDMC_ROOT` (HNI). User authorized the **Mac built-in** display (Sidecar disconnected). Recheck geometry before each visible window. Pixel acceptance remains Azahar own 400×480 vs raw browser 400×240 / 320×240. Mute unless the user unmutes for audio.

## Seats

| Seat | Who | Cap |
| --- | --- | --- |
| Coordinator | this T3 thread (steered from grilling `a1e53fbc`; Grok 4.6) | one living thread |
| Worker | Camera date-group (`camera-date-group-20261005-r1`) and Camera browse slider (`camera-browse-slider-20261005-r1`); both Grok 4.7 | two |
| Reviewer | none | one, different model from the worker |

## Evidence on this tree (static stills; input, motion and audio not compared)

| Scenario | Upper | Lower | Artifacts |
| --- | ---: | ---: | --- |
| `notifications-list-unread-dot` vs native `58fff714…` at `c8a56cba` (Mac built-in) | **0** | **0** | `home-fidelity-20261001/notifications-scrollbar-1-clamp-recapture-20261005/` report `34eb7d08…` lower `8a624950…` |
| `camera-readonly-view-photos-page1` HNI vs native `cae793c3…` at `eb501e00` (Mac built-in, SDMC) | **33522** | **12872** | `home-fidelity-20261001/camera-3d-badge-sdmc-recapture-20261005/` report `a6925bfc…` cube `(100,100,100)` / badge box **7** |
| Camera Welcome p3/p4 vs natives `3ad989b5…` / `38c19ca0…` | — | **2480** / **2093** | interiors **1079** / **692** unchanged (byte-identical hashed lowers) |
| Sound first-run vs native `9dea0cc2…` at `898d0752` (Mac built-in) | **6094** | **6267** | perimeter **6072** / interior **195** unchanged (byte-identical hashed HudTime pair) |
| Sound empty-entry vs native `65fc5f88…` at `0eee41c6` (Mac built-in) | **6222** | **16021** | battery **183→1**; title/row/slider/footer unchanged; lower byte-identical `ee103d93…` |
| Camera Welcome p1 vs native `52a6dcf7…` at `78206164` (Mac built-in) | **0** | **1401** | interior **0** / perimeter **1401** unchanged (byte-identical hashed `0d7bfea`) |

Unread-dot empty mask, max RGB 2, compare status 0. Camera badge white cube gone. **Static still only.** Whole scenarios still fail.

## Next

**Camera date-group cell leftover** in flight (Grok 4.7 `camera-date-group-20261005-r1`; native centre `(255,161,0)` vs browser `(230,209,173)`). Second worker: Camera browse slider chrome (native ± vs browser speech icons, strip **1992**). Welcome p1 recapture is byte-identical (**0 / 1401**). Sound empty-entry battery **183→1**. Unread-dot 0/0 and HNI cube stay closed. HOME idle unmatched. Do not claim 1:1.

## History

Append-only log: `/Volumes/Sandisk1/3ds-claude-codex-handoff/LOG.md`.
It is not the restart prompt.
