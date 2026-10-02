# HOME folder-held backing dimming — decoded resource endpoint

## Outcome

The folder-held lower LCD now selects local frame 10 of the decoded
`LncFolderCapture_00_PicUp` animation while an independently owned tile pickup
remains inside the open folder. Ordinary open-folder, released/cancelled and
root-held states retain frame 0.

This is not a CSS shade, reconstructed overlay or fitted opacity. The selected
endpoint is the source layout's own full-LCD `P_Capture_01` multiply material.
It is drawn after the retained root toolbar/capture and before the live folder
panel, children and pickup, so it darkens the backing and toolbar while leaving
the folder foreground available to the later authored layouts.

The exact native controller call that chooses this endpoint remains unresolved.
Using frame 10 specifically for the captured folder-held ownership phase is
therefore a **capture-fitted native-resource selection adaptation**. Coordinator
integration and comparison are recorded below; they do not establish native
transition timing or interpolation.

## Captured defect

The immutable native folder-held reference is Azahar's own 400×480 PNG
`_02.10.26_20.33.56.197.png`, SHA-256
`48a18cabbc26a3eacc41926a97dc95f2b75fd7743a6d6c4e953d5adf87750607`.
A fresh native repeat is byte-identical across the complete 320×240 lower LCD.

The coordinator's pre-change browser lower LCD at
`visibility-phases/folder-held/lower.png` has SHA-256
`2da78b624e98d8cae2117e5b7934e98ff3b399ee146d9b30089dedfc5eab1d81`.
For raw lower bounds `(0,212,320,28)`, every one of 8,960 pixels exceeds delta
2 against native, with maximum channel delta 30 and all-channel mean absolute
error 23.9484375. The comparison report is
`comparison/held-visibility-report-eeea99e7.json`, SHA-256
`e700629dc71df69bfe76be389f1b82cabec95b4b4f8ec157dc503ff29695d853`.
Its whole-LCD result remains `fail`.

All private inputs and reports are under:

`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-pickup-held-20261002/`

## Bounded resource trace

The pinned source is EUR HOME Menu title `0004003000009802`, version 24576,
content index 0 / content ID `00000082`. Its CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`,
decrypted `code.bin` SHA-256 is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`,
and `RomFS/launcher_LZ.bin` SHA-256 is
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.

| Role | Manifest key and decrypted member | SHA-256 |
| --- | --- | --- |
| Folder capture composite | `layouts.LncFolderCapture_00` → `launcher_LZ.bin/blyt/LncFolderCapture_00.bclyt` | `da89e81a94b843f0423cd57c58244d8b28313ef30e137bb8d75c23f216281d86` |
| Folder pickup backing clip | `animations.LncFolderCapture_00_PicUp` → `launcher_LZ.bin/anim/LncFolderCapture_00_PicUp.bclan` | `d35235569528d14632b302dc0c7bb03020db6307684ab98e05641b0d5ee3fd32` |
| Delivered launcher pack | `home.launcher` → `packs/home/launcher.json` | `f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044` |

Conversion is `ctr-native-web` 1.2.0 with CTRTool 1.3.0. The clip has 11
local frames and binds group `G_Capture_01`. Its material-color track changes
the final alpha register from 255 at frame 0 to 0 at frame 10. Through the
decoded TEV and multiply blend, a representative backing pixel
`[200,210,220]` remains `[200,210,220]` at frame 0 and becomes
`[167,177,193]` at frame 10. The endpoint reduction of 27–33 channel values
has the same scale as the captured maximum-30 defect; this motivates the
candidate but does not itself prove a native controller state.

No second source path was pursued. In particular, this slice does not infer a
general HOME dimming flag, alter the toolbar layout, or reconstruct a missing
controller.

## Verification boundary

Focused tests assert frame 0 for ordinary/restored/root-held states, frame 10
for folder-held state in normal and reduced-motion presentation, the decoded
multiply result, and explicit failure when the selected animation is absent.
Gesture ownership, footer/banner visibility, pickup geometry and release/drop
remain governed by their existing paths.

No worker browser or Azahar session was operated. Pixel acceptance, mobile and
reduced-motion recapture, and whole-scenario classification remain coordinator
work. Existing portfolio artwork/color, folder pickup height, motion cadence,
input timing and audio differences remain open.

## Coordinator Integration

Source `5f621a49` integrates as `4e18d7c9`. Full checks: 1,840 pass, 0 fail,
23 skip, 1 TODO; production build and typecheck pass. Logs are
`dimming-tests.log`, `dimming-build.log` and `dimming-typecheck.log` under
the private held-pickup root above. No shader or source material changed.
Independent review found no actionable defect; painter tests passed 53/53.

Production desktop/mobile/reduced runs each complete seven raw LCD pairs
under `dimming-desktop`, `dimming-mobile` and `dimming-reduced`. Actual
projected-pointer input verifies retained pickup/source/scale, atomic swap
without item loss, reverse byte-identical preferences and outside-release
cancellation. All runs are muted with no page errors. The coordinator opened
the mobile console image and raw held LCD. These checks do not prove native
input or animation timing.

Fresh isolated reference instance `native-held-dimming-20261002` replays the
unchanged CTM from a copy-on-write clone of the stopped `native-close-clean`
seed. Clone-local paths, no user symlinks, empty input audit, exact executable
and cwd verified; Static input2, Null output1, volume0, original/EUR, factor1.
`dimming-native-input-record.md` and `dimming-native-config.before.ini` retain
inputs and configuration. Native PID63347/window11690/session42974 reached
EOF and closed normally with exit0; no native process remains.

Native own400x480 PNGs live in the new instance's `screenshots/` directory:

| Phase | Filename | SHA256 |
| --- | --- | --- |
| Neutral | _02.10.26_21.12.19.314.png | 03fbe34eaaab1b62c086fd3e8ef4ceac2e788fcc2f1dffe02bc51adcec147544 |
| Folder held | _02.10.26_21.12.51.826.png | 247f1f090f92a6eee5ef9f71266aafc09e5711bace764ec31ee3579126977e39 |
| Root held | _02.10.26_21.13.23.277.png | 9f2d8764bad8e6ff099366063873f65783a4ec7e3b98d90a4146de685af9ab78 |
| Released | _02.10.26_21.13.47.221.png | ac54642c5ace099fb6e096e4249c237918f89011e1f85e0694f77fac0319addb |

The complete folder-held lower LCD repeats the previous native capture
byte-for-byte; upper clock/wallpaper phases differ. Native counters before
held/root/release were2460/4375/5870 of7056, not rendered-frame identities.
This establishes repeatable held lower pixels, not exact playback cadence.

### Matched Pixel Comparison

The coordinator opened the before/native/after sheet. Native lower pixels are
cropped at `(40,240,320,240)` from Azahar's own PNG; production uses the raw
320x240 target. There is no mask, registration shift, fit or exclusion. Counts
below are pixels with any channel delta greater than 2, comparing the earlier
`eeea99e7` production capture and integrated `4e18d7c9` against the fresh native
folder-held capture.

| Raw lower region | Before count / maximum delta | After count / maximum delta |
| --- | --- | --- |
| Toolbar `(0,0,320,34)` | 10,880 / 42 | 0 / 2 |
| Footer `(0,212,320,28)` | 8,960 / 30 | 1,576 / 4 |
| Foreground control `(72,72,120,124)` | 0 / 1 | 0 / 1 |
| Complete lower LCD | 33,504 / 193 | 6,696 / 168 |

The foreground control is byte-identical before/after. Neutral, root-held and
released toolbar/footer/control regions are also byte-identical before/after;
the entire root-held lower LCD is unchanged. Neutral and released lower LCDs
retain small phase-dependent changes elsewhere (660 and 88 pixels above delta
2, maximum 7). Complete upper LCDs still differ: 59,259 before and 59,288 after,
maximum 255, with unmatched clock/wallpaper/banner epochs. Whole-scenario status
remains `fail`; only the toolbar region reaches static delta-2 tolerance.

Private artifacts in `comparison/`:

| Artifact | SHA-256 |
| --- | --- |
| `held-dimming-report-4e18d7c9.json` | `7c7b8379cb269c1d6d53670f41320814612bf4fbbfa04b4c33b08c54d2d846ef` |
| `held-dimming-manifest-4e18d7c9.json` | `a46fec6bc3eabcc5a71bd197e766b1166e416f7445c427b216a9227b769b94cf` |
| `held-dimming-before-native-after-4e18d7c9.png` | `4681081b56a79fabadaa89d44966dbb52af8605956a6a0adb60698dddc6867e1` |

The additional `dimming-phases` production replay completes five paired LCD
captures; nominal phase inputs occur at 30,055 / 60,067 / 90,015 ms. It verifies
the pointer path and restoration, not native epoch or cadence parity. Owned
Chrome PID 74498/window 11751 closed normally after capture; no owned GUI is
left running. The production preview remains at `http://127.0.0.1:3021/`.

Next captured defects are held-icon artwork colour/contrast/width/sampling,
one-row folder bright-shell height, and exposed footer/gutter raster (maximum
4). Other-density anchors and upper pose/epoch remain open. Existing portfolio,
hover/drop/edge/lifecycle/coverage/high-slot/anchor adaptations remain; decoded
native graphics do not establish the original controller, motion, input or
audio timing. No firmware assets changed and no private matrix was rewritten.
