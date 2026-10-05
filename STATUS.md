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
| HEAD | `cb324a43` — Attribute the HOME 1-row 291-pixel tail so the masked 5426 has no unlabelled component. |

Runtime clamp `c8a56cba`. Recapture note `eb501e00`. Camera HNI badge bind `d9ddf309`. Date-group bind `5c0199f4` recaptured (fill `(255,161,0)`). Slider source-gap `e6bcca9f` (Grok 4.6 **APPROVE** `90be3135`). Photo-crop source-gap `b75f275d` (Grok 4.6 **APPROVE** `9d3237b6`). Date-text source-gap `82a16d1c` (Grok 4.6 **APPROVE** `62457c68`). Selection source-gap `9c431d1d` (Grok 4.6 **APPROVE** `43173720`). Settings-footer X-scale `99a4362e` (Grok 4.6 **APPROVE**; recapture `d6ce9913` Settings **954→630**). Remaining Settings third then `TxtSet` source-size `9580641b` (Grok 4.6 **APPROVE** `3e9c5170`; recapture `3bdc3192` Settings **630→0**). Welcome p5 live-feed source-gap `679db045` (Grok 4.6 **APPROVE** `f14c2241`). Sound Next `Guid1TxtW` source-size `269e8757` (Grok 4.6 **APPROVE**; recapture `a5b8aa9e` interior **195→0**). Sound volume live-slider source-gap `11f3cb3c` (Grok 4.6 **APPROVE** `c4f0fb90`). Sound Span live-spectrum source-gap `57b04572` (Grok 4.6 **APPROVE** `7614c291`). Sound birds held-offset source-gap `9e335f3a` (Grok 4.6 **APPROVE** `f67628f3`). Sound battery underbar-partition source-gap `76a3635a` (Grok 4.6 **APPROVE** `684a3418`). Sound UnderBar Line01 partition source-gap `6db7e7ef` (Grok 4.6 **APPROVE** `d0d96201`). Sound empty-entry row 1916 source-gap (Grok 4.6 **APPROVE** `2807aeb5`). Sound first-run guide perimeter compositor source-gap `02a60c52` (Grok 4.6 **APPROVE** `6cc31903`). Sound empty-entry mid `S_BG` constant source-gap `636976ad` **REJECTED** by Grok 4.6 (native is dump `S_BG_Grid` ETC1 checker `(223,215,206)`/`(231,223,215)`, bound on library path only); grid bind `603c5388` (Opus 5.5) recaptured: empty-entry lower **16021→7216**, mid **2255→0** / **1024→0**; Grok 4.6 **APPROVE-WITH-NITS** `de5c6445`. Leftover queue `cccf162e`. Camera Welcome p3 `TxtDlg` **1079** source-gap `57af95dd` (Grok 4.6 **APPROVE-WITH-NITS** `7e8e13a1`; host-gate probe `1863c4e4` accepts `writer-0x111` for every alignment-4 line alignment the setter stores as 0x111, including Welcome line alignment 2; live recapture owed). Sound upper 316 labelled `14533857` (volume overhang **42** + `S_Back_U` **274**; review pending). Camera large thumbs `PicL_SD` bind `89efb7a3` (recapture `6499f0af` lower **10158→8958**). Camera Slideshow header source-size `04f3d6bf` (recapture `5d25e2a5` header **837→0**). Camera thumb interiors 56×42 sample source-gap `84d636e3` (Grok 4.6 **APPROVE** `2258268a`). Product `acabb7af` kept. GitHub `/Volumes/DeveloperStorage/GitHub/3ds-idea` on `dev-size-opt` is not this site.

Dead T3 parents `4a686b7b` / `d4492840` / `d1bc835d` / `580fab2c` / `42eb773b` are not this Coordinator. Do not reconstruct `42eb773b`.

## Serving

`127.0.0.1:3000` production (`next start`, pid at start 15469) Ready at runtime `5c3903da` (Browser title-local HUD). STATUS `2757aa7b` is docs-only after the review note. `CAMERA_FIXTURE_SDMC_ROOT=/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/user/sdmc` (HNI). Path `/Users/paramveer/.codex/worktrees/3ds-home-fidelity-20261001`, branch `codex/home-fidelity-20261001`. Typecheck 0, `npm test` 2220 pass / 0 fail (2244 tests), build 0. Mac built-in display. Capture Chrome muted. Pixel acceptance remains Azahar own 400×480 vs raw browser 400×240 / 320×240.

## Seats

| Seat | Who | Cap |
| --- | --- | --- |
| Coordinator | this T3 thread `mcp:f3c9a760` (Grok 4.6; took over 5 Oct after Opus 5.5 hit the monthly spend limit; dead parent `42eb773b` stays unread) | one living thread |
| Worker | entry-banner relabel (`entry-banner-relabel-20261005-r1`, Grok 4.7) and Settings main 0/20 (`settings-main-review-20261005-r1`, Grok 4.7). Landed: HOME 1-row tail `cb324a43`, Welcome p2 `c53a96aa` | two |
| Reviewer | plus-tint `ed55865e` (`plus-tint-review-20261005-r1`, Grok 4.6). HUD `463513e8` **APPROVE-WITH-NITS** integrated. Backlog: `14533857`, `22e8b0a4`, `1863c4e4` | one, different model from the worker |

## Evidence on this tree (static stills; input, motion and audio not compared)

| Scenario | Upper | Lower | Artifacts |
| --- | ---: | ---: | --- |
| `settings-other-page1` vs native `424ffb45…` at runtime `1863c4e4` (Mac built-in, date `2026-09-26T03:31:10Z`) | **0** | **0** | `camera-welcome-gate-recapture-20261005/settings-other-page1/` report `9cc86b0c…` max Δ2; held after writer-gate (prior `603c5388` report `62c05201…`) |
| `settings-other-page3` / `page4` vs natives `76ff0914…` / `32509749…` at `603c5388` | **169** | **8** / **35** | `regression-recapture-20261005/settings-other-p34/` reports `d7fe7218…` / `5b9a9133…`; counts held |
| `notifications-list-unread-dot` vs native `58fff714…` at `c8a56cba` (Mac built-in) | **0** | **0** | `home-fidelity-20261001/notifications-scrollbar-1-clamp-recapture-20261005/` report `34eb7d08…` lower `8a624950…` |
| `camera-readonly-view-photos-page1` HNI vs native `cae793c3…` at `3bdc3192` (Mac built-in, SDMC) | **33522** | **7491** | `home-fidelity-20261001/camera-settings-txtset-recapture-20261005/` report `b7da8109…` lower `2657bb85…`; header y<32 **0**; Settings third **630→0** **APPROVE**; date pane **1006**; slider **1992**; photo crop labelled; selection labelled **APPROVE**; thumbs interiors **846/918** labelled **APPROVE** `2258268a` |
| Camera Welcome p3/p4 vs natives `3ad989b5…` / `38c19ca0…` at `1863c4e4` | — | **2479** / **2093** | interiors **1078** / **692**; p3 **1079→1078** (one pixel); p4 held; host-gate `1863c4e4` recaptured `camera-welcome-gate-recapture-20261005/` reports `039e9887…` / `7d33cdf2…`; colour spans still keep the direct sampler off |
| Sound first-run vs native `9dea0cc2…` at `a5b8aa9e` (Mac built-in) | **6094** | **6072** | `home-fidelity-20261001/sound-guide-next-recapture-20261005/` report `3aeaf442…` lower `d78f43b6…`; interior **0**; Next **0**; perimeter **6072** compositor gap **APPROVE** `6cc31903`; volume **130** labelled **APPROVE**; Span **2314** labelled **APPROVE**; birds **1558** labelled **APPROVE**; battery ROI **1** labelled **APPROVE**; Line01 `(92,220)` labelled **APPROVE** |
| Sound empty-entry vs native `65fc5f88…` at `603c5388` (Mac built-in) | **6222** | **7216** | battery **183→1** labelled **APPROVE**; Line01 labelled **APPROVE**; row **1916** labelled **APPROVE** `2807aeb5`; mid-body `[41,96,47,48]` **2255** / under-lip `[136,116,48,28]` **1024** `S_BG` constant gap `636976ad` **REJECTED**; `S_BG_D-Grid` bind `603c5388` **APPROVE-WITH-NITS** `de5c6445` recaptured lower **16021→7216**, mid **0**/**0** (`sound-grid-recapture-20261005/`, lower `860b3222…`); slider/perimeter checker share to be recounted; title/slider/footer unchanged; volume **130** labelled **APPROVE**; Span **2442** labelled **APPROVE**; birds **1558** labelled **APPROVE**; lower byte-identical `ee103d93…` |
| Camera Welcome p1 vs native `52a6dcf7…` at `1863c4e4` (Mac built-in) | **0** | **1401** | interior **0** / perimeter **1401** held (`camera-welcome-gate-recapture-20261005/page1/`, report `04aa56e1…`) |
| Camera Welcome p5 vs native `616fbeae…` at `1863c4e4` (Mac built-in) | **7615** | **1401** | interior lower **0**; illustration centre **0**; live-feed gap **APPROVE** `f14c2241` held (report `21cbb596…`) |

Unread-dot empty mask, max RGB 2, compare status 0. Sound Next interior 0. Camera Slideshow header 0. Camera Settings third 0. Welcome p5 **7615** live-feed source-gap **APPROVE**. Volume **130** live-slider source-gap **APPROVE**. Span **2314**/**2442** live-spectrum source-gap **APPROVE**. Birds **1558** held-offset source-gap **APPROVE**. Battery `[45,216,85,240]` **1** underbar-partition source-gap **APPROVE**. Line01 `(92,220)` partition source-gap **APPROVE**. Empty-entry row **1916** **APPROVE**. Thumb interiors **846/918** **APPROVE**. Guide perimeter **6072** compositor gap **APPROVE** `6cc31903`. Empty-mid **2255**/**1024** → **0**/**0** by grid bind `603c5388` **APPROVE-WITH-NITS** `de5c6445`. p3 `TxtDlg` **1079→1078** after host-gate `1863c4e4` (spans still keep the sampler off). Sound upper 316 labelled `14533857`. y=177 **320** labelled `22e8b0a4`. Plus-tint strip **1992** kept `ed55865e`. Reviews pending. **Static still only.** Whole scenarios still fail.

## Next

Queue: [leftover-queue-2026-10-05](docs/feature-map/leftover-queue-2026-10-05.md). In flight: entry-banner relabel (Grok 4.7), Settings main 0/20 (Grok 4.7), plus-tint review (Grok 4.6). HOME 1-row tail **291** labelled `cb324a43` (unlabelled tail **0**; predicted masked lower **5426**; review pending). Welcome p2 **blocked** `c53a96aa` (no upper guide frame; Azahar black-feed native recapture owed). Browser HUD `5c3903da` serving; HUD strip recapture owed (frozen **10787**). Rank-1 recapture still owed: Settings main, Health Usage, Manual p0 `d0ecf020`, Browser Manual `7466b4e4`, Design `ed167d5b`. Review backlog: `14533857`, `22e8b0a4`, `1863c4e4`, `cb324a43`. Recount Sound slider/perimeter checker share after grid bind. Grid bind **APPROVE-WITH-NITS** `de5c6445`. Unread-dot 0/0, HNI cube, Sound Next interior 0, Camera Slideshow header 0, Camera Settings third 0, empty-entry mid 0/0 stay closed. HOME idle unmatched. Whole scenarios fail (input/motion/audio). Do not claim 1:1.

## History

Append-only log: `/Volumes/Sandisk1/3ds-claude-codex-handoff/LOG.md`.
It is not the restart prompt.
