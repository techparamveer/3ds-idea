# Workstream Registry

Coordinator: the Codex chat **Explain the 3DS project**,
`01a0f8e9-441b-76a2-b3ee-bec359217934`. The user explicitly requested separate
Codex chats and worktrees, with this chat orchestrating their work and allowing
bounded subagents inside each lane. The latest user request selects
GPT-6 Astra/high for workstream chats and GPT-6.1 Sol/high for future subagents;
normal speed, no Fast applies to both.
Existing in-flight helpers were not claimed switched. Chat messaging sets
model/reasoning but not service tier. The saved global priority override was
removed; existing chat speed overrides remain unverified. Computer use refused
Codex's own controls; do not bypass it or claim the message changed service tier.
Do not start new helpers through the priority-only collaboration route.

On 2 October, all eight registered workstream chats accepted explicit
`gpt-6-astra` / `high` follow-ups with the new no-Fast policy. These were
settings-only acknowledgements, not implementation dispatches. Completed
subagents remain stopped; their in-flight model was not changed retroactively.

HOME Settings delivery: renderer `23f21485` integrated as `6c31e2f6`, state
`183b4965` as `e4a30ab0`, System tests `eaf4cf20` as `ca326367`, MyMenu painter
`61cf9509` as `8fd2f4bf`; runtime wiring/review fixes `e923487d`. Workers used
assigned `3ds-home-design-native-panel-20261002` and `3ds-home-design-state-20261002`
worktrees without GUI. [Evidence and residuals](../home-settings-integration-2026-10-02.md).

The [completion map](../feature-map.md) defines scope, status and acceptance.

Coordinator `17eebbb0` delivers [compact retained HOME presentation](../home-compact-window-2026-10-02.md).
Next reserved slice: source suspended dark backing/warp and sleep presentation,
then modal footer visibility and matched phase replay. No new worker dispatch.

Coordinator `0330d13c`/`e3503cc7`/`645ae96d` adds source switch icon header,
advancing pending banner and selected-title/dark Close footer. [Evidence](../home-switch-footer-2026-10-02.md)
still fails whole-scenario acceptance. Newest user priority is HOME 1:1;
the compact icon was subsequently delivered above. Backing and modal footer
visibility remain. No new worker dispatch.

Coordinator close/switch delivery `f17a1007` replaces authored modal art with
source dialog/masks/messages, source button bounds and paired readiness.
[Eleven-pair browser evidence](../home-software-dialog-2026-10-02.md) verifies
cancel/confirm and cross-drag behavior. Native caller/policy, inline size and
closing motion remain open. This was coordinator work, not a worker dispatch.
This file is the dispatch ledger. Feature IDs and route details live in
[HOME/lifecycle](home-and-lifecycle.md), [system/services](system-and-online-apps.md)
and [media/social/portfolio](media-social-and-portfolio.md).

## Ownership

Current queued deliverables are in the [design-to-ship map](design-to-ship.md):
Lifecycle close/switch plus modal buttons, then power-on; HOME interaction fixes;
other lanes preserve existing design and take only captured Finish/Replace gaps.
These assignments do not mean a worker is running. No new chat or agent was
dispatched for this mapping update, and no new shared-file reservation is taken.

| Lane | Branch | Worktree under `/Users/paramveer/.codex/worktrees/` | Ownership |
| --- | --- | --- | --- |
| HOME | `codex/complete-home-ui-20261001` | `3ds-complete-home-ui-20261001` | HOME layout, toolbar, density, cursor, folders, drag, selected-title banners |
| Lifecycle | `codex/complete-lifecycle-20261001` | `3ds-complete-lifecycle-20261001` | Boot, launch, loading, suspend/resume, close/switch, sleep/power and ownership boundaries |
| Settings/helpers | `codex/complete-settings-20261001` | `3ds-complete-settings-20261001` | Settings menus, Health, Manuals, amiibo and Settings/internal helper UI |
| Camera | `codex/complete-camera-20261001` | `3ds-complete-camera-20261001` | Read-only Camera guide, folders, gallery, paging, photo and native chrome |
| Sound | `codex/complete-sound-20261001` | `3ds-complete-sound-20261001` | Sound guide, room, menus, supplied-song library/transport and music-owner cleanup |
| Social/applets | `codex/complete-social-20261001` | `3ds-complete-social-20261001` | Notes, Friends, Notifications; their local storage/navigation and supported native UI |
| Local services | `codex/complete-services-20261001` | `3ds-complete-services-20261001` | eShop, Zone, local Browser/Miiverse and their scope-limited service UI |
| Portfolio | `codex/complete-portfolio-20261001` | `3ds-complete-portfolio-20261001` | Eight portfolio apps, content routes, asset delivery, responsive console usability |

The original five lanes remain historical ownership guidance. These new
assignments are the current user-authorized execution split. The Assets lane's
provenance rules apply to every lane; shared converter/native-renderer changes
require coordinator review and regression coverage across consuming apps.

## Shared File Reservations

- Coordinator completed the selected-owner suspended-window slice at `81d0b3d8`
  in its assigned checkout. `home-suspended-window.ts`, firmware metadata,
  screens, portfolio capture access and native recovery changed together; no
  worker edited those interfaces concurrently. Reservation released after full
  checks and muted Sidecar recapture. [Evidence](../home-suspended-window-2026-10-02.md).

- Coordinator completed the bounded L-06/L-07 modal-input slice at `7dd76afa` in
  its assigned
  `3ds-home-fidelity-20261001` worktree: `system.ts`, `stock-screen-layout.ts`,
  `portfolio-screens.ts` and dedicated dialog tests. No worker is dispatched
  or editing those paths for this slice. Reservation released after tests/build
  and muted Sidecar replay. Native replacement remains separate and first in
  the queue; [evidence](../software-dialog-input-2026-10-02.md).

- Lifecycle owns changes to `src/os/system.ts`, `app-host.ts`, `app-input.ts`,
  `app-types.ts`, `system-transitions.ts`, `runtime-effects.ts` for its assigned
  lifecycle tasks. Other lanes submit a narrow required contract change first.
- HOME owns `src/os/home-*` and HOME-only input/state changes. Lifecycle-related
  `home-*` changes are coordinated explicitly with HOME before either edits.
- `src/os/stock-apps.ts`, `stock-screen-layout.ts`, `screens.ts`,
  `stock-screen-presentation.ts`, `app-registry.ts` and shared native loaders are
  **coordinator-reserved**. App lanes may diagnose and propose exact hunks but
  must not concurrently edit these monoliths. Coordinator grants one narrow
  reservation at a time, then records the integrated commit before the next.
- `src/scene/console-scene.ts` is coordinator-reserved for cross-lane integration.
  Portfolio may inspect it, but needs a reservation before changing it.
- App-specific `stock-native-*.ts`, dedicated navigation/model helpers and tests
  belong to their named lane. Every task still states its allowed file set.
- No lane edits the coordinator's progress/index/registry or another lane's
  worktree. A worker appends its result to a lane-local handoff and commits it.

## Dispatch Rules

Each worker starts with git status/branch/HEAD and the feature-map task, then
names its scope and available evidence before editing. Never assume the chat's
initial project working directory is the assigned worktree: use the absolute
path above for every command. The registered project points at a different Git
object database on DeveloperStorage; it is not the continuation checkout.

All chats use local project association and explicitly assigned existing
worktrees. Do not create an app-managed worktree from the project's unrelated
original checkout or import its dirty state. Source base and final delivery SHA
must be recorded for each lane. The coordinator integrates by reviewed
cherry-pick only in its own continuation branch, never by a shared-branch merge.

Start with one bounded task per lane. Limit each lane to at most one additional
subagent and give it a disjoint file set or a read-only review. No nested agent
fan-out. Workers run focused non-GUI checks; coordinator runs the complete
integrated suite/build and all GUI/native comparison. Do not run eight full
builds simultaneously on the user's machine.

If native evidence is missing, request the exact scenario/inputs/frame/region
from the coordinator and move to a ready task. Do not invent graphics or native
behavior. Every task ends with commit, feature IDs, tests, source identities,
evidence needed and remaining defects, not an unbounded status loop.

## Integration Gate

1. Worker commit is clean, scoped and independently reviewed.
2. Coordinator checks interface overlap and cherry-picks sequentially.
3. Code/assets: full tests, typecheck, build; shader/material changes also shader
   validation. Documentation: relative links and whitespace checks.
4. Coordinator performs muted Sidecar browser/native scenarios and affected
   regressions, retaining raw LCD hashes, input history, masks and inspected diff
   sheets. Audio remains open while muted. No tests-only 1:1 claim.
5. Update task state and progress with the integrated SHA and evidence. Failed
   comparisons return to the owning chat with a specific region and next action.

## Chat Dispatch

All eight worktrees were created and verified clean from `f5ed204c` before
dispatch. They are source-focused sparse checkouts; workers use the integrated
dependency installation read-only and do not install packages. The associated
Codex project is `3ds-idea`, but each prompt assigns the absolute worktree above.
The tools cannot attach an arbitrary existing checkout as the chat's initial
project directory. The assigned path, not the initial project cwd, is mandatory.

| Lane | Codex chat ID | First bounded task | Dispatch state |
| --- | --- | --- | --- |
| HOME | `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` | H-12/H-10 contract/tests integrated; Work/Health browser suspension captured, native window gate needed | verification-needed |
| Lifecycle | `01a0f9a7-3b9c-7640-b7f6-3528982b4929` | L-06/L-07/L-09 route tests integrated; Work close/cancel/confirm browser-inspected | verification-needed |
| Settings/helpers | `01a0f9a8-ffa2-7782-9336-915253cf5695` | S-*/G-* menu/leaf/Back, Manual/Health route tests integrated; capture tickets ready | verification-needed |
| Camera | `01a0f9a3-24c9-7e41-ad18-64689e20a28a` | M-CAM-04 keyboard/touch fixes integrated at `38bab8b7`/`dda25e9e`, independently reviewed and browser-inspected; native comparison pending | verification-needed |
| Sound | `01a0f9a3-7cd6-7e82-bddb-f6d2d3900dd8` | M-SND-* silent transport tests integrated; production song input absent | verification-needed |
| Social/applets | `01a0f9a3-bca6-75b1-8981-da3f5b47f12f` | C-* route tests integrated; missing-renderer/scroll capture tickets ready | verification-needed |
| Local services | `01a0f9a9-43a4-7ff3-b708-f5af6c0cb954` | O-* offline route tests integrated; Zone collapsed-detail and History capture tickets ready | verification-needed |
| Portfolio | `01a0f9a4-99cd-7b12-8bd2-b9e0028cdb4c` | Eight content graphs and actual selection-effect assertions integrated (`54497736`); both negative controls caught | verification-needed |

First-task edits are restricted to each lane's new
`tests/<lane>-completion-routes.test.mjs` and
`docs/workstream-handoffs/<lane>.md` (HOME uses `home`). Existing coverage is
reused; do not duplicate tests or commit knowingly failing tests. These are
bounded readiness slices, not claims that missing native UI is complete. Next
visual implementation requires the coordinator's named capture and a narrow
file reservation. No lane repeats source-only investigation indefinitely.

Historical first dispatch (superseded by the policy above): the first six chats initially started before that model request. All six
received accepted `gpt-6-astra`/`high` follow-up overrides; Settings and services
were created directly with those settings. An in-flight old-model turn may
finish before the override takes effect. All new helpers must use
`gpt-6.1-sol`/`medium`; no Fast-mode setting is claimed verified.

## First Deliveries - 2 October 2026

All eight initial commits are tests/handoffs, not new native screens. Integrated
HEAD `75cab5e2` passed 1,595 tests, zero failures, 23 skips and two TODOs;
typecheck passed. The production bundle used runtime `f5ed204c` for the first
browser captures. Full route evidence is in the [coordinator capture record](../completion-routes-2026-10-02.md).

| Lane | Worker commit | Integrated commit | Handoff |
| --- | --- | --- | --- |
| HOME | `9c459370` | `74771823` | [HOME](../workstream-handoffs/home.md) |
| Lifecycle | `9ac6faee` | `33981e97` | [Lifecycle](../workstream-handoffs/lifecycle.md) |
| Settings | `855ebe3f` | `931c6da6` | [Settings](../workstream-handoffs/settings.md) |
| Camera | `ad4b403a` | `bf4e8350` | [Camera](../workstream-handoffs/camera.md) |
| Sound | `8780c64a` | `e69ed6b1` | [Sound](../workstream-handoffs/sound.md) |
| Social | `7c3dadff` | `133ca575` | [Social](../workstream-handoffs/social.md) |
| Services | `2c6597a8` | `a0aea6dd` | [Services](../workstream-handoffs/services.md) |
| Portfolio | `04938361` | `75cab5e2` | [Portfolio](../workstream-handoffs/portfolio.md) |

Completed reservations: Camera's first correction `b6afb008` integrated as
`38bab8b7`, then touch correction `32b8bc60` as `dda25e9e`. The reservation is
released; `stock-apps.ts` is coordinator-reserved again. Portfolio test correction
`dc9876b1` integrated as `54497736`. All worker tasks are bounded and complete;
the verification-needed rows are not still-running chats or accepted scenarios.

Final full checks at `dda25e9e`: 1,605 pass, zero failures, 23 skips and one TODO;
typecheck/build pass. Camera final production keyboard, direct-touch, physical
Back, reopen and footer Back routes were inspected on muted Sidecar. Four
browser-before/after sheets were inspected; no native comparison is implied.
Independent GPT-6.1 Sol/Medium review closed both findings with 17 focused tests
and 12 extra tick/navigation Camera cases. No Fast-mode verification is implied.

## Historical Model Override - 2 October 2026

Historical receipt only; superseded by the supplied repository preference and
normal-speed policy at the top of this file. It is not a new dispatch instruction.

All eight registered chats accepted explicit `gpt-6-astra` / `high` follow-up
overrides. The follow-ups only acknowledge settings; they do not resume completed
implementation tasks. Future helpers require `gpt-6.1-sol` / `medium` with
standard, non-Fast service verified before dispatch. No new helper was started.
The available dispatch tools still cannot toggle or verify Fast mode, so that
part of the user's requested configuration remains unverified.
