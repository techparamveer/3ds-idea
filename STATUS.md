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
| HEAD | `6cc31903` — Record independent APPROVE of the Sound guide perimeter compositor source-gap. |

Runtime clamp `c8a56cba`. Recapture note `eb501e00`. Camera HNI badge bind `d9ddf309`. Date-group bind `5c0199f4` recaptured (fill `(255,161,0)`). Slider source-gap `e6bcca9f` (Grok 4.6 **APPROVE** `90be3135`). Photo-crop source-gap `b75f275d` (Grok 4.6 **APPROVE** `9d3237b6`). Date-text source-gap `82a16d1c` (Grok 4.6 **APPROVE** `62457c68`). Selection source-gap `9c431d1d` (Grok 4.6 **APPROVE** `43173720`). Settings-footer X-scale `99a4362e` (Grok 4.6 **APPROVE**; recapture `d6ce9913` Settings **954→630**). Remaining Settings third then `TxtSet` source-size `9580641b` (Grok 4.6 **APPROVE** `3e9c5170`; recapture `3bdc3192` Settings **630→0**). Welcome p5 live-feed source-gap `679db045` (Grok 4.6 **APPROVE** `f14c2241`). Sound Next `Guid1TxtW` source-size `269e8757` (Grok 4.6 **APPROVE**; recapture `a5b8aa9e` interior **195→0**). Sound volume live-slider source-gap `11f3cb3c` (Grok 4.6 **APPROVE** `c4f0fb90`). Sound Span live-spectrum source-gap `57b04572` (Grok 4.6 **APPROVE** `7614c291`). Sound birds held-offset source-gap `9e335f3a` (Grok 4.6 **APPROVE** `f67628f3`). Sound battery underbar-partition source-gap `76a3635a` (Grok 4.6 **APPROVE** `684a3418`). Sound UnderBar Line01 partition source-gap `6db7e7ef` (Grok 4.6 **APPROVE** `d0d96201`). Sound empty-entry row 1916 source-gap (Grok 4.6 **APPROVE** `2807aeb5`). Sound first-run guide perimeter compositor source-gap `02a60c52` (Grok 4.6 **APPROVE** `6cc31903`). Sound empty-entry mid `S_BG` constant source-gap `636976ad` (**2255**/**1024**; review in flight). Camera Welcome p3 `TxtDlg` **1079** source-gap `57af95dd` (review queued). Camera large thumbs `PicL_SD` bind `89efb7a3` (recapture `6499f0af` lower **10158→8958**). Camera Slideshow header source-size `04f3d6bf` (recapture `5d25e2a5` header **837→0**). Camera thumb interiors 56×42 sample source-gap `84d636e3` (Grok 4.6 **APPROVE** `2258268a`). Product `acabb7af` kept. GitHub `/Volumes/DeveloperStorage/GitHub/3ds-idea` on `dev-size-opt` is not this site.

Dead T3 parents `4a686b7b` / `d4492840` / `d1bc835d` / `580fab2c` / `42eb773b` are not this Coordinator. Do not reconstruct `42eb773b`.

## Serving

Not serving (5 Oct, Opus 5.5 coordinator start): nothing listens on `127.0.0.1:3000`; Azahar not running. Last served runtime was the TxtSet-sampler bundle (`9580641b`); every commit since is docs/tests only. User authorized the **Mac built-in** display (Sidecar disconnected). Recheck geometry before each visible window. Pixel acceptance remains Azahar own 400×480 vs raw browser 400×240 / 320×240. Mute unless the user unmutes for audio.

## Seats

| Seat | Who | Cap |
| --- | --- | --- |
| Coordinator | this T3 thread `mcp:f3c9a760` (Claude Opus 5.5, 1M; took over 5 Oct from dead Grok 4.6 `42eb773b`) | one living thread |
| Worker | leftover audit (`leftover-audit-20261005-r1`, Grok 4.7, worktree `leftover-audit-20261005`); second seat open | two |
| Reviewer | Sound empty-entry mid (`sound-empty-mid-review-20261005-r1`, Grok 4.6); p3 `TxtDlg` review queued | one, different model from the worker |

## Evidence on this tree (static stills; input, motion and audio not compared)

| Scenario | Upper | Lower | Artifacts |
| --- | ---: | ---: | --- |
| `notifications-list-unread-dot` vs native `58fff714…` at `c8a56cba` (Mac built-in) | **0** | **0** | `home-fidelity-20261001/notifications-scrollbar-1-clamp-recapture-20261005/` report `34eb7d08…` lower `8a624950…` |
| `camera-readonly-view-photos-page1` HNI vs native `cae793c3…` at `3bdc3192` (Mac built-in, SDMC) | **33522** | **7491** | `home-fidelity-20261001/camera-settings-txtset-recapture-20261005/` report `b7da8109…` lower `2657bb85…`; header y<32 **0**; Settings third **630→0** **APPROVE**; date pane **1006**; slider **1992**; photo crop labelled; selection labelled **APPROVE**; thumbs interiors **846/918** labelled **APPROVE** `2258268a` |
| Camera Welcome p3/p4 vs natives `3ad989b5…` / `38c19ca0…` | — | **2480** / **2093** | interiors **1079** / **692**; p3 `TxtDlg` **1079** labelled `57af95dd` (review queued); p4 **692** labelled |
| Sound first-run vs native `9dea0cc2…` at `a5b8aa9e` (Mac built-in) | **6094** | **6072** | `home-fidelity-20261001/sound-guide-next-recapture-20261005/` report `3aeaf442…` lower `d78f43b6…`; interior **0**; Next **0**; perimeter **6072** compositor gap **APPROVE** `6cc31903`; volume **130** labelled **APPROVE**; Span **2314** labelled **APPROVE**; birds **1558** labelled **APPROVE**; battery ROI **1** labelled **APPROVE**; Line01 `(92,220)` labelled **APPROVE** |
| Sound empty-entry vs native `65fc5f88…` at `0eee41c6` (Mac built-in) | **6222** | **16021** | battery **183→1** labelled **APPROVE**; Line01 labelled **APPROVE**; row **1916** labelled **APPROVE** `2807aeb5`; mid-body `[41,96,47,48]` **2255** / under-lip `[136,116,48,28]` **1024** labelled `S_BG` constant `636976ad` (review in flight); title/slider/footer unchanged; volume **130** labelled **APPROVE**; Span **2442** labelled **APPROVE**; birds **1558** labelled **APPROVE**; lower byte-identical `ee103d93…` |
| Camera Welcome p1 vs native `52a6dcf7…` at `78206164` (Mac built-in) | **0** | **1401** | interior **0** / perimeter **1401** unchanged (byte-identical hashed `0d7bfea`) |
| Camera Welcome p5 vs native `616fbeae…` (Mac built-in) | **7615** | **1401** | interior lower **0**; illustration centre **0**; labelled live-feed gap **APPROVE** `f14c2241` |

Unread-dot empty mask, max RGB 2, compare status 0. Sound Next interior 0. Camera Slideshow header 0. Camera Settings third 0. Welcome p5 **7615** live-feed source-gap **APPROVE**. Volume **130** live-slider source-gap **APPROVE**. Span **2314**/**2442** live-spectrum source-gap **APPROVE**. Birds **1558** held-offset source-gap **APPROVE**. Battery `[45,216,85,240]` **1** underbar-partition source-gap **APPROVE**. Line01 `(92,220)` partition source-gap **APPROVE**. Empty-entry row **1916** **APPROVE**. Thumb interiors **846/918** **APPROVE**. Guide perimeter **6072** compositor gap **APPROVE** `6cc31903`. Empty-mid **2255**/**1024** and p3 `TxtDlg` **1079** labelled, reviews pending. **Static still only.** Whole scenarios still fail.

## Next

Reviews: Empty-mid `636976ad` in flight (Grok 4.6); then p3 `TxtDlg` `57af95dd` (Grok 4.6). Leftover audit (Grok 4.7) writes `docs/feature-map/leftover-queue-2026-10-05.md`, a ranked queue of unlabelled residuals, unreviewed gaps, runtime awaiting recapture and unpaired scenarios. Second worker seat takes its top source-only item. Every static cluster on Camera browse/Welcome and Sound first-run/empty-entry is closed or labelled; do not reopen. Unread-dot 0/0, HNI cube, Sound Next interior 0, Camera Slideshow header 0 and Camera Settings third 0 stay closed. HOME idle unmatched. Whole scenarios fail (input/motion/audio). Do not claim 1:1.

## History

Append-only log: `/Volumes/Sandisk1/3ds-claude-codex-handoff/LOG.md`.
It is not the restart prompt.
