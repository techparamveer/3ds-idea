# Isolated Azahar CUA input calibration — 27 September 2026

The isolated Azahar process is still running from
`/Volumes/Codex3DSIsolated/camera-guide-replay-20260926/Azahar.app`. Its active
profile is `user/config/qt-config.ini`, keyboard profile 1. The configured
mapping is Up `T` (84), Down `G` (71), Left `F` (70), Right `H` (72), confirm
`A` (65), cancel `S` (83), and HOME `B` (66).

Earlier CUA attempts were sent before explicitly raising Azahar and did not
move the highlight from Face Raiders. After raising the window, repeated
keyboard text sends still did not reliably move the D-pad highlight: from AR
Games, `f`, `ff` and `h` left AR Games selected. A genuine Azahar capture at
05:13 records that out-of-scope title. Do not count a window screenshot or an
unsettled title animation as a selection.

The profile's configured touch-from-button map is active. `U` (key code 85)
at lower-screen `(244,154)` selects the visible empty slot, reported as
`Create Folder`. This confirms touch delivery for that coordinate, not Camera
selection. A click on the HOME row's right-side scroll affordance moved the
selection from AR Games to Download Play; repeating it left Download Play
selected. The left affordance did not establish a new title. The direct
production accessibility shortcut opened Camera's Welcome page, but that is
not paired input and does not establish the Camera HOME selection. The exact
Camera selection route remains to be calibrated.

Native reference capture:
`/Volumes/Codex3DSIsolated/camera-guide-replay-20260926/screenshots/_27.09.26_05.13.58.691.png`
(400×480 PNG; SHA-256
`8cee0f314ac2808438d07342afcaaa18aa7ea520cca36de12ef984479a91c3ce`). It shows AR Games selected, an excluded title, so it is
input-calibration evidence only and not an in-scope matched capture.

Follow-up native HOME capture at 05:26:41.725 is also a genuine 400×480 PNG
(`b2d2df02db02a597029fc601f73b8734399d025c034a9703ac2f8869456c788b`). It
shows `Create Folder` selected. After raising Azahar, sending `h` and `f`, and
clicking the visible right page affordance once, the selection still reads
`Create Folder`; the page art animates but the selected title does not change.
The repeated keyboard input and pointer interaction are therefore still
unreliable for reaching the Camera banner. This capture is not a Camera match.

At 05:29, one left-side carousel touch eventually selected Activity Log from
the empty slot; the raw capture at 05:29:27.015 shows that excluded title. A
subsequent `t` send, right-side touch, and mapped `c` send did not move its
selection. The 05:31:02.691 raw frame
(`5d6e87534f0cb897e71cb41f5f779334916c850b59ae22637e876d160af1cd00`) still
shows Activity Log. Treat the left-side touch as a single observed transition,
not a calibrated repeatable route to Camera.

The production browser's temporary tab was initially on Contact, then navigated
to Empty slot. Its accessible Camera shortcut opened the Camera Welcome page
for inspection. The user's tab remained on Settings. None of these states is a
paired Camera capture. Keep the browser/native evidence tiers and scenario
matrix unchanged until identical in-scope states and input sequences are
captured on both sides.

## Notifications list input check, 27 September

The later isolated profile at
`/Volumes/Codex3DSIsolated/native-home-replay-20260927` has a genuine
400 × 480 Notifications capture at 12:12:20.627 (see
`docs/native-personal-tools.md`). The first visible rows are **HOME Menu
Settings** and **Touching and Sliding**. The profile still maps A to Qt key
code 65 and `touch_device=engine:emu_window`; it enables the separate
touch-from-button map, whose `C` key targets lower-LCD `(160,80)`. Its
`layout_option=0` is the default layout. The emulator log records the
screenshot command but no individual button or touch events. Two CUA clicks
on visible rows and a mapped A send produced no verified row selection or
detail transition. This is an input-delivery gap, not evidence that the
native rows are inert.

Azahar 2126.1.2 source defines the input boundary precisely:
[`GRenderWindow::keyPressEvent` and `keyReleaseEvent`](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/citra_qt/bootmanager.cpp#L532-L537)
forward **Qt key events** to the keyboard device. The
[`mousePressEvent` path](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/citra_qt/bootmanager.cpp#L540-L575)
forwards left-button press/release to touchscreen state, converting widget
coordinates with `devicePixelRatioF()` first. The
[`TouchPressed` path](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/core/frontend/emu_window.cpp#L155-L199)
rejects coordinates outside the computed lower-screen rectangle. Thus the
400 × 480 saved PNG is a useful visual coordinate reference, but a CUA
desktop click must account for the actual app window origin, render-widget
bounds and display scale. A text insertion operation is not itself proof that
the render widget received a Qt key press and release. Neither source path
logs an input acknowledgement at the current log level.

For the next **single-owner** live calibration, first raise the render window
and record its accessibility/window bounds and an Azahar screenshot. Send a
true key press/release to the focused render widget using the CUA key API,
then capture after the animation settles; compare the selected row/banner or
detail page with the baseline. Separately, click the center of the first
lower-LCD row after translating from the visible render-widget rectangle,
and capture again. The mapped `C` touch at `(160,80)` is a third independent
probe. Run these probes one at a time from a known list state, with a fresh
native capture after each, so a transition can be attributed to one route.
The successful route must be repeated before using it for a matched scenario.
Until then, there is no reliable verified CUA route from the current
Notifications list into a row detail.

## HOME restart probe, 27 September 13:05

Azahar's **Emulation → Restart** menu action completed in the isolated
`native-home-replay-20260927` process and returned to HOME with Notifications
selected. This establishes a repeatable way back to a visible HOME state without
changing the reference profile. The Game Notes helper icon was visible in the
lower HOME toolbar. A click on that icon briefly changed the top status count
to the Notes count of 42, but the selected banner and highlight remained
Notifications after settling. A second click, a short drag on the icon and
the configured left D-pad key likewise did not establish Notes selection.
These actions do not qualify as a Notes input route or native grid capture.
