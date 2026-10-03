# HOME Toolbar Re-entry - 3 October 2026

## Captured Defect And Correction

Base `896a12b9`, runtime `d53cbe32`: from Camera at six rows, press Notifications
at `(160,16)`, move outside to `(160,60)`, return and release. Native restores
Select and then selects Notifications with its banner, cursor and Open footer.
Browser-before permanently cancels at eight-pixel slop and remains on Camera.

Worker `86715adf` integrates as `eacae23c`. Toolbar contacts retain their exact
original owner across excursions. Shared `ownedHomeToolbarContact` guards
painting and release against pointer/start identity, action, selection revision,
panel, container, focus and density changes. Cross-button, grid, footer and
density transfers remain inert. First applet touch selects through the existing
retained focus/cursor model; repeated selected touch uses the existing activation
route. Settings remains a direct action. Physical A/Start, density/footer
ownership and all native assets remain unchanged.

This is a **capture-fit input adaptation**: the native touch callsite and exact
timing remain untraced. Notifications is directly observed; equivalent treatment
of applet focuses1..5 is not independent native acceptance of every applet.

## Source Identity

No new visuals, audio or native assets are authored. Element-to-manifest and
CIA-member mappings, hashes and converter versions remain in the
[toolbar source audit](home-toolbar-interaction-2026-10-02.md#focus-anchors-and-visible-resources).
The changed pressed binding uses `home.launcher`,
`animations.LncBase_D_01_Select` frame1 on `G_News_00` for this capture.
Select SHA256: `77887eff1bf874d8f330b15c31d5a92fe968d3e57441921d7a977a8fc23697b8`.
The same retained source cursor, CGFX banner and footer selection paths are reused.
HOME title `0004003000009802`, version24576, content index0/`00000082`,
`romfs/launcher_LZ.bin`, converter `ctr-native-web`1.2.0/CTRTool1.3.0.

## Native Evidence

Private evidence root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-toolbar-reentry-20261003`.
Native clone is sibling `native-toolbar-reentry-20261003`; its own screenshots
are400x480. Preparation audit and `native-input-record.md` record exact launches,
input and cleanup. CTM SHA256:
`9ccc1a6ab0fe30e2dc9f739addd826f5bac5b5b7a751616f8bff7a5e076845f0`.
Launch config SHA256:
`d4191414cbc4525fced4560156585f9ddb4d36675e242f924160edf6311fb0c1`.
The source profile config is unchanged at
`d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`.
Original hardware/EUR/factor1, static microphone2, Null output1 and volume0.

| Frozen pair | Native own PNG, 3 October 2026 | Nearby AX observation |
| --- | --- | --- |
| notifications-held | `_03.10.26_06.44.42.017.png` | 2941 |
| outside-held | `_03.10.26_06.44.55.876.png` | 3779 |
| notifications-reentered | `_03.10.26_06.45.05.371.png` | 4377 |
| released | `_03.10.26_06.45.19.33.png` | 5215 |

The06.44.22.918 onset is ambiguous and excluded. Browser camera-idle is unpaired.
AX counters are observations, not exact capture frames. CTM boundaries
7020/11700/15210/18720 of27596 input pairs correspond to nominal30/50/65/80s;
native/browser cadence and epochs are not matched. First native replay completed
and exited0 normally. A second replay supplies only supplemental repeatability
and selected-touch activation evidence, not replacement frozen pairs.
After EOF, Movie Close and Continue restored60FPS; a screenshot-grounded
foreground Notifications click opened the native applet. Its own PNG
`_03.10.26_06.53.51.112.png` has SHA256
`49f375f9970c3d937aaf095807afeb1793f94590e351ea07cea32f5403a92a27`.
Second process17442 required SIGKILL/exit137 after Quit and SIGTERM did not
close it. No clean shutdown or post-run persistence is claimed for that clone.

## Supporting Checks

Integrated full suite:1954 pass,0 fail,23 skipped,1 TODO (1978 total).
Build and sequential post-build typecheck pass. Worker223 scoped checks pass;
independent read-only review has no confirmed findings with185 adjacent tests,
typecheck and mixed physical/touch controls passing. Its full sparse-worktree
suite has36 missing-asset failures; the coordinator full checkout passes.
No shader/material change. No test result establishes native fidelity.

## Comparison Boundary

Frozen plan: four exact pairs, empty masks, channel delta2; whole upper/lower,
toolbar `(0,0,320,34)` and Notifications `(140,0,40,34)` diagnostics. No
registration, phase fitting or best-frame selection. Native held/re-entered
toolbar crops are byte-identical; native outside differs by668 pixels above2.
Browser-before never restores Select. Before re-entry has666 pixels above2,
release572; whole pairs all fail. Before sheet is coordinator-inspected.

Production desktop1150x690 and mobile390x844 each retain five actual-painted
raw LCD pairs,400x240 upper/320x240 lower, with errors[] and mute. Both restore
Select and release to Notifications on HOME; viewports are inspected and the
complete console is visible. `browser-controls-v2` retains21 pairs with
cross-toolbar/density/footer/grid transfers inert, first-select/second-activate,
Notifications return, density6->5->6 re-entry and Manual re-entry/return all
passing. The initial control run's13 captures are retained but incomplete:
its assertion incorrectly expected `dataset.app` for an applet. The corrected
collector checks the live Notifications announcement; actual applet pixels
were already correct. No runtime change was needed for this harness error.

Coordinator-independent toolbar recomputation: held, outside and re-entered
all have zero pixels above2, maximum2, on both desktop and mobile. Re-entry
therefore improves666 ->0. Released toolbar remains fail:498/max139 desktop
and514/max147 mobile, versus572/max168 before. Selection now agrees, but
released cursor pixels/epoch do not. No phase optimization is used to hide it.
All16 after whole-LCD pairs remain fail: upper45819..52922 pixels above2,
lower9488..9677. The final before/desktop/mobile sheet is coordinator-inspected;
97 final and32 before manifest records independently rehash correctly. The
comparison worker's initial wrong mobile pathname is preserved in addendum01
and explicitly corrected in addendum02 before after metrics; pairs are unchanged.

Final artifacts under `comparison/`:

| Artifact | SHA256 |
| --- | --- |
| `report.json` | `1f8c9eb93bca181cc0a540ae393431bc8abe2ca59c170e7972ac01c7f1eac355` |
| `comparison-sheet.png` | `dd43f9b8b27256f6d1e94b357e0fec9f6884c338bdda3b84fffccd698f70cd53` |
| `manifest.json` | `30c1d19154d5f73711a279f7c601cee0b80a4588bc203a9391b6159a5c62f731` |

Owned muted browser exits0; native17442 and browser9223 are absent.
Production preview3021 serves the integrated build. Default Azahar and system
audio remain untouched; private matrix remains unchanged.

Still non-native/unaccepted: population and placement adaptations, live clock
and status, unmatched banner/cursor epochs, native touch caller, input cadence,
motion and cue timing. Other existing app designs are preserved. No private
matrix, whole-scenario or strict1:1 status is upgraded.
