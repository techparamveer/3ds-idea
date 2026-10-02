# Close Exit Icon and Fresh Native Sequence

Runtime `7d0b4a9f`, test follow-up `fcb05a71`, 2 October 2026. This is a
source-backed endpoint correction with a capture-fitted selection policy,
not a recovered native disappearance clock or whole-scenario pass.

## Captured Defect and Delivery

Fresh native Health close from folder13/child2 shows the normal white/yellow
icon while the closing dialog fades out. Production `a40d597e` retained the
blue suspended overlay through its exit-terminal pair. `7d0b4a9f` appends
authored `LncIconSleep_00_DisAppear` frame20 after the existing Appear, Scale
and Sleep bindings only for ordinary close `exiting`/`exit-terminal` phases.
The source endpoint sets `P_Sleep_00` alpha0, exposing the ordinary title icon
already rendered beneath it. Earlier close phases and all switches are unchanged.

The predicate samples the existing generation/owner-validated transition;
it does not retire or mutate the suspended application, alter either paired-LCD
publication barrier, or add a timer. Missing selected resources fail explicitly
through the existing paired error/recovery path. Reduced-motion exit selects
the same endpoint. The native start epoch remains untraced; the earlier worker
AppQuit0 disappearance proposal is not revived.

## Native Source

HOME `0004003000009802`, version24576, content index0/ID00000082, decrypted
selected-content SHA256
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
Converter `ctr-native-web`1.2.0, extractor CTRTool1.3.0.

| Element / manifest key | Decrypted CIA-internal path | SHA256 |
| --- | --- | --- |
| Sleep overlay / `home.launcher.layouts.LncIconSleep_00` | `RomFS/launcher_LZ.bin/blyt/LncIconSleep_00.bclyt` | `7f8b8f7da609e138c0c0c153de0d58aca2c123c8072be6aa847c40fe86153a39` |
| Disappearance / `home.launcher.animations.LncIconSleep_00_DisAppear` | `RomFS/launcher_LZ.bin/anim/LncIconSleep_00_DisAppear.bclan` | `fdd5ba31f67ae7acdbf8d73f3d1c4501413c21d9006cd0d9008e727c9ba40a39` |
| Launcher archive / `home.launcher` | `RomFS/launcher_LZ.bin` | `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834` |

Delivered launcher pack SHA256
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
No asset conversion, colour, geometry, sound or native graphic was invented.
Existing [sleep texture/pulse provenance](home-suspended-highlight-2026-10-02.md)
and [dialog/mask source selection](home-closing-fade-2026-10-02.md) are unchanged.

## Fresh Native Evidence

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-folder-switch-20261002/`.
Native sibling `native-folder-switch-20261002/screenshots/` contains39 genuine
400x480 RGB PNGs from `_02.10.26_23.10.23.092.png` through
`_02.10.26_23.11.24.973.png`. F9 saves are verified as files, not inferred
from tool dispatch. The run is at5% emulator speed and has a17.481-second
gap between23.10.42.702 and23.11.00.183. It cannot establish normal-speed
timing, evenly sampled native epochs or exact browser frame correspondence.

Zero-based native phases after raw-pixel inspection:

- 0 suspended; 1..3 Close interval, visually pre-modal.
- 4..9 modal entry, not exit or settled dialog. In particular index8 retains
  a faint upper title and a transitional lower panel.
- 10..19 stable held dialog: lower PNG pixels are byte-identical, including
  across the capture gap.
- 20..24 actual modal exit; 25..28 post-modal old-footer departure.
- 29..37 HOME banner reacquisition; 38 final HOME.

Late exit index24 `_02.10.26_23.11.09.903.png` SHA256
`cf9e645747c1c1e035b985ed5857d743d6c593f4715d29ed45ddb22eadf6be57`;
post-modal index26 `_02.10.26_23.11.12.066.png` SHA256
`2040d73074bea7e2e1a634677f3938809c3cdc601a5176476ebaa0d83b1eff35`.
The source-selected icon endpoint is justified by visible state ordering, not
by assigning a native source sample number to either PNG.

`R/compare/sequence-comparison-report.json` SHA256
`d7b46875fabab6612cf00d7f4966d516ad0668a77412be576b079b8a2bcb0b67`;
manifest `2af1f341db8b421fc56ef9fbc89e567bdc7637582a8a6f4517583d65441715d0`.
Coordinator opened the contact/stage sheets and independently verified123
manifest records. Structural stage pairs use empty masks, no shift, fit or
colour correction. All whole pairs remain fail. An initial full-screen
compositing-footprint conclusion was withdrawn: it used transitional index8
as settled and cannot follow from cross-sequence mismatch counts.

## Verification and Remaining Work

Production `R/after-desktop`, `after-mobile` and `after-reduced` each complete
Health launch, HOME, same-child software Close and exact saved-layout restoration
through real input. They capture24/24/40 close-phase pairs plus four endpoint
pairs each, with no page errors and mute retained. Actual source phase metadata
identifies desktop `close-22` as exit-terminal, not an ordinal guess. Coordinator
opened desktop/mobile views, raw exit icon and before/native/after sheet.

Against native index25 `_02.10.26_23.11.10.985.png`, the fixed lower selected
ROI216,109,56,56 improves3,136 ->22 pixels above delta2; maximum133 ->7,
mean58.225128 ->0.322917. Whole lower improves14,559 ->8,625. Footer pixels
are byte-identical before/after and remain2,635/max97 above delta2. The following
browser settled pair preserves the icon but jumps to Open; native footer
departure is not fixed. No masks, registration, shifts, colour fits or pose
sweeps. Source-phase matching is structural, not a shared native capture epoch;
the residual selected ROI and all whole pairs remain fail.

`R/compare-after/exit-terminal-after-report.json` SHA256
`df7e5e38f5bb185be6de5518773453aa5e5f21024590eb52c5e0b4afb6271607`;
manifest `16b600d15b9fb5d7f48504a1f7daf69f64efde83b95ce18c4c3e5137d4b69ed4`;
sheet `6fd2ac6c05cfb6dad6619109453ad63c3078d585cc6561b25bebc0d8e5283bd5`.
Coordinator independently verified all14 manifest records. Native source PNGs
were not altered or recaptured after this pure endpoint selection change.

Full tests1856pass,0fail,23skip,1TODO (1880 total); typecheck/build pass.
Initial full run found an omitted new helper export in the painter stub;
`fcb05a71` fixes it and adds paired resource-failure/owner-retention recovery,
paint ordering and close/switch/reduced phase checks. Final independent
review is clear; focused81/81 pass. No shader/material changes.

The native sequence separately establishes missing post-modal footer departure:
native26..28 fades the old Close/Resume controls before Open29, whereas current
production still changes directly on retirement. Native entry also fades the
dialog, while production AppQuit0 already displays its bright formed surface.
The compatible decoded `Dlg_A_D_02_FadeIn` is not yet source-proven as the live
donor/start clock; the prior executable audit proves donor selection for exit
suffixes only. Do not add an unlabelled guessed entry or footer fade.

Still non-native/unproved: endpoint-selection policy, native disappearance
start/cadence, APT wait and retirement order, exact input/motion/audio, modal
entry and footer departure, sampling/backing residuals, earlier fitted anchors,
visibility/hover/drop/coverage policies and portfolio population/content.
Unrelated selected/suspended folder policy remains unverified: attempted Camera
drags did not relocate it. No private scenario-matrix update.

Native PID6774/session56411 quit through the visible Yes confirmation and
completed exit0; absence verified. `R/cleanup.json` records restored HOME B66,
touch mapping and100% speed while stopped; Static2/Null1/volume0 remain.
Restored config SHA256
`d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`.
Only the coordinator used the authorized whole Mac. No default profile,
system audio, Spotify, microphone, original ROM or DeveloperStorage artifact
was changed. Source/comparison workers remained GUI-free.
Dedicated Chrome PID26354/session75049 closed normally, exit0, PID absent;
production3021/session26029 remains available at runtime7d0b4a9f. Chrome stderr
reported transient zero-attachment framebuffer warnings during navigation;
captured desktop/mobile LCDs render correctly and all route page-error arrays
are empty. Do not conflate that with a warning-free browser process.
