# Leftover queue — 5 October 2026

Read-only audit by a Claude Opus 5.5 worker. Base `6cc31903`; STATUS checked
at `bcfdc8bf`. No Azahar, production browser, preview or recapture. Counts are
any RGB channel >2/255 with the empty mask `dc4b320b…`. I recomputed them with
Pillow from the frozen PNGs named below. This is a queue, not acceptance.
Whole scenarios still fail on input, motion and audio. Not 1:1.

Roots: `O=/Users/paramveer/.codex/3ds-artifact-overflow`,
`H=$O/home-fidelity-20261001`, `M=$O/captures-20260926/reference/scenario-matrix/v1/captures`.
This audit skips work already in flight: the Sound empty-mid `S_BG_D-Grid`
bind and the Camera Welcome p3 `TxtDlg` 1079 review.

## 1. Unlabelled static residuals on frozen pairs

| Scenario / pair | ROI (half-open) | Count | Finding | Owner note | Suggested source-only slice |
| --- | --- | ---: | --- | --- | --- |
| Sound first-run + empty-entry upper. Natives `9dea0cc2…` / `65fc5f88…`; browser `16565d8e…` / `ebe8959e…`; `H/sound-guide-next-recapture-20261005/`, `H/sound-empty-entry-recapture-20261005/` | `[30,216,37,240)` | **42** (max 226) | Native `(62,46,29)` vs browser white. `-H-SndB` spans `[7,218,37,238)`, but the volume label stops at x=30. | [volume 130](../sound-volume-130-2026-10-05.md); labelled [upper 316](../sound-upper-316-2026-10-05.md) `14533857` | Integrated: the 42 px are the approved frame-0 overhang (icon 172). Awaits independent review. |
| Same two uppers (identical pixel set) | `[0,114,400,160)` | **274** (max 10) | Thin bands at y 122–126 and 138–152 (greens and greys), below Span `[0,100,400,114)`. Plus 4 px at `[103,85,107,89)`. | [upper 316](../sound-upper-316-2026-10-05.md) `14533857` | Integrated as `S_Back_U` sampling source-gap. Awaits independent review. |
| Sound empty-entry lower. Native `65fc5f88…`; browser `ee103d93…`; report `ef62e9ce…` | `[0,177,320,178)` | **320** (max 3) | Native `(62,127,240)` vs browser `(63,127,237)` on a one-row line between the slider and footer ROIs. | [y=177](../sound-empty-y177-2026-10-05.md) `22e8b0a4` | Labelled `UserWdwEdge` LA8 α25 over entry theme. Grok 4.6 **APPROVE** `9fe268f8`. |
| Same lower | `[0,64,41,96)` | **1303** | 1225 px are the exact rejected `S_BG` beige pair `(223,215,206)`/`(229,224,216)` | [empty-mid](../sound-empty-mid-2026-10-05.md) (rejected) | No new slice. Add this ROI to the in-flight grid-bind recapture. |
| Same lower | `[232,137,279,144)` | **223** | 184 px are the beige pair (`regions[7]` of the mid note) | same | Same as above. |
| Camera Welcome p2. Native `fd4a660e…` (Renu feed); browser upper `b642d80f…`; `M/camera-guide-page2-modal-0d7bfea/` report `b7b54a14…` | whole upper | **93408** | The browser upper is byte-identical to p1 (`b642d80f`). The p1 native is black-feed and scores 0; the p2 native shows the configured Renu feed. The [feed mask](../camera-guide-feed-mask.md) excludes p1–2, so this has no label. | [feed mask](../camera-guide-feed-mask.md) | Either extend the source-derived finder mask to p2 and record a reviewed read-only adaptation, or have the coordinator recapture native p2 in the p1 black-feed config. |
| HOME 1-row Right walk, yaw 304. Native `4adc0ef0…`; `H/home-row-viewport-20261004/diff-after-masked` report `0069238f…` | 1-px lines x=200 `[128,196)`, y=200 `x50–186` | **108** | Tail **291** labelled [home-row-tail](../home-row-tail-2026-10-05.md) `cb324a43`. U17 leftover **APPROVE** [review](../home-cursor-anim-review-2026-10-05.md): no unused idle pane; `LncCsr_00` already bound. Unlabelled tail **0**. | [row viewport](../home-row-viewport-2026-10-04.md) | Grok 4.6 tail **APPROVE** `f72296ff`. U17R **APPROVE** `3556026d`. Predicted masked lower **5426**. |

Recount results. Camera browse lower **7491** is fully owned: date 1006, strip
1992, thumb cells 2251/2242 (interiors, selection rings and Pho2x3). Camera p3,
p4 and p5 uppers have the identical **7615** pixel set, so the p5 APPROVE
`f14c2241` covers p3 and p4. Notifications is 0/0.

## 2. Labels lacking review, or resting on weak evidence

| Label | Commit / note | Problem | Action |
| --- | --- | --- | --- |
| Sound empty-entry slider ROI **377** (was **4271**) | [recount](../sound-grid-recount-2026-10-05.md); [review](../sound-slider-57-review-2026-10-05.md) **APPROVE-WITH-NITS** | Post-grid `860b3222…`. Checker **0**. **320** edge + **57** `C_SldH_L` (**52** `IconS` under `M-`, **4** `Box` fringe, **1** `BtnP`). | Closed (docs). Predicted ROI **377**. Edge stays with y=177. Painter unchanged. |
| Sound first-run perimeter **6072** compositor gap (APPROVE `6cc31903`) | [subsets](../sound-perimeter-5212-subsets-2026-10-05.md); veil [review](../sound-perimeter-5212-review-2026-10-05.md) **REJECT**; subset [review](../sound-perimeter-5212-subsets-review-2026-10-05.md) **APPROVE-WITH-NITS** | Post-grid lower `cd0ce717…`. **860** dimmed grid kept. **4416** half observation, no unique pane (**48** of it is empty-entry row-over, **338** footer-over; stay half-class). **728**: **144** labelled row + **53** labelled footer (peak `(296,234)`) + **531** already within 2, unlabelled. **68** guide fringe, no unique pane. | **144** / **53** closed (docs). **4416** / **531** / **68** stay unlabelled. Veil stays **REJECT**. Predicted complement **6072**. Painter unchanged. Not 1:1. |
| Camera browse slider plus tint, inside strip **1992** (APPROVE `90be3135`) | [slider](../camera-browse-slider-2026-10-05.md); decode [plus-tint](../camera-plus-tint-2026-10-05.md) `ed55865e`; review [plus-tint-review](../camera-plus-tint-review-2026-10-05.md) `b6620fa4` **APPROVE** | LA4 decode: 156 opaque whites, 0 α128. Kept as source-gap. Independent Grok 4.6 **APPROVE**. | Closed (docs). Predicted strip **1992**. |
| Settings main **0/20** | `74ac999e`, [note](../settings-main-residual-2026-10-04.md); review [settings-main-review](../settings-main-review-2026-10-05.md) `6ee4f4f8` **APPROVE-WITH-NITS** | 15 Other Settings t/n/s rights just below `*.5`; 2 Data Management **a** (not **g**); 3 `I_TopLTs` fringe Δ3. | Closed (docs). Predicted **0/20**. || HOME entry banner footer-14 activation | `7b773b71`, [note](../home-entry-banner-scale-2026-10-04.md) | Relabelled. The footer-14 `activationReady` gate only delays activation; N057 timing is a capture-fit adaptation. Scale writer `0x1fa344` kept. U16 leftover **APPROVE**. | Done (docs-only). Recapture stays in §3. |
| HOME 1-row unused idle cursor pane | leftover `3556026d` + [review](../home-cursor-anim-review-2026-10-05.md) **APPROVE** | No unique unused pane. `LncCsr_00` already Select 0 / Scale 0 / Loop 37. Decide/UnSelect write `N_Scene_00` press y=−2. Compact `LncBase_U_00` is another pair. | Closed (docs). Predicted **190/5426**. Painter unchanged. Not 1:1. |
| Browser upper HUD bind | integrated `5c3903da` + review `463513e8` **APPROVE-WITH-NITS**; leftover [1200](../browser-hud-1200-2026-10-05.md) `2c821272` | Recaptured HUD **10787→1200**. Unique dump: `BasePct` / `HudBase_00` fade y=25–27 over Welcome vs start-menu BG. Chrome 0–24 **0**. Painter unchanged. Predicted **1200**. Awaits independent review. | Reviewer |

## 3. Integrated runtime changes awaiting coordinator recapture

| Commit | Change | Scenario / collector | Expected pair and check |
| --- | --- | --- | --- |
| `d0ecf020` | Settings Manual p0 title rule, LCD-centre sampling | Settings → Manual → Important Information p0 (`verify-stock-helpers.mjs` id `manual-settings-page-1`); native `50264d73…` | Raw 400×240/320×240. ROI `[35,37,365,39]` expected **332→0**; hashed whole **3054/2071**; ScrollIndicator 858 stays. Native volume unmounted. |
| `7466b4e4` | Browser Manual Close/Enlarge `lcd-source-size` (applies to every Manual page) | Recaptured `rank1-recapture-20261005/browser-manual-page0/` vs native `a28e9f43…` report `9007719f…` | Footer `[0,212,320,240)` **1934→1684**; whole lower **2680→2430**; upper **2154** |
| `ed167d5b` | HOME Design Image Share / StreetPass rows | Recaptured `rank1-recapture-20261005/home-design-lower/` vs native `e9a87578…` report `e33242d9…` | Lower **9630→9581**; upper **36195→42073** (wallpaper/HUD epoch, outside slice) |
| `7b773b71` | HOME entry banner activation on footer 14 (capture-fit adaptation) | `capture-entry.mjs` `c36374ab…`; N057 `17d3ecc0…` / N058 | U16 leftover **APPROVE** [review](../home-entry-anim-review-2026-10-05.md): no unique dump writer; `0x1fa344` shared. N057 pixel box still owed. |
| `8dc72ac6`, `9d80f9e6`, `96136a07`, `c8a56cba` | Shared text origin, fractional `lcd` sampling, A8 blit pad | Regressions: `settings-other-page1` **0/0** held `22b13f20` report `c3481bf7…`; `health-usage` **22398 / 0** held (elapsed 17199.9 hashes `6cd3eded…` / `352b09da…`); Settings main (0/20), Other p2 (0/960), p3/p4 (**169**/8, **169**/35), HOME 1-row (190/5426) | Counts held at `603c5388` except Health upper (TopLoop, not a dump bind). Upper **169** dump-bound [HudMset Bat 4/5 + `T_TimeC_00`](../settings-other-p34-hud-169-2026-10-05.md); Grok 4.5 **APPROVE**. Predicted **169/8** and **169/35** while the painter is unchanged. Lower 8/35 stay out. |
| `603c5388` | `S_BG_D-Grid` | `sound-empty-entry` recaptured lower **16021→7216**, mid **0**/**0** | Slider ROI **4271→377** (checker **0**). First-run complement stays **6072**; **860** of it is the dimmed grid. [recount](../sound-grid-recount-2026-10-05.md). |
| `1863c4e4` | Welcome `TxtDlg` `writer-0x111` host gate (alignment 4 + line alignment 2) | Welcome p1 / p3 / p4 / p5 + Other page 1 | Recaptured Mac built-in: p1 **0/1401** held, p3 **2480→2479** / **1079→1078**, p4 **2093/692** held, p5 **7615/1401** held, Other page 1 **0/0** Δ2 held. Colour spans still keep p3/p4 off the direct sampler. Grok 4.7 **APPROVE-WITH-NITS** `42d62c69`. |

## 4. In-scope scenarios with no usable native/browser pair

| App | Missing scenario | Native route needed |
| --- | --- | --- |
| Browser | `browser-start-menu-local` | Welcome pair still mismatch (95571/76728). Clone first-run is done, but isolated NAND HOME toolbar `(189,16)` → Open is official `_06.10.26_15.37.10.852.png` `e8562da9…` System Update required (`browser-start-20261006/`). Not start menu. System Update excluded. **blocked**. Settings/bookmark still owed |
| eShop | `eshop-welcome-home-a-ok` | 1-row HOME slot 5 → A (runbook §4.1). The only native today is the direct-launch NNID state |
| Miiverse | `miiverse-local-toolbar-back` | Browser Open from HOME `22a08e27…` / `8f5be3f5…` (`miiverse-toolbar-20261006/browser/`; empty Communities chrome + footer). Native pair already exists (022-5362 vs Communities). Toolbar `(238,16)` native still owed |
| Zone | `zone-offline-search-info-back` | **Skipped** (user, 5 Oct). Browser half kept. Not on `Launcher.dat`. Do not launch `0000000d.app` this leftover |
| Notes | `notes-grid-editor-switch` | Browser grid `a78a5ba2…` / `2ea6c8ec…` (`notes-grid-20261006/browser-note1/`; tutorial + empty 4×5). A slot → editor `50cb7097…` / `33daea28…` (`browser-editor/`; upper “There is no suspended software.” / blank pad). Native owed. Up/Down in editor hashed identical to editor (`50cb7097…` / `33daea28…`); blank pad inert |
| Friends | `friend-list-local-profile-return` | Browser own card `04afa1ba…` / `4c78b5cb…` (`friends-profile-20261006/browser-card/`; Player / no favourite title). A to profile announce “Friend List”; profile PNG re-download incomplete. Native owed |
| Notifications | `notifications-list-scroll-and-readonly-detail` | Browser scrolled list at `notifications-scroll-20261006/browser/` `b9696c92…` / `4c4e43a9…` (Play Coins…About Notifications; upper unread 8). Native half owed (Azahar Sound splash stuck). Open remains inert |
| Health | `health-general-held-down-and-thumb-drag`; 3D article; end scroll; Back focus | General article top official `_06.10.26_15.17.30.791.png` `c63b1153…` vs `79bd45d9…` / `1d829435…` empty mask **23993 / 0** report `e9ce4f6f…` (`health-general-20261006/`). held-down official `_06.10.26_16.05.17.323.png` `5593d9d3…` vs `a0e63170…` / `cc80acbe…` **24904 / 19206** report `abb7e07a…` (`health-held-down-20261006/`). Upper TopLoop. Lower paneY mismatch after 18 Down taps. Thumb-drag / 3D / end-scroll / Back-focus still owed |
| Settings | `settings-internet-connections-roundtrip`, `settings-parental-pin-boundary`, `settings-data-software-empty`, `settings-nnid-transfer-update-return`, exact `settings-other-page1-home-a-touch` | Internet settled **4760 / 24076**. Data root **4956 / 20096**. U21 [data-root state](../settings-data-root-state-2026-10-06.md) pending recapture. Software empty **6852 / 22**. Parental intro **4595 / 0** no PIN. NNID official `cc610faa…` vs `6ea86f3a…` / `c1a5b348…` **82096 / 74907** report `6ca33395…` (Sign in vs unavailable; adaptation). Extra Data **6989 / 51927**. Health General **23993 / 0**. Transfer official `01ff4af3…` **22816 / 76797** (eShop-required vs 3DS/DSi; adaptation). Exact Other p1 official `98d0fc9d…` **217 / 0**. Browser start menu **blocked**. Health held-down **24904 / 19206**. Remaining §4: Camera folder native / empty browse (shoot reached; View Photos/AX blocked), Sound guide p2/p3 native (splash hang), Notifications scroll native, Notes editor native, Friends card native |
| Camera | folder list; empty six-cell browse; full photo view; paging/drag; caller return | six-cell official `_06.10.26_16.19.55.191.png` `7f67f64b…` vs `d6086990…` / `1649ce00…` **94661 / 16898** report `7194813a…` (`camera-folder-20261006/`). Second HOME A reached shoot (green finder, Photos 29997). View Photos stylus did not register; B/HOME HID eaten; Emulation Restart left Camera; CUA AX unresolved on window 7112. Folder native / empty `c3096df7…` still owed. Did not Shoot |
| Sound | guide p2/p3; `sound-supplied-song-playback` (blocked: no user songs) | Browser p2/p3 kept (`sound-guide-20261006/browser-p2`, `browser-p3`). Native blocked: HOME A Sound hangs on Nintendo splash; Emulation Restart recovered HOME once; second A hung again. Did not invent native |
| amiibo | `amiibo-opening-read-only` | Blocked: no in-scope caller. Never add a HOME tile |
| HOME / lifecycle | `baseline-home-idle` pair `ebbc2743…` vs `441d366d…` / `656f808f…` empty mask **23182 / 14754**. U18 STOP: no unique unused writer for upper **12255**. Compact H-12 official `93058283…` vs Camera `b368f61d…` / `ac6485d2…` **30032 / 47436** report `f2fceb55…` (`home-compact-20261006/`). Settings browser half `8d1b17ab…` / `50d721ec…` kept. U19 STOP `2b384723`: no unique compact Health sleep writer. U19R **APPROVE** `421ed134` `mcp:586260d0`. Queue rows 3–9 (`life-*`) | Do not paint. Do not add AL/DP. Work open/close/switch/sleep routes |
| Portfolio | 8 `portfolio-*` routes | Browser-only interiors (labelled adaptations); native applies only to the HOME/launch chrome |

## 5. Ranked top 6

| # | Slice | Seat | Why |
| ---: | --- | --- | --- |
| 1 | Recapture batch from §3: `d0ecf020`, `7466b4e4`, `ed167d5b`, `7b773b71`, plus the post-`8dc72ac6` regressions | **Coordinator** (Azahar not needed; browser plus frozen natives) | Four visible runtime changes have been integrated since 4 Oct without a measurement, and earlier static matches are unverified under shared renderer edits |
| 2 | Sound upper unlabelled 316: volume-icon spill `[30,216,37,240)` 42 (max 226) and room band ~270 | **Done** `14533857` + review `daa93bca` **APPROVE** | Labelled as volume overhang 42 + `S_Back_U` 274 |
| 3 | Sound empty-entry lower y=177 line, 320 px | **Done** `22e8b0a4` + review `9fe268f8` **APPROVE** | `UserWdwEdge` LA8 α25; painter unchanged |
| 4 | Camera browse plus-tint re-review (`ZoomUp` decode) | **Done** `ed55865e` + review `b6620fa4` **APPROVE** | LA4 decode; source-gap kept; predicted strip 1992 |
| 5 | Browser HUD remaining strip **1200** after recapture | **Integrated leftover** `2c821272`; review `codex/browser-hud-1200-review-20261005` | Recaptured HUD **10787→1200**. `BasePct` / `HudBase_00` fade y=25–27. Predicted **1200**. |
| 6 | Camera Welcome p2 upper 93408: extend the source-derived feed mask to p2 plus a reviewed adaptation, or recapture native p2 in black-feed config | **Blocked** `c53a96aa`. Recapture: **Coordinator, Azahar** | No p2 upper guide frame; mask not extended. Frozen **93408** until black-feed native recapture. |
| — | Settings Other p3/p4 upper HUD **169** | **Done** `a74309f6` + review **APPROVE** | Dump `HudMset_00` Bat 4/5 **137** + `T_TimeC_00` **32**. Painter unchanged. Predicted **169/8** and **169/35**. Grok 4.5 independent [review](../settings-other-p34-hud-169-review-2026-10-05.md). |

Next after these: first native pairs for eShop and Miiverse (coordinator,
Azahar; runbook `O/coord-logs/native-new-apps-runbook-20261004.md`), and
the HOME 1-row tail review `cb324a43` **APPROVE** `f72296ff`. U17 leftover
**APPROVE** `3556026d` (no unused idle pane). Perimeter **5212**
subsets **APPROVE-WITH-NITS**: veil stays **REJECT**; **144** row + **53**
footer bind inside the **728**, and **4416** / **531** / **68** stay
unlabelled (predicted complement **6072**). Slider **57** **APPROVE-WITH-NITS**
`444ba8e0`.
Welcome gate **APPROVE-WITH-NITS** `42d62c69`. y=177 **APPROVE**
`9fe268f8`.
