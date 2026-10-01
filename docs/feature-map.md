# 3DS App Completion Map

Current plan, 2 October 2026. This is the execution map for the **whole in-scope
app**, not just HOME pixel polishing. The coordinator owns this index, dispatch,
integration and native/browser acceptance. Each workstream has its own Codex
chat, Git branch and worktree, recorded in the [workstream registry](feature-map/workstreams.md).
Workstream chats use GPT-6 Astra/High; helper subagents use GPT-6.1 Sol/Medium.
The user's no-Fast-mode requirement is recorded, but its app setting cannot be
changed or verified through the dispatch tools.

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

1. **Make navigation complete and safe.** Lifecycle and app workstreams enumerate
   routes, cover missing tests and fix evidenced broken entry/back/close/switch
   paths. The coordinator records a smoke route for every app, not only HOME.
2. **Close missing visible screens and controls.** Finish decoded source-backed
   menus, notices, empty/populated states and explicit failure states. An inert
   action needs a scope reason; placeholder native graphics are not an option.
3. **Run one acceptance queue.** Coordinator captures each workstream's named
   native/browser scenarios, returns exact residual regions to its chat and
   integrates fixes sequentially. HOME idle and Settings Other page 1 remain
   baseline regressions. A browser startup failure does not stop code inventory
   or other independent workstreams.
4. **Finish fidelity and integration.** Correct unexplained pixels, input and
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
