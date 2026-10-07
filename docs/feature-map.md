# Feature map — 1:1 queue

7 October priority override: finish [AN-01 through AN-04](animation-fidelity-workflow-2026-10-07.md)
for top-row opening, Manual opening, folder entry and HOME suspension. GitHub
restart base is `5ee6fd7`; the historical static queue below is preserved.
All four motion flows are currently fail pending matched frame-sequence proof.

Animation runtime `2169497`: Notes source boot-cover and no-software body are
visible; folder/pause receipt guards are integrated. Empty-mask diagnostics:
Notes complete cover0/0, first-ready9198/46427; folder re-entry first terminal
61126/7478; Camera Manual baseline endpoint446/1038. None passes the scenario.
Manual runtime `127da97` now has the source outgoing/hold/incoming cover.
Opaque-cover static diagnostic0/0; first-ready446/1038 is unchanged. Camera
and Settings desktop repeat captures reach ready, but the first reduced-mobile
Camera run exposed mixed-clock recovery. All motion flows remain fail.
Runtime `61f8b4e` fixes that clock regression and integrates the source Notes
HUD. Repeated normal/reduced mobile Manual and Notes, Settings Manual, folder
tile and physical-HOME browser captures complete without recovery. Notes
first-ready diagnostic is now1263/46427; upper residual is live HUD state,
lower empty-thumbnail brightness remains. Full tests2260 pass,1 historical
Camera PNG failure,96 skip,1 TODO; typecheck/build pass.
Next: source-derived empty Notes thumbnail binding, folder upper-banner
terminal receipt, and remaining top-row common-cover callers. Exact native
input epochs, timing and muted audio remain unverified.
Reviewed source thumbnail runtime `19ee552` is now recaptured: first-ready
1039/731, empty mask, down from46427 lower pixels. Tile interiors match;
footer edge/text and live HUD state remain. Full2266 pass,1 historical PNG
failure,96 skip,1 TODO; typecheck/build and6 source Python tests pass.
Normal native Manual140 own PNGs reproduce cover0/0 and endpoint446/1038;
Notifications94 own PNGs now show the missing outgoing-HOME common cover.
Next: reviewed folder terminal-banner correction and top-row common callers.
See [the current evidence and limitations](animation-fidelity-workflow-2026-10-07.md#integrated-corrections-and-recapture).

6 October 2026. Checkout `f53fbeef` (`codex/home-fidelity-20261001`). This index is the queue. Evidence: [leftover queue](feature-map/leftover-queue-2026-10-05.md), [STATUS.md](../STATUS.md), [progress](progress-2026-09-24.md). If they disagree, evidence wins.

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
| 6 | HOME 1:1 + incomplete animations | Idle pair **23182 / 14754** holds. Compact H-12 **30032 / 47436**. U19 STOP `2b384723` + U19R **APPROVE** `421ed134` ([note](home-compact-h12-2026-10-06.md) / [review](home-compact-h12-review-2026-10-06.md)). N057 box owed | Coordinator |
| 7 | Settings Internet / Data / Parental pairs | Re-dated to native screenshot time (HUD now matches): Internet settled **169 / 1008**, Data root **14 / 177**, Software empty **6 / 22** after U24 `SD Card` lcd sampling `22490950` ([note](settings-sdcard-label-2026-10-06.md), [review](settings-sdcard-label-review-2026-10-06.md) **APPROVE-WITH-NITS**), Parental intro **169 / 0**, Other p1 **117 / 0** (`settings-title-sampling-20261006/*-dated/`). Undated: Internet **1405 / 1008**, Data **1388 / 177**, Software **1939 / 22**, Parental **1414 / 0** after U22 title centre `1cb43fe2` + U23 title LCD sampling `73db7a2b` ([note](settings-title-sampling-2026-10-06.md), [review](settings-title-sampling-review-2026-10-06.md); `settings-title-sampling-20261006/`, title ROI 0/14/0/0; upper rest ≈ HUD). Earlier U22 ([note](settings-title-centre-2026-10-06.md), [review](settings-title-centre-review-2026-10-06.md) **APPROVE-WITH-NITS**; `settings-title-centre-20261006/`). U23 shares Other's `lcd` + `azahar-12p4-fit` title raster on every Settings `CommonBG_U_00` ([note](settings-title-sampling-2026-10-06.md)); offline title ROI **1896/1007/1256/796 → 0/14/0/0**. Coordinator recapture owed. Earlier U21 [data-root state](settings-data-root-state-2026-10-06.md) ([review](settings-data-root-state-review-2026-10-06.md) **APPROVE-WITH-NITS**); recapture `settings-data-root-state-20261006/`. Software empty **6011 / 22** after U20 `c579683b` (number ROI **841→0**; title group left-pinned vs centred → U22). Parental intro **4595 / 0**. NNID unsigned-in native `cc610faa…`. Extra Data **6989 / 51927**. Health General **0 / 0** at `lcdHealthFrame=252` (pixel-threshold-pass). Health General held-down **24904 / 19206**. Transfer **22816 / 76797** (eShop-required vs 3DS/DSi; labelled adaptation). Exact Other p1 official **217 / 0**. Browser HOME→Open is System Update gate `e8562da9…` (**blocked**, update excluded). Remaining §4: Camera folder native / empty browse (six-cell **94661 / 16898**; shoot reached, View Photos/AX blocked), Sound guide p2/p3 native (splash hang), Notifications scroll native, Notes editor native vs `50cb7097…` / `33daea28…`, Friends card native vs `04afa1ba…` / `4c78b5cb…` | Coordinator |

## In-scope surfaces

| Surface | Native pair? | Pixel U / L | Input | Motion | Audio | Gap | Next slice |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| HOME idle | yes (Health 1-row left-anchor) | 23182 / 14754 | fail | fail | fail | fail | official `_06.10.26_13.55.03.154.png` `ebbc2743…` vs raw LCDs `441d366d…` / `656f808f…`; empty mask; native vacant vs Settings; HUD clock/battery. Not pass |
| HOME 1-row (yaw 304) | yes | 190 / 5426 | fail | fail | fail | fail | U17 leftover **APPROVE**: no unused idle pane (`LncCsr_00` already bound). Tail labelled. Still fail |
| HOME Design | yes | 42073 / 9581 | fail | fail | fail | fail | Next #3 leftover APPROVE-WITH-NITS; owed matched HOME backing / cursor / brightness / wallpaper |
| HOME entry banner | browser frames only | none | fail | fail | fail | adaptation | U16 leftover **APPROVE**: no unique writer (`0x1fa344` shared). Footer-14 capture-fit. N057 pixel box still owed |
| HOME compact H-12 | yes (Health sleep + Camera) | 30032 / 47436 | fail | fail | fail | fail | official `93058283…` vs `b368f61d…` / `ac6485d2…`; native compact Health vs browser Camera banner; 2-row/Mii vs 1-row Settings-right. Settings half `8d1b17ab…` / `50d721ec…` kept |
| Power / launch | partial | none whole | fail | fail | fail | fail | timing / audio; durations adapted |
| Settings main | yes | 0 / 20 | fail | fail | fail | fail | labelled; not pass |
| Settings Other p1 | yes | 117 / 0 | fail | fail | fail | fail | official `_06.10.26_15.43.46.991.png` `98d0fc9d…` vs `96ae87a2…` / `809e0f98…`; lower 0; upper **217** HUD clock/battery. Held 0/0 vs older `424ffb45…` remains. Not pass |
| Settings Other p2 | yes | 0 / 960 | fail | fail | fail | fail | overlap source-gap |
| Settings Other p3 | yes | 169 / 8 | fail | fail | fail | fail | HUD 169 labelled |
| Settings Other p4 | yes | 169 / 35 | fail | fail | fail | fail | HUD 169 labelled |
| Settings Internet | yes (settled after first-run OK) | 169 / 1008 | fail | fail | fail | fail | official `f0c5d093…` vs `f9b85092…` / `f9d2a956…`; HUD clock + unfocused blue vs selected yellow + native helper face. U21 unfocused entry recaptured: lower **24076→1008** (native first-run helper face + AA), report `981e35ee…`. First-run helper kept `9fbcbb5c…` **95922 / 76800**. U23 predicted title ROI **1256→0**. Not pass |
| Settings Parental | yes (intro Back/Set) | 169 / 0 | fail | fail | fail | fail | official `98fb3d62…` vs `b0829071…` / `b571493f…`; lower 0; upper HUD/title. No PIN. U23 predicted title ROI **796→0**. Not pass |
| Settings Data | yes (root + Software empty) | 14 / 177 and 6 / 22 | fail | fail | fail | fail | root `686d3dfb…` **4956 / 177** after U21 empty Reset `B_L_Invalid` + unfocused entry (lower **20096→177** AA, report `50fd454f…`). Software empty `9c5cb75c…` vs `21608571…` / `379919e6…` **6011 / 22** report `86cce230…` after U20 dump `TextBox_05` bind of portfolio fixture `65,536` ([note](settings-open-blocks-2026-10-06.md), [review](settings-open-blocks-review-2026-10-06.md) **APPROVE-WITH-NITS**); number ROI **0**. Title group centred (U22); U23 predicted title ROI Software **1896→0**, Data **1007→0–14**. Extra Data still has native `?` row |
| Settings Manual p0 | yes (reconstructed native) | 2543 / 1821 | fail | fail | fail | fail | leftover U11 + U11R **APPROVE-WITH-NITS**: title ROI 0; unique unused ScrollIndicator 858; remaining already-bound AA. Not pass |
| Settings NNID / Transfer | yes | Transfer 22816 / 76797 and NNID 82096 / 74907 | fail | fail | fail | fail | Transfer official `01ff4af3…` vs `0e531310…` / `b1d9a863…`; native eShop-required vs portfolio 3DS/DSi. NNID official `cc610faa…` vs `6ea86f3a…` / `c1a5b348…` **82096 / 74907** report `6ca33395…` (`settings-nnid-20261006/`). Native Sign in chrome vs portfolio Account-services-unavailable. Labelled adaptation. Do not paint / Sign in / launch eShop |
| Health Usage | yes | 0 / 0 | fail | fail | fail | fail | Next #2 pixel-tier 0/0 at frame 327; not pass |
| Health General / articles | yes (article top) | 0 / 0 | fail | fail | fail | fail | official `c63b1153…` vs `bfdf9da2…` / `1d829435…` at `lcdHealthFrame=252` **pixel-threshold-pass** max Δ2 (`health-general-frame-sweep-20261006/`, report `f6d1afbb…`). Was 23993 (TopLoop frame 15). Held-down **0 / 19206** at `lcdHealthFrame=292` (`health-held-down-frame-sweep-20261006/`, report `3743d387…`; lower = native held-key scroll lands between browser tap steps — needs controlled-hold native capture). Static tier only |
| Camera browse p1 | yes | 33522 / 7491 | fail | fail | fail | fail | labelled interiors; date/slider remain |
| Camera Welcome p1 | yes | 0 / 1401 | fail | fail | fail | fail | perimeter 1401 |
| Camera Welcome p2 | mismatch | 93408 / — | — | — | — | blocked | leftover §5 #6; LIVE-AZAHAR ☐ |
| Camera Welcome p3 | yes | 7615 / 2479 | fail | fail | fail | fail | TxtDlg 1078 |
| Camera Welcome p4 | yes | 7615 / 2093 | fail | fail | fail | fail | TxtDlg 692 |
| Camera Welcome p5 | yes | 7615 / 1401 | fail | fail | fail | source-gap | live-feed APPROVE |
| Camera folder / empty / full / paging | six-cell yes; folder native owed | 94661 / 16898 | fail | fail | fail | fail | six-cell official `_06.10.26_16.19.55.191.png` `7f67f64b…` vs `d6086990…` / `1649ce00…` **94661 / 16898** report `7194813a…` (`camera-folder-20261006/`). Native date-group + 3 thumbs vs browser 6-photo grid. Folder list browser kept; native folder / empty browse still owed |
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
| Internet Browser start menu | native-only (update gate) | none usable | fail | fail | fail | blocked | HOME toolbar `(189,16)` → Open is official `_06.10.26_15.37.10.852.png` `e8562da9…` System Update required. Not start menu. Update excluded. Welcome pair still mismatch |
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
