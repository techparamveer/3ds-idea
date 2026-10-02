# Ordinary stationary pickup entry

The [2 October Back-hover continuation](home-folder-drag-out-2026-10-02.md)
retains the exact folder source and native pickup owner while the existing
gesture adapter returns to root HOME. Release/cancel/stale-source cleanup still
ends ownership. The source-backed stationary entry below is unchanged; the
500ms hover deadline and cross-container continuation remain adaptations with
a native-compared settled drag-out endpoint, not native held-motion proof.

Root owns the `HomeControls.tilePickup` state and its transition from widget
callback3. The threshold widget is integrated at `4cb429d`; retained candidates
at `a8a8fdd`. [GRID_PICKUP_ENTRY_EVIDENCE.md](../scripts/firmware/GRID_PICKUP_ENTRY_EVIDENCE.md),
integrated at `610b7ae`, extends occupied H21 through mode14 and one
unchanged-position H22. Its four-case report hash is
`6f18a19bed6bf3daf39fb5ba41e2852cb3a8b1e19bb184cc1eac4d82c446330c`.
The earlier `GRID_LONG_PRESS_EVIDENCE.md` ends before this continuation and must
not be cited as proof of completed mode14.

The entry copies candidate to selection without ordinary acceptance effects,
requests primary2, starts/seeks native Pickup and PickUpBlank Scale, and emits
grab (`0x0100002f`) in input. The lower footer hides the original tile and primary
before2D. Original Select retains its H20 pose/controller and primary Loop does
not advance. Pickup/Blank mode5 Scale each submit the density frame in2D, with
no subsequent increment. Candidate, widget capture and long-press flag remain.

`home-tile-pickup.ts` retains separate current/applied Scale fields, source,
blank center, pickup center and an explicitly supplied anchor. Root stores all
centers in320×240 LCD coordinates. The native center-origin/up-Y conversion
belongs to the input adapter, once only. Priority375 and root scale1 belong to
the ordinary entry. Painting must neither advance controllers nor infer a lift.

Presentation owns these additions to `firmware-presentation.ts`:

- `pickupAt(ctx, centerX, centerY, appliedScaleFrame)` renders the ordinary
  Pickup shell and returns the existing `{drawn, icon:{x,y,width,height,alpha}}`.
- `pickupBlankAt(ctx, centerX, centerY, appliedScaleFrame)` renders PickUpBlank.
- Keep existing authored/folder wrappers for their current callers. The new
  methods consume the applied frame directly, with no density clamp, tile-size
  heuristic, timing, gesture or anchor calculation.

Root will connect `screens.ts` and the derived view to those methods. Native
source hiding is driven by `tilePickup.source`; null applied frames must not
draw. Resource Scale and complete ancestor transforms determine shell, shadow,
artwork and blank geometry. Existing `menuArtwork` remains the intentional
portfolio-content overlay; it is not native IconMask/TEV parity. No resource
conversion is required: the presentation audit verified originals, current
public decodes and all14 distinct texture dependencies on SSD in
`presentation/pickup-entry/`.

The browser adapter supplies an explicitly capture-fitted anchor and the
continuation executes `position = supplied touch + supplied anchor`. Only two
Scale endpoints have held native observations: folder Scale1 uses `(0,-14)`;
restored-root Scale5 uses the provisional proportional `(0,-5.25)` derived from
the observed approximately 0.375 pickup-size ratio. Scale0/2/3/4 and fractional
frames retain the earlier zero-anchor adaptation; interpolation is not invented.
The 500 ms Back-hover deadline remains an unmeasured browser adaptation. The
held captures establish endpoint state, not the native transition deadline.

The native inputs are Azahar own 400×480 PNGs from the same CTM-held run:

| State | Capture | SHA-256 |
| --- | --- | --- |
| Folder density1, touch `(244,137)` | `native-held-ctm-20261002/screenshots/_02.10.26_20.33.56.197.png` | `48a18cabbc26a3eacc41926a97dc95f2b75fd7743a6d6c4e953d5adf87750607` |
| Root density5 after held Back | `native-held-ctm-20261002/screenshots/_02.10.26_20.34.26.428.png` | `83c6db6ad50711219e688ee6505c5ad846017520fc141986ff0240e2a8ddab7d` |

The first capture places the native bright pickup at y86..154 versus the prior
browser y100..167, supporting the -14 vertical fit. The root capture establishes
that Back immediately switches the held pickup to root Scale5; it does not by
itself validate the proportional lift. Coordinator browser capture at integrated
commit `652520ee` confirms the adapter submits Scale5, anchor `(0,-5.25)`, retained
folder source 19/2 and Blank Scale1 after Back
(`retarget-first-browser/cancel-root-preview/capture.json`, SHA-256
`a65b9522bcf149ade5e89d20703eb60b7d35aaa37ee4138240648e16c44c29b9`).
That is state-path evidence, not a matched pixel fit. Resource installation,
PicToggle/material mutations and native icon-content setup remain supplied
endpoints. Movement, hover, drop/release, folder-icon and toolbar pickup still
use explicit authored bridges. Do not call this a complete native drag lifecycle
or a matched pickup pixel result.

Root's host checks cover root/child × same/different ordinary entry, H20 release,
vacant hold/callback4, one stationary held pass, grab once, hidden controller
retention, and browser cancellation. Presentation should add meaningful resource
sampling/paint checks for the new methods; it must not control browser/Azahar.
