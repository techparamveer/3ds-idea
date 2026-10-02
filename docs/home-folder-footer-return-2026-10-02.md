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

`sampleSystemHomeFolderClose` remains the ownership gate. Incomplete records
require their owned navigation reference; completed records intentionally remain
sampleable in root HOME until a new close or lifecycle reset. An unsampleable
record falls back to the ordinary settled footer. A sampled `complete` record without
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

## Integrated production verification

Source `172342f2` is integrated as `9371c576`. Full tests:1818 pass,0 fail,
23 skip,1 TODO; typecheck and production build pass. Independent review passed
51 focused tests and found no remaining runtime issue. No-System callers were
regression-tested before integration. No asset, shader or audio change.

The coordinator drove actual lower-LCD pointer events in the muted production
browser: idle, two-second Back hold, outside cancellation, and on-target release.
Before produced24 raw motion pairs; after produced22 desktop,24 mobile and6
reduced-motion pairs. All final runs exited0 without page errors. The first
reduced run's normal-motion minimum-frame assertion was a harness error;
its incomplete output is preserved and excluded. An earlier setup double-tap
correctly launched Health and was also excluded before the corrected replay.

Before first-root footer ROI0,210,320,30 was byte-identical to settled. After
first-root differs in6838 pixels above2 and samples SceneIn0,3,6,8,11,14,15,
visibly restoring the missing entry. Mobile stages the same clip; reduced
motion has the settled footer at first root. Five settled control footer ROIs,
five stock lower LCDs and both Settings upper LCDs remain byte-identical.
Three Health upper epochs are unmatched, not regression or pass evidence.

The native own-PNG idle/released lower comparisons still fail at5714/13202
pixels above2, maximum191/255, empty masks and no fit. Native folder1/slot13
and browserfolder6/slot19 differ in population and animated epochs. Native
diagnostic motion and corrected browser motion share root-before-footer
ordering, not proven exact cadence. Native exposed backing is striped whereas
browser backing is flatter; held Back is obscured by the recorder overlay.
These remain open alongside prior shade, cursor/banner/HUD, fitted sampling
and lifecycle adapters, portfolio content and muted native-cue timing.

Private evidence root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-folder-press-20261002/`.
Immutable `comparison/v2-after/report.json` SHA-256:
`f0b0a31fce448e301ded5842db440b07e4a3cc3d30aaa1d85b822f648f6ccb86`.
Inspected native/before/after sheet SHA-256:
`bdbcb22d73dc9a99fd8cdeb77fe26453b8e9f4c760d63a4cd86d33b8e767ba92`.
The baseline report remains `fc21fc883269392793a6485f3e0e8fbaad0cf1cc9ab6012235a900385f655355`.
Reports track native own-PNG, browser LCD and diagnostic video identities.
Native and owned Chrome exited0; production preview3021 remains available.
