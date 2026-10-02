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
New workstream dispatches use GPT-6 Astra/high; future subagents use GPT-6.1
Sol/high, at normal speed, no Fast. The latest request supersedes Fast; chat service tier cannot
be changed or verified through dispatch tools. No new priority-only helpers.

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
