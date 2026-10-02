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
therefore a **capture-fitted native-resource selection adaptation**, pending the
coordinator's matched production recapture. It is not evidence for transition
timing or interpolation.

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
