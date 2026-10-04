# Camera Welcome shoot underlay — 4 October 2026

Stock/Camera worker on `codex/camera-shoot-underlay-20261004` at `1d432c1c`.
This slice changes no runtime, pack, CGFX reader or projection. The assigned
page-1 defect (black lower surround around the guide) is already bound on this
checkout. No new layout or model bind is justified. Capture stays inert.

This is not a 1:1 claim. Tests and this note do not close pixels, input, motion
or audio. Coordinator recapture remains the acceptance gate.

## Assigned defect versus current paint

The [underlay handoff](camera-guide-underlay-source-handoff.md) starts from
integration `69d570a`: Welcome page 1 versus preserved
`camera-first-run/native/combined.png` is **1,387 upper / 7,026 lower** pixels
over 2/255. The lower residual is the native dimmed shoot scene; that browser
pair cleared the surface around `C_DlgChA` to black.

`drawNativeCameraGuide` still begins with an opaque black `fillRect` on both
LCDs. That is only the canvas clear. On this tree the lower pass then paints
the already published `P_Shoot_D` CGFX, the source `P_Shoot_D` 2D layout and
children, then the settled black-alpha128 modal, then the guide body. A missing
shoot pack fails the draw instead of publishing a reconstructed native screen.

Settled order in `src/os/stock-native-camera.ts`:

1. Black 320×240 clear.
2. Scene-owned `options.cameraShoot.draw` (`src/scene/camera-shoot-background.ts`).
3. `P_Shoot_D` + `P_CamBtn` + `P_CamIcon` (`drawCameraShootWelcome`).
4. `drawCameraGuideModal` — source black `(0,0,0,128)` across the lower LCD.
5. `C_DlgChA` and the page button container.

The black clear is therefore not the visible page-1 surround when those
resources are ready. Re-implementing the same underlay, or inventing another
projection to chase the `69d570a` count, is not justified.

## Already-bound resources

EUR Camera `0004001000022400`, version 4097, content index 0 / ID `0000001a`.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| Shoot CGFX | `manifest.models.cameraShootBackground` → `models/camera-shoot-background/model.json` | `romfs/res/P_Shoot_D.bcenv.LZ` (clear CGFX) | `728ff7412764350ab15fd978236e29dfc0a5bd850803b7a2f343ad82ca0294a1` |
| Compressed CGFX | [handoff](camera-guide-underlay-source-handoff.md) | same `P_Shoot_D.bcenv.LZ` | `a5519a472c873ed3bca958ab9716e1a08e43df87cc6d17586ea6611292f0481b` |
| Shoot layout pack | `packs/camera/contents/0000-0000001a/lyt-P_Shoot_D-arc-LZ.json` | `lyt/P_Shoot_D.arc.LZ` | `a5aa9ae10eb59d400160a85f8aa919a274f6f13d480d041d7f95b91eef0dd41e` |
| `P_Shoot_D` BCLYT | pack `resourceSources.layouts.P_Shoot_D` | `blyt/P_Shoot_D.bclyt` | `3000aa79b92564e0cf495403adaa1c5d835fc44c1c64449075c369137d23ef5b` |
| `P_Shoot_D_Disable` | pack `resourceSources.animations.P_Shoot_D_Disable` | `anim/P_Shoot_D_Disable.bclan` | `a129d382126a52af8f615d4348f80fc9a20425134c1d2c3c789abc8b007fc1a1` |
| `P_CamBtn` | same pack | `blyt/P_CamBtn.bclyt` | `af471925343dab648422e7793264b99f1ebd7267cc48bd01cfc644c72acb1e2f` |
| `P_CamIcon` | same pack | `blyt/P_CamIcon.bclyt` | `2e70e74d1d877be77179b5bbed79cf73131101c3fbbc58b105b90b284a524da2` |

CGFX converter: ctr-cgfx-web 1.4.2; wrapper
`cfd133f797f14ad24ad70eee865317d6163110e66ed71af4b23aa4ab6836d90a`, exporter
`5fd4a013c92586e0522a77599190f174f8a3be8005ae4120cf3c07b44146c7fe`.
Models in the published JSON remain `P_Shoot_D,X_Arw,Z_Arw,A_stick`. Only
`P_Shoot_D` is visible; the arrows and stick stay hidden because Welcome
visibility and pose are still unbound
([state audit](camera-welcome-underlay-state-audit.md)).

## Labelled adaptations already in force

These are existing fits, not new work from this checkout:

- CGFX camera aspect **1.5 → 4/3** for the 320×240 lower target. Source Aim
  pose `(0,680,661.113)`, target `(0,0,20.4593)`, FOVY `0.660595` and
  near/far `0.34/34000` are unchanged. This is the prior viewport fit, not a
  measured grid registration.
- Offscreen CGFX clear is source warm RGB `(233,224,208)`, then an opaque
  readback. Grid1 has no opaque base plane.
- 2D `P_Shoot_D_Disable` and `P_CamBtn_Disable` held at frame 0; `P_CamIcon`
  uses authored `ANM_IconPtrn=[0]`. Native Welcome clip/camera-icon selection
  remains untraced ([top-control audit](camera-guide-top-controls-audit.md)).
- Named slot-5 materials ShootLBase, ShootRBase, Lever1 and UserWdw1 take the
  existing orange user theme `(255,161,0,255)`. Other constants stay source.
- Settled modal is source black alpha 128
  ([modal composition](camera-guide-modal-composition.md)). Opening/closing
  timing is unported. C_BkMask is not loaded.

`scripts/firmware-cgfx/camera.py` still accepts only CCAM revision
`0x06000000`. camera1 in this CGFX is `0x07010000`. This slice does not
change that gate or invent a replacement projection. The published model
camera record is consumed by the existing scene adapter, not by widening the
Python reader.

Shoot, capture, import and persistence stay inert. Guide OK still ends in the
read-only folder screen.

## Implementation history (already on `1d432c1c`)

| Commit | Bind |
| --- | --- |
| `6a0f158` | Static `P_Shoot_D` CGFX underlay |
| `271ddc9` | Source 2D `P_Shoot_D` layout under the guide |
| `fef0d4e` / `2db3ca7` | `P_CamBtn` / `P_CamIcon` child delivery and mount |
| `0d7bfea` | Warm CGFX clear and settled black-alpha128 modal |

Evidence notes: [underlay adaptation](camera-shoot-underlay-adaptation.md),
[child delivery](camera-shoot-child-delivery.md),
[modal composition](camera-guide-modal-composition.md),
[first-run guide](camera-first-run-guide.md).

## Remaining page-1 pixels

This worker did not recapture. Recorded empty-mask counts over 2/255:

| Pair | Upper | Lower | Notes |
| --- | ---: | ---: | --- |
| Assigned `camera-guide-page1-69d570a-20260926` | **1,387** | **7,026** | Guide present; lower surround black |
| CGFX-only `6a0f158` (matrix v48) | 1,387 | 7,026 | MAE 8.2033 → 7.2603; perimeter still black |
| 2D layout `271ddc9` (matrix v49) | 1,387 | 2,690 | Missing top child; grid/border residuals |
| Latest recorded post-modal `0d7bfea` (matrix v56) | **0** | **1,401** | RGB MAE 0.1715 / 0.2372; black-feed fixture |

The current remaining page-1 residual from the last coordinator pair is
**0 upper / 1,401 lower**. The [lower residual audit](camera-guide-lower-residual-audit.md)
and [top-control follow-up](camera-guide-top-controls-audit.md) still localize
those lower pixels to side-strip grid/backdrop registration, the capture-fitted
top controls (about 588 of 1,401 at Y0–5), and guide border/bird/text edges.
Native attenuation, clip/theme writes and exact CGFX projection remain open.

If a later production build again reports ~1,387 / ~7,022, that is a
publication or readiness regression against this bind, not a missing first
underlay.

## Coordinator recapture pair

Named pair: **Camera Welcome page 1**, empty mask, threshold 2/255.

- Native: preserved `camera-first-run/native/combined.png` (400×480), lower
  crop `(40,240,320,240)`.
- Browser: raw 400×240 upper and 320×240 lower after a production rebuild that
  includes this checkout.
- Compare against
  `camera-guide-page1-69d570a-20260926` (assigned black-surround defect) and
  `camera-guide-page1-modal-0d7bfea` (latest recorded bind).
- Inspect the lower perimeter, top controls and guide body; the guide should
  stay present. Then pages 2–5 and guide exit for resource release.

This lane did not drive Azahar or preview 3021. Focused Camera underlay tests
on this worktree pass; they do not establish visible browser pixels.
