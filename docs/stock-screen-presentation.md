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
cached until view/font/image/native readiness changes. `prepare(view,owner,font)`
starts resource acquisition without drawing. `syncStockView(state,context)`
primes during launch and app phases, and cancels on HOME, off or suspension;
the scene passes its font-bearing upper context before painting the launch.

`scripts/verify-stock-screens.mjs` accepts absolute `--artifact-dir`,
`--asset-root`, `--canvas-module` and `--font-manifest` paths. The first run wrote
seven 400×240 / 320×240 screen pairs and a contact sheet under the SSD artifact
directory `presentation/stock-ui-first`, with no renderer diagnostics. The
Settings assembly, gallery images and player controls were visually inspected.

These are reviewable UI changes, not 1:1 acceptance. Camera consumes the original browser background, folder and photo thumbnails,
selection frame and album mount. Portfolio image and folder content is composed
inside those frames. The six-cell placement, upper photo preview and Back/Open
footer remain portfolio adaptations; native capture and zoom controls are hidden.
The neutral source transition BG remains visible in place of UserBG's blue
replacement default; native runtime background binding is still unresolved.
Sound now consumes the source background/grid, title and
track panels, parakeet, Back button, list cursor and transport art. Track strings
and artwork come from AppView. The transport mounts are repositioned to the
shared control targets; seek/repeat/shuffle remain authored portfolio controls.
Source animation frames are settled snapshots, not a claim of native scheduling.
Health consumes the source upper background/title, three precaution buttons,
reading frame, footer and exact English messages. The menu hit regions match
the native button bounds. Documents use eight source lines per page with base
message styles; the shared counts are 12/44/27 pages for 3D/general/usage.
Verification checks those counts against delivered text. Rich inline message
runs and native continuous scrolling remain explicit adaptations.
The remaining titles still need their native screen composition;
Settings colours, pose and typography need matched native/browser review.
The integration task owns browser verification and audio transport.

## Integrated browser checkpoint, 23 September

The localhost integration was reloaded and visually checked on the actual
console: Settings source menu, Sound source title/parakeet/checkerboard/Back,
Camera source folder frames/cursor with existing photos, and Health source
upper title/three precaution buttons all rendered. Camera horizontal navigation
and opening an existing photo folder were exercised. Assets can still settle
after the first app frame; launch preparation starts their request earlier but
is not a guarantee of zero fallback frames on a cold load.

The production build through Health and the horizontal window-frame fix passes.
The full JavaScript run had1064 passes,17 skips and one outdated launch-time
assertion; that assertion was corrected and its46-test focused suite passes.
The native window/raster suite passes38 checks, including306 raster comparisons.
A subsequent Notifications composition is wired but awaits browser inspection.
This is an integration checkpoint, not full1:1 acceptance. Remaining toolbar
and service compositions, inline text/layout differences, native reference
comparisons and transition raster performance remain open.
