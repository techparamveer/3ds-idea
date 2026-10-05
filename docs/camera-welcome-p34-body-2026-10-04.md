# Camera Welcome pages 3/4 remaining TxtDlg body 1,079 / 692 source gap — 4 October 2026

Stock/Camera worker on `codex/next-residual-20261004` from HOME fidelity
`ec7ad711`. Sparse worktree; `node_modules` linked from HOME fidelity.
No `model/`. No runtime change. No Azahar. No preview 3021. No CDP 9320.
No recapture. No CSS, font, mip, sampler, snap, colour or
`azahar-12p4-fit`. Capture stays inert. The labelled page-1 lower
**1,401** chrome ([page-1 1401](camera-welcome-p1-1401-2026-10-04.md))
and the labelled pages 3–5 unobscured-feed mask
([feed mask](camera-guide-feed-mask.md)) are not reopened. HOME 1-row
leftovers stay labelled.

This is not a 1:1 claim. Tests and this note do not close pixels, input,
motion or audio. Coordinator recapture remains the acceptance gate.

## Pair (reused, not recaptured)

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v1/captures/`.
Empty mask. Threshold any RGB channel >2/255. Official lower crop of each
native 400×480 PNG is `(40,240,320,240)`.

| Item | SHA-256 |
| --- | --- |
| Page-3 native `Nintendo 3DS Camera_26.09.26_20.37.10.334.png` | `3ad989b5c214caa6be956643b2aa0785df2cc9612ffcc63a32ed5c70270f7c8a` |
| Page-3 browser lower | `57476c312f731b8f52884b8c1d777c590a13f23588f32923664713081b715339` |
| Page-3 `R/camera-guide-page3-modal-0d7bfea/diff/report.json` | `1e8cf7907e4a9cc6447b10621bb4eb57d974333b46c928ca8b75d4049eed51be` |
| Page-3 `diff/lower-contact-sheet.png` | `122175a1db9ffdf8c84e53d849e9b9b9af907eb184c44eefcf5489e24152be2b` |
| Page-4 native `Nintendo 3DS Camera_26.09.26_20.37.37.016.png` | `38c19ca07e7569cb92daf31ce1743f19fab82b3f402fc4304af4f58e49057087` |
| Page-4 browser lower | `4f182d392c6beec47db961e5386076b5c9112cc88b657ca2dd41f6e9ca033df7` |
| Page-4 `R/camera-guide-page4-modal-0d7bfea/diff/report.json` | `e13f8841f3afcff1e88e07e65ab31ee7e1f8edea61321c324092b1ef986a87b6` |
| Page-4 `diff/lower-contact-sheet.png` | `e1ff90fd39f287821895cdf842367416ea873f53c05c059287f70f925af3f188` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Inspected both lower contact sheets. Guide card, Back/Next, bird and
page counter align. Remaining interior red is sparse body-glyph AA on
the already-bound `TxtDlg` paragraph, not a missing second card or
button.

Recorded empty-mask counts over 2/255:

| Page | Whole lower | Interior `[20,20,300,220]` | Perimeter complement | Max |
| ---: | ---: | ---: | ---: | ---: |
| 1 (labelled) | **1401** | **0** | **1401** | 101 at `(315,167)` |
| 3 | **2480** | **1079** | **1401** | 101 at `(315,167)` (chrome); interior max **14** at `(246,113)` |
| 4 | **2093** | **692** | **1401** | 101 at `(315,167)` (chrome); interior max **14** at `(181,126)` |
| 5 | **1401** | **0** | **1401** | 101 at `(315,167)` |

Page-3 `meanRgbError` 0.32734375; page-4 0.2943706597222222. Native
interior sample at `(246,113)` is `(202,200,198)` versus browser
`(214,213,212)`; page 4 max at `(181,126)` is `(208,207,205)` versus
`(221,220,219)`. No interior pixel is native red-emphasis ink; the bound
`group 0 / type 3` spans for `3D depth slider ` / `at least 30cm (12in)\n`
already paint. Page 5 `D_003_4` is five lines with interior **0**, so the
leftover is not missing `_flw` copy.

## Residual ownership

Half-open rectangles. Counts are pixels with any RGB channel delta
greater than 2.

| Region | Rectangle | Page 3 | Page 4 | Owner |
| --- | --- | ---: | ---: | --- |
| Whole lower | `[0,0,320,240]` | **2480** | **2093** | mixed |
| Guide interior | `[20,20,300,220]` | **1079** | **692** | already-bound `TxtDlg` glyph AA |
| Perimeter complement | whole − interior | **1401** | **1401** | labelled page-1 chrome, not reopened |
| Top Y0–5 | `[0,0,320,6]` | 588 | 588 | labelled Disable / Grid1 |
| Left / right strips | `[0,0,6,240]` / `[314,0,320,240]` | 362 / 372 | 362 / 372 | labelled |
| Page counter | `[290,226,313,237]` | 78 | 78 | labelled `TxtNumber0` / `TxtNumber1` |
| Official page-1 Next box | `[104,184,232,224]` | **0** | **0** | `Guid2TxtW` already bound |
| Official page-2 button box | `[76,184,260,224]` | **0** | **0** | `Guid2TxtB` / `Guid2TxtW` already bound |
| Interior bbox | page 3 `[28,99,287,145]`; page 4 `[71,112,244,133]` | 1079 | 692 | `TxtDlg` `[20,19,300,171]` |

Official page-3 interior components start at
`report.screens.lower.regions[6]` **51** `[28,128,11,17]`, then 47 / 35.
Those 149 interior boxes sum to **1079**. Official page-4 interior starts
at `report.screens.lower.regions[5]` **77** `[132,112,10,17]`; the
interior boxes sum to **692**.

## Already-bound source (no unused unique owner)

EUR Camera `0004001000022400`, version 4097, content index 0 / ID
`0000001a`. Pinned executable SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`,
image base `0x100000`. Nested `Dlg` archive source SHA-256
`101e184056296119b5b17021ff148211b49090a5729c727d1113fc27b3f47957`
(converter 1.4.0). Published `lyt-C-Dlg.json` SHA-256
`32ef0772e40f2e1802c8f45cda2c7b0c424c488286720b3232ad5a15d58cfd4c`.
`P_tips` source `msg/EU_English.LZ/P_tips.msbt` SHA-256
`0fd449e7831698969cd8d0f20a351990c6ddbe89f59df16bbe96ccf9b55bb1e0`.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| `C_DlgChA` | `lyt-C-Dlg.json` | `lyt/C.LZ/Dlg/blyt/C_DlgChA.bclyt` | `4d35e4b38ae75fa7ad8c8f2d2484bd200856b562ee4c493b13adbc765c5eb8d7` |
| `C_DlgGuid2Btn` | same pack | `lyt/C.LZ/Dlg/blyt/C_DlgGuid2Btn.bclyt` | `1a93160f30cd0906334d8edff697e52dfe4cf5b9cf55ec048093075d4e57505c` |
| `C_DlgGuid2Btn_Default` | already requested | `lyt/C.LZ/Dlg/anim/C_DlgGuid2Btn_Default.bclan` | `4c3bf562754cd65e646b8399c22b2f09a1f728262e58532620f78efc00693ed9` |
| Page-3 body | `P_tips` `D_003_2` style 83 | same MSBT | tokens include illustration `P_Guid05_U` plus RGBA `ff3200ff` / `454039ff` |
| Page-4 body | `P_tips` `D_003_3` style 83 | same MSBT | tokens include illustration `P_Guid01_U` plus the same RGBA pair |
| `TxtDlg` | Guid2 `txt1` | 280×152 at `[0,25]`, origin 4, alignment 4, lineAlignment 2, font `cbf_std.bcfnt`, glyph size `[20,24]` | LCD `[20,19,300,171]` |

`drawNativeCameraGuide` already selects `C_DlgGuid2Btn` for Welcome
pages 2–5 (0-based 1–4), binds Default frame 0, installs `nativeMessageOverride`
plus `nativeMessageColorSpans` on `TxtDlg`, and draws with
`textSampling:'lcd-source-size'`. That sampler is the existing
single-line Camera guide option
([button raster](camera-guide-button-raster.md)); it does not uniquely
own a new multiline `TxtDlg` writer. Style 83 `unresolvedWords['0']` is
280, the already-bound pane width.

## Unused members that do not uniquely own the 1,079 / 692

Published dialog clips still include `C_DlgGuid2Btn_Push` /
`C_DlgGuid2Btn_Disable` and `C_DlgGuid1BtnW_Push`. Push writes only
`Guid2BtnW_Grp` / `Guid2BtnB_Grp` translation.y −2 and scale.x 1.03 plus
button `materialColor`; Disable writes the same panes. Neither clip has
a `TxtDlg`, `visible` or alpha track. The official Back/Next boxes stay
**0**, so those clips do not uniquely own the interior AA.

`C_DlgGuid1BtnW` is the page-1 Next container, not the page-3/4 body.
`D_003_2_flw` / `D_003_3_flw` are unused follow-up strings
("Please remember that this system can only display 2D images…"); the
captured stills show the `D_003_2` / `D_003_3` paragraphs already
bound, not those extra five-line bodies. Binding `_flw` would add
unseen copy. `C_BkMask` is still absent from published packs.

Extending `lcd-source-size` to multiline `TxtDlg`, guessing a
`azahar-12p4-fit`, or painting sampled grey would be a screenshot fit.
No unique unused pane/clip/frame/sampler/message owns the leftover.

## Labelled gap

M-CAM-01 pages 3 and 4 are a **source-gap** for the remaining interior
**1,079** and **692** lower pixels. The labelled 1,401 perimeter chrome
is unchanged. Until a unique unused owner exists for the already-bound
`TxtDlg` raster, the painter stays unchanged.

## Checks

Focused `tests/camera-welcome-p34-body.test.mjs` plus `git diff --check`.
Application typecheck/build were not rerun because no application files
changed. This lane did not drive Azahar or preview 3021.

## Recapture (coordinator, Mac built-in, `eb501e00`)

User-authorized laptop display. Frozen natives reused (`3ad989b5…` /
`38c19ca0…`); Azahar not relaunched. Production `127.0.0.1:3000`. Chrome
`--window-position=80,60`. Raw LCD `captureScreensAt`. Empty mask, 2/255.
Artifacts `home-fidelity-20261001/camera-welcome-p34-recapture-20261005/`.

| Page | Lower | Interior `[20,20,300,220]` | Perimeter | Browser lower SHA |
| ---: | ---: | ---: | ---: | --- |
| 3 | **2480** (unchanged) | **1079** | **1401** | `57476c31…` (byte-identical to hashed `0d7bfea`) |
| 4 | **2093** (unchanged) | **692** | **1401** | `4f182d39…` (byte-identical to hashed `0d7bfea`) |

Interior max stays 14 at `(246,113)` / `(181,126)`. Later renderer
changes did not move this leftover. Labelled source-gap stands. Not 1:1.
