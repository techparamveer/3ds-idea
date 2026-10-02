# Closing entry and post-modal footer

Historical checkpoint: [compact footer follow-up](home-compact-footer-2026-10-02.md)
at `be54ea30` supersedes SceneOut0..14 below with ChangeDw0..6 and scoped
Decide5 Close tone. Earlier captures remain preserved evidence.

Runtime `54152a33` + `0bb044d5` + `062a486b`, 2 October 2026. Features H-10/L-04.
This corrects two visible omissions in the fresh [39-frame native close
sequence](home-close-icon-exit-2026-10-02.md), not whole-scenario fidelity.

## Implementation

The buttonless closing dialog now borrows decoded `Dlg_A_D_02_FadeIn` at
the existing lower-mask sample 0..20. Its parent grows from scale 0.95 to 1
and fades from alpha 0 to 255. The previous frame-zero fully visible window
is removed. Only the exit donor has a traced native caller: this compatible
entry-donor selection and its clock binding are explicitly capture-fitted.

After the dialog's `exit-terminal`, the existing guarded close controller
publishes `footer-exiting` at `footerExitFrame:0`, advances source
`LncBtmBtn_02_SceneOut` through frame 14, and stops at `footer-terminal`.
Only a later eligible update retires the app. Both endpoints force paired
LCD paint and WebGL publication. The owner, frozen app capture and footer
labels remain intact throughout; the disappeared sleep overlay stays hidden.
Reduced motion selects source frame 14 without changing logical lifetime.
Missing selected resources fail explicitly; existing readiness freeze,
B/HOME recovery, generation guards and sleep inhibition remain in force.
Switch retains its original AppQuit-terminal-to-commit path.

The first production comparison caught an additional SceneOut binding defect:
its static descendant channel changed Resume alpha from 255 to 220 at frame0.
`062a486b` binds settled SceneIn15 first, then SceneOut with
`childBinding:false`, preserving the prior button state while direct
`G_Scene_00` members animate. This is a capture-fitted binding choice, not a
traced native call. The source pack remains unchanged. Independent focused
review confirms the direct-member semantics and passes 56 tests.

Native frames 25..28 establish departure after the dialog, not at AppQuit0.
The source's parent Y 0 to -32 becomes downward movement in the renderer;
alpha 255 to 0 removes the old controls. Starting that clip on the next HOME
update remains a host-ordering adaptation. The rejected immediate-departure
candidate `204137c8` is not integrated.

## Source Identity

All sources are pinned HOME title `0004003000009802` v24576, EUR10.7.0-32E,
content index 0 / ID `00000082`, selected decrypted content SHA-256
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
Converter: `ctr-native-web` 1.2.0 / CTRTool 1.3.0. No assets were replaced.

| Visible element | Manifest and member | CIA-internal decrypted path | SHA-256 |
| --- | --- | --- | --- |
| Closing window | `home.dialog` / `layouts.Dlg_A_D_00` | `RomFS/dialog_LZ.bin/blyt/Dlg_A_D_00.bclyt` | `ccee73ad198e6dba3df6498108ceec64dfd38ab8994cea5422db60fdee72534b` |
| Entry donor | `home.dialog` / `animations.Dlg_A_D_02_FadeIn` | `RomFS/dialog_LZ.bin/anim/Dlg_A_D_02_FadeIn.bclan` | `e4dc8547f621e137ac1678823deee1b9817a2b97ff4741520aa04499023745c2` |
| Footer | `home.launcher` / `layouts.LncBtmBtn_02` | `RomFS/launcher_LZ.bin/blyt/LncBtmBtn_02.bclyt` | `1be988eda6f3d2374d8445d0773688fa1c6dd118590cb986d526c0dc4f326a44` |
| Footer departure | `home.launcher` / `animations.LncBtmBtn_02_SceneOut` | `RomFS/launcher_LZ.bin/anim/LncBtmBtn_02_SceneOut.bclan` | `df95bfcc74135a116fe14b39604cdd1300197e48b2c864989d3b40d35f13cf1d` |

Dialog archive SHA-256
`65675c4a6ecada83a0d7256ea20c36692190be10349bf87c32e6068376409704`;
launcher archive
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`;
delivered launcher pack
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Unchanged message, mask and exit-source mappings remain in the linked close
evidence and [footer handoff](workstream-handoffs/home-footer-departure.md).

## Verification

Private root R:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-postmodal-footer-20261002`.
Code tests: 1,858 pass, zero fail, 23 skip, one TODO (1,882 total).
Typecheck and production build pass; independent focused review passes 138
tests with no actionable findings. Initial failures were stale completion
helpers expecting retirement before the new footer stages; final helpers
exercise the longer close while preserving switch timing.

Native references are the preserved own-PNG sequence, not newly captured in
this slice. Coordinator inspected raw/desktop/mobile views and both sheets.

Initial `browser-desktop`, `browser-mobile`, `browser-reduced` runs at
`0bb044d5` capture 28/30/54 close pairs plus four endpoints each, observe
footer0/footer14, restore saved layouts exactly and report no page errors.
Their `compare/` report and sheet are retained as the evidence that prompted
the alpha-binding correction, not final-runtime acceptance. Coordinator
inspected the sheet and independently verified all 137 manifest records.
Report SHA-256 `6d2c9c3804b6eaedc1ff1b9fcd9dd57b01933306d06ec143de9511359cedafee`;
manifest `14a11ffeb99f2870293da208d6d1206261274e7806c2a7f4079c358363798fcb`.

Final `final-desktop`, `final-mobile`, `final-reduced` at `062a486b` capture
28/29/47 close pairs plus four endpoints each. All complete with no page errors,
mute retained and exact fixture restoration. Both new endpoint phases and one
unchanged owner are observed. No state injection or native-epoch claim.
Final full tests/typecheck/build pass again after the binding correction.

`compare-final/final-comparison-report.json` names each native/browser pair,
raw dimensions, phase/frame and input SHA. Native lower crops are `(40,240,320,240)`;
whole-LCD comparisons use no mask, registration, shift or colour fit. Half-open
dialog `[20,20,300,220]` and footer `[0,212,320,240]` regions rank the nearest
structural sample only. They do not establish a common render epoch.

| Diagnostic, pixels above delta2 | Before | Final |
| --- | --- | --- |
| Mean dialog ROI across native4..9, before `7d0b4a9f` | 46,793; mean absolute channel delta39.616 | 43,741.167; mean7.389 |
| Mean footer ROI across native25..28, before `7d0b4a9f` | 7,135.5; mean41.237 | 4,260.25; mean9.676 |
| Native25 Resume vs footer0, initial `0bb044d5` regression | 4,911; mean8.539 | 45; mean0.402 |
| Native25 whole footer vs footer0, initial regression | 8,125; maximum97 | 2,635; maximum97 |

The unchanged entry code has different nearest-sample metrics between the
initial and final real-time capture sets; neither is synchronized to native.
Do not infer an entry regression or cadence from those differing sample grids.
All named pairs and whole scenarios remain diagnostic fail.

Coordinator independently verified all 190 final manifest records:

- Report SHA-256 `89818a811786ed4271bf2e1813f88732d09f0af62d4fe754ea89e45c920ab728`.
- Manifest `48d11883024eef5919b228ce4c3a914c670773209a0715db99ec5604a1099fbb`.
- Inspected sheet `74e0506e24c1eb4026628c255c598c40ad06113d67916dbf4651eef53c0e6056`.

Dedicated Chrome sessions close normally, exit0, exact PIDs42303 and48073
absent. Process stderr includes transient zero-attachment framebuffer warnings
during navigation and GPU shutdown messages; this is not a warning-free-process
claim. Rendered captures and route page errors were checked. Production preview
remains on `http://127.0.0.1:3021/`, HTTP200. No new native process, system-audio,
Spotify, microphone, default-profile, DeveloperStorage artifact or matrix change.

## Remaining Differences

Native frame 25 changes the left Close tone while right Resume stays fixed.
SceneOut contains no colour/tone track and cannot explain that difference.
Whether native switches the white/black pane or input state remains untraced;
no guessed colour adjustment is applied. Open-footer return and upper-banner
reacquisition, exact entry/exit/retirement/APT timing, input and audio remain
open. The private RGB source proxy is diagnostic only, never acceptance.
Native26 retains a nearly full-height faded footer while the nearest browser
SceneOut sample is strongly translated down. Intermediate geometry/alpha is
therefore still a visible residual, not merely an unknown epoch or tone.

Existing upper-opacity, icon-disappearance, folder anchor/visibility/drop,
glyph-coverage and portfolio adaptations remain explicitly separate from
native fidelity. All whole scenarios remain fail/unaccepted; no private matrix
change or whole 1:1 claim. System audio and Spotify are untouched.
