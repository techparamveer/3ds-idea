# Feature map — 1:1 queue

5 October 2026. Checkout `bd0f8b72` (`codex/home-fidelity-20261001`). This index is the queue. Evidence: [leftover queue](feature-map/leftover-queue-2026-10-05.md), [STATUS.md](../STATUS.md), [progress](progress-2026-09-24.md). If they disagree, evidence wins.

Pixel-tier **0/0 is not pass**. Whole scenarios still **fail** on input, motion, and audio unless a row says otherwise. Tests, source renders, and browser inspection are not acceptance.

**LIVE-AZAHAR:** isolated copy `/Volumes/Sandisk1/3ds-portfolio-azahar-isolated-20260926` (Static 2 / Null 1 / Vulkan 2). Nintendo Zone skipped. Do not A on Activity Log / excluded titles. Never `/Applications/Azahar.app`.

Pick the first unmatched **Next** row, then any in-scope surface whose gap is `fail` and whose pair is usable. Closed leftover-§5 labels (Sound upper 316, y=177, Camera plus-tint, Settings Other HUD 169) stay in evidence, not this queue.

## Next

| # | Slice | Evidence | Seat |
| ---: | --- | --- | --- |
| 1 | Browser HUD fade **1200 → 0**; chrome **81** | leftover + review **APPROVE-WITH-NITS**: `LoadingIconW` wait-dots at `LoadingIconPos`. Unpublished. Do not guess-paint. Phase mask after attach | Closed leftover |
| 2 | Health Usage **0 / 0** at `lcdHealthFrame=327` | leftover + review **APPROVE-WITH-NITS**; coordinator recapture `/Volumes/Sandisk1/3ds-fidelity-artifacts/health-usage-frame327-20261005/` report `7b8ea2c2…` max 2. Receipt `healthTopLoopFrame=327`. Pixel-tier 0/0 is not pass | Closed leftover. Input/motion/audio open |
| 3 | HOME Design **42073 / 9581** | leftover [REJECT](/Users/paramveer/.codex/worktrees/home-design-9581-review-20261005/docs/home-design-9581-review-2026-10-05.md) then [revised](/Users/paramveer/.codex/worktrees/home-design-9581-20261005/docs/home-design-9581-2026-10-05.md) + [re-review](/Users/paramveer/.codex/worktrees/home-design-9581-rereview-20261005/docs/home-design-9581-rereview-2026-10-05.md) **APPROVE-WITH-NITS**: HOME backing, `PtCsr_00` corners, Brightness state. No unique pane. Upper wallpaper/HUD epoch | Closed leftover |
| 4 | Browser Manual footer **1684** | leftover + [review](/Users/paramveer/.codex/worktrees/browser-manual-1684-review-20261005/docs/browser-manual-1684-review-2026-10-05.md) **APPROVE-WITH-NITS**: footer AA. Page-path omits `ScrollIndicator` **894** (native teal 4×149; do not size from 6×151). Close 40-px hairline is edge, not glyph AA | Closed leftover |
| 5 | Owed recaptures | leftover §3: Settings Manual p0 `d0ecf020` recaptured **2543 / 1821** title ROI **332→0**. Entry banner `7b773b71` browser frames collected `/Volumes/Sandisk1/3ds-fidelity-artifacts/home-entry-banner-20261005/run/` (26 pairs; homeUpdateDelta **17** at frame-008). Native N057 `17d3ecc0…` not on volume; pixel box still owed. Remaining: post-`8dc72ac6` regressions | Coordinator |
| 6 | HOME 1:1 + incomplete animations | U16 leftover **APPROVE**: no unique N057 writer. U17 leftover **APPROVE**: no unused idle pane. Idle pair owed. Compact H-12 different pair. Zone skipped | Coordinator |

## In-scope surfaces

| Surface | Native pair? | Pixel U / L | Input | Motion | Audio | Gap | Next slice |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| HOME idle | live HOME exists, not idle | none idle | fail | fail | fail | fail | Sidecar EUR HOME 5 Oct 19:35 Game Notes selected `7b7905c6…` (`cda8959f…` / `c9079395…`); idle still owed |
| HOME 1-row (yaw 304) | yes | 190 / 5426 | fail | fail | fail | fail | U17 leftover **APPROVE**: no unused idle pane (`LncCsr_00` already bound). Tail labelled. Still fail |
| HOME Design | yes | 42073 / 9581 | fail | fail | fail | fail | Next #3 leftover APPROVE-WITH-NITS; owed matched HOME backing / cursor / brightness / wallpaper |
| HOME entry banner | browser frames only | none | fail | fail | fail | adaptation | U16 leftover **APPROVE**: no unique writer (`0x1fa344` shared). Footer-14 capture-fit. N057 pixel box still owed |
| HOME folders / toolbar / footer | yes (unmatched epochs) | none usable | fail | fail | fail | fail | captured residuals only |
| Power / launch | partial | none whole | fail | fail | fail | fail | timing / audio; durations adapted |
| Settings main | yes | 0 / 20 | fail | fail | fail | fail | labelled; not pass |
| Settings Other p1 | yes | 0 / 0 | fail | fail | fail | fail | held; not pass |
| Settings Other p2 | yes | 0 / 960 | fail | fail | fail | fail | overlap source-gap |
| Settings Other p3 | yes | 169 / 8 | fail | fail | fail | fail | HUD 169 labelled |
| Settings Other p4 | yes | 169 / 35 | fail | fail | fail | fail | HUD 169 labelled |
| Settings Internet | browser only | none | fail | fail | fail | fail | browser half `f9b85092…` / `f9d2a956…`; native owed |
| Settings Parental | browser only | none | fail | fail | fail | fail | browser half `b0829071…` / `b571493f…` (Set / covered features; no PIN); native owed |
| Settings Data | browser only | none | fail | fail | fail | fail | browser half `a788e2fc…` / `cc40fb23…`; native owed |
| Settings Manual p0 | yes (reconstructed native) | 2543 / 1821 | fail | fail | fail | fail | leftover U11 + U11R **APPROVE-WITH-NITS**: title ROI 0; unique unused ScrollIndicator 858; remaining already-bound AA. Not pass |
| Settings NNID / Transfer | no | none | fail | fail | fail | fail | leftover §4 pair |
| Health Usage | yes | 0 / 0 | fail | fail | fail | fail | Next #2 pixel-tier 0/0 at frame 327; not pass |
| Health General / articles | no | none | fail | fail | fail | fail | leftover §4 pair |
| Camera browse p1 | yes | 33522 / 7491 | fail | fail | fail | fail | labelled interiors; date/slider remain |
| Camera Welcome p1 | yes | 0 / 1401 | fail | fail | fail | fail | perimeter 1401 |
| Camera Welcome p2 | mismatch | 93408 / — | — | — | — | blocked | leftover §5 #6; LIVE-AZAHAR ☐ |
| Camera Welcome p3 | yes | 7615 / 2479 | fail | fail | fail | fail | TxtDlg 1078 |
| Camera Welcome p4 | yes | 7615 / 2093 | fail | fail | fail | fail | TxtDlg 692 |
| Camera Welcome p5 | yes | 7615 / 1401 | fail | fail | fail | source-gap | live-feed APPROVE |
| Camera folder / empty / full / paging | no usable | none | fail | fail | fail | fail | leftover §4 pair |
| Sound first-run | yes | 6094 / 6072 | fail | fail | fail | fail | perimeter 6072 |
| Sound empty-entry | yes | 6222 / 7216 | fail | fail | fail | fail | labelled leftovers |
| Sound guide p2 / p3 | no | none | fail | fail | fail | fail | leftover §4 pair |
| Sound supplied-song playback | no | none | — | — | — | blocked | no user songs |
| eShop | yes | 44880 / 76486 | fail | fail | fail | fail | leftover + review **APPROVE-WITH-NITS**: NNID vs welcome scene-mismatch; HUD 194 phase; welcome source-gap (account). Do not paint |
| Nintendo Zone | browser only | none | fail | fail | fail | fail | **skipped** (user). Browser half `0697ac09…` / `76af1ed7…`; `semanticRouteMatched=false`. Native `0000000d.app` not this leftover |
| Game Notes | yes | 89343 / 76679 | fail | fail | fail | fail | leftover U13B + U13R2 **APPROVE**: tutorial vs Note 1 **89343 / 76679** and empty-grid `0f1f7eb5…` **90386 / 46427**. Scene-mismatch. Do not paint |
| Friends | yes | 95998 / 40951 | fail | fail | fail | fail | leftover U12 + U12R **APPROVE-WITH-NITS**: scene-mismatch Error 002-0121 vs Friend List card. Post-OK no-Mii `0dbe3669…` is excluded Mii Maker, not an empty own-card. Do not paint |
| Notifications unread-dot | yes | 0 / 0 | fail | fail | fail | fail | held; not pass |
| Notifications scroll / detail | no | none | fail | fail | fail | fail | leftover §4 pair |
| Internet Browser HUD | yes | 81 / — | fail | fail | fail | fail | Next #1 leftover U08; fade 1200 closed |
| Internet Browser Manual p0 | yes | 2154 / 2430 | fail | fail | fail | fail | Next #4 leftover APPROVE-WITH-NITS; page-path omits ScrollIndicator 894 |
| Internet Browser start menu | mismatch | none usable | fail | fail | fail | fail | leftover §4 recapture |
| Miiverse | yes | 96000 / 30822 | fail | fail | fail | fail | leftover + review **APPROVE-WITH-NITS**: 022-5362 vs Communities; empty interior source-gap. Close-frame upper body 0 vs browser. Do not paint error |
| amiibo opening | no | none | — | — | — | blocked | no in-scope caller |
| Work | no native interior | — | fail | fail | fail | adaptation | HOME / launch chrome only |
| Side Projects | no native interior | — | fail | fail | fail | adaptation | HOME / launch chrome only |
| Hobbies | no native interior | — | fail | fail | fail | adaptation | HOME / launch chrome only |
| Life | no native interior | — | fail | fail | fail | adaptation | HOME / launch chrome only |
| HackUK | no native interior | — | fail | fail | fail | adaptation | HOME / launch chrome only |
| NVIDIA / Renu | no native interior | — | fail | fail | fail | adaptation | HOME / launch chrome only |
| About | no native interior | — | fail | fail | fail | adaptation | HOME / launch chrome only |
| Contact | no native interior | — | fail | fail | fail | adaptation | HOME / launch chrome only |

HUD charging (HOME / Settings / Notifications / eShop / Zone / Sound) is a declared reference-session **adaptation**, not a live telemetry pass. See [scope](portfolio-ui-scope.md).

## Excluded (not backlog)

Software Keyboard · Activity Log · Download Play · Mii Maker · StreetPass Mii Plaza · AR Games · Face Raiders.

Remote web, network, account, PIN, capture, and microphone stay out. Internal helpers do not get invented HOME tiles.

## Also

| Doc | Use |
| --- | --- |
| [leftover queue](feature-map/leftover-queue-2026-10-05.md) | Residual counts, owed recaptures, missing pairs |
| [leftover log 5 Oct](feature-map/history-2026-10-05.md) | Archived diary; not the queue |
| [design-to-ship](feature-map/design-to-ship.md) | Implemented vs missing UI |
| [HOME / lifecycle](feature-map/home-and-lifecycle.md) · [Settings / services](feature-map/system-and-online-apps.md) · [media / social / portfolio](feature-map/media-social-and-portfolio.md) | Route inventories |
| [progress](progress-2026-09-24.md) · [verification](architecture/verification.md) · [workstreams](feature-map/workstreams.md) | Evidence and owners |
