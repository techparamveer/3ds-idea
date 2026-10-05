# Camera Welcome page 2 upper 93,408 — blocked pair — 5 October 2026

Camera worker on `codex/camera-welcome-p2-mask-20261005` from `ed55865e`.
Sparse worktree; `node_modules` linked from HOME fidelity. No `model/`.
No painter change. No Azahar. No production `:3000`. No preview 3021.
No CDP. No recapture. The pages 3–5 [feed mask](camera-guide-feed-mask.md)
and `drawNativeCameraGuide` stay as they are.

This is not a 1:1 claim. The note does not close pixels, input, motion
or audio. A black-feed native recapture is coordinator-only.

## Decision

**Blocked pair.** Do not extend the feed mask to page 2.

`Guide_snk.gbin` page 2 is `D_003_1`, mode 3, with no group-4/type-1
illustration token (`scripts/audit_camera_welcome.py` expects
`[None, None, P_Guid05_U, P_Guid01_U, P_Guid02_U]`). Mode 3 selects the
two-button lower body. It does not select an upper window. Pages 3–5 are
the only Welcome pages that draw `C_DlgGuid_U`. Page 2 leaves
`cameraWelcomePages[1].illustration` null, so the upper draw is the black
read-only finder plus `P_Finder_U` and `C_IconSD`.

The pages 3–5 generator masks sampled **zero alpha** of that guide frame
and keeps every nonzero alpha texel, including the partial border. Page 2
has no such frame. `P_Fnd_Edge0.bclim` is a 16×16 LA8 vignette stretched
across `Edge0`–`Edge3`, not a viewport plate with a transparent hole.
There is no published picture pane for the live photograph. The page-5
note already recorded that no dump rectangle owns that photograph.

## Pair (reused, not recaptured)

Empty mask `dc4b320b…`. Threshold any RGB channel >2/255. Native upper is
the top 400×240 of the 400×480 PNG.

| Item | SHA-256 |
| --- | --- |
| Native `Nintendo 3DS Camera_26.09.26_19.32.20.509.png` | `fd4a660ef47879a3535ec6fa9f83fffe1caaa9c1973bd0580ca9cbced4dacc21` |
| Browser upper | `b642d80f8f219a90f61f38718f58c6be71cfbd48aee421763ffaff878f7ac00e` |
| Browser lower | `7473b1b5c45a69757bfadcbfb253edbc75a5b7394853aca11910496f2eb357ab` |
| `camera-guide-page2-modal-0d7bfea/diff/report.json` | `b7b54a149eb5e9ca9430887dcc9664c885408f087b9acf8f6624d6fd98f1a6a9` |

Report directory:
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v1/captures/camera-guide-page2-modal-0d7bfea/`.

Inspected the upper contact sheet. Native is the configured Renu
photograph with the finder HUD on it (capacity, grey cube, SD). The
browser upper is black behind that same HUD. Recorded empty-mask upper
count: **93408** (MAE 170.7979, max 255). One component covers the full
400×240 with 93344 differing pixels; the other 64 sit in small HUD-edge
specks. Lower **1401** is outside this slice.

The browser upper is byte-identical to the page-1 browser upper. The
page-1 native `52a6dcf7…` scores **0** against that image
([page-1 note](camera-welcome-p1-1401-2026-10-04.md)). Page 1 and page 2
share the upper painter. The 93408 count is this Renu replay against the
black finder, not a second upper layout.

## Why the generator cannot be extended

Read-only `rasterNativePicture` of the welcome-visible pictures
`Edge0`–`Edge3`, `2DView` and `C_IconSD` (same helper the pages 3–5
generator uses; captures were not an input to the raster). Screen alpha
was 79567 zero, 13925 partial, 2508 opaque. Against the frozen pair:

| Edge/icon alpha | Pixels over 2 | What the pair shows |
| --- | ---: | --- |
| 0 | 79008 | Open viewport: photograph versus black |
| 1–254 | 13040 | `P_Fnd_Edge0` vignette. Browser is the LA8 grey over black. Native is the photograph through that coverage |
| 255 | 1360 | Opaque edge texels. Browser matches decoded `(2,2,2)`. Native is still the photograph, about `(197,182,156)` at `(0,0)` |

The other 2592 pixels already agree: 2033 have nonzero edge or icon
alpha (capacity, cube, SD, and bright vignette samples such as `(8,8)`
and `(12,6)`), and 559 are near-black photograph texels inside the
zero-alpha set.

A zero-alpha-only mask would leave **14400**. Those 1360 alpha-255
texels are published edge coverage, so the pages 3–5 rule cannot mask
them. Masking the partial vignette would also drop border texels that
rule keeps compared. The existing 5777-pixel mask overlaps **5773** of
these diffs and would still leave **87635**. It stays limited to settled
pages 3–5.

## Provenance

EUR Camera `0004001000022400`, version content index 0 / ID `0000001a`.

| Element | Dump path | SHA-256 |
| --- | --- | --- |
| `P_Finder_U` | `lyt/P_Finder_U.arc.LZ/blyt/P_Finder_U.bclyt` | `49746852aac6835d7666872460b621b028098f14de694ff2af7e9f139d01d71e` |
| `P_Fnd_Edge0.bclim` | `lyt/P_Finder_U.arc.LZ/timg/P_Fnd_Edge0.bclim` | `52271c232c2d4b7ec883846e3e73d1386dc45ca75c50429507d1658f549cb096` |
| Published edge PNG | `textures/b527ba033c28f2484b31b50bf08029eb877350267bb792f1a700fd3b2e468ee5.png` | `b527ba033c28f2484b31b50bf08029eb877350267bb792f1a700fd3b2e468ee5` |

`Edge0` is 384×16 at screen `(0,0)`; `Edge1` 16×224 at `(384,0)`;
`Edge2` 16×224 at `(0,16)`; `Edge3` 384×16 at `(16,224)`. Each material
samples the same 16×16 LA8. `Edge0` itself is 1110 zero-alpha, 4614
partial and 420 opaque texels. That is a border vignette, not the
`C_DlgGuid_U` window.

## Label

**Blocked pair / source gap.** Painter unchanged. Pages 3–5 mask
unchanged. Frozen upper **93408** stays until the coordinator recaptures
native page 2 in the page-1 black-feed configuration. That recapture is
predicted to land on the page-1 upper **0**, because this browser upper
is already that page-1 image. This note does not measure that recapture.
Not 1:1.
