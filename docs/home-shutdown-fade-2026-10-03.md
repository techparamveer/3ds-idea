# Shutdown Fade - 3 October 2026

Runtime `cdc2926f3395815982c604ddf1658ef6bbb06dc7`, worker `a21f1e4a`.
This is a visible L-01 correction, not whole-scenario or timing acceptance.

## Delivered

The old shutdown used lower Decide, then an early 21-pose common fade and
logical off at 550 ms. The retained native sequence instead identifies the
61-pose paired sleep SceneOut. The renderer now preserves Power's opening
terminal, adds lower Decide, then binds Slp SceneOut last on both LCDs.
Putting Decide last would erase the fade because it owns a zero-alpha mask.
No new graphic, font, sound, pack or firmware file was added.

Normal host mapping is explicitly adapted: nominal 60 Hz, Decide 0..10 then
sleep SceneOut 0..60, logical off at 1200 ms. Terminal 60 is eligible from
1166.7 ms until off, not guaranteed published across a stall. Reduced motion
holds Decide 10 / SceneOut 60 for the existing 120 ms. Settled Power, boot,
launch, app ownership and audio behavior are unchanged.

## Source Mapping

All changed elements resolve through `manifest.home.sleep` to
`packs/home/sleep.json`, SHA-256
`bfe9219930b99d475b0ceb0895c086e5854442a1e91fae2f5120feab313f59ef`.
HOME title `0004003000009802`, v24576, content index 0 / ID `00000082`:

| Source | SHA-256 |
| --- | --- |
| `0004003000009802.cia` | `2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898` |
| Selected decrypted content | `c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d` |
| CIA-internal `RomFS/sleep_LZ.bin` | `9af919d002228a156d98be1001c10504a343d7da235f387b46dce643fc6d6a71` |

The following are archive members, not separate top-level CIA files:

| Element / member within `sleep_LZ.bin` | SHA-256 |
| --- | --- |
| Upper composition, `blyt/Slp_U_00.bclyt` | `4b2d4f32afdb368996a9d9f6e5947a3b0155bfad802d4c9e9b9696b5a1344027` |
| Lower composition, `blyt/Slp_D_00.bclyt` | `1609d6b1bd27a954da7c65be5782b77320e8a5faedca5f3dd1f25d3eea95d56d` |
| Power Off confirmation, `anim/Slp_D_00_Decide.bclan` (31..41) | `31c83eda1bdc2a101a9ff559d1a5e75096ffa0c184092d7b8b84eb4e17708f56` |
| Upper fade, `anim/Slp_U_00_SceneOut.bclan` (120..180) | `6212fd58acdcf168c30cb2c45ef5affc343a0fbee2f132f95f47f85f0ae74ceb` |
| Lower fade, `anim/Slp_D_00_SceneOut.bclan` (120..180) | `7f1683894b15dfa15d693e5b67e7ade6e213117f3c3d4a85493142dc4a53fbc5` |
| Paired mask texture, `timg/BgLine.bclim` (8x8 L4) | `5c1ff31e996b2367dd8ed15973e4fa9e1863c2d08927eda513c0a97e00699836` |
| Delivered `textures/5d4ee2aa41034fec89997ba9630f984f35c4fdf740051b97351d557da7bf6bd4.png` | `5d4ee2aa41034fec89997ba9630f984f35c4fdf740051b97351d557da7bf6bd4` |

Delivered converter is `ctr-native-web` 1.2.0 / CTRTool 1.3.0, extractor SHA
`e4bae2eb1b254af5f4849d5807c92b3caff768fab5d5ead5f50ca0fe4ac7ff81`.
Worker rechecked the delivered source/pack/PNG hashes. Selected pack/layouts/
animations have empty unsupported arrays. Public members carry path/SHA/title;
version/content/archive linkage is transitive, and content ID comes from the
preserved private provenance. This is not self-contained public per-member
CIA provenance. Earlier notes mark three converter-script hashes stale; this
records delivered converter identity, not a refreshed converter audit. Unchanged
Power text/opening sources remain in the [Power source record](home-power-footer-raster-2026-10-02.md).

## Captures

Private root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/power-lifecycle-20261003/`.
Production before is `browser-before` (25 motion pairs). Corrected
`browser-after`, `browser-mobile`, `browser-app` each retain 38 motion pairs;
`browser-reduced` retains 3. Each also has settled Power, off and restart
captures. Keyboard Power and actual lower-touch Off are exercised; the app
route enters Health through its exposed accessibility button handler, not a
matched native gesture. All finish ready and muted, with no page errors.
Desktop 1150x690 and mobile 390x844 viewport images were opened. The production
page has its expected controls and no framework error overlay.

Fresh native evidence is 14 own 400x480 PNGs under the isolated copy's
`screenshots/power-lifecycle-20261003/`: two settled baselines and 12 post-Off
captures. Native 0..2 retain gray-button states, 3 changes only the button,
and later captures dim both panels. The slowed 5% sequence's inferred mask
alphas 9,29,44,65,80,104,126,143 fit sleep frames 2,6,9,13,16,20,24,27 to
within 1.30 alpha levels. This is source-family evidence, not an input epoch
or original-speed duration measurement. No black/off own PNG was retained.

Full checks: 1872 passed, 0 failed, 23 skipped, 1 TODO (1896 total).
Typecheck and production build pass. Independent review passes 94 focused
tests without findings. Shader/material code was not changed.

## Native Comparison

`power-lifecycle-comparison-report.json` compares unregistered, unmasked raw
upper 400x240 and lower 320x240 pairs at delta 2. The named button diagnostic
ROI is lower `[65,166,255,203]`; its complement separates button change from
panel dimming. Neither is used to hide differences in the whole-LCD result.
Nearest retained-stage comparisons are explicitly structural, not shared
source-frame/epoch matches. No colour correction or image shifting is used.

Across native stages 4..11, independently nearest before/after whole-pair MAE
averages 3.920159 -> 1.115926 (71.534% lower). Seven stages improve; native 9
does not. Native 7 / corrected desktop frame-020 and native 8 / frame-021 each
have zero pixels above delta 2, maximum 2. This is partial static pixel evidence,
not motion acceptance. HOME desktop/mobile/reduced and the separately matched
app-origin settled Power retain the prior two-LCD maximum-2 result. Comparing
app-origin Power to HOME-origin native instead differs in the expected
Software closed label; that wrong-origin comparison is not a regression.

Actual presented metadata equals terminal paint on desktop at 1194.3 ms and
app-origin at 1190.2 ms. Mobile's last sampled shutdown is 1164.2 ms (source
59, already black after raster quantization), not terminal 60. Reduced has
one terminal request at 0.2 ms but its simultaneous presented metadata still
belongs to Power; next retained sample is off. The paint-triggered observer
does not establish reduced terminal GPU publication. No cross-stall guarantee
is claimed for any mode, and the existing charcoal off fill remains adapted.

The coordinator opened the comparison sheet and independently rehashed all
499 manifest input/output records. Artifacts in the private root:

| Artifact | SHA-256 |
| --- | --- |
| `power-lifecycle-comparison-report.json` | `70c9b467d34fd802cfaa5e9efe3c45a6de873894ba3a11406816d555c46f2688` |
| `power-lifecycle-comparison-manifest.json` | `f3f4609566831c4e92d297d79990506d1cfb0630a5e756ee6230ae8f74f03e38` |
| `power-lifecycle-comparison-sheet.png` | `dbe5b104233533b9505a88a20d7b465c91d4cf7776c174d76801a41cccae2778` |
| `generate_power_lifecycle_comparison.py` | `9a56cc0156750088c12f0f9cc037bb81a6951b4b56cef77fbffa4d63840f6e87` |

## Cleanup And Limits

Valid native PID 48781 exited normally and its exact original config was
restored. The longer terminal attempt never launched the title: after tool
resume, native chooser input/geometry targeting was unreliable. No new own
PNG was produced. PID 58440 ignored TERM, was scoped-KILL stopped, verified
absent, and its exact original config restored. Both restores hash
`d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`.
Pinned executable SHA-256 is
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`.
Static microphone input 2, Null output 1, volume 0 stay explicit; Spotify and
system audio are untouched. The production preview remains on port 3021.
Dedicated Chrome PID 52554 exited 0 through CDP Browser.close and is absent;
required capture/test processes are complete. Its process stderr retains
deprecated service-endpoint warnings, not page errors or a warning-free claim.

Still non-native/unproven: the nominal host clock and reduced policy, held
Power-button feedback/input ownership, exact Decide/fade epochs, terminal
publication across stalls, black/off and physical backlight order, restart
timing, and all native cues under mute. The existing authored off fill and
portfolio content remain adaptations. No later common fade is invented.
Whole scenarios remain fail and the private scenario matrix is unchanged.
