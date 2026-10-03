# HOME Toolbar Motion Comparison - 3 October 2026

## Delivered Correction

Runtime `15630913` integrates reviewed worker `b62675ae`, based on `23defd22`.
Notes, Browser and Miiverse now render the exact hosted visibility, scale, yaw
and decoded clip frames, sharing the existing Friends/Notifications path.
Their hard-coded front pose and independent browser-time clips are removed.
Readiness/failure, labels, sibling mask and generation/request/activation
publication guards are preserved. No asset, shader or material changed.

The [source trace](home-toolbar-motion-source-2026-10-03.md) identifies the
common constructor/update class for all five native types14..18 in pinned HOME
`0004003000009802`, v24576, content0/`00000082`. Existing visible-element to
manifest/source mappings and `ctr-cgfx-web`1.4.2 conversion identities are in
the [host asset record](home-toolbar-host-2026-10-03.md#source-assets).
No graphics, fonts or audio were invented or re-extracted.

## Capture Identity

Private root `A` is
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001`;
`R` is `A/home-toolbar-motion-20261003`.
Native is the isolated `A/native-toolbar-motion-20261003/Azahar.app`, original
hardware, English, EUR, factor1, null output and volume0. Eleven preparation
files and five external anchors were independently rehashed before launch.
Executable SHA-256:
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`.
HOME content:
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
Input movie `R/native/toolbar-motion.ctm`:
`fcff11d515870fbfe91abe4c9d61fd37431a685d438eef90f88941fa4ee36f65`.

Native first taps select Browser, Notes and Miiverse at nominal10/40/70s.
Fifteen own400x480 PNGs are bound by exact filename, SHA-256 and chronological
ordinal in `R/comparison/frozen-plan-addendum-03.json`; all are retained in
`A/native-toolbar-motion-20261003/screenshots/`. Nearby AX observations are
not exact PNG epochs. The Browser sample1-to2 interval is particularly long;
native ordinals must not be described as browser one-second intervals.

Collector `R/browser-v2.mjs`, SHA-256
`4d3b02a13243e4691d8fb6168ceab63bf590a26dff24f03ba30df92f07f6962a`,
drives the same selection order with actual projected pointer input. It gates
on cursor and active-primary readiness, then captures requested offsets
+1 through +5 seconds from pointer release, retaining actual offsets.
Accepted before is `R/browser-before-v2/desktop` at `b3e03f32`.
Sequential after roots are `R/browser-after-v2/{desktop,mobile,reduced}` at
`15630913`, each with16 raw400x240 upper/320x240 lower pairs, including Camera
baseline. All runs complete exit0, errors[]/nativeScreenFailures[]/mute.
No state injection or presentation overrides are used. The initial incomplete
`R/browser-before/desktop` run remains excluded: it asserted the old primary
before active readiness and is not product-failure evidence.

## Inspected Result

The coordinator opened the final sequence sheet and raw frames. All three
native selections visibly turn; before browser sequences stay front-facing.
After desktop and narrow sequences visibly change front/side orientation,
including edge-on +3s frames. Reduced motion stays front-facing and its adjacent
raw LCDs are byte-identical, as the explicit accessibility adaptation requires.
Desktop, narrow and reduced viewports show the model and both LCDs correctly.
Neither changing wallpaper pixels nor host telemetry alone establishes yaw.

The frozen comparison uses empty masks, delta2, no registration, color fit,
phase search or best-frame selection. Regions are whole400x240/320x240 LCDs,
upper banner body `[120,35,280,160]`, and lower footer `[0,212,320,240]`.
Native lower is cropped from `[40,240,360,480]`. All rectangles are half-open.
All120 whole native/browser comparisons remain **fail**. Same ordinal does
not mean matched epoch, so no numerical pixel-improvement, pose-parity or
cadence claim is made. All60 adjacent lower-footer controls are byte-identical.

The coordinator independently rehashed213 records and recomputed all480
metrics with `R/verify-comparison.mjs` (240 cross-source,240 adjacent).
Final files under `R/comparison/`:

| File | SHA-256 |
| --- | --- |
| `report.json` | `d31af59ff0878501a4f57a4c87657dfd5969a1331c860b9845bbfc82501a9d2b` |
| `sheet.png` | `497e3c58ee94326dd5fc32e694874f3bf14897a60a352c076f67d0efd0017c76` |
| `manifest.json` | `0ac83aeac8f1f8f2d54f860e4968bf00ec4c62b36c17a31ae591d038fcc70bfa` |

## Regression and Limits

Full tests:1966 pass,0 fail,23 skipped,1 TODO. Production build and sequential
typecheck pass. An earlier typecheck overlapped build cleanup and reported
missing generated `.next/types`; the completed-build rerun passes. Independent
exact-commit review reports no actionable finding. No shader check is required
for this pose-routing-only change.

`R/browser-controls` completes18 Manual/Open/re-entry/Close/other-toolbar raw
pairs. Rapid retarget runs `R/browser-retarget-{desktop,reduced}-15630913`
complete7 pairs each for Notes -> Browser -> Miiverse -> Friends ->
Notifications. They observe retained/hidden outgoing owners (44/38 desktop,
48/44 reduced samples), finish on Notifications, and report no errors or native
screen failures. These are browser controls, not native timing acceptance.

Remaining source gaps include native activation/first submitted clip phase,
cadence, displacement/offsets and exact presentation/input/cue timing. Whole
HOME banner, wallpaper, HUD and cursor residuals remain. Reduced-motion static
endpoints, local HUD state, portfolio content/tile placement, existing manual
placement and the previously documented local stock-app behavior remain
adaptations. Browser manual pages beyond Contents/page0, Language and Enlarge
remain unsupported. Existing designs are preserved, not reclassified as native.
All3DS audio stayed muted; audio parity remains untested. System audio and
Spotify were untouched. No private matrix change or whole1:1 claim was made.

Native PID36705 and owned browser PID32993 close normally with exit0 and are
verified absent. Other browser/profile state is preserved. Production preview
`http://127.0.0.1:3021` remains HTTP200 at runtime `15630913`.
