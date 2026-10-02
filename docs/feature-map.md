# 3DS App Completion Map

**Start with the [remaining UI design and shipping map](feature-map/design-to-ship.md).**
It separates missing/placeholder UI from existing designs and verification,
covers every in-scope app/menu/helper, and assigns work to the existing lanes.
Latest user request refocuses **HOME screen 1:1 fidelity**: suspended backing,
compact retained icon, footer states, banners and interaction. Close/switch,
power-on and buttons remain pending; preserve the other existing designs.

Current plan, 2 October 2026. This is the execution map for the **whole in-scope
app**, not just HOME pixel polishing. The coordinator owns this index, dispatch,
integration and native/browser acceptance. Each workstream has its own Codex
chat, Git branch and worktree, recorded in the [workstream registry](feature-map/workstreams.md).
The latest user-supplied repository instructions select GPT-5.6 Sol/high for
new delegated work. Model overrides do not switch the coordinator; service
tier is not exposed or verified by the collaboration tool.

Latest [populated-folder Delete notice](home-populated-folder-2026-10-02.md)
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

All 3DS sessions stay muted. All visible verification runs on the iPad Sidecar
desktop after fresh geometry checks. Only the coordinator operates Azahar and
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
