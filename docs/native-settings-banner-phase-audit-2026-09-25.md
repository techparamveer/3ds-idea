# Settings HOME banner phase audit

The production pair at `reference/scenario-matrix/v1/captures/home-settings-selected/`
under the private EUR 10.7.0-32E artifact root was made at integration
`80b77f5`. The unmasked raw 400×240 upper LCD diff is **43,130 pixels** over
2/255 (mean RGB error 12.884/255). The native contact sheet shows the Settings
wrench nearly edge-on; the browser is broad. The browser `capture.json` records
an active Settings title, HOME yaw counter 14, yaw −0.146607667 radians and
`COMMON` skeletal frame 14. The scenario matrix marks the inputs unmatched:
the native state was a persisted selection after notification acknowledgment,
while the browser cold-started into a persisted selection. The native yaw and
skeletal frame are not recorded. A phase offset inferred from these two images
would therefore be unsupported.

The actual Settings `COMMON` model and 600-frame looping clip are delivered
from decrypted Settings `0004001000022000` `exefs/banner.bin` (SHA-256
`5804ba5a7768d2ae9b7487e4d277923502646d89768668b19d666e3e4d30fbac`).
The shared HOME `BannerCamera` and 600-count yaw rule are source-derived. A
focused projection test draws the delivered model through the shared camera:
the wrench's projected mesh width is over 75 upper LCD pixels at source frame
14 and under 25 pixels at both frames 150 and 450. That brackets plausible
edge-on poses without selecting a native phase or changing live animation.

The loopback `lcdCapture=1` verification hook now accepts an optional
`lcdBannerFrame=0..599`. It requires an active Settings HOME selection and
overrides only the capture paint's yaw and `COMMON` skeletal sample. It records
`bannerSample.kind="synthetic-source-pose"`, frame and yaw in `capture.json`.
After encoding the raw LCDs it repaints the live pose; the host state, update
count, animation epochs and runtime timing are unchanged. The coordinator can
capture distinct browser scenarios at frames 150 and 450 beside timed native
motion checkpoints, then assess silhouette, projected placement, material and
HUD independently. The sample must not be treated as a matched native event.

| Visible element | Public manifest key | Dump source | Current difference |
| --- | --- | --- | --- |
| Settings wrench, bottle, icons, title | `models.settingsBanner` | Settings `exefs/banner.bin` above | Native frame unknown; broad browser frame 14 versus narrow native silhouette. A source frame sample can bracket pose. |
| 3D HOME wallpaper | `models.homeBackground` | HOME `0004003000009802`, `3D/BannerBG_LZ.bin` | Background raster/color residuals remain in the unmasked diff; no phase correction applied. |
| 3D stencil frame | `models.bannerFrame` | HOME `3D/BannerFrame_LZ.bin` | Frame edge residuals remain; source projection has not been recalibrated from matched timing. |
| 3D projection | `models.homeCamera` | HOME `3D/BannerCamera_LZ.bin` | No evidence yet for a camera change. |
| Upper base and HUD | `titles.0004003000009802.packs` → `packs/home/launcher.json`, `packs/home/hud.json` | HOME `launcher_LZ.bin`, `hud_LZ.bin` | Native says “Internet” with orange battery; browser says “Disabled” with blue battery. State differs. |
| Lower HOME tiles | HOME source tiles plus eight portfolio titles | HOME and portfolio SMDH assets | Portfolio substitutions and selected grid geometry differ from stock; outside this banner phase sample. |

There are no new visual or audio assets, replacement fonts or custom graphics
in this change. Remaining upper pixels are open pending matched native motion
checkpoints and same-input browser samples; lower stock/portfolio differences
remain an explicit scope adaptation. This source projection test and capture
control are verification evidence, not a live native/browser acceptance pass.
