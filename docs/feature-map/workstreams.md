# Workstream Registry

Coordinator: the Codex chat **Explain the 3DS project**,
`01a0f8e9-441b-76a2-b3ee-bec359217934`. The user explicitly requested separate
Codex chats and worktrees, with this chat orchestrating their work and allowing
bounded subagents inside each lane. Latest model policy: GPT-6 Astra, high for
workstream chats; GPT-6.1 Sol, medium for helper subagents. No Fast mode. The
tools can set model/reasoning but cannot toggle or verify Fast mode/service
tier; that limitation must not be reported as a successful setting change.

The [completion map](../feature-map.md) defines scope, status and acceptance.
This file is the dispatch ledger. Feature IDs and route details live in
[HOME/lifecycle](home-and-lifecycle.md), [system/services](system-and-online-apps.md)
and [media/social/portfolio](media-social-and-portfolio.md).

## Ownership

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
| HOME | `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` | H-12/H-10 suspended-window source/owner contract, footer route tests and exact capture ticket | active |
| Lifecycle | `01a0f9a7-3b9c-7640-b7f6-3528982b4929` | L-06/L-07/L-09 close/switch cancel-confirm and helper-return contracts | active |
| Settings/helpers | `01a0f9a8-ffa2-7782-9336-915253cf5695` | S-*/G-* menu/leaf/Back coverage, Manual/Health routes and missing caller tickets | active |
| Camera | `01a0f9a3-24c9-7e41-ad18-64689e20a28a` | M-CAM-* five-page guide, combined gallery/photo/Back and empty/applet routes; `ad4b403a` delivered, photo Back selection bug found | review |
| Sound | `01a0f9a3-7cd6-7e82-bddb-f6d2d3900dd8` | M-SND-* silent fake-effect transport lifecycle, empty/first-run evidence and user-song dependency | active |
| Social/applets | `01a0f9a3-bca6-75b1-8981-da3f5b47f12f` | C-* Notes/Friend/Notifications local route contracts and named missing-renderer/scroll tickets | active |
| Local services | `01a0f9a9-43a4-7ff3-b708-f5af6c0cb954` | O-* offline menu/Back contracts, Zone collapsed-detail and Browser History repro tickets | active |
| Portfolio | `01a0f9a4-99cd-7b12-8bd2-b9e0028cdb4c` | P-* all eight content/action graphs, page/photo bounds and explicit-link checks | active |

First-task edits are restricted to each lane's new
`tests/<lane>-completion-routes.test.mjs` and
`docs/workstream-handoffs/<lane>.md` (HOME uses `home`). Existing coverage is
reused; do not duplicate tests or commit knowingly failing tests. These are
bounded readiness slices, not claims that missing native UI is complete. Next
visual implementation requires the coordinator's named capture and a narrow
file reservation. No lane repeats source-only investigation indefinitely.

The first six chats initially started before the latest model request. All six
received accepted `gpt-6-astra`/`high` follow-up overrides; Settings and services
were created directly with those settings. An in-flight old-model turn may
finish before the override takes effect. All new helpers must use
`gpt-6.1-sol`/`medium`; no Fast-mode setting is claimed verified.
