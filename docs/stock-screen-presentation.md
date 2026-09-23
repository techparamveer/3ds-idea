# Stock screen presentation, first live slice

`stock-screen-presentation.ts` replaces the shared stock four-row drawing with
Camera folder/photo surfaces, a Sound library/player and native Settings main
assembly. It consumes the existing `AppView`; navigation and audio transport
remain owned by the runtime and scene. The eight portfolio app painters are
unchanged. Root calls `graphics.syncStockView(state)` before every paint,
including the powered-off early return, to release inactive native sessions.

Camera uses the real portfolio photo records, asynchronous bounded image loading,
six thumbnails per page, a selected-image upper screen and a full-photo view.
It has no capture, edit or import controls. Sound paints supplied track metadata,
play/pause, previous/next, seek, repeat and shuffle. Production music is empty
pending the user's tracks; the verification player is explicitly synthetic.
`stock-screen-layout.ts` supplies the same controls to runtime touch navigation.

Settings consumes source Bg_U/D, TopText_U_00, Top_D_02 and the five I_Top*s child
layouts, plus English mset message styles. Settled scene frames and each button's
source Select clip paint focus (frame 1 selected, frame 0 inactive). The bounded
Settings adapter creates derived direct-track clips, omitting only the archive's
`Button → AS_Picture_00` and `BottunPage01 → AS_Picture_16` share records after
asserting both endpoints are absent in each button layout. It preserves original
clips and source packs; any new or applicable share fails explicitly. This is a
presentation adapter, not a general native binding claim.
Missing/failed native assets retain a per-app fallback. Native
assets belong to an application instance through `createNativeTitleSession`;
owner changes, suspension and disposal release them. Completed screens are
cached until view/font/image/native readiness changes.

`scripts/verify-stock-screens.mjs` accepts absolute `--artifact-dir`,
`--asset-root`, `--canvas-module` and `--font-manifest` paths. The first run wrote
seven 400×240 / 320×240 screen pairs and a contact sheet under the SSD artifact
directory `presentation/stock-ui-first`, with no renderer diagnostics. The
Settings assembly, gallery images and player controls were visually inspected.

These are reviewable UI changes, not 1:1 acceptance. Camera/Sound currently use
portfolio adaptations while native gallery/player chrome is being converted.
Health and the remaining titles still need their native screen composition;
Settings colours, pose and typography need matched native/browser review.
The integration task owns browser verification and audio transport.
