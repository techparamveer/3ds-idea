# 3DS App Completion Map

**Start with the [remaining UI design and shipping map](feature-map/design-to-ship.md).**
It separates missing/placeholder UI from existing designs and verification,
covers every in-scope app/menu/helper, and assigns work to the existing lanes.
Latest user request refocuses **HOME screen 1:1 fidelity**: suspended backing,
compact retained icon, footer states, banners and interaction. Close/switch,
power-on and buttons remain pending; preserve the other existing designs.

Current plan, 3 October 2026. This is the execution map for the **whole in-scope
app**, not just HOME pixel polishing. The coordinator owns this index, dispatch,
integration and native/browser acceptance. Each workstream has its own Codex
chat, Git branch and worktree, recorded in the [workstream registry](feature-map/workstreams.md).
The latest user-supplied repository instructions select GPT-5.6 Sol/high for
new delegated work. Model overrides do not switch the coordinator; service
tier is not exposed or verified by the collaboration tool.

Latest [switch closing correction](home-switch-closing-2026-10-03.md),
`65d75466`, restores the missing decoded lower closing dialog/mask after
Health-to-Camera confirmation, hides the footer, and preserves the compact
suspended Health window. Switch still skips ordinary-close exit/return stages.
Lower terminal residual improves76,304 ->91 pixels above delta2; full1884
tests/typecheck/build pass. Source timing and whole-scenario fidelity remain
unaccepted. Preserve the implemented state and owner guards; next is the
missing dark retained upper backing during confirmed switch, then Camera's
ordinary-close confirmation header.

Earlier [settled Open footer investigation](home-open-footer-residual-2026-10-03.md)
confirms54 edge pixels above delta2/max5 at unchanged `ea6265de`. A retained
capture candidate is rejected because maximum error and MAE worsen; no runtime
change. Stop this palette/filter path pending discriminating capture evidence,
and take the next captured HOME/lifecycle defect. Whole scenarios still fail.

Earlier [Power re-entry comparison](home-power-reentry-2026-10-03.md) confirms
the existing continuous-contact behavior at unchanged runtime `ea6265de`:
native clears held feedback outside, restores it inside, and shuts down on
inside release. Four primary unmasked two-LCD pairs meet maximum delta2;
held/re-entered button ROImax1. No runtime change was indicated. Exact native/browser epochs,
motion/audio, physical backlight and cold boot remain open. Preserve this
verified ownership behavior; do not repeat the same gesture audit as missing.

Earlier [shutdown publication](home-shutdown-publication-2026-10-03.md),
`19376463` + `ea6265de`, closes a captured host-stall endpoint skip. A guarded
native-pair/render acknowledgment precedes off; forced publication spans an
animation callback boundary and suspension/context changes invalidate it.
Full1882 tests/typecheck/build pass; native epochs, motion/audio, backlight
and restart timing remain open. Preserve the source poses and earlier Power
input correction; next lifecycle comparison still needs
exact cold-boot/input timing, not another fitted shutdown duration.

Earlier [Power input](home-power-input-2026-10-03.md), `b0814dd4`, fixes
outside-origin release activation and missing source held-button feedback.
Fresh native controls confirm both cross-boundary releases stay in Power;
held ROI6708->0 pixels above delta2 and five desktop endpoint pairs reach
maximum2, including exact black shutdown. Full1874 tests/typecheck/build and
four browser modes pass implementation checks. Continuous native re-entry is
now compared above; exact input/motion/audio, physical backlight and restart timing remain open.
Preserve settled Power and completed close/return; next lifecycle acceptance
targets those specific gaps, not another reconstruction of the same screen.

Earlier [shutdown fade](home-shutdown-fade-2026-10-03.md), `cdc2926f`, uses
delivered paired sleep SceneOut after Decide, replacing the wrong generic
fade. Browser 1200/120 ms timing remains an adaptation. Full 1872 tests,
typecheck/build and four production modes pass implementation checks. Native
partial fade is captured; exact epochs/input/audio, physical off/backlight and
terminal publication under stalls remain open. Continue those lifecycle/button
gaps; preserve the previously implemented close/return and settled Power UI.

Earlier [banner return](home-banner-return-2026-10-03.md), `78fa7325` + `c01e1219`,
requests selected content at guarded footer departure0 while retaining all
readiness gates. Clean desktop/reduced show growth from return2 and mobile
from return4, before Open completes. Full1869 tests/typecheck/build pass;
load-sensitive initial desktop is preserved, not hidden. Exact native epochs,
input/motion/audio and whole scenarios remain fail/open.
Its remaining target is measured relative banner/footer pose and load variability,
without treating sparse first-captured native onset as an exact scheduling
boundary; power/buttons acceptance also remains open.

Earlier [Open return](home-open-return-2026-10-03.md), `03500c6c` + `65b758af`
with publication fix `0172842b`, adds ChangeUp0..8 and selected-banner
reacquisition. Owner retirement precedes return; quarantine and paired endpoint
publication continue through8. Reduced replay exposed and then verified the
fix for synchronous cleanup skipping return0. Full1867 tests/typecheck/build
pass. Native banner activation/growth, intermediate alpha/epochs and exact
input/motion/audio remain open; whole scenarios still fail. Preserve this
implementation and target those measured gaps, then remaining power/buttons.

Earlier [compact footer correction](home-compact-footer-2026-10-02.md) at
`c44e88d7` + `be54ea30` selects ChangeDw0..6 and black-left Decide5 after
dialog exit. Native25 Close2590->37 mismatched pixels, Resume unchanged45;
whole scenarios still fail. Open return/banner reacquisition, intermediate
alpha/epochs and input/motion/audio remain open. Fresh46 native frames and
desktop/mobile/reduced actual-input replays are recorded in the progress note.

Earlier [closing entry and post-modal footer](home-postmodal-footer-2026-10-02.md),
`54152a33` + `0bb044d5` + `062a486b`, adds decoded entry FadeIn and close-only SceneOut0..14
after dialog exit. Owner retirement waits for the footer terminal pair;
switch remains unchanged. Full1,858 tests/typecheck/build pass; independent
138-test review finds no actionable regression. Donor/epoch binding remains
capture-fitted. The first comparison's Resume dimming regression is corrected;
intermediate footer geometry/alpha still differs. Next: native Close tone, Open return/banner reacquisition,
exact timing/input/audio, then power-on/buttons. Whole scenarios remain fail.

Earlier [close exit icon](home-close-icon-exit-2026-10-02.md), `7d0b4a9f`,
selects source DisAppear20 only during close dialog exit, preserving owner,
switch and earlier close behavior.39 fresh native own-PNGs now capture actual
entry/exit and return; earlier endpoint-only limitations are superseded.
Full1856 tests/typecheck/build pass; test follow-up `fcb05a71` covers paired
failure/recovery. The later entry/footer implementation above supersedes those
two missing stages; exact timing/input/audio and whole1:1 remain open.

Earlier [folder pulse diagnostic](home-suspended-highlight-2026-10-02.md#folder-pulse-diagnostic---2-october-2026)
at unchanged `a40d597e` explains the full-icon tint residual through observed
animation phase: fixed-ROI3,136/max34 becomes8/max4 at the best live pose.
No palette or runtime change.218 paints cover106/120 modulo residues; native
epoch/cadence remain unknown and the result still fails strict tolerance.
Do not repeat a tint fit or the same best-pose sweep; target native activation
timing or another captured interaction. Whole scenarios remain unaccepted.

Earlier [suspended folder software Close](home-folder-software-close-2026-10-02.md),
`a40d597e`, corrects both the white folder-action resource and its wrong Back
route. Selected suspended Health now uses native black X Close, runs the
existing close transition, and returns to the same folder/child with Open.
Full 1,853 tests, typecheck/build pass. Fresh native idle/suspended endpoint
captures are available; exit capture failed, so exact motion/timing and whole
scenario acceptance remain open. No guessed fade or renderer change.
Same-native footer mismatch improves 2,895 -> 73 pixels above delta 2;
desktop/mobile/reduced close and fixture-restoration routes pass.

Earlier [continuous folder re-entry](home-folder-reentry-2026-10-02.md),
`d58bc92a` / `95989614` / `7727fa35`, keeps the native pickup/stroke across
root-folder hover, preserves observed title suppression, and handles Back out
of a visited folder with immutable source ownership. Fresh native comparison
reduces re-entry lower mismatch 37,137 -> 5,284 pixels above delta 2.
Desktop phase-paced/mobile/reduced eight-pair runs and old seven-pair Back
regression pass; full 1,848 tests/typecheck/build pass. Whole pixel states,
native cadence/motion/audio and existing source/sampling gaps still fail/open.
Next: a new captured interaction or unfinished lifecycle transition; preserve
this correction and do not repeat the bounded small-icon/footer source audits.

Earlier [held stock artwork](home-held-title-artwork-2026-10-02.md),
`e911e475`, retains the authored material binding from `edc0090e`. Folder-held
art now reaches static delta-2 tolerance; root-held art improves but remains
236 pixels above delta 2, maximum 54. The direct-LCD experiment regressed root
art and was withdrawn. Full 1,842 tests/typecheck/build/shader pass. Next are
the unresolved small held artwork source/sampling, shell edge, and footer/gutter
raster, without guessed colours or another unmeasured transport change. The
bounded fractional-Y sweep did not explain root width; retain its current
anchor instead of repeating an anchor fit.

Bounded small-icon follow-up: the genuine Health SMDH24 plane matches native
ink bounds but its offline substitution worsens the above-delta2 count
236 -> 253 (maximum improves54 ->31). No asset/runtime selection is shipped.
Treat root-held source selection as a recorded gap and its pixels as fail;
no further source-only iteration without discriminating native evidence.

The bounded [held-footer check](home-folder-held-dimming-2026-10-02.md#held-footer-residual-check)
finds no new dimming-material error. Gutter/toolbar change residuals meet delta2;
the held footer still fails at1,576 / maximum4, consistent with the existing
retained-capture precision gap. No guessed raster correction is integrated.
Next: new matched root-to-folder hover or edge-continuation evidence, not a
repeat small-icon, footer or transport source audit.

Earlier [folder-held backing](home-folder-held-dimming-2026-10-02.md),
`4e18d7c9`, selects the decoded native pickup dimming endpoint before the
folder foreground. Full1,840 tests/typecheck/build and three production
interaction variants pass. A fresh CTM native lower capture repeats exactly;
controller timing remains adapted. Toolbar now reaches delta-2 static tolerance
(0 mismatching pixels, maximum 2); footer improves to 1,576 pixels above delta
2, maximum 4. Whole lower still differs at 6,696 pixels; scenario remains fail.
Keep residual backing raster, pickup
artwork/height, other anchors and exact motion/input/audio open.

Earlier [held pickup comparison](home-held-pickup-2026-10-02.md) obtains genuine
native held PNGs through CTM playback. `652520ee` corrects fitted lift and held
tile size after Back; `a751722b` fixes a counted-clock boundary missed by the
initial successful browser replay. `bcc3dcb6` refines the measured root lift;
1,836 tests/build/typecheck and all three production interaction variants pass.
Native resources remain unchanged. Then-captured
defects: folder toolbar dimming and composited artwork color; other
density anchors and exact timing/audio remain open. Visibility follow-up
`eeea99e7` now hides held footers and the root-held upper title through an
explicit capture-fitted policy; 1,839 tests/build/typecheck pass. See the
linked evidence for production comparison. Do not repeat the resolved size
diagnosis or claim1:1.
Production desktop/mobile/reduced and the nominal phase replay pass. Reused
native CTM references show root footer at delta2 tolerance (max1), while the
folder's newly exposed band remained too bright (max30). The backing follow-up
above addresses that source selection; whole LCDs still fail.

Earlier [folder drag-out](home-folder-drag-out-2026-10-02.md), `dd73c4ee` with
production ownership/scope fixes `35846d2e` and `1089c78c`,
fixes a fresh native/browser semantic mismatch: dragging a folder child over
Back now reaches root HOME instead of remaining in the folder. Desktop/mobile/
reduced-motion pointer replays verify the occupied-root swap, item conservation,
reverse restoration and outside-LCD cancellation. Final full1,832 tests and
typecheck/build pass. The 500ms deadline remains an explicit adaptation;
whole-LCD, native held animation, exact cadence and audio remain fail/open.
Next: matched root-to-folder/edge continuation or the specific backing source
gap, not another audit of the fixed Back-exit endpoint.

Earlier [pickup endpoint comparison](home-pickup-endpoints-2026-10-02.md) at
unchanged `28083c79` verifies native folder child2 ->1 ->2 placement against
desktop/mobile/reduced. Selected artwork and vacated blank cores meet delta2;
held animation/timing remain unverified. Divider and footer-edge shade remain
repeatable failures, with HOME capture format/raster precision unproved. No
speculative runtime correction. Next: unverified held/drop/hover/edge scenarios
or a source-supported backing correction, not another settled-endpoint audit.

Earlier [Create Folder footer text](home-footer-text-2026-10-02.md), `f031cca9`,
reduces the fixed whole-footer residual19 ->0 above delta2/max2 against three
preserved native captures. Desktop/mobile/reduced agree; four non-target
footer ROIs are byte-identical. The coverage fit is a labelled adaptation in
all Create Folder poses, with settled-only native proof. Browser hold/cancel
passes; full1,827 tests/build/typecheck pass. Whole HOME, remaining text/shade,
cursor/banner/HUD epochs and exact motion/input/audio stay open. Next: capture
and fix the next unmatched control/cursor state, not another resolved footer
backing or page-boundary audit. Preserve other designs.

Earlier [page boundary](home-page-boundary-2026-10-02.md), `ddea6d53`, fixes
the persistent right arrow, open-ended tray and keyboard/gesture escape beyond
the captured root slot59. Source geometry/input use60 exposed slots while
preserving300 stored slots through labelled high-slot compatibility. Six native
right-edge regions now have zero pixels above delta2, maximum2; the settled
footer edge also meets tolerance. Desktop/mobile/reduced endpoint sequences
match59 ->53 ->59 ->59. Final1,827 tests/build/typecheck pass. The exposed
first-root footer ROI also improves41 ->0 above2/max1. A suspected missing
folder arrow was a visual misread, disproved by exact regional bytes; candidate
47915d8b is reverted by e83d55de. Runtime remains equivalent to ddea6d53.
Whole LCDs, exact
input/motion/audio, native growth rules, population/epochs and shade/text remain
open. Next: matched remaining footer/text or cursor states, not another arrow
or tray-boundary audit. Preserve other designs.

Earlier [footer backing](home-footer-backing-2026-10-02.md), `8e2a29a1`,
restores the decoded native stripe band beneath the separate footer. Fixed raw
native/browser ROI improves from 8,960 to41 pixels above delta2 without a mask
or fit. Keep the remaining top-right edge, settled footer shade and whole-screen
differences open. Full1,820 tests/build/typecheck pass; desktop/mobile pointer
replays and seven unchanged stock LCD targets support the change. The slowed
native capture establishes pixels only, not cadence. Preserve other designs.
Folder Settings backing also improves6,814 ->31 above2 against existing native
own-PNG controls. The subsequent boundary correction above resolves its settled
top-right edge; footer text/shade remains open. Do not reopen the resolved
full-base composition decision.

Earlier [folder footer return](home-folder-footer-return-2026-10-02.md),
9371c576, restores staged Settings/Open entry after root selection returns.
Before, the first root paint already contained the settled footer; after,
production motion samples show SceneIn0,3,6,8,11,14,15. Native desktop video
supports the ordering, not exact raw-pixel timing. The clock binding remains a
labelled adaptation, and held Back pixels are obscured by a recorder overlay.
Full1818 tests/typecheck/build pass. Exposed footer backing, native cadence,
press pixels and audio remain open; do not repeat the already-fixed instant
footer defect. Other user-designed screens remain unchanged.

Earlier folder-gutter replay corrects the defect diagnosis: the browser retained
a root viewport shifted28px from native. Actual left paging to root-zero removes
the exposed icon strip with unchanged runtime `5b82c896`. Do not mask or hide
retained root content. Five fresh native captures and two eleven-pair production
runs support this distinction; exact timing/audio and whole-screen fidelity
remain open. Next: matched pressed/fade states, preserving delivered designs.
The aligned gutter retains816 pixels above delta2, maximum4; keep that backing
shade residual open. [Audit](home-folder-gutter-2026-10-02.md) and
[comparison](workstream-handoffs/home-folder-gutter-compare.md).

Earlier [open-folder footer](home-open-folder-footer-2026-10-02.md) at
`5b82c896` replaces occupied Close/Open with native full-width Open. Fresh
native left-footer touch and production desktop/mobile routes launch Health;
vacant children remain button-free and inert. Full1,813 tests/typecheck/build
pass, with static stock regression LCDs unchanged. Test follow-up21079a0d
retains true Back/B close coverage. [Comparison](workstream-handoffs/home-open-folder-footer-compare.md).
Footer shade, suspended-folder variants and exact input/motion/audio remain
open. The root-icon gutter attribution is superseded by the root-zero replay
above. Next is captured pressed/fade states, not another footer audit.

Earlier [populated-folder Delete notice](home-populated-folder-2026-10-02.md)
at `2ee79ae3`/`43b8be55` replaces the authored confirmation with the captured
native one-button message, retaining the upper folder banner and contents.
Two native touch-OK runs return to root; production desktop/mobile OK, physical
A, cross-target rejection, empty-delete and reload checks pass. B/HOME recovery
remains an adaptation. Full 1,808 tests/typecheck/build pass. A visible leaked
HOME footer was corrected after the first after capture. [Comparison](workstream-handoffs/home-populated-folder-compare.md).
Final modal retains98 corner pixels above delta2, max8; full pair49,352/12,601
remains fail, with unexplained backing shade and unmatched root/upper state.
Whole scenarios and exact motion/input/audio remain open.
Next: captured pressed/fade states or the open-folder root-icon gutter and
incorrect Close/Open footer (native Open-only); preserve
the delivered create/open/close design and excluded Rename boundary.

Earlier [Create Folder footer audit](home-create-folder-footer-2026-10-02.md)
at `8272c0b9`/`fd0e4cf9` adds a source-selection regression, not new pixels.
The stable 799-pixel residual splits spatially into 780 edge-shaped and 19
ink-intersecting pixels; causal layer ownership remains unproved. No palette
or glyph fit was introduced. Full 1,802 tests/typecheck/build pass; new native
and production controls are in the [comparison](workstream-handoffs/home-create-folder-footer-compare.md).
Do not repeat the source-only audit without new runtime evidence. Runtime
stays `2f074d64`; next work returns to unresolved folder interaction/press states.

Earlier [empty-folder Delete correction](home-folder-delete-native-2026-10-02.md)
at `2f074d64` removes the incorrect confirmation: two fresh native runs go
directly from Folder Settings Delete to root HOME/Create Folder. Desktop touch,
physical A, reload persistence and mobile touch pass in production, muted and
without page errors. Full 1,801 tests/typecheck/build and static stock regressions
pass. Populated-folder deletion remains an explicitly non-native adapter;
failed native population attempts establish no behavior. Exact motion/input/
audio and whole-screen fidelity remain open. [Comparison](workstream-handoffs/home-folder-delete-compare.md).
Post-delete Create Folder footer retains 799 pixels above delta 2 in both
native repeats (maximum 66); it is a bounded visible follow-up, separate from
population/scroll and cursor/banner epoch differences.

Earlier [Folder Settings replacement](home-folder-settings-native-2026-10-02.md)
at `79e77f58` removes the captured generic modal, restores the folder banner
and delivers source-derived touch Cancel with loading/error escape. Fixed
modal mismatch improves 55,945 -> 107 pixels above delta 2; header/Delete row
meet static tolerance, but Rename/corners, outside backing and upper epochs
remain. Full 1,800 tests/typecheck/build, desktop/mobile Cancel routes and
static stock regressions pass. [Comparison](workstream-handoffs/home-folder-interaction-compare.md).
Whole scenarios remain fail; pressed/fade states, populated-folder Delete and
opened-folder root-icon gutter are the next bounded folder gaps. Preserve
existing creation/open/close designs and the excluded text-entry boundary.

Earlier [cursor replay](home-cursor-replay-2026-10-02.md) establishes 60 phases
at each of six densities. The LCD-sampling candidate `68c69bcf` is rejected;
`b8773a90` restores the prior transport. Small best-fit corner improvements do
not clear the four-row full-ROI regression or unexplained outside-ROI changes.
No shipped visual fix, native epoch, matrix or whole-scenario pass follows.
Production input/responsive and static stock-app regression checks pass.
Next: native-visible pressed/toolbar/folder interactions, preserving the
existing source graphics and documented adaptations. See the
[comparison handoff](workstream-handoffs/home-cursor-compare.md).

Latest accepted [resize correction](home-touch-projection-2026-10-02.md) at `a751b2dd`
resolves the previous mobile density diagnosis: the QA projection retained a
desktop point outside the resized viewport; actual raycast input already worked.
Production resize/same-aspect resize, desktop all-density/boundary controls and
Notes desktop/mobile touch/HOME checks pass. Full 1793 tests/typecheck/build/
shader pass. Fresh native comparison extends toolbar/density-control static
pixel tolerance to all six densities, with unchanged before/after controls.
Whole scenarios still fail; native longer-press repeat, exact timing, motion,
audio and remaining visual gaps stay open. No app redesign or new native asset.
The [density comparison](workstream-handoffs/home-density-compare.md) identifies
selected cursor phase as the next bounded replay target; establish matched
frames before any geometry or timing correction.

Latest [ordinary icon correction](home-icon-corners-2026-10-02.md) at
`3bb6c6f3` uses the firmware's authored icon mask. Four production-after/native
pairs improve the Camera fringe 23 -> 0 pixels above delta 2, maximum 2;
the artwork edge improves 1 -> 0. Notes, unselected plate and footer controls
are unchanged; selected cursor epochs remain unmatched.
Full 1789 tests/typecheck/build/shader pass. Six desktop densities, Notes
desktop/mobile touch and HOME return work; static Health/Settings and both
Power origins remain exact before/after. Mobile density increase fails both
before and after at this historical checkpoint; the later resize diagnosis
above supersedes that open-target label. Whole scenarios remain
fail for the remaining visual, input, motion and audio gaps. See the
[comparison](workstream-handoffs/home-icon-corners-compare.md).

The [ordinary Camera plate baseline](workstream-handoffs/home-ordinary-plate-compare.md)
at `ee133aa8` repeats 963 high-delta plate pixels across three fresh browser
and preserved native pairs: shadow 415, rim/body 548. Its separate icon defects
are resolved by the later correction above. The bounded
[source replay](home-ordinary-plate-2026-10-02.md) at `476f05be` worsened the
plate mismatch and was rejected; target orientation/clear/precision remain a
source gap. No plate or scenario pass is inferred. GUI testing may use the full
Mac, with 3DS audio muted.

Latest [Notes toolbar comparison](workstream-handoffs/home-notes-toolbar-compare.md)
at runtime `79597372` resolves the captured H-09 glyph residual: 201 -> 0
pixels above delta 2, maximum 25 -> 1, across four native/production pairs.
The missing-UV rule is a narrowly guarded, labelled sampling adaptation, not
proven native initialization. Full 1782 tests/typecheck/build/shader pass;
desktop/mobile Notes touch and HOME return pass. Power and static Settings/
Health regression LCDs remain unchanged. Whole HOME scenarios still fail for
remaining visual gaps, population, epochs and exact input/motion/audio.

Latest runtime [Power footer correction](home-power-footer-raster-2026-10-02.md) at
`d4c96f26` resolves the last three high-delta footer pixels. Both HOME/app
Power routes now have zero pixels above delta 2 on both LCDs, maximum 2,
empty masks. Lower before/after and app repeat are byte-identical. Full 1780
tests/typecheck/build pass; desktop/mobile controls and 65 browser motion pairs
inspected. L-01 remains partial for exact input, native motion/shutdown/audio
and earlier app-output variance; no whole-scenario or matrix pass. Next work
returns to captured HOME interaction/visual defects, not this resolved footer.

Earlier [Power block-centering correction](home-power-centering-2026-10-02.md)
at `57c4c824` uses the decrypted multiline writer rule. Upper mismatch falls
4334 -> 3 on both origins; list 4331 -> 0, lower remains 0 above 2 and exact
before/after. App-only repeat is identical. Full 1778 tests/typecheck/build
pass; desktop/mobile controls and 64 browser motion pairs inspected. L-01
remains partial: three footer pixels, native input/motion/shutdown/audio and
prior upper variance remain open. No whole-scenario or matrix pass.

Earlier [Power text raster correction](home-power-raster-2026-10-02.md) at
`766888a2` resolves lower-label668 ->0 pixels above2, maximum2, both origins.
The ineffective upper experiment was removed. HOME upper4334 and app upper6512
remain; the app variance repeats even with the lower sampler disabled.
The restored-build app repeat returns to4334; upper stability remains open.
Full1777 tests/typecheck/build pass, final controls and73 browser motion pairs inspected.
L-01 remains partial: upper text, exact input/motion/shutdown and muted audio
are open. Whole scenarios still fail; no matrix or1:1 pass.

Earlier [Power menu correction](home-power-menu-2026-10-02.md) at `82d26a8b`
uses ROM-marked20% spacer advances and the sole native touch boundary. Full1776
tests/typecheck/build pass; native/browser settled comparison improves upper
7848 ->4334 pixels above2, lower668 unchanged. Physical Power/HOME and inert
footer pass on desktop/mobile. L-01 remains partial: text raster, phase timing,
input and muted audio are open; whole scenarios fail and matrix stays unchanged.

Earlier [balloon density correction](home-balloon-density-2026-10-02.md) at
`5de1f381` removes the native-inconsistent two-row Settings title balloon and
preserves one-row behavior. Final1771 tests and runtime typecheck/build pass; production
before/after and fresh native own-PNGs inspected. Same-anchor Health balloon
needs no offset. H-04/H-12 remain partial: whole LCDs/input/motion/audio still
unmatched, no matrix pass. Worktrees and muted Sidecar discipline preserved.

Earlier [closing exit delivery](home-closing-fade-2026-10-02.md) at `229e864c`
uses the ROM-selected dialog donor and mask FadeOut00 clips. Two worker chats/
trees and one clock subagent delivered; owner retention, readiness recovery and
resume publication are guarded. Full1765 tests/typecheck/build pass; seven
production routes/99 pairs inspected. Preserved native intermediate comparison
improves lower mean RGB51.984 ->18.735, but best-pose selection is diagnostic,
not epoch matching. H-10/H-12/L-04 remain partial. Exact timing/input/audio and
HOME residuals remain; no matrix update or whole-scenario pass.

Earlier [upper-close delivery](home-upper-close-2026-10-02.md) at `1fbfd6be`
adds fixed-bounds panel departure and source light camera hints. Two separate
worker trees/chats supplied a source audit and corrected edge fit; the panel
alpha is explicitly adapted, not a traced native writer. Full1755 tests,
typecheck/build pass; seven production routes/95 pairs inspected. Seven fresh
100%-speed native PNGs; upper mean RGB difference51.596 ->4.978, whole pair
still fails. H-10/H-12/L-04 remain partial: closing-dialog parent fade-out,
matched epochs/input/audio and existing HOME residuals are next. Matrix unchanged.

Earlier [software-closing delivery](home-software-closing-2026-10-02.md) through
`cf38daf8` adds the source lower closing window/text/scrim and guarded recovery.
Held Shift now reliably returns native Health to HOME;37 own-PNGs informed the
correction. Two separate chats/worktrees used; unsupported upper/footer
departure candidates remain unwired. Full1747 tests/typecheck/build pass;
seven production routes/98 pairs inspected. Local lower dialog interior has
zero pixels above2, but whole comparisons fail. H-10/H-12/L-04 remain partial:
upper fixed-bounds departure, parent fade, exact cadence and audio are next.
Private matrix unchanged. See the registry for current worker status.

Earlier [button/border delivery](home-buttons-border-2026-10-02.md) through
`25d4f367` fixes footer touch transfers and the close-start backing disappearance.
Two separate worktrees/chats delivered; full1738 tests/typecheck/build/shader
pass, final pointer routes and seven close flows inspected. Native Health launch
recovered, HOME return did not. Retained close-start upper diagnostic improves
74145 ->10769 pixels above2; all whole scenarios still fail. H-10/H-12/L-06/L-07
remain partial: panel/footer departure, native cadence/audio and residuals open.
The sampler slice has a visible correction; next is departure motion, not
another binding audit. Worktrees preserved, workers idle, muted preview updated.

Earlier [power-reveal delivery](home-power-reveal-2026-10-02.md) through
`2c992dd7` fixes endpoint eligibility, reduced-motion fade painting and actual
render acknowledgment. Full 1725 tests/typecheck/build pass; four power routes
and seven close regressions are browser-inspected. Native startup observation
failed, so L-01 remains partial, with adapted timing and no native motion pass.
Parallel close-mask audit `6066c315` identifies a sampler conflict but leaves
the unproven native binding unchanged. Its next gate is native frame/descriptor
evidence, not another source-only audit. Both new worktrees are preserved.

The [close-motion delivery](home-close-motion-2026-10-02.md) through `f8334ec2`
integrates two dedicated worktrees plus the pure controller. Retained-owner
AppQuit, terminal GPU publication, sleep pause and input quarantine are live.
Full1721 tests/typecheck/build/shader pass; seven browser flows and93 pairs
inspected. Both private Azahar retries failed launch input; retained before/after
diagnostics still fail. L-06/L-07/H-12 remain partial: abrupt initial mask backing,
window/footer departure and native timing are unresolved. Workers idle, trees
preserved. Next visible gaps remain close departure, power-on and buttons.

Earlier [suspended highlight and pulse](home-suspended-highlight-2026-10-02.md) at
`7b243793`/`dc6d19f7`/`47845dc5` adds source lower tint, hidden modal footer and
paired owner-scoped animation. Two new dedicated worktrees delivered commits;
two independent muted Azahar copies supplied Sidecar references. Full1695 tests
pass,28 production pairs inspected; all whole native pairs still fail. H-12
remains partial: timing/HUD/background shades need work. Reviewed close
controller `43b18bf0` is not yet runtime-integrated; that is the next visible
delivery before power-on. Earlier checkpoints below describe their own state.

The [suspended HOME backdrop](home-suspended-background-2026-10-02.md) at
`fc6e5983` now uses the source curved capture, mask and AppPause material.
Nine browser pairs and four fresh native captures show substantial improvement:
expanded upper 95,276 -> 12,137 differing pixels, unoccluded strip 8,544 -> 46.
H-12 remains partial: binding/padding/sampler/settled pose are fitted adaptations;
sleep pulse, lower icon tint, modal footer, HUD and exact motion remain open.
No whole scenario passes.

The [compact HOME window](home-compact-window-2026-10-02.md) at `17eebbb0`
restores the source retained icon/HOME glyph beside another selected title.
Four fresh native captures and nine browser pairs verify this bounded delivery,
not exact tint/pulse/motion. H-12 remains partial; next is suspended dark
backing/warp and sleep presentation. No whole scenario passes.

The [HOME switch/footer correction](home-switch-footer-2026-10-02.md) at
`0330d13c`/`e3503cc7`/`645ae96d` delivers source icon header, moving pending
banner, dark selected X Close and correct Health/Camera footer actions.
Nineteen inspected browser pairs and native comparisons support local progress;
no whole scenario passes. Next: suspended tint/warp, compact icon and modal
footer hiding. Camera Manual content is an explicit source gap.

The [Health Close correction](health-close-native-2026-10-02.md) at `3d5e533c`
delivers selected Health direct close and source X Close glyph/input. Fresh
native and eleven browser pairs support that bounded outcome, not motion or
whole-scenario parity. Native Health-to-Camera switch now supplies the next
defect: icon header/no unsaved warning, correct Camera upper presentation.
Suspended/closed/switch diagnostics all fail; L-06/L-07 remain partial.

The [source close/switch dialog](home-software-dialog-2026-10-02.md) at
`f17a1007` replaces the authored frame/glyphs and touch bounds, preserving
same-button ownership and paired failure recovery. Eleven browser pairs and
full1668 tests pass supporting checks; native dialog composition, inline text
size, per-title policy and closing motion remain open. L-06/L-07 are partial.

The [close/switch input correction](software-dialog-input-2026-10-02.md)
at `7dd76afa` is implemented, tested and browser-inspected: bounded same-button
touch and press feedback. Its authored artwork was superseded by the source
assembly above; native acceptance and closing motion remain unfinished.

[Silent reference recovery](native-silent-reference-2026-10-02.md) restores
native HOME/Health rendering with synthetic input2, Null output1 and volume0.
It supersedes Null input1, which stalled the reference. The subsequent
[held-HOME reference](native-home-return-2026-10-02.md) reached suspended HOME
and captured its upper window, first-use notice and Health close outcome.
The subsequent [source-window delivery](home-suspended-window-2026-10-02.md)
at `81d0b3d8` restores its expanded panel and owned frozen frame. Tests/build
and nine browser pairs pass their supporting checks; retained-native diagnostic
95286/51107 still fails. Flat backing, compact window, tint and motion remain
open. This is partial H-12 delivery, not completed close/switch or a scenario pass.

## Scope and Evidence

Preserve the original 2012 Silver + Black 3DS XL, spin/opening, physical controls,
two native-proportion LCDs and all eight portfolio apps. Target EUR 10.7.0-32E,
original hardware, English. [UI scope](portfolio-ui-scope.md),
[architecture](architecture/README.md), [progress](progress-2026-09-24.md) and
[verification](architecture/verification.md) remain authoritative. The previous
map is retained as [history](feature-map-history-2026-10-01.md), not a live queue.

**No whole native scenario is accepted 1:1.** Some individual static frames have
pixel-threshold matches; those do not prove input, motion or audio. Workstream
rows separately identify implementation, tests, inspected browser states and
native evidence. A missing screenshot is an evidence gap, not evidence that the
feature is absent. Native residuals remain fail until explained and accepted.

The [2 October live evidence](home-live-verification-2026-10-02.md) verifies
selection-independent background progression and repeated-paint stability.
A retained-native wallpaper-margin diagnostic matches within 1/255, but the full
pair still fails at 4940/19125 upper/lower pixels above 2. Native Health launched;
bounded HOME attempts did not return to HOME, so H-12 window composition still
needs its native gate. All owned verification processes are stopped.

The [HOME Settings correction](home-design-native-comparison-2026-10-02.md)
at `747f840d` replaces unrelated upper icons/hints with the native caption.
The later [lower-panel integration](home-settings-integration-2026-10-02.md)
at `e923487d` replaces authored Settings graphics and adds source Save/Load,
brightness/power rows, scrolling, local saved layouts and guarded confirmations.
Retained-reference lower residual is9630 pixels >2 (previous61485); differing
population/phase/input make this diagnostic only. Whole pair36195/9630 still
fails. Saved thumbnails/zoom and later Settings rows remain incomplete.
Settings Other page1 browser regression is exactly unchanged on both LCDs.
Health APT-debug follow-up still did not establish native HOME return.

The [fresh Save/Load comparison](home-layout-native-comparison-2026-10-02.md)
now includes `18bc33c0`, `6c24da03` and `5232b9c5`: empty-slot plates/Delete,
footer correction and current-layout paired preview are implemented. Against
the retained native frame, the final diagnostic is7899/1122 upper/lower pixels
above2; a fresh native frame gives8383/1217. Timing/population differ, so neither
is acceptance. Saved thumbnails/Zoom, first-use preparation and exact motion/
input/audio remain open. Full1648 tests, typecheck/build pass.

All 3DS sessions stay muted. The user now permits the entire Mac for visible
verification; check current display geometry before input. Only the coordinator operates Azahar and
the shared production browser. No default Azahar profile; no new artifacts on
DeveloperStorage. Private artifacts use the internal disk. No push, merge to a
shared branch or deployment without authorization.

## Coverage Index

| Workstream | Required user-visible coverage | Detailed map |
| --- | --- | --- |
| HOME | Upper wallpaper/HUD/selected banners; lower toolbar/grid/icons/labels/footer; selection/cursor; every density; scroll; folders; pickup/drop; HOME settings/manual/suspended controls; keyboard, touch and physical routes | [HOME and lifecycle](feature-map/home-and-lifecycle.md) |
| App lifecycle | Cold boot; opening/fade/logo/loading; cancellation/failure/retry; HOME suspend/resume; close confirmation; switching apps; nested helper return; lid sleep/wake; power menu/shutdown/restart; readiness/owner cleanup/persistence | [HOME and lifecycle](feature-map/home-and-lifecycle.md) |
| Settings, Health and helpers | Settings main, Internet/Data/Other pages, Profile/Date/Language/Sound and remaining in-scope menus; Parental notice; NNID/Transfer/Update UI; Manual contents/articles; Health articles/scroll; amiibo; internal helper surfaces | [System apps](feature-map/system-and-online-apps.md) |
| Camera | First-run guide; gallery folders; empty/populated browse; paging/strip gestures; photo view; read-only menu/chrome; exit and HOME return | [Media/social/portfolio](feature-map/media-social-and-portfolio.md) |
| Sound | First-run guide; entry room; source menus; empty/populated song library; supplied-song selection and playback transport; return/suspend/close cleanup | [Media/social/portfolio](feature-map/media-social-and-portfolio.md) |
| Notes, Friends, Notifications | Notes grid/editor/tools/save/return; Friend local screens and source error differences; Notifications empty/populated/read markers/list/scroll/detail policy; applet return to suspended software | [Media/social/portfolio](feature-map/media-social-and-portfolio.md) |
| Local services | eShop welcome/wait/exit; Zone entry/no-service UI; local Browser navigation/menu/return; Miiverse source chrome/local content and helper return; offline boundaries | [System apps](feature-map/system-and-online-apps.md) |
| Portfolio and console experience | Work, Side Projects, Hobbies, Life, HackUK, NVIDIA, About, Contact; list/detail/page/photo/cross-app/link actions; actual device controls; startup/retry/teardown; desktop/mobile framing and accessibility | [Media/social/portfolio](feature-map/media-social-and-portfolio.md), [experience contract](architecture/experience-design.md) |

## Shared Completion Matrix

Every app and helper must have an explicit answer for each applicable route.
Record N/A with a scope reason rather than silently omitting a route.

| Gate | Required behavior and evidence |
| --- | --- |
| Entry | Correct HOME identity and selection, source banner, Open action, matching touch/physical/keyboard outcome |
| Launch | Correct outgoing HOME, logo/fade/upper-lower publication, input gate and measured transition checkpoints |
| First run | Guide/welcome pages, forward/back/skip/dismiss where actually supplied; repeat-visit policy and saved state |
| Main screen | All visible labels, icons, panes, native fonts, animations, toolbars, footers and enabled/disabled states |
| Navigation | Each submenu/page/tab/list/detail, first/last item, scroll limits, touch hit areas, back/cancel and focus restoration |
| Dialogs | Each reachable confirmation/error/notice, modal input ownership, obscured background behavior, safe Cancel/Back |
| Content | Empty and populated states, selected content, pagination, missing-resource failure and declared local fixtures |
| HOME | Suspend, HOME presentation, suspended software indicator, Resume, and persistence of app selection/content |
| Close | Normal close, confirm/cancel, close-from-HOME and helper-return distinction, correct next HOME selection |
| Switch | Current app to different app, cancel switch, accepted switch, cleanup of outgoing owners before new publication |
| Interrupt | Lid sleep/wake, power menu/cancel/off/on, loading interruption, rapid retarget and stale async completion |
| Persistence | Reload, explicit reset, previous save migration, malformed save, no unintended network/device operations |
| Cleanup | No leaked renderer/audio/effect owner, no old app frame published, bounded caches, retry works after failure |
| Verification | Source identity + focused tests + full integrated checks + raw paired LCD evidence + inspected sheets + input/motion/cue timing |

## Work Order

1. **Close and switch software.** Replace the captured authored dialogs, finish
   closing/next-app presentation and correct modal button press/release bounds.
2. **Power-on, then HOME interactions.** Complete source-backed power/LCD
   sequencing; fix captured physical/touch/keyboard feedback and navigation
   defects. Preserve the existing model, HOME layout and app designs.
3. **Finish remaining missing UI.** Use the ordered design map's Finish/Replace
   rows; gated source/caller/content work must not monopolize the coordinator.
4. **Run one acceptance queue.** Coordinator captures each workstream's named
   native/browser scenarios, returns exact residual regions to its chat and
   integrates fixes sequentially. HOME idle and Settings Other page 1 remain
   baseline regressions. A browser startup failure does not stop code inventory
   or other independent workstreams.
5. **Finish fidelity and integration.** Correct unexplained pixels, input and
   motion, retest shared consumers, then audio only when the user permits it.
   Adaptations and source gaps stay visible; no completion percentage hides them.

At most one bounded source-only slice per feature before a visible correction
or a recorded source gap/adaptation. No repeated research loop without a named
defect, next observable result and stopping condition. A blocked item yields the
worker to the next ready item; it does not consume the entire coordinator.

## Task Protocol

Each task has a stable feature ID from a detailed map, one owner, explicit
allowed files, dependencies, captured defect or route repro, exact deliverable,
focused tests, and coordinator acceptance scenarios. The worker reports its
commit and unresolved items. The coordinator reviews the diff, integrates only
coherent commits, runs required checks and updates evidence before marking a
row accepted. Subagents may help inside a workstream but do not own shared UI.

Shared files (`system.ts`, `app-host.ts`, `stock-apps.ts`, `screens.ts`,
`stock-screen-layout.ts`, `console-scene.ts`, registry and native loaders) need
a named edit reservation in the registry. Worktrees prevent accidental writes,
not logical merge conflicts. Workers do not cherry-pick each other's work or
rebase a branch under another active worker. They never stage all files.

Use statuses **queued**, **active**, **review**, **integrated**,
**verification-needed**, **accepted**, or **blocked** for work. Separately retain
the native scenario status **fail**, **pass**, **adaptation**, **source-gap**, or
**blocked**. An integrated task is not automatically accepted. A source gap is
not a reduction of the user's completion criteria.

## Scope Boundaries

- Required adaptations: eight portfolio apps/content/tile population; read-only
  Camera; supplied-song playback; local/offline Browser, Miiverse and service
  flows. Document exact per-screen differences in the detailed maps.
- Excluded: Software Keyboard, Activity Log, Download Play, Mii Maker,
  StreetPass Mii Plaza, AR Games, Face Raiders; remote web/network/account/PIN
  actions; camera/microphone capture, recording/import and editable stock
  profiles. Internal helper registration does not invent a HOME entry.
- Native visuals/fonts/audio come only from the pinned dump with complete
  element -> manifest -> title/version/content/path/hash/converter provenance.
  Raw firmware, credentials, executables and private captures never go public.
- Supplied songs are a user-input dependency; the empty song manifest is not a
  completed playback demonstration. Silent tests may continue without unmuting.

## Coordinator Checkpoint

Working integration is `/Users/paramveer/.codex/worktrees/3ds-home-fidelity-20261001`
on `codex/home-fidelity-20261001`, not the original DeveloperStorage checkout.
All eight first tests/handoff deliveries are integrated. The muted Sidecar
browser recovered and supplied raw Work launch/HOME/close/cancel/confirm,
Health launch/HOME/resume and Camera guide/gallery/photo/Back observations.
The [capture record](completion-routes-2026-10-02.md) separates those from native
evidence. H-12's missing suspended window is visibly confirmed; its native
Health activation/frame reference remains pending before renderer work.

Camera physical-selection correction `38bab8b7` is integrated and visibly
verified; direct-touch correction `dda25e9e` follows the independently reviewed
and captured stale-focus defect. Portfolio's actual-effect test correction is
integrated at `54497736`. Final checks/recapture are recorded in progress, not
inferred from worker success. No native acceptance was added. The latest native
frame-step PNGs still do not establish a shared browser epoch.

This map and the chat registry supersede the old five-lane task ordering, not
the source-of-truth, isolation, ownership or verification rules in AGENTS.md.
