# HOME Folder Back Re-entry - 3 October 2026

## Captured Defect

Base `dc65d0a7`, runtime `eacae23c`: native open-folder Back retains its
original contact across `(59,55)` -> `(150,55)` -> `(59,55)`. Re-entry restores
pressed Back, then release closes the folder to root. Browser-before-v3 loses
the press at generic eight-pixel slop, does not restore it and stays in-folder.

Worker `bd422b3e` integrates as `e3b4f061`. A distinct `folder-back` origin
retains its exact owner across travel. Shared `ownedHomeFolderBackContact`
gates Select and release against live pointer/start identity, original/current
Back geometry, selection revision, folder/context, focus, columns and density.
Other regions cannot inherit activation. This is a capture-fit input adaptation;
the exact native touch callsite and epochs remain untraced.

The existing counted folder-close controller, footer SceneOut/SceneIn, physical
B route and grid-drag Back hover are unchanged. No native asset, audio cue,
shader or other existing app design changes.

## Native Resources

Element -> manifest -> source mappings remain in the
[toolbar/folder resource audit](home-toolbar-interaction-2026-10-02.md#focus-anchors-and-visible-resources)
and [folder footer-return evidence](home-folder-footer-return-2026-10-02.md#native-resource-provenance).
This change binds existing `home.launcher` / `layouts.LncFolder_00` with
`animations.LncFolder_00_Select` frame1 while the exact contact owns Back,
otherwise frame0; group `G_Btn_00`. Source member
`romfs/launcher_LZ.bin/anim/LncFolder_00_Select.bclan` SHA256
`69b1e0c444c116ec93e65c9fbbdef8182490a5366338fd2eaa38890b1ffedabd`.
Source `Bounding_00` retains inclusive x23..95,y43..65. No guessed geometry.

Pinned EUR HOME `0004003000009802`, version24576, content index0/`00000082`.
Content SHA256 `c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`;
launcher archive `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`;
delivered pack `f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Converter `ctr-native-web`1.2.0/CTRTool1.3.0. Delivered Decide remains unbound:
this capture does not establish a new activation clip or native timing.

## Reference Replay

Evidence root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-folder-back-reentry-20261003`.
Fresh sibling clone `native-folder-back-reentry-20261003`, originalEUR/factor1,
static microphone2/Null output1/volume0. Coordinator independently rehashed
11 preparation files and7 anchors; no user symlinks. Source config unchanged:
`d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`.
Clone launch config:
`f207da5d190670eef4e3db789bc0112494ae00c79def437f997a75603dafadd3`.
CTM `83e3d1879c273c457cb750681cf7a4935f923e095223fba983f67625fb4bb1c2`
preserves27596 template pairs, header/revision/order. Short35-sample folder taps
start2340 and3510 at native `(90,82)`, with releases2375/3545. Back phases
begin7020/11700/15210/18720, nominal30/50/65/80s. These are not matched epochs.

| Frozen pair | Native own400x480 PNG | Nearby AX observation |
| --- | --- | --- |
| back-held | `_03.10.26_07.11.20.441.png` | 2221 |
| back-reentered | `_03.10.26_07.11.52.617.png` | 4136 |
| released | `_03.10.26_07.12.16.724.png` | 5572 |

Camera6 was visibly observed at426. The07.10.54.837 PNG near726 already shows
selected folder1 at root, not Camera; it is excluded. Folder was observed open
near1743, but the next own-PNG arrived during hold. Outside was observed near3777,
but its own-PNG arrived after re-entry. Native folder-idle/outside own-PNGs are
missing, not substituted from another phase. Counters are nearby observations,
not exact screenshot frame IDs. Movie completed; exact close button/Yes exits0,
PID43635 absent. Source/default profiles and system audio remain untouched.

Browser-before-v3 uses actual lower-screen setup taps at `(118,82)` for folder6.
Native folder1/root13 and browser folder6/root19 differ in population, folder
density and selected Health placement. These fixture adaptations do not excuse
whole-LCD mismatch. The empty premature-boot run and incomplete Camera-launch
setup run remain preserved and excluded. V3 has six painted pairs, errors[]/mute.

## Supporting Checks

Integrated full suite1956pass/0fail/23skip/1TODO (1980 total), build and sequential
typecheck pass. Worker190 scoped tests and typecheck pass. No shader change.
Independent review118/118 has no actionable findings (88 changed-file checks
and30 gesture checks). Review did not repeat the full suite or typecheck.

## Production Comparison

Desktop1150x690 and narrow390x844 after runs each retain six actual-painted raw
LCD pairs, errors[] and mute, runtime `e3b4f061`. Both return to HOME on release;
before-v3 remains in-folder. Both viewport screenshots were inspected.
The native/browser input coordinates for the Back stroke match, but setup
placement, input cadence and native epochs remain unmatched.

Frozen empty-mask results, RGB pixels above2/255:

| Pair | Desktop upper / lower | Narrow upper / lower | Back ROI before -> after (both) |
| --- | --- | --- | --- |
| Held | 46605 / 16398 | 55688 / 16290 | 714 -> 714 |
| Re-entered | 16584 / 16328 | 34298 / 16291 | 2002 -> 714 |
| Released | 20649 / 9365 | 48869 / 9490 | 2034 -> 1829 |

All12 after whole-LCD comparisons still fail. The fixed gesture does not make
the diagnostic Back ROI a pixel match: held/re-entry maximum delta remains194,
including different root content behind the folder. Released Back is absent
and the same rectangle now contains root content. Do not interpret those
released ROI pixels as a remaining pressed-button defect or infer parity by
masking the surroundings. Coordinator independently recomputed all18 after
whole/ROI metrics from the frozen PNGs, without phase fitting.

`browser-controls` completes15 painted pairs, errors[]/mute: outside release,
toolbar/footer/grid transfer and outside-origin entry all remain in-folder;
valid Back re-entry and physical B return HOME. These are browser regressions,
not additional native-paired scenarios. Owned browser PID41187 exits0 and is
absent; native PID43635 is also absent. Preview3021 remains HTTP200. Default
Azahar, other browser sessions and system audio were not touched.

Final `comparison/comparison-sheet.png` opened and inspected. Coordinator
independently rehashed all82 final and34 preserved before-manifest records.
Held and re-entered Back ROIs are byte-identical within each after run;
the missing native outside capture still prevents an outside parity claim.

| Artifact under evidence root | SHA256 |
| --- | --- |
| `comparison/report.json` | `4970dfa8cf384bcbc6b1ca1fa8003bbdfac327bbaf52e5ff7f730638b64d0a6e` |
| `comparison/comparison-sheet.png` | `4b82930adca80f494c2041dfe59bb970db574ede2054cfbd418de4c27ca9c7b6` |
| `comparison/manifest.json` | `0f67d0bd4feec4f56c98a34bbe721cb578abe5676d47eb6fcf6dcc975d601a6e` |

## Acceptance Boundary

Three frozen native pairs, empty masks, delta2, full upper/lower LCDs and
Back diagnostic ROI `(20,38,78,30)`. No phase fitting, registration or best-frame
selection. Whole1:1, exact native caller/epochs, input cadence, motion and
native-cue timing remain open. Native assets are reused; non-native population,
placement, density, live clock/status and input adapters remain explicit.
No private matrix change or whole-scenario upgrade is authorized by this fix.
