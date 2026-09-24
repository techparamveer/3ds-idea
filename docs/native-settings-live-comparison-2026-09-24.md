# Native Settings page 1 / browser comparison — 24 September 2026

This is a bounded native/browser scenario, not a strict 1:1 acceptance. The
reference is an isolated Azahar 2126.1.2 run of EUR 10.7.0-32E System Settings
in OpenGL, English locale, with the private copied profile. The browser ran
integration `3769074` at `http://localhost:3000/` in the production server.

The native sequence was title-list launch → settled Settings main → mapped
touch U at lower-LCD `(240,170)` → settled Other Settings page 1. The browser
sequence was HOME → close suspended Work → Settings main → Right → Down → A.
Both ended on Other Settings page 1, showing Profile, Date & Time, Touch
Screen, four page dots and Back. Browser warnings/errors were empty. The
native lower page labels and arrangement are qualitatively similar, but the
browser is shown on a perspective-transformed 3D LCD while the reference is an
emulator window, so these captures do not support a numeric pixel score.

The earlier 400×240/320×240 **source render** of this settled page can be
aligned numerically with the native emulator-window capture. Using fixed LCD
rectangles, bilinear downsampling and excluding the upper 17 rows that contain
the missing status strip, mean absolute RGB channel error is 5.22 on the
upper LCD and 9.15 on the lower LCD (0–255 scale). Pixel-mean error is at most
10 for 93.1% and 80.2% of those regions respectively. This is a bounded
source-render comparison; JPEG capture, scaling, source render age and the
excluded strip prevent it from proving the current live browser pixels or
strict 1:1 fidelity. `reference/native-settings-2026-09-24/compare.py` and
`comparison.json` on the SSD record the boxes, source hashes and method.

The native upper LCD has a blue Internet/status strip, clock and battery along
its top edge. The browser Settings painter currently draws `Bg_U_00` and
`CommonBG_U_00`/`TextBG_U_00` (or `TopText_U_00` on main) without a matching
upper system-status composition. That is a visible fidelity gap. The content
below this strip still needs aligned pixel comparison at native LCD scale,
including original fonts, color, animation phases and source-defined status
state. Do not invent network/battery readings; bind the actual source resource
and a declared portfolio status before publishing a fix.

Evidence under the SSD artifact root:

- `reference/native-settings-2026-09-24/other-page1-opengl.jpg`: native
  emulator-window screenshot after the mapped touch.
- `reference/native-settings-2026-09-24/browser-other-page1-3769074.jpg`:
  browser viewport screenshot of the corresponding portfolio page.

The mapping uses the [Azahar Qt config reader](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/citra_qt/configuration/config.cpp)
and the [graphics API enum](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/common/settings.h).
The isolated profile was restored after capture, and the default Azahar profile
was not changed. The prior black capture after an A press was not evidence that
mapped touch could not work: the earlier config still had Qt's default flag
enabled. This trial establishes one working coordinate, not complete input.
