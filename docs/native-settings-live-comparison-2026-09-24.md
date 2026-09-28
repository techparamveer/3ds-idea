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
its top edge. A later private-source audit proved that this is the
Settings-owned `HudMset_00`, not inherited HOME chrome. The worker branch now
draws that source layout last on main and subpages, using a fixed
reference-observed network/battery state and the injected local clock. Its
bounded top-17-row source render has RGB MAE 10.9467 against this JPEG capture.
See the [status-strip source audit](settings-native-status-source-audit.md).
The integrated strip was subsequently inspected in the live browser on main
and Other Settings page 1. The content below it still needs aligned native-LCD
comparison. Neither result establishes whole-screen 1:1 fidelity.

Evidence under the SSD artifact root:

- `reference/native-settings-2026-09-24/other-page1-opengl.jpg`: native
  emulator-window screenshot after the mapped touch.
- `reference/native-settings-2026-09-24/browser-other-page1-3769074.jpg`:
  browser viewport screenshot of the corresponding portfolio page.
- `reference/native-settings-2026-09-24/browser-other-page1-touch-unselected.jpg`:
  corrected browser capture with the same white touch-entry pose.

A later static executable/layout trace found separate logical row 0 and visual
Select frame 0 state. It also found that page changes and Back from Profile or
Date & Time use the same inactive cross-scene pose, rather than restoring an
active child highlight. See the
[Other Settings focus source audit](settings-other-focus-source-audit.md).

The mapping uses the [Azahar Qt config reader](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/citra_qt/configuration/config.cpp)
and the [graphics API enum](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/common/settings.h).
The isolated profile was restored after capture, and the default Azahar profile
was not changed. The prior black capture after an A press was not evidence that
mapped touch could not work: the earlier config still had Qt's default flag
enabled. This trial establishes one working coordinate, not complete input.

At `62f0b97`, the browser capture
`reference/native-settings-2026-09-24/browser-other-page1-touch-62f0b97.jpg`
showed one remaining settled-pose mismatch: touch-opened Other Settings
highlighted Profile yellow, while the native touch-opened capture left it
white. The integration now keeps Profile as the logical first A target but
applies the source button's frame-0 white pose until directional input gives
it focus. The resulting browser capture is
`reference/native-settings-2026-09-24/browser-other-page1-touch-unselected.jpg`.
Down then highlighted Date & Time; browser warnings/errors stayed empty. This
corrects the observed touch-entry pose, not unmeasured focus timing or every
return path.

The [Other Settings focus audit](settings-other-focus-source-audit.md) later
traced the cross-scene rebuild. On the corrected production build, Back from
both Profile and Date & Time returned to page 1 with all three rows white and
logical focus at Profile. Down after Date & Time Back focused Date & Time.
The browser warning/error log was empty. The Profile return capture is
`reference/native-settings-2026-09-24/browser-other-page1-after-profile-back.jpg`
under the same SSD root. Native return timing and a direct return capture are
still unavailable.
