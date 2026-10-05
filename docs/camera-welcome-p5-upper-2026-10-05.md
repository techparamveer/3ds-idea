# Camera Welcome page 5 upper 7,615 — live-feed source gap — 5 October 2026

HOME-fidelity Camera worker on `codex/camera-welcome-p5-upper-20261005`
from fidelity `9c431d1d`. Sparse worktree; `node_modules` linked from
HOME fidelity. No `model/`. No painter change. No Azahar. No preview
3021. No CDP. No recapture. Capture stays inert. Page-1 lower **1401**
stays the labelled perimeter
([page-1 note](camera-welcome-p1-1401-2026-10-04.md)). Page-3/4
`TxtDlg` interiors, browse chrome, the shoot underlay and `P_Shoot_D`
stay untouched.

This is not a 1:1 claim. Tests and this note do not close pixels, input,
motion or audio. Coordinator recapture remains the acceptance gate.

## Pair (reused, not recaptured)

Empty mask. Threshold any RGB channel >2/255. Native upper is the top
400×240 of the combined 400×480 PNG.

| Item | SHA-256 |
| --- | --- |
| Native `Nintendo 3DS Camera_26.09.26_20.38.02.703.png` | `616fbeaebdf290656868fd2449cba3f61362bf7be50eb08bf3db08d206cbb18f` |
| Browser upper | `1df24847d9033b20c9c7619f693172c748765dd8017ce57badfcdc80a45d3467` |
| Page-1 browser upper (comparison only) | `b642d80f8f219a90f61f38718f58c6be71cfbd48aee421763ffaff878f7ac00e` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |
| `camera-welcome-p5-recapture-20261005/diff/report.json` | `87306be0f58c1d4fcae4cbd4531557c4ca8d7243483798c3b619a4610f4b6bb6` |
| Upper contact sheet | `64755be4230c0543c7616fe59d5e1933b517d9bbf90711805632ae27f83135b8` |

Report directory:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-welcome-p5-recapture-20261005/`.

Inspected the upper contact sheet. The green window, white interior,
bird, balloon and pen align. Red sits in the margin around that window,
where native shows the configured camera photograph and the browser
shows the black read-only finder.

Recorded empty-mask upper count over 2/255: **7615** (MAE 6.1026, max
128 at `(12,6)`, native `(127,127,127)`, browser `(255,255,255)`).
Official components: one 7607-pixel field covering the margin, plus 8
pixels at `(112,3)` size 3×3.

| Region | Rectangle | Over 2 | Notes |
| --- | --- | ---: | --- |
| Whole upper | `[0,0,400,240]` | **7615** | max 128 at `(12,6)` |
| Illustration centre | `[80,40,240,160]` | **0** | `P_Guid02_U` sprites |
| Left margin | `[0,0,80,240]` | 2447 | mostly outside the opaque window |
| Right margin | `[320,0,80,240]` | 2457 | same |
| Top band | `[0,0,400,40]` | 2768 | feed above the window plus the top rim |

## Ownership

Page 5 (`cameraWelcomePages[4]`) already draws `C_DlgGuid_U` and then
`P_Guid02_U`. Page 1 leaves `illustration` null, so it does not draw
that window, and its upper is already **0**. Comparing the two browser
uppers against this native frame:

| Class | Pixels | What it is |
| --- | ---: | --- |
| Same as the page-1 browser | **7526** | Page 5 did not paint these. Native shows the live photograph. The page-1 finder already matched its own native upper. |
| Changed from page 1 | **89** | Partial alpha of `GuidWdwU_L` / `GuidWdwU_R` (34–238) source-over the page-1 finder. Opaque neighbors match native. |
| Raster alpha 255 and over 2 | **0** | Opaque window body and white interior already match. |

`(12,6)` is in the 7526. Page-1 and page-5 browsers are both
`(255,255,255)` (`P_Finder_U` / `Edge0`). The delivered window sample
there is alpha 0, so the painter leaves `Edge0` in place. Page-5 native
is `(127,127,127)` because the photograph is visible in that
zero-coverage texel. `(20,6)` and `(200,120)` match native on both the
green cap and the white interior.

`P_Guid02_U` is five sprites (`Ballon`, `Inko`, `Pen`, `Effect_Ballon`,
`Effect_Inko`) on a 400×240 null root. None of those pictures covers
`(12,6)`. The centre match is the sprites, not a full-bleed plate.

`GuidWdwU_L` is 368×230 at centre `(-10,0)`; `GuidWdwU_R` is 20×230 at
`(184,0)` with scale X `-1`. Both materials use `C_DlgChBase.bclim`
(ETC1A4) and `C_DlgChLay_U.bclim` (A4), standard source-over
(`operation` 1, source factor 4, destination factor 5), and the left
pane's texture matrix scale `(18.4, 1)` places the 20px cap at 1:1.
There is no second upper-window layout, no clip on the painter draw,
and no unused animation on `C_DlgGuid_U`. Filling the zero-alpha margin
would cover `Edge0`, which page 1 already matched. A fitted crop is not
a dump rectangle.

The 89 rim pixels are the same backdrop gap. Their browser values are
the delivered partial alpha composited on the page-1 finder. Native is
that coverage over the photograph. Changing the rim alpha or RGB would
move the opaque body, which is already equal.

## Provenance

EUR Camera `0004001000022400`, version 4097, content index 0 / ID
`0000001a`. Pinned executable SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.
Converter ctr-native-web 1.2.0.

| Element | Dump path | SHA-256 |
| --- | --- | --- |
| Dialog archive | `lyt/C.LZ` nested `Dlg` | `101e184056296119b5b17021ff148211b49090a5729c727d1113fc27b3f47957` |
| `C_DlgGuid_U` | `lyt/C.LZ/Dlg/blyt/C_DlgGuid_U.bclyt` | `63b7f51b16405dd7dd40e1cfc090cf9094dba9864e824aa4a4f287735aa426e1` |
| `C_DlgChBase.bclim` | dialog `timg` | `a9fa4c68c3ad4222c9e5da2df047b2bc8cf38d227ab296e2e4e04d0bf4a18b03` |
| Published base PNG | `textures/665505a3deb531c280efd484a261ca8132f6b548ac34655a02f45333c0eecebb.png` | `665505a3deb531c280efd484a261ca8132f6b548ac34655a02f45333c0eecebb` |
| `C_DlgChLay_U.bclim` | dialog `timg` | `4ace99514177f09014a0b078af175622944068ef8eceab46982f1df112e943e4` |
| Published lay PNG | `textures/8f0ff3062701d35fb201cd653f73e1ce1560b1447c26e0a0d8173c41abf1af66.png` | `8f0ff3062701d35fb201cd653f73e1ce1560b1447c26e0a0d8173c41abf1af66` |
| Guide archive | `lyt/P_Guid_U.arc.LZ` | `2c39e2f8376ddc2c3e460a20721190a5272736930bd24ca8b61ad93ab71817b9` |
| `P_Guid02_U` | `lyt/P_Guid_U.arc.LZ/blyt/P_Guid02_U.bclyt` | `f4d871b2c9541a7b53d8b147fee3b6fdcd61389fe83424936e84d801f36728cc` |

The black finder in place of the live photograph is the existing
read-only adaptation recorded in
[the unobscured-feed mask](camera-guide-feed-mask.md). This pair does
not add a second owner.

## Label

**Source gap.** Painter unchanged. The frozen upper **7615** stays
unresolved until a coordinator recapture with the real camera image, or
until a dump-backed feed binding exists. Neither is in this slice.
