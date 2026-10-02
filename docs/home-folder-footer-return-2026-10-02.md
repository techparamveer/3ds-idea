# HOME folder-close footer return — 2 October 2026

Base: `685d9a8a45554fb5627d46dfa246554f4c80d701`

Branch: `codex/home-folder-footer-return-20261002`

Feature IDs: H-10

## Visible defect and bounded correction

Before this slice, `firmware-presentation.ts` sampled the footer's settled
`LncBtmBtn_02_SceneIn` frame 15 as soon as the normal folder-close controller
became `complete`. That made the restored root Settings / Open footer appear in
one paint. The diagnostic native desktop recording instead shows the root plate
and selection restored first, followed by the footer moving upward into place.

The presenter now binds the authored `LncBtmBtn_02_SceneIn` clip from frame 0
at the retained `selectionReadyAtUpdate` boundary and advances it from the
shared HOME update count, clamped at the existing settled frame 15. Frame 0 is
fully transparent at Y -32, so no invented delay or new timer is needed.
During `closing` and the defensive `viewport` phase, the existing SceneOut
sampling remains unchanged. Software-switch hiding still has precedence.
Reduced motion still selects the settled SceneIn frame immediately.

`sampleSystemHomeFolderClose` remains the ownership gate. A lifecycle or
navigation replacement makes a retained record unsampleable and therefore
falls back to the ordinary settled footer. A sampled `complete` record without
its required selection-ready boundary is rejected rather than assigned a
guessed epoch.

## Native resource provenance

The pinned source is EUR 10.7.0-32E HOME Menu title `0004003000009802`
v24576, content index 0 / ID `00000082`. The selected decrypted content SHA-256
is `c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.

| Element | Manifest / pack key | Decrypted dump source | SHA-256 |
| --- | --- | --- | --- |
| Footer layout | `manifest.home.launcher` -> `layouts.LncBtmBtn_02` | `romfs/launcher_LZ.bin/blyt/LncBtmBtn_02.bclyt` | `1be988eda6f3d2374d8445d0773688fa1c6dd118590cb986d526c0dc4f326a44` |
| Return motion | `animations.LncBtmBtn_02_SceneIn` | `romfs/launcher_LZ.bin/anim/LncBtmBtn_02_SceneIn.bclan` | `9b19c054cbb84c89a4b0c8669a2c05566f386dc7fd681410864065b8dee44a4e` |
| Departed pose | `animations.LncBtmBtn_02_SceneOut` | `romfs/launcher_LZ.bin/anim/LncBtmBtn_02_SceneOut.bclan` | `df95bfcc74135a116fe14b39604cdd1300197e48b2c864989d3b40d35f13cf1d` |

The launcher archive SHA-256 is
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`;
the delivered `launcher.json` SHA-256 is
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Conversion was `ctr-native-web` 1.2.0 / CTRTool 1.3.0. The non-looping SceneIn
resource has 15 frames, source range -14..0, group `G_Scene_00`, and no reported
unsupported fields. Its `N_Scene_00` tracks author alpha 0 to 255 and Y -32 to
0. No native graphic or sound is reconstructed by this slice.

## Evidence boundary

The timing cue is the coordinator-provided diagnostic desktop recording
`native-trajectory/recording.mp4` (SHA-256
`cd58ec3181106b051aa4fdf0891d9b43f26f517f35002d4e67c678701995f0cf`)
and its `comparison/native-trajectory-v1/contact-sheet.png` (SHA-256
`443aee41c8bf0886252f4dac3c1d0e39f9afe0c41edd12c92b5afcd7278ce1b6`).
The cursor overlay contaminates that recording, and it is not an Azahar own-PNG
acceptance pair. It visually places root restoration around 3.84 seconds and
footer entry around 3.98–4.04 seconds. Binding the authored clip to the exact
existing `selectionReadyAtUpdate` host epoch is therefore a fitted adaptation,
not a proven native call-site mapping.

Focused tests cover the close, viewport, readiness, midpoint and endpoint
poses; reduced motion; stale-record fallback; impossible epochs; resource
identity; source track endpoints; and presenter integration against the real
counted close adapter. The coordinator must integrate and run the matched
native/browser motion loop before changing any scenario status. Exact input,
motion and audio fidelity remain open; no acceptance matrix entry is changed.
