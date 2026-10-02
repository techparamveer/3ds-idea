# HOME held stock-title artwork — pickup material binding

## Outcome

The native material binding is retained. The later direct LCD-sampling opt-in
described below was tested and withdrawn after it regressed root-held artwork;
it is not the current rendering policy. Source geometry and fitted anchors
remain unchanged.

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

## Rejected LCD Sampling Experiment

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
the fractional phase. Experimental runtime `5d8cb1bb` selected the direct
path; `e911e475` withdrew it after comparison. No generic raster implementation
or source resource changed.

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
existing LCD-centre sampler to stock held pickups was a
**capture-directed native-raster transport adaptation**, not accepted after
production recapture. Ordinary tiles and cleared cancel/release states did not
use the pickup draw and remained unchanged.

## Coordinator Integration

Material source `931ec40e` integrates as `edc0090e`; LCD sampling source
`eb649e7e` integrates as `5d8cb1bb`, with scope note `7a82f8b8` integrated as
`a94ba504`. Independent reviews found no actionable issues in either stage.
The final sampling review explicitly covers its authorized stock-pickup-wide
scope, not an artwork-only claim.

Each integrated runtime passes the full suite: 1,842 pass, 0 fail, 23 skip,
1 TODO (1,866 tests). Both production builds, typechecks and shader validation
pass. Private logs are `artwork-{tests,build,typecheck,shader}.log` and
`artwork-lcd-{tests,build,typecheck,shader}.log` under the held-pickup root above.
Neither stage changes delivered assets, native material data or the generic
renderer. Shader validation is supporting evidence, not native pixel proof.

The comparison reuses the four preserved native own-PNGs from
`native-held-dimming-20261002`, captured in the preceding coordinator run.
There is no fresh native launch in this slice. Input/configuration history is
preserved in `dimming-native-input-record.md`; the native held lower LCD had
repeated byte-for-byte. Production replays use projected pointer input and raw
paired LCD capture, with no state injection. The wall-time phase schedule does
not establish a shared native render/HID epoch.

The first runtime's desktop, mobile and reduced-motion runs each complete
seven paired captures under `artwork-{desktop,mobile,reduced}`; its phase run
completes five under `artwork-phases`. Retention, carried source identity,
atomic swap/no item loss, reverse preference restoration and outside-release
cancellation pass without page errors. All sessions remain muted. The
coordinator opened the mobile console image and the held lower LCD.

At `edc0090e`, fixed unmasked folder artwork improves from 674 pixels above
delta 2 / maximum 74 to zero / maximum 2, with native ink bounds and count.
Root artwork improves from 256 / maximum 103 to 236 / maximum 54 and remains
fail. Folder shell improves from 1,197 / maximum 74 to 430 / maximum 9, with
its one-row residual still open at that stage. Neutral artwork remains zero /
maximum 1. Toolbar/footer/panel control regions are unchanged before/after.
The second sampling stage and its comparison are recorded separately below.

### Experiment and Restoration

The second runtime completed the same three seven-pair variants and five-pair
phase replay under `artwork-lcd-*`, with functional restoration/no page errors.
Against the same fixed native references, folder art reached zero above delta
2 / maximum 1 and its shell improved to 266 / maximum 9. Root art regressed
from 236 / maximum 54 to 251 / maximum 65; its shell regressed from 501 to 523
above delta 2 with maximum 81 unchanged. Neither a phase shift nor a different
small-icon source has been established. No fitted coordinate or guessed source
was introduced to hide the regression.

A bounded offline decoded-resource diagnostic reproduced the sampled browser's
100-pixel yellow feature at Y49.75. Sweeping Y47.75..51.75 in 1/64-pixel steps
did not resolve the 16-pixel versus native 14-pixel width; full-RGB results did
not justify an anchor change. This is diagnostic evidence only, recorded in
the shared LOG, not another production capture or proof of a small-icon source.
Keep anchor -4.25 and investigate the remaining source/sampling gap separately.

Commit `e911e475` removes only the stock LCD-sampling opt-in and records the
regression in the focused test. `git diff edc0090e -- src` is empty after this
restoration: the retained runtime is exactly the first material-binding code.
The final full suite again passes 1,842 tests, with 23 skips and 1 TODO;
typecheck, build and shader validation pass. Logs use `artwork-restored-*`.
The source worker's experimental commits remain preserved, not reset.

The coordinator opened both comparison sheets. Fixed artwork and shell regions
use raw LCD coordinates, without shifts, masks or colour fits. Enlarged sheet
cells are nearest-neighbour visualizations only. Reports under `comparison/`:

| Artifact | SHA-256 |
| --- | --- |
| `held-artwork-final-report-edc0090e.json` | `239db154cc24e83350292a6c667c4a8965202d3adb0837a856940f6dec9c15b8` |
| `held-artwork-final-manifest-edc0090e.json` | `870efc77fb644894a5fc3050f9111cb42eb27452f7986886be51c7f47a0612a8` |
| `held-artwork-final-before-native-after-edc0090e.png` | `67adda93b5bf4a1542df758a825207bcdd2352f5e202e3d710f2a02fd6aaeaec` |
| `held-artwork-final-report-5d8cb1bb.json` | `2fee2f61cfc4ee7bb6d1fd680b3166248780f9a4f85087a79b370ee4e34097d0` |
| `held-artwork-final-manifest-5d8cb1bb.json` | `c1ba6cc4fc0132a7420e8f4603bcef7e5d2a58c5ad9e923ce7b1dd1ccfcc7d69` |
| `held-artwork-final-before-native-after-5d8cb1bb.png` | `08c2331544afbd6a2772afe6cc54f5b892a1be513a4d5f1f2748739c36523e44` |

Whole scenarios remain `fail`. At the retained material stage, folder-held
whole lower has 5,929 pixels above delta 2 (maximum 168), root-held 9,046
(maximum 255), and upper captures have unmatched clock/wallpaper/banner epochs.
Native input cadence, motion and muted audio are not accepted. Remaining
non-native content/policies include portfolio content, fitted anchors,
hover/drop/edge/lifecycle/coverage/high-slot and held visibility/backing
adaptations documented in the preceding notes. No private matrix was rewritten.

Final restored runtime `e911e475` completed another seven-pair desktop input
replay under `artwork-restored-desktop`, including outside cancellation and
byte-identical preference restoration with no page errors. Its lower held LCD
was opened. The dedicated muted Chrome PID 98415/window 11763/session 45621
closed normally with exit 0 and no remaining windows. No Azahar was launched
in this slice; unrelated apps/audio were untouched. Production preview remains
at `http://127.0.0.1:3021/`.

The restoration report confirms byte-identical lower LCDs and every requested
fixed ROI between `edc0090e` and `e911e475` desktop held captures. Final native
folder-held art remains zero above delta 2 / maximum 2, shell 430 / maximum 9,
toolbar zero / maximum 2, footer 1,576 / maximum 4 and panel zero / maximum 1.
Root-held art remains 236 / maximum 54, shell 501 / maximum 81 and footer zero /
maximum 1. Final desktop whole lower counts are 5,951 folder / 9,046 root;
the phase replay's 5,929 folder count above belongs to its separately tracked
pose. Both remain fail, not a global static match.

- `comparison/held-artwork-restoration-report-e911e475.json`: SHA-256
  `11328d2e26d3788e613c8f0d133aeb08b36585f767a5fe5c692795c20c0837db`.
- `comparison/held-artwork-restoration-manifest-e911e475.json`: SHA-256
  `8bf6279aea2ec551b364dbcd163a24239727691f8d364f4c82d1db438cb1e957`.

All 23 restoration manifest records verify; both earlier reports and sheets
retain their recorded hashes. Source worker, reviewer and comparator are idle.

## Bounded Small-Icon Check

At unchanged coordinator `aad1e26c`, the source worker decoded the same pinned
Health `ExeFS/icon` file's 24x24 RGB565 plane at offset `0x2040`, length 1,152.
The PNG SHA-256 is
`4353c7e059b0f5fc44d9273baead3120e3616f6603305a1f277389897a807a1d`.
The existing `scripts/firmware/texture.py` decoder has SHA-256
`399be43d43fc6d92363386c0a5347135e875ec35edca8d1a1e36145366aed38f`.
Its 48x48 control decode at `0x24c0`, length 4,608, reproduces the delivered
large PNG byte-for-byte. Title/content/source provenance remains the Health
identity recorded above; no new production manifest entry was published.

An offline diagnostic substitutes each unchanged plane into the authored
Scale5 pickup material at the retained centre `(59,49.75)`. It reconstructs
the browser underlay from the large-icon overlay, then composites the small
overlay. The large control reproduces the browser ROI exactly, but that
calibration does not independently establish the recovered underlay or native
controller. This is not a new production capture or native acceptance pair.

In fixed raw lower ROI `(48,42,22,20)`, small-source yellow bounds match native
`x52..65/y47..56`, versus current `x51..66/y46..56`. Yellow-mask symmetric
difference improves 8 to 6 pixels. Maximum RGB delta improves 54 to 31 and
mean absolute channel error 6.403 to 4.030, but pixels above delta 2 worsen
236 to 253. The result is mixed and still outside tolerance: do not select
the small plane by an invented density, pane-size or title-specific rule.

Private evidence is under `small-icon-source/` in the held-pickup artifact
root above: `decoded-source.json`, both source PNGs,
`compare-small-icon.mjs`, and `small-icon-comparison.json` (SHA-256
`ce3353585cf732cb9b4e78f2d2c7cfbbf24693474283573801884326ec0cba24`).
No masks, padding, UV, filter, anchor, colour, runtime or public asset changed.
Independent review verified source/decoder identity but did not establish
native selection. The source worker incorporated restoration `e911e475` as
`ca802d23`; experimental history is preserved.

The root-held artwork remains `fail`, with source selection a recorded gap.
This exhausts the bounded source-only check for this feature; do not repeat
sampling, anchor or small-icon experiments without new discriminating native
evidence. No new build, tests, GUI, motion or audio acceptance is claimed.
