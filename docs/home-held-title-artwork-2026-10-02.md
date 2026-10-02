# HOME held stock-title artwork — pickup material binding

## Outcome

Held stock-title artwork now enters the decoded `LncIconPickUp_00/P_Icon_00`
picture in the same native-layout draw as its pickup shell. The existing 48×48
SMDH pixels replace only sampler 0; sampler 1 remains the decoded
`IconMask.bclim`. The pickup picture retains its source 52×52 base pane,
alpha 235, two UV sets, bilinear samplers, three TEV stages and source-over
blend. Applied `Scale` frame and LCD centre still come from the retained pickup
owner unchanged.

The preceding browser path drew the same PNG separately with Canvas smoothing
disabled after hiding `P_Icon_00`. That bypassed the pickup-specific mask,
sampling and combiner, and was not equivalent to the decoded layout. The new
path does not introduce a fitted colour, opacity, size, filter or hand-drawn
graphic. `LncIconDist_01`, the separate ordinary-grid title material, is not
reused.

Portfolio artwork remains an explicitly non-native overlay on the returned
pickup bounds, and folder glyphs retain their existing decoded folder-pickup
path. Missing pixels, dimensions other than 48×48, changed pickup material
identity and a rejected native draw fail explicitly instead of falling back to
the raw image.

## Captured defect

The fresh Azahar 400×480 held PNG
`_02.10.26_21.12.51.826.png` has SHA-256
`247f1f090f92a6eee5ef9f71266aafc09e5711bace764ec31ee3579126977e39`.
The coordinator's pre-change production lower LCD at
`dimming-phases/folder-held/lower.png` has SHA-256
`a39cf4f02f68e1537da6a33ca1f5d28730c744f37ea96c16ba943a78c0ad56ef`
and was rendered from integrated runtime `4e18d7c9`.

The unshifted diagnostic found that neutral unheld artwork already matched its
fixed ROI within maximum delta 1 with identical bounds and classified pixel
count. The held-only mismatch was sampling-dependent: folder-held yellow ink
kept native/browser Y bounds 115–139 but measured 38 pixels wide natively and
39 in the browser; root-held kept Y bounds 47–56 but measured 14 pixels wide
natively and 16 in the browser, one extra browser edge column on each side.
This isolates the correction to the held pickup material rather than the
shared SMDH source geometry.

The diagnostic report, manifest and sheet are respectively:

- `comparison/held-artwork-diagnostic-report-4e18d7c9.json`, SHA-256
  `cdfb841e0555d64aa3cf02328cb0ba8e7f3b1d1df5249bff2ac32eb1f7b95c4d`;
- `comparison/held-artwork-diagnostic-manifest-4e18d7c9.json`, SHA-256
  `19477c84fe71b16eb358ad594e5ebb069aab658f495a20833ea48917256de76f`;
- `comparison/held-artwork-diagnostic-sheet-4e18d7c9.png`, SHA-256
  `698cb2d1c26252f82ddcf4caefab1712efd548c40c40fdc10af5904687ec5382`.

They remain under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-pickup-held-20261002/`.
The diagnostic is evidence for the captured defect, not post-change
acceptance.

## Source and delivered identity

The held application is Health and Safety Information, title
`0004001000022300`, version 3077, content index 0 / content ID `00000008`.
The manifest maps its icon to `icons/health-and-safety.png`, SHA-256
`156d28fc628375d35813b90a19954241f6da6c34e067f5c2a9b2ccc48dc84aa4`.
Its decrypted `ExeFS/icon` source has SHA-256
`ab6cfc9da9089bb7209bee980ff79b365638e84eacb663e1a792fed58e7a9055`;
the title record's source SHA-256 is
`f941928965cbea4c30f6049304fd6e31c4f8c8e87cf713d67c159f9c63c7ecdf`.
The title selection records `ctr-native-web` 1.3.1 and CTRTool 1.3.0.

The pickup material comes from EUR HOME Menu title `0004003000009802`,
version 24576, content index 0 / content ID `00000082`:

| Role | Decrypted member / delivered key | SHA-256 |
| --- | --- | --- |
| Pickup layout and `P_Icon_00` material | `launcher_LZ.bin/blyt/LncIconPickUp_00.bclyt` | `6ec30917cd9ed047ce5e9937a4e776456696a265490fc5267cda5960f6341ca2` |
| Pickup scale animation | `launcher_LZ.bin/anim/LncIconPickUp_00_Scale.bclan` | `c4138973ce034f02f6e5049f945f3a69446f40a9b95d60ef3d0c4481d0343cce` |
| Pickup mask | `launcher_LZ.bin/timg/IconMask.bclim` | `de8c6815059f79db23984571fb864f56792a738b3391a3800e3d6bc47ab59983` |
| HOME source archive | `RomFS/launcher_LZ.bin` | `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834` |
| Delivered launcher pack | `home.launcher` → `packs/home/launcher.json` | `f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044` |

The HOME conversion is `ctr-native-web` 1.2.0 with CTRTool 1.3.0. One bounded
source/resource audit established this identity; no second source path was
pursued.

## Verification boundary and remaining defect

Focused tests cover folder-held title-ID forwarding, preserved centre and
applied `Scale`, distinct title texture identities, the exact pickup
pane/material contract, portfolio separation, explicit resource/draw failures,
and no pickup paint after gesture cancel or release. The existing gesture suite
continues to cover stale-source and lifecycle cancellation.

No worker browser or Azahar session was operated. The coordinator must recapture
the integrated result before assigning pixel status. The whole held scenario
therefore remains `fail` at this checkpoint.

The same diagnostic identifies a separate one-row folder-held shell/halo
residual: native bright shell bottom Y is 154 versus browser 153, and native
mint-halo bottom Y is 160 versus browser 159. Root-held shell/halo bounds match,
and the folder foreground-panel control remains within maximum delta 1. This
slice does not alter shell rasterization or claim that residual fixed. Motion,
exact input timing and audio also remain open.

## Fractional LCD sampling follow-up

The coordinator integrated the first correction at runtime `edc0090e`. Its
folder-held artwork ROI `(220,108,48,38)` reached zero pixels over delta 2 with
maximum delta 2, improving from 674 pixels and maximum delta 74. This is
post-integration evidence that the authored pickup material corrects that
captured folder-held artwork. It is not a whole-scenario pass.

The same capture loop left a root-held residual at the smaller Scale5 pose:
the fixed artwork ROI `(48,42,22,20)` retained 236 pixels over delta 2 with
maximum delta 54 (previously 256 / 103), while the shell retained 501 pixels
over delta 2 with maximum delta 81. The production pickup centre is
`(59,49.75)`, so the pane lands at a fractional LCD phase. The production raw
lower LCD `artwork-desktop/cancel-root-preview/lower.png` has SHA-256
`d23e11decab05932737a1656a913242e5080ff53b3e744c486465aebdc5a5687`;
the fresh native own-PNG `_02.10.26_21.13.23.277.png` has SHA-256
`9f2d8764bad8e6ff099366063873f65783a4ec7e3b98d90a4146de685af9ab78`.

The existing renderer's `pictureSampling: 'lcd'` path evaluates an eligible
source picture once at destination LCD pixel centres. Without that opt-in, a
picture is rasterized at pane size and Canvas then shifts the intermediate at
the fractional phase. The stock pickup call now selects the existing direct
path; no generic raster implementation or source resource changes.

This selection is draw-wide for `LncIconPickUp_00`, not pane-scoped. It can
therefore change any picture in that layout whose transform is fractional and
whose source-over blend and opaque destination satisfy the renderer's guarded
direct path. At the captured root Scale5 pose that includes artwork
`P_Icon_00`, shell `P_Btn_00` and shadow `P_BtnShdw_00`; additive
`P_Btn_01` remains on the established intermediate fallback. Those stock
shell/shadow changes require separate comparison, so the folder-held one-row
shell residual cannot be called fixed without coordinator evidence. Portfolio
pickups (no native title ID) and folder-icon pickups do not opt in.

The source layouts define the transforms, samplers, UVs, TEV and blend, but no
recovered native controller selects this browser transport option. Scoping the
existing LCD-centre sampler to stock held pickups is therefore a
**capture-directed native-raster transport adaptation** pending matched
production recapture. Ordinary tiles and cleared cancel/release states do not
use the pickup draw and remain unchanged.
