# System Settings native status strip source audit

This is a bounded EUR 10.7.0-32E source and render result, not a whole-screen
fidelity claim. System Settings owns the upper 400×20 status composition; it is
not inherited HOME Menu chrome.

## Source ownership and geometry

The private converted title pack
`packs/settings/contents/0000-0000003d/hud.json` contains `HudMset_00` and its
`Bat`, `NetAtn`, `NetMode` and `WhiteBlack` clips. Its root is 400×240 and the
visible HUD panes occupy the top 20 rows:

- wireless at x 0–23, followed by the 112×20 network badge at x 24;
- date/time beginning at x 218 (`N_DateTime` is translated from source x 0 by
  120), with date at local x 18 and hour/minute at 117/143;
- the 32×20 battery pane at x 368.

The Settings executable owns the HUD implementation around `0x2389b8` and
constructs it near `0x238fcc`. The disassembly under the private presentation
evidence shows independent animation controllers and periodic PTM/network/time
service reads. Consequently the browser must not describe these frames as live
3DS telemetry.

`message_EU.json` supplies the `hud` bank. In English, `lau_connect0` is
“Internet”, `lau_date` is `%d/%M (%w)`, and day, month and weekday labels
provide the localized substitutions. The title layout requests `Hud.bcfnt`.
The private Settings `Hud_JP.bcfnt` conversion and the already delivered shared
HUD font are byte-identical (font JSON SHA-256
`a40d189bd94da15a4122c7d7d13c273e0447378d6b256e50b777dd0ce22bf519`;
sheet SHA-256
`c41bb1a929dd5755dbc6724afad2d3552474bfad9312019529029eb31b4fec28`),
so the delivery binds `Hud.bcfnt` to that existing native HUD font.

## Declared portfolio state

The accepted native Other Settings capture shows `24/09 (Thu) 06:31`, the
Internet badge with full bars, and the orange battery state. A bounded source
frame sweep selects:

- `HudMset_00_NetAtn` frame 3;
- `HudMset_00_NetMode` frame 0;
- `HudMset_00_Bat` frame 4;
- `HudMset_00_WhiteBlack` frame 0.

These network and battery frames are a fixed, reference-observed portfolio
state. They are not browser or console readings. Date/time is formatted through
the source English messages from the presentation's injected local `Date`; the
paired-screen cache keys year, month, day, hour and minute, but not seconds.
The title session still owns loading, generation checks, atomic paired-LCD
publication and disposal.

The status layout is drawn last on Settings main and every implemented subpage.
No generic HOME HUD or gray “HOME Disabled” strip is used.

## Bounded render evidence

The native top crop comes from
`reference/native-settings-2026-09-24/other-page1-opengl.jpg`. The source sweep
composites only `HudMset_00` over the existing source-rendered Other Settings
upper screen and compares the top 17 rows after matching the capture crop. The
selected state has RGB mean absolute error **10.9467**. JPEG loss, emulator
window capture and crop resampling remain in that score; it is not a
framebuffer-perfect comparison.

Artifacts are under the private SSD root at
`presentation/settings-status-hud/`: `probe.mjs`, `native-top.png`,
`probe-best.png`, the executable trace, and `verifier/` source renders.

## Remaining gaps

- Native animation scheduling and transitions are not reproduced.
- Network and battery status are deliberately static and are not telemetry.
- This worker did not operate the browser or emulator; integration browser
  inspection remains separate.
- The comparison covers only the top status rows. It does not establish strict
  1:1 fidelity for the complete Settings screen.
