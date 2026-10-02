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

The browser adapter currently supplies zero anchor, retaining its existing
pointer-centered placement. The native anchor initializer is unresolved; the
continuation executes position = supplied touch + supplied anchor. Resource
installation, PicToggle/material mutations and native icon-content setup remain
supplied endpoints. Movement, hover, drop/release, folder-icon and toolbar pickup
still use explicit authored bridges. Do not call this a complete native drag
lifecycle or a matched pickup pixel result.

Root's host checks cover root/child × same/different ordinary entry, H20 release,
vacant hold/callback4, one stationary held pass, grab once, hidden controller
retention, and browser cancellation. Presentation should add meaningful resource
sampling/paint checks for the new methods; it must not control browser/Azahar.
