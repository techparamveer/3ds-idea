# Compact software-close footer

Runtime `c44e88d7` + `be54ea30`, 2 October 2026, H-10/L-04. Supersedes the
SceneOut departure in the [earlier checkpoint](home-postmodal-footer-2026-10-02.md).
Whole native scenarios remain fail; this is a measured regional correction.

## Implementation and source

Worker `0254c9f4` integrates as `c44e88d7`. The existing guarded close controller
now selects `LncBtmBtn_02_ChangeDw` frames 0..6 after dialog exit. The decoded
scene moves down four pixels and fades out, replacing SceneOut's 32-pixel move.
Frame0 and terminal6 require paired publication; only a later update retires
the owner. Readiness, generation checks, sleep inhibition and Switch behavior
are unchanged. Reduced motion samples6 without shortening logical ownership.

`be54ea30` establishes SceneIn15, applies Decide5 to authored group
`G_BtnB_L_03` only, then ChangeDw with `childBinding:false`. This supplies the
captured grey Close tone without changing Resume's settled alpha255. Invalid
is not a black-left source: its authored groups are white center/right only.
No graphics, colors, textures, source packs or native audio were substituted.

These are decoded sources, but their post-modal caller, persistent Decide5,
direct-member binding and one-frame-per-HOME-update clock are capture-fitted
adaptations. Native timing is not recovered. ChangeUp/Open return is deferred.

All source members belong to HOME `0004003000009802` v24576, EUR10.7.0-32E,
content index0 / ID `00000082`, decrypted content SHA-256
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
Converter `ctr-native-web`1.2.0 / CTRTool1.3.0. Manifest `home.launcher`:

| Element / member | CIA-internal path | SHA-256 |
| --- | --- | --- |
| Compact departure / `animations.LncBtmBtn_02_ChangeDw` | `RomFS/launcher_LZ.bin/anim/LncBtmBtn_02_ChangeDw.bclan` | `9185e44ba4b89f1c4084530d53534ffabae565e97a1b96fe530b9dc7671cb601` |
| Left Close tone / `animations.LncBtmBtn_02_Decide` | `RomFS/launcher_LZ.bin/anim/LncBtmBtn_02_Decide.bclan` | `65eb55af8110e51cf8efdc9bafb70d681fdbf528a211a0df5d9ca172546de4bc` |
| Settled footer / `animations.LncBtmBtn_02_SceneIn` | `RomFS/launcher_LZ.bin/anim/LncBtmBtn_02_SceneIn.bclan` | `9b19c054cbb84c89a4b0c8669a2c05566f386dc7fd681410864065b8dee44a4e` |

ChangeDw has7 samples, source range80..86, group `G_Scene_00`; Decide has6,
range36..41. Layout, SceneIn, messages, content/archive/delivered-pack identities
are unchanged from the linked checkpoint. Launcher archive SHA-256
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`;
delivered pack `f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.

## Verification

Private root R:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-footer-change-20261002`.
Full tests1858pass/0fail/23skip/1TODO (1882 total), production build/typecheck
pass. Independent focused review96pass/0fail, no actionable findings.

Production actual-input desktop/mobile/reduced runs at `be54ea30` capture
19/21/38 close pairs plus four endpoints each. Each observes footer0/6,
retains one owner through departure, returns to the same folder, restores the
saved layout exactly and reports no page errors; mute stays true. Coordinator
opened desktop/mobile screenshots and the raw comparison sheet.

Fixed native25..28 vs preserved `062a486b` and new production are named in
`R/compare/change-comparison-report.json`; manifest and sheet share that stem.
Coordinator independently verified all46 manifest records. Native own400x480
PNGs are cropped at `(40,240,320,240)` for lower LCD; upper is400x240. No
registration, color fit, constructed proxy or whole-LCD mask is used. Footer
`[0,212,320,240]`, Close `[0,212,130,240]` and Resume `[130,212,320,240]`
half-open diagnostic regions rank nearest structural samples, not native epochs.
Report SHA-256 `2536e378e894805c12afec61e8ad61c489cfd33a2f7db964072d6feaeae15e40`;
manifest `c960de0e1623af3f44b6cf5e03bbb6a5d59acf2cb3abeb1cb2b2ea71c919d280`;
sheet `94f539cd19b5617bea1e2c9979879bd021b78d970f8272a59776d3e071719779`.

| Diagnostic | Previous | New |
| --- | --- | --- |
| Native25 Close pixels above delta2 | 2590 | 37, max5 |
| Native25 Resume pixels above delta2 | 45 | 45 |
| Native25 complete footer pixels above delta2 | 2635 | 82 |
| Mean footer absolute channel delta, native25..28 | 9.675819 | 3.589555 |
| Mean footer pixels above delta2, native25..28 | 4260.25 | 3662.5 |

Native26 nearest captured new frame3 remains8029/8960 pixels above delta2,
MAE11.015253. Only frames0/3/6 were sampled in the desktop run. The compact
movement is visually closer, but alpha/epoch alignment is unresolved. Whole
LCD mismatch counts do not uniformly improve; unrelated upper/content epochs
remain visible and unmasked. No timing, audio or whole-scenario pass is claimed.

The coordinator also captured46 fresh native own-PNGs, baseline
`_02.10.26_23.46.37.266.png` through `_02.10.26_23.47.35.057.png`, in the existing
isolated `native-folder-switch-20261002/screenshots` directory. Same folder13,
Health child2, launch/HOME/Close route; 5% speed and3FPS were observed. Slow
captures are structural evidence, not real-time cadence acceptance.

`R/fresh-native/fresh-comparison-report.json` names fresh37/38/39 against
production0/3/6 in full-grey/fade/blank structural order. Fresh9..31 have
byte-identical held-dialog lower LCDs;32..36 exit; Open first appears40.
The coordinator opened both fresh sheets and verified68 manifest records.
Fresh37 footer has74 pixels above delta2 (Close33/max5, Resume41);
fresh38 fade has7717/8960, MAE8.516220; fresh39 blank has1727, max5.
These remain diagnostic fail; the three captured production samples are not
equivalent source/native epochs. Uncaptured frames are not inferred.
Fresh final report SHA-256 `1403d9f24f626c5e0178b4f63cef99ff4679e8fc75a0e3af0899420af811568e`;
manifest `831c1dc1a1226a78c419c9bb5b74b8b4d189220b900f1ecb22c9234facaac517`;
sheet `99185f4fdb1a34a62b43e3dc180c625c8c41dda272df0aaa905a74f1704799e0`.

Azahar71644 quit normally and is absent. `R/native/cleanup.json` records
restoration of speed100, HOME B, touch-from-button true, Static input2/Null
output1/volume0 and original config SHA-256
`d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`.
Owned Chrome75728 exited0 via Browser.close and is absent. Process stderr
contains navigation zero-attachment framebuffer and shutdown messages; page
error checks are not a warning-free-process claim. Preview3021 remains live.

Still non-native: entry donor/clock, compact footer binding/clock, upper
opacity/icon policies and earlier folder anchors/visibility/hover/drop/glyph
coverage adaptations, plus portfolio content. Open return, banner reacquisition,
exact input/motion/audio and whole HOME acceptance remain open. Private matrix
unchanged; original ROMs/default profile/system audio/Spotify untouched.
