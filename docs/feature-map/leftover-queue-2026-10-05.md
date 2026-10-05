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
| HOME 1-row Right walk, yaw 304. Native `4adc0ef0…`; `H/home-row-viewport-20261004/diff-after-masked` report `0069238f…` | 1-px lines x=200 `[128,196)`, y=200 `x50–186` | **108** | Tail **291** now labelled [home-row-tail](../home-row-tail-2026-10-05.md) `cb324a43`: 108 = 78 mask-miss `P_BtnShdw_00` + 30 cursor fringe; 183 = cursor/shadow/peek/News. Unlabelled tail **0**. | [row viewport](../home-row-viewport-2026-10-04.md) | Grok 4.6 **APPROVE** `f72296ff`. Predicted masked lower **5426**. |

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
| Settings main **0/20** | `74ac999e`, [note](../settings-main-residual-2026-10-04.md); review [settings-main-review](../settings-main-review-2026-10-05.md) `6ee4f4f8` **APPROVE-WITH-NITS** | 15 Other Settings t/n/s rights just below `*.5`; 2 Data Management **a** (not **g**); 3 `I_TopLTs` fringe Δ3. | Closed (docs). Predicted **0/20**. || HOME entry banner footer-14 activation | `7b773b71`, [note](../home-entry-banner-scale-2026-10-04.md) | Relabelled. The footer-14 `activationReady` gate only delays activation; N057 timing is a capture-fit adaptation. Scale writer `0x1fa344` kept. | Done (docs-only). Recapture stays in §3. |
| Browser upper HUD bind | integrated `5c3903da` + review `463513e8` **APPROVE-WITH-NITS** | Frozen HUD `[0,0,400,28]` **10787** until recapture. Start-menu native still Azahar. | Coordinator recapture. |

## 3. Integrated runtime changes awaiting coordinator recapture

| Commit | Change | Scenario / collector | Expected pair and check |
| --- | --- | --- | --- |
| `d0ecf020` | Settings Manual p0 title rule, LCD-centre sampling | Settings → Manual → Important Information p0 (`verify-stock-helpers.mjs` id `manual-settings-page-1`); native `50264d73…` | Raw 400×240/320×240. ROI `[35,37,365,39]` expected **332→0**; hashed whole **3054/2071**; ScrollIndicator 858 stays |
| `7466b4e4` | Browser Manual Close/Enlarge `lcd-source-size` (applies to every Manual page) | `browser-manual-browser-v2.mjs` `fb282c96…`; native `a28e9f43…` | Footer `[0,212,320,240)` **1934**, offline 1684 (pre-merge). Recount the whole lower **2680** and the Settings Manual footer |
| `ed167d5b` | HOME Design Image Share / StreetPass rows | `settings-lower-integrated` plus a scrolled still (choice 4 at 184, choice 5 at 280); native `e9a87578…` | Lower **9630** (strips 3272/3110, footer 728). Upper 36195 is outside this slice |
| `7b773b71` | HOME entry banner activation on footer 14 (capture-fit adaptation) | `capture-entry.mjs` `c36374ab…`; N057 `17d3ecc0…` / N058 | Banner box `x40..360,y80..170`; first-small update vs native ≈17 |
| `8dc72ac6`, `9d80f9e6`, `96136a07`, `c8a56cba` | Shared text origin, fractional `lcd` sampling, A8 blit pad | Regressions: `settings-other-page1` (0/0, Δ2), `health-usage` initial and `-down2-frame8`, Settings main (0/20), Other p2 (0/960), p3/p4 (**169**/8, **169**/35), HOME 1-row (190/5426) | Counts held at `603c5388`. Upper **169** dump-bound [HudMset Bat 4/5 + `T_TimeC_00`](../settings-other-p34-hud-169-2026-10-05.md); Grok 4.5 **APPROVE** [review](../settings-other-p34-hud-169-review-2026-10-05.md). Predicted **169/8** and **169/35** while the painter is unchanged. Lower 8/35 stay out. |
| `603c5388` | `S_BG_D-Grid` | `sound-empty-entry` recaptured lower **16021→7216**, mid **0**/**0** | Slider ROI **4271→377** (checker **0**). First-run complement stays **6072**; **860** of it is the dimmed grid. [recount](../sound-grid-recount-2026-10-05.md). |
| `1863c4e4` | Welcome `TxtDlg` `writer-0x111` host gate (alignment 4 + line alignment 2) | Welcome p1 / p3 / p4 / p5 + Other page 1 | Recaptured Mac built-in: p1 **0/1401** held, p3 **2480→2479** / **1079→1078**, p4 **2093/692** held, p5 **7615/1401** held, Other page 1 **0/0** Δ2 held. Colour spans still keep p3/p4 off the direct sampler. Grok 4.7 **APPROVE-WITH-NITS** `42d62c69`. |

## 4. In-scope scenarios with no usable native/browser pair

| App | Missing scenario | Native route needed |
| --- | --- | --- |
| Browser | `browser-start-menu-local` | The existing pair (`H/native-new-apps-captures-20261004/browser-start-menu-local`, 95571/76728) puts the native first-run Welcome against the browser start menu, so the states do not match. The clone's first-run is now done, so capture HOME toolbar `(189,16)` → Open → start menu. Settings/bookmark: `browser-settings-bookmark-roundtrip` |
| eShop | `eshop-welcome-home-a-ok` | 1-row HOME slot 5 → A (runbook §4.1). The only native today is the direct-launch NNID state |
| Miiverse | `miiverse-local-toolbar-back` | Toolbar `(238,16)` → Open; capture the offline/error dialog |
| Zone | `zone-offline-search-info-back` | Not on `Launcher.dat`. Launch from the game list, labelled `semanticRouteMatched=false` |
| Notes | `notes-grid-editor-switch` | Suspended app → HOME → Notes → slot → Double/Up/Down → B (browser smoke only) |
| Friends | `friend-list-local-profile-return` | Toolbar Friends → own card → profile → B |
| Notifications | `notifications-list-scroll-and-readonly-detail` | From unread-dot, move to row 6, then Open is inert |
| Health | `health-general-held-down-and-thumb-drag`; 3D article; end scroll; Back focus | Health → General → held Down / thumb drag |
| Settings | `settings-internet-connections-roundtrip`, `settings-parental-pin-boundary`, `settings-data-software-empty`, `settings-nnid-transfer-update-return`, exact `settings-other-page1-home-a-touch` | Settings main → each entry (read-only, no PIN entry) |
| Camera | folder list; empty six-cell browse; full photo view; paging/drag; caller return | Welcome → folder → photo A → strip. Empty browse has native `c3096df7…`, but its only browser pair is stale (`ba5a8da`, 25 Sep, 76023/71260), so a browser-only recapture is needed |
| Sound | guide p2/p3; `sound-supplied-song-playback` (blocked: no user songs) | Guide Next, Next |
| amiibo | `amiibo-opening-read-only` | Blocked: no in-scope caller. Never add a HOME tile |
| HOME / lifecycle | `baseline-home-idle` (unmatched epoch); queue rows 3–9 (`life-*`) | Matched-epoch idle; Work open/close/switch/sleep routes |
| Portfolio | 8 `portfolio-*` routes | Browser-only interiors (labelled adaptations); native applies only to the HOME/launch chrome |

## 5. Ranked top 6

| # | Slice | Seat | Why |
| ---: | --- | --- | --- |
| 1 | Recapture batch from §3: `d0ecf020`, `7466b4e4`, `ed167d5b`, `7b773b71`, plus the post-`8dc72ac6` regressions | **Coordinator** (Azahar not needed; browser plus frozen natives) | Four visible runtime changes have been integrated since 4 Oct without a measurement, and earlier static matches are unverified under shared renderer edits |
| 2 | Sound upper unlabelled 316: volume-icon spill `[30,216,37,240)` 42 (max 226) and room band ~270 | **Done** `14533857` + review `daa93bca` **APPROVE** | Labelled as volume overhang 42 + `S_Back_U` 274 |
| 3 | Sound empty-entry lower y=177 line, 320 px | **Done** `22e8b0a4` + review `9fe268f8` **APPROVE** | `UserWdwEdge` LA8 α25; painter unchanged |
| 4 | Camera browse plus-tint re-review (`ZoomUp` decode) | **Done** `ed55865e` + review `b6620fa4` **APPROVE** | LA4 decode; source-gap kept; predicted strip 1992 |
| 5 | Browser: review and integrate HUD `01d9f79a`, then capture native start menu → `browser-start-menu-local` | **Integrated** `5c3903da` + review `463513e8` **APPROVE-WITH-NITS**. Recapture owed | Frozen HUD 10787 until recapture. Start-menu native still Azahar. |
| 6 | Camera Welcome p2 upper 93408: extend the source-derived feed mask to p2 plus a reviewed adaptation, or recapture native p2 in black-feed config | **Blocked** `c53a96aa`. Recapture: **Coordinator, Azahar** | No p2 upper guide frame; mask not extended. Frozen **93408** until black-feed native recapture. |
| — | Settings Other p3/p4 upper HUD **169** | **Done** `a74309f6` + review **APPROVE** | Dump `HudMset_00` Bat 4/5 **137** + `T_TimeC_00` **32**. Painter unchanged. Predicted **169/8** and **169/35**. Grok 4.5 independent [review](../settings-other-p34-hud-169-review-2026-10-05.md). |

Next after these: first native pairs for eShop and Miiverse (coordinator,
Azahar; runbook `O/coord-logs/native-new-apps-runbook-20261004.md`), and
the HOME 1-row tail review `cb324a43` **APPROVE** `f72296ff`. Perimeter **5212**
subsets **APPROVE-WITH-NITS**: veil stays **REJECT**; **144** row + **53**
footer bind inside the **728**, and **4416** / **531** / **68** stay
unlabelled (predicted complement **6072**). Slider **57** **APPROVE-WITH-NITS**
`444ba8e0`.
Welcome gate **APPROVE-WITH-NITS** `42d62c69`. y=177 **APPROVE**
`9fe268f8`.
