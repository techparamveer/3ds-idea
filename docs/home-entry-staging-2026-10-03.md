# HOME Entry Staging

3 October 2026, coordinator base `0c20c334`, baseline runtime `cbfaa053`.
This follows [power-on staging and publication](home-power-on-staging-2026-10-03.md).
The prior correction withheld HUD/footer during boot; the captured remaining
defect is their instantaneous settled appearance at the first HOME paint.

## Captured Target

Private R:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-entry-staging-20261003`.
Native own PNGs are in sibling
`native-folder-switch-20261002/screenshots/home-entry-staging-20261003`.
There are73 own400x480 PNGs from one isolated HOME-title initialization at5%
speed. This is emulated title initialization, not physical cold boot or an
identical input history to the browser warm Camera/HOME/Off/On route.

Fixed chronological targets: `_03.10.26_04.23.46.034.png` first partial footer,
only the bottom eight rows of the footer band; `_03.10.26_04.23.53.579.png`
first partial HUD after its absence through52.491. Native49.262 has the
settled footer and Camera banner but no HUD;04.24.05.292 has the settled HUD.
These are observed sequence boundaries, not samples chosen to minimize a diff.
The coordinator opened all four named own PNGs.

`R/before-desktop/frame-001` is the browser's first HOME paint at relative
HOME update0. Both HUD and footer are already fully visible. The28-pair
capture spans HOME update0..70, has no page errors and retains mute. It records
actual LCD paints and render metadata, not synthetic source-frame previews.
The native clock/status/population and browser title content differ; preserve
empty whole-LCD masks and report them, not a whole-scenario pass.

## Source Mapping

Unchanged HOME title `0004003000009802`, v24576, content0 / `00000082`,
converter `ctr-native-web`1.2.0 / CTRTool1.3.0:

- HUD -> manifest `home.hud` -> `hud_LZ.bin/blyt/HudMenu_00.bclyt` and
  `hud_LZ.bin/anim/HudMenu_00_SceneIn.bclan`. Animation SHA
  `dd44a8b153374128fa7737e1663aafe52fb2d8c45f0bc9f8526e8b48b0c0c7f2`.
  Decoded41 frames, source range[-20,20], group `G_Scene_00`; normalized20
  has alpha0/scale1.1, normalized40 alpha255/scale1.
- Footer -> manifest `home.launcher` ->
  `launcher_LZ.bin/blyt/LncBtmBtn_02.bclyt` and
  `launcher_LZ.bin/anim/LncBtmBtn_02_SceneIn.bclan`. Animation SHA
  `9b19c054cbb84c89a4b0c8669a2c05566f386dc7fd681410864065b8dee44a4e`.
  Decoded15 frames, source range[-14,0], group `G_Scene_00`; normalized0..14
  translates source y-32..0 while alpha rises0..255.

Full unchanged pack/archive/layout and title identities are retained in the
[preceding evidence](home-power-on-staging-2026-10-03.md#sources-and-limits).
The manifest title-level identity `2863c6c4...` is distinct from the encrypted
CIA archive `011d0276...`; neither is newly extracted or replaced here.

## Implementation

Worker `d3c15fbb` integrates as `a655e4ed`. The paired screen owner observes
an awake boot's `system.since` and current shared HOME update count. After
that same boot enters ordinary HOME, it samples footer SceneIn0..14 and HUD
SceneIn0..40; repeated paints do not advance. Warm restart retains the global
clock but acquires a new relative origin. Unobserved boots stay settled.
Sleep retains the owner while the shared clock is frozen. App, panel, dialog,
Power, folder and specialized footer contexts revoke it; resource replacement
and disposal clear it. No reducer, scene, asset, host duration or audio changed.

Only actual diagnostic sample options are non-mutating. Reuse-only options
belong to live state-driven paints and must retire an entry immediately, even
for Power then B before another cadence update. Independent review caught
this overloaded-options distinction before integration; the real paired
screen regression now covers it. Existing specialized footer poses retain
priority. Missing source resources follow existing explicit native failure.

## Supporting Checks

Independent exact-commit review finds no actionable issue; focused tests80/80.
Integrated runtime `a655e4ed` passes1,923 tests, zero failures,23skip/oneTODO
(1,947 total), production build and serialized typecheck. Logs are
`R/npm-test.log`, `R/build.log` and `R/typecheck.log`. No shader/material change.

Production `R/after-desktop`, `R/after-mobile` and `R/after-reduced` retain
28/27/2 actual raw LCD pairs, errors[] and mute. First HOME shared counts9/7/12
show nonzero warm-boot origins; relative counts begin0. Normal desktop/mobile
show absent HUD/footer at entry, footer motion, then HUD entrance. The
coordinator inspected raw desktop delta0, delta2 footer, delta22 HUD and both
desktop/mobile full viewports. Reduced motion is event-driven and yields only
boot20 and HOMEdelta0, with settled source endpoints; interval samples are
not fabricated. This is an accessibility adaptation, not native entry motion.

`R/boot-stall-control` and `R/boot-reduced-stall-control` retain4/5 pairs and
successfully present terminal20 before HOME after a700ms host stall. Both have
errors[] and mute. These browser controls do not establish native cadence.

Eight Work/About/Health close, cancel, repeated close, switch, reduced close
and direct-close controls complete in `R/close-controls`, with errors[] and
mute. The final agent-browser check confirms ready, native canvas and no
framework overlay. Dedicated Chrome41115 exits cleanly; its launcher exits0
and CUA session ends. Native37352 remains absent and original config SHA
`d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`
is reverified. Preview3021 remains HTTP200. No system audio/default profile,
private matrix, firmware/model, other app design or DeveloperStorage write.

## Native Comparison

Frozen plan `R/home-entry-comparison-plan.json` selects chronological actual
HOME samples, not closest pixels: first delta0; first in(0,14] for footer;
first in(20,40] for HUD. Desktop before/after select delta2 and delta22;
mobile selects delta3 and delta23. The different sample cadence is retained.
Whole masks are empty; diagnostic regions are HUD[0,0,400,24) and
footer[0,212,320,240). No registration, colour fit or phase search.

| Fixed native target | Baseline | Desktop after | Mobile after |
| --- | ---: | ---: | ---: |
| Partial footer: footer pixels over delta2 | 8,598 | 2,522 | 2,521 |
| Partial footer: whole pair over delta2 | 41,610 | 33,263 | 31,673 |
| Partial HUD: HUD pixels over delta2 | 5,477 | 1,948 | 2,520 |
| Partial HUD: whole pair over delta2 | 31,015 | 27,441 | 28,230 |

Native partial-footer46.034 SHA
`8b58d687025e998db8c558c46c20315c95f3bc9782994f8c7401c3f6ede28ca5`;
partial-HUD53.579 SHA
`43e6092bd61d30d8fd3cbccd7063e5813e48fb36a5b76c50b02644406affa03f`.
Named browser pairs are `before-desktop/frame-003` / `after-desktop/frame-003`
and `before-desktop/frame-010` / `after-desktop/frame-010`; mobile has the same
frame names at its recorded different deltas. At the HUD sample, desktop's
lower LCD is byte-identical before/after; all modes' settled footer remains
within maximum2 of native. Reduced endpoint's whole pair still differs by
41,293 pixels. Every whole native comparison remains **fail**.

Coordinator opened `R/home-entry-comparison-sheet.png`, including fixed
pre-footer, partial footer, partial HUD and settled rows. Source identities,
raw pair hashes, metrics and capture limits are in the comparison report.

Frozen comparison bundle: report SHA
`9607a2bcae01e8145ecf1e0ec2cefd0a113588679b060f43969767f8bfa0ec53`;
inspected sheet SHA
`09968175d6afb5b0782ff39c652dd7ce17ae4b6eae6baf66398da6948e40804e`;
manifest SHA
`9203a89bf27c9a372659c3b8424e7de5c798057c9ea0c05aaa455faf9485675d`.
`R/verify_home_entry_comparison.py` independently verifies all337 records,
including finalized supporting controls, harnesses, tests and cleanup record.
Comparator reports two byte-stable regenerations. The earlier native inventory
is unchanged, report SHA
`a8b590d16c9e1d513f64057a0542872997b55ec012e4b4a695660e404f339356`,
with all86 records independently reverified. Private scenario matrix unchanged.

## Acceptance Boundaries

Native caller epoch and one-HOME-update-to-source-frame scheduling are not
yet proven. Reduced-motion endpoints remain an accessibility adaptation.
No source graphics, fonts, audio or other app designs may be reconstructed.
Whole HOME pixel/input/motion/audio fidelity remains fail; muted sessions
cannot establish native-cue acceptance. A source clip and successful tests
are not sufficient evidence for native timing or whole-scenario completion.
The selected Camera banner already appears at the browser's first HOME paint,
whereas native partial-footer capture has no banner. Its initial caller/entry
ordering remains a separate visible defect; this change does not fix or accept
it. Existing population/status/content, wallpaper, glyph/sampling and retained
overlay adaptations remain open as recorded in the feature map.
