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
| Sound empty-entry lower. Native `65fc5f88…`; browser `ee103d93…`; report `ef62e9ce…` | `[0,177,320,178)` | **320** (max 3) | Native `(62,127,240)` vs browser `(63,127,237)` on a one-row line between the slider and footer ROIs. | [y=177](../sound-empty-y177-2026-10-05.md) `22e8b0a4` | Labelled `UserWdwEdge` LA8 α25 over entry theme. Review pending. |
| Same lower | `[0,64,41,96)` | **1303** | 1225 px are the exact rejected `S_BG` beige pair `(223,215,206)`/`(229,224,216)` | [empty-mid](../sound-empty-mid-2026-10-05.md) (rejected) | No new slice. Add this ROI to the in-flight grid-bind recapture. |
| Same lower | `[232,137,279,144)` | **223** | 184 px are the beige pair (`regions[7]` of the mid note) | same | Same as above. |
| Camera Welcome p2. Native `fd4a660e…` (Renu feed); browser upper `b642d80f…`; `M/camera-guide-page2-modal-0d7bfea/` report `b7b54a14…` | whole upper | **93408** | The browser upper is byte-identical to p1 (`b642d80f`). The p1 native is black-feed and scores 0; the p2 native shows the configured Renu feed. The [feed mask](../camera-guide-feed-mask.md) excludes p1–2, so this has no label. | [feed mask](../camera-guide-feed-mask.md) | Either extend the source-derived finder mask to p2 and record a reviewed read-only adaptation, or have the coordinator recapture native p2 in the p1 black-feed config. |
| HOME 1-row Right walk, yaw 304. Native `4adc0ef0…`; `H/home-row-viewport-20261004/diff-after-masked` report `0069238f…` | 1-px lines x=200 `[128,196)`, y=200 `x50–186` | **108** | These sit outside the neighbour mask and outside the 1656 / 162 / peek boxes. Another 183 px of thin ring edges (x 203/284, y 118/205) are probably the [Settings+cursor](../home-settings-cursor-2026-10-04.md) ring, but no note counts them. | [row viewport](../home-row-viewport-2026-10-04.md) | Attribute these 291 tail pixels in a docs-only recount (58 components; the six labelled ones total 5135). |

Recount results. Camera browse lower **7491** is fully owned: date 1006, strip
1992, thumb cells 2251/2242 (interiors, selection rings and Pho2x3). Camera p3,
p4 and p5 uppers have the identical **7615** pixel set, so the p5 APPROVE
`f14c2241` covers p3 and p4. Notifications is 0/0.

## 2. Labels lacking review, or resting on weak evidence

| Label | Commit / note | Problem | Action |
| --- | --- | --- | --- |
| Sound empty-entry slider **4271** (APPROVE-WITH-NITS) | [slider](../sound-empty-slider-2026-10-04.md) | **2767** of its pixels are the `S_BG_Grid` ETC1 checker pair whose constant-colour gap was **REJECTED** today. The approval therefore covers pixels a dump texture owns. | After the grid bind, recount the slider ROI and re-review only what remains. |
| Sound first-run perimeter **6072** compositor gap (APPROVE `6cc31903`) | [perimeter](../sound-guide-perimeter-2026-10-05.md) | 464 + 396 perimeter pixels are native `(111,107,103)` / `(115,111,107)`. That is half of the two checker colours, while the browser shows constant `(229,224,216)`. So the dimmed native shows the grid. The "4760 / 1312 half-split" evidence predates the grid finding. | Recount after the grid bind and re-review the compositor claim on what remains. |
| Camera browse slider plus tint, inside strip **1992** (APPROVE `90be3135`) | [slider](../camera-browse-slider-2026-10-05.md); decode [plus-tint](../camera-plus-tint-2026-10-05.md) `ed55865e` | LA4 decode: 156 opaque whites, 0 α128. Kept as source-gap. Independent review still owed (worker was Grok 4.7). | Different-model review of `ed55865e`. |
| Settings main **0/20** | `74ac999e`, [note](../settings-main-residual-2026-10-04.md) | No independent review on record | Review (docs-only). |
| HOME entry banner footer-14 activation | `7b773b71`, [note](../home-entry-banner-scale-2026-10-04.md) | The Claude four-slice review (LOG, 4 Oct) asked to relabel this as a capture-fit adaptation. The note still calls it a "source-backed fix". | Doc-only relabel. |
| Browser upper HUD bind | worker `01d9f79a` on `codex/browser-hud-20261004` | Not integrated and not reviewed. The Browser pair's HUD scores 10787. | Review with a different model, then integrate. |

## 3. Integrated runtime changes awaiting coordinator recapture

| Commit | Change | Scenario / collector | Expected pair and check |
| --- | --- | --- | --- |
| `d0ecf020` | Settings Manual p0 title rule, LCD-centre sampling | Settings → Manual → Important Information p0 (`verify-stock-helpers.mjs` id `manual-settings-page-1`); native `50264d73…` | Raw 400×240/320×240. ROI `[35,37,365,39]` expected **332→0**; hashed whole **3054/2071**; ScrollIndicator 858 stays |
| `7466b4e4` | Browser Manual Close/Enlarge `lcd-source-size` (applies to every Manual page) | `browser-manual-browser-v2.mjs` `fb282c96…`; native `a28e9f43…` | Footer `[0,212,320,240)` **1934**, offline 1684 (pre-merge). Recount the whole lower **2680** and the Settings Manual footer |
| `ed167d5b` | HOME Design Image Share / StreetPass rows | `settings-lower-integrated` plus a scrolled still (choice 4 at 184, choice 5 at 280); native `e9a87578…` | Lower **9630** (strips 3272/3110, footer 728). Upper 36195 is outside this slice |
| `7b773b71` | HOME entry banner activation on footer 14 | `capture-entry.mjs` `c36374ab…`; N057 `17d3ecc0…` / N058 | Banner box `x40..360,y80..170`; first-small update vs native ≈17 |
| `8dc72ac6`, `9d80f9e6`, `96136a07`, `c8a56cba` | Shared text origin, fractional `lcd` sampling, A8 blit pad | Regressions: `settings-other-page1` (0/0, Δ2), `health-usage` initial and `-down2-frame8`, Settings main (0/20), Other p2 (0/960), p3/p4 (169/8, 169/35), HOME 1-row (190/5426) | Every count must hold. Owed since 4 Oct (`coord-logs/regression-recapture-r1.prompt`) |
| `603c5388` | `S_BG_D-Grid` | `sound-empty-entry` recaptured lower **16021→7216**, mid **0**/**0** | Slider/perimeter checker share still to recount. First-run 6094/6072 held. |
| `1863c4e4` | Welcome `TxtDlg` `writer-0x111` host gate (alignment 4 + line alignment 2) | Welcome p1 / p3 / p4 / p5 + Other page 1 | Recaptured Mac built-in: p1 **0/1401** held, p3 **2480→2479** / **1079→1078**, p4 **2093/692** held, p5 **7615/1401** held, Other page 1 **0/0** Δ2 held. Colour spans still keep p3/p4 off the direct sampler. |

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
| 2 | Sound upper unlabelled 316: volume-icon spill `[30,216,37,240)` 42 (max 226) and room band ~270 | **Done** `14533857` (review pending) | Labelled as volume overhang 42 + `S_Back_U` 274 |
| 3 | Sound empty-entry lower y=177 line, 320 px | **Done** `22e8b0a4` (review pending) | `UserWdwEdge` LA8 α25; painter unchanged |
| 4 | Camera browse plus-tint re-review (`ZoomUp` decode) | **Done** `ed55865e` (review pending) | LA4 decode; source-gap kept; predicted strip 1992 |
| 5 | Browser: review and integrate HUD `01d9f79a`, then capture native start menu → `browser-start-menu-local` | **Integrated** `5c3903da` + review `463513e8` **APPROVE-WITH-NITS**. Recapture owed | Frozen HUD 10787 until recapture. Start-menu native still Azahar. |
| 6 | Camera Welcome p2 upper 93408: extend the source-derived feed mask to p2 plus a reviewed adaptation, or recapture native p2 in black-feed config | Mask: **worker, source-only**. Recapture: **Coordinator, Azahar** | Large unlabelled count on an existing pair whose browser upper is byte-identical to the 0-scoring p1 |

Next after these: first native pairs for eShop and Miiverse (coordinator,
Azahar; runbook `O/coord-logs/native-new-apps-runbook-20261004.md`), and the
Settings main 0/20 review and entry-banner relabel (docs-only).
