# Software Switch Closing Dialog

Runtime `65d75466`, worker `423f8f37`, 3 October 2026. Feature L-07.
The fresh native Health -> HOME -> Camera -> Open -> Cancel -> Open -> OK
route exposed a missing lower closing window. Browser `ea6265de` instead
showed the HOME grid and Manual/Open footer during AppQuit.

## Implementation

Confirmed switch `closing` and `terminal` now select the decoded buttonless
`Dlg_A_D_00`, lower mask and exact `lau_dlg_quit5` message. The footer stays
at decoded SceneOut14. The intent-scoped paired-screen key retains explicit
failure/recovery for missing selected resources. Switch keeps its compact
suspended window and icon; ordinary Close alone applies the
existing upper opacity fit and subsequent dialog/footer exit/return stages.
No duration, controller, owner transfer, source asset or audio change.

The entry donor and AppQuit-to-animation binding remain capture-fitted
adaptations, not traced native scheduling. Preserved portfolio population,
upper backing/opacity fits, glyph coverage and local/offline policies remain
separate from native fidelity. No new reconstructed native graphics or cues.

## Source Identity

Pinned HOME title `0004003000009802` v24576, EUR10.7.0-32E, content index0 /
ID `00000082`; decrypted content SHA-256
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
Converter `ctr-native-web` 1.2.0 / CTRTool 1.3.0. These already-delivered
resources were reused; extraction and manifests are unchanged.

| Element / manifest member | CIA-internal decrypted path | SHA-256 |
| --- | --- | --- |
| Window `home.dialog/layouts.Dlg_A_D_00` | `RomFS/dialog_LZ.bin/blyt/Dlg_A_D_00.bclyt` | `ccee73ad198e6dba3df6498108ceec64dfd38ab8994cea5422db60fdee72534b` |
| Entry donor `home.dialog/animations.Dlg_A_D_02_FadeIn` | `RomFS/dialog_LZ.bin/anim/Dlg_A_D_02_FadeIn.bclan` | `e4dc8547f621e137ac1678823deee1b9817a2b97ff4741520aa04499023745c2` |
| Mask `home.dialogmask/layouts.DlgMask_D_00` | `RomFS/dialogmask_LZ.bin/blyt/DlgMask_D_00.bclyt` | `45ffaa6a0379423844784ffd3e450b5f3e2bf46e1724484a234b40ca73afbc86` |
| Mask entry `home.dialogmask/animations.DlgMask_D_00_FadeIn` | `RomFS/dialogmask_LZ.bin/anim/DlgMask_D_00_FadeIn.bclan` | `400bd1588c04d175c54104110c004f32dc96dd82d0a7cd9d9f0b8da8b2734fe4` |
| Message `home.messages/menu_msbt_LZ/lau_dlg_quit5` | `RomFS/message/EU_English/menu_msbt_LZ.bin` | `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350` |
| Footer `home.launcher/layouts.LncBtmBtn_02` | `RomFS/launcher_LZ.bin/blyt/LncBtmBtn_02.bclyt` | `1be988eda6f3d2374d8445d0773688fa1c6dd118590cb986d526c0dc4f326a44` |
| Hidden footer `home.launcher/animations.LncBtmBtn_02_SceneOut` | `RomFS/launcher_LZ.bin/anim/LncBtmBtn_02_SceneOut.bclan` | `df95bfcc74135a116fe14b39604cdd1300197e48b2c864989d3b40d35f13cf1d` |

The message hash identifies the compressed bank, not an independently hashed
decompressed MSBT member. Existing font/icon mappings and unsupported fields
remain in [switch evidence](home-switch-footer-2026-10-02.md); no font or icon
resource changes here.

## Verification Scope

Private root R:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-switch-sequence-20261003`.
Fresh native own400x480 PNG `_03.10.26_02.05.12.123.png` is under sibling
`native-folder-switch-20261002/screenshots/switch-sequence-20261003/`.
It shows the closing window, retained Health icon and pending Camera banner.
The browser comparison selects terminal AppQuit20 in advance, not a best-pose
sweep. Native screenshot dispatch does not establish that frame's epoch.

Native Shift versus browser H, different Camera slots due to portfolio
population, capture latency and unmatched clocks/cadence remain explicit in
`R/native-input-record.md`. One early native suspend dispatch overlapped the
first browser setup; the completed clean baseline had no native interleaving.
`before-desktop` is a partial run with a harness cleanup timeout: Camera Close
requires confirmation. Its correction is in the harness, not the application.
Use completed `before-desktop-clean` as the primary before replay.

Integrated full checks: 1,884 pass, zero fail, 23 skip, one TODO; typecheck and
production build pass. Independent review: 116 focused tests, no actionable
findings. Worker sparse-tree build/full-suite failures are not integration
results. Missing switch-message helper and reducer recovery are tested, but
switch-specific createScreens failure injection remains a coverage gap.

Native PID55761 exited normally (0), process absence verified, original config
restored exactly to `d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`.
Static input2 / Null output1 / volume0 and static-image Camera backends kept
3DS audio and device capture disabled. No system audio, Spotify, microphone,
default profile, original ROM, DeveloperStorage artifact or private matrix edit.
Whole-scenario fidelity remains fail; timing, motion and native audio are open.

Production desktop/mobile/reduced-motion replays capture19/18/18 switch pairs,
each with Cancel/repeat, retained Health through terminal20, Camera arrival,
Camera close confirmation and exact fixture restoration. Errors are empty;
mute remains true. Desktop and mobile full-console screenshots plus raw LCDs
were inspected. The separate ordinary Health Close regression captures47
pairs and retains dialog exit-terminal, footerExit0/6, footerReturn0/8, one
owner and retirement before Open return. These are browser implementation
checks, not matched native timing evidence.

Dedicated Chrome PID60363 closes normally via its owned launch session,
exit0 and process absence verified. Native was already stopped before these
completed after replays. Production preview remains at
`http://127.0.0.1:3021/`; no other browser or application was closed.

## Native Comparison

`R/home-switch-sequence-comparison-report.json` names the native own PNG and
browser `before-desktop-clean/switch-20` versus `after-desktop/switch-16`.
Native closing SHA-256:
`0517a0e219dbda8d4ab5a38a7770bdb3f51de625f9076c7c93c6ce71e8866a31`.
Native lower crop is `(40,240,320,240)`; upper is400x240. Empty masks, no
registration, colour fit, shift or phase search. Half-open modal ROI is
`[20,20,300,212)`; compact Health control is `[8,28,40,60)`.

| Pixels above delta2 | Before | After desktop |
| --- | --- | --- |
| Closing lower LCD | 76,304 | 91, maximum78 |
| Closing modal ROI | 53,264 | 19, maximum78 |
| Closing upper LCD | 83,889 | 83,890 |
| Whole two-LCD pair | 160,193 | 83,981 |
| Confirmation lower control | 79 | 79, byte-identical before/after |

Closing lower PNG is byte-identical across all three corrected modes:
`b039f23ae1c5cae3bc3692e7d2b10b023a4cc07c338e41621c5003c008ec87a8`.
Compact Health ROI is also byte-identical before/after desktop, but still
differs from native by162 pixels. The coordinator inspected the final sheet.

**Remaining visible defect:** native retains the dark curved Health backing
during confirmed closing; both before and after browser show pale HOME
wallpaper instead. This is an unresolved composition defect, not merely an
unmatched banner epoch. It is the next bounded source-backed correction;
Camera's ordinary-close confirmation icon header follows it. Upper banner/HUD
epochs, lower text/edge residuals and exact input/motion/audio also remain open.

Final comparison identities (coordinator rehashed all214 manifest records):

- Report `dc28c35d8c0b82f19adaf91b34477b14f3aec8635c0cb595f0f854c19467983e`.
- Inspected sheet `29b330d58d871b96f9e2ba39ac1a5ebffe90d5cd06d3af10c8f5fc59b4e4ca5e`.
- Manifest `3e0851dcd174dee5527a84a11474d874d8fa8c0cfe3beb5794a05549f417a9d3`.
- Generator `561f3e092c14d7387bd906076a65505b413e386f2ae68295fdf72e98d6e16d28`.

Recheck with `python3 R/verify_switch_manifest.py`, replacing R with the
absolute private root above. Double generation was byte-stable. All whole
scenarios remain fail; no acceptance status was inferred from test success.
