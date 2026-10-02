# Remaining UI Design and Shipping Map

Current runtime checkpoint: `2f074d64` (native empty-folder Delete; rejected cursor
candidate remains restored to `a751b2dd` behavior), 2 October 2026. This is the **ordered
design and implementation queue for the entire in-scope app**. Start here;
the three detailed maps supply routes and evidence, not competing priorities.
The user's existing console, HOME and app designs must be preserved. Missing
native acceptance is not permission to redesign an implemented screen.

## Work First

The [Create Folder footer source audit](../home-create-folder-footer-2026-10-02.md)
used its one bounded source-only slice. The 799-pixel stable residual is not
fixed by source selection; no runtime change was justified. Do not rerun the
same audit or hide the error under phase/population differences. New native
runtime evidence or an explicitly measured adaptation is needed. Continue with
populated-folder behavior or captured pressed/fade interaction states.

The captured [Folder Settings placeholder](../home-folder-settings-native-2026-10-02.md)
is replaced at `79e77f58` with decoded native frame, rows and message styles.
The selected-folder upper banner is retained, the underlying HOME footer is
hidden, and source-bounded touch Cancel plus physical B/Escape work on desktop
and mobile. The [comparison](../workstream-handoffs/home-folder-interaction-compare.md)
separates regional static evidence from full-screen population/epoch residuals.
Empty-folder Delete now returns directly to root HOME at `2f074d64`, matching
two fresh native runs; the former confirmation was incorrect, not a native
screen to redesign. [Correction and evidence](../home-folder-delete-native-2026-10-02.md).
Next bounded folder work is native populated-folder behavior or captured
pressed/fade states, not another redesign of folder creation/open/close.
Rename/text input stays excluded. The open-folder left-gutter discrepancy,
native keyboard delivery, exact timing/motion/audio and whole scenarios remain
open; retain these as separate defects.

Latest bounded HOME result: [ordinary icon corners](../home-icon-corners-2026-10-02.md)
now meet the delta-2 static pixel tier in four native/production captures.
The subsequent [resize investigation](../home-touch-projection-2026-10-02.md)
proves the mobile density miss was a stale projected QA point, not broken
raycast input. The projection fix and actual resized taps pass. Fresh native
captures extend toolbar/density static tolerance across all six row counts;
longer-press repeat cadence remains unresolved and needs native input evidence
before reducer changes. Preserve the existing design and source graphics.
The [cursor replay](../home-cursor-replay-2026-10-02.md) now covers all 60
phases at six densities. No geometry/clock correction is justified. A narrow
LCD-sampling candidate failed the clean full-ROI/control gate and is reverted;
do not repeat that experiment or claim a delivered raster fix. Next bounded
visible check is native pressed/toolbar/folder interaction against the existing
browser design, with exact capture preconditions and source-backed assets.
The [progress record](../progress-2026-09-24.md)
supersedes older checkpoint details in the queue below; whole scenarios remain
unaccepted and the user's lifecycle priorities are unchanged.

Bounded HOME follow-up `5de1f381` corrects Settings' two-row title balloon;
[native/production evidence](../home-balloon-density-2026-10-02.md). One-row
behavior remains; no general Settings redesign or shipping-gate reduction.
Health anchor audit found no positioning defect. Lifecycle priorities below
remain unchanged.

Order is the user's: **quit/close/switch transitions, power-on, then buttons
and HOME interactions**. Further HOME Settings polishing is deferred. The
modal-button portion of items 1-2/4 is implemented and browser-inspected;
[evidence and remaining design](../software-dialog-input-2026-10-02.md).

| Order | Feature IDs / owner | Concrete unfinished UI or interaction | Bounded deliverable and completion check |
| --- | --- | --- | --- |
| 1 | L-06 / Lifecycle | Source dialog/direct Health Close preserved; retained-owner AppQuit live through `f8334ec2` | [Seven-flow evidence](../home-close-motion-2026-10-02.md) verifies terminal WebGL publication, sleep pause and input quarantine. Initial mask backing is abrupt; window/footer departure and native epoch remain unresolved. Native close capture blocked; do not replace native gaps with guessed animation. |
| 2 | L-07 / Lifecycle | Confirmed switch retains old owner through AppQuit then launches frozen target; two dedicated worktrees integrated | [Latest evidence](../home-close-motion-2026-10-02.md): Work->About browser route passes; source motion native timing/mask binding still unverified. Preserve cancel/owner guards and replace only captured unfinished departure/reveal states. |
| 3 | L-01, L-03 / Lifecycle | Power-on exists but uses a 3000 ms boot, final 350 ms reveal and fitted phase order; shutdown uses 550 ms | Finish source-backed off -> power-on -> paired LCD reveal -> HOME, plus power menu Cancel/Off -> black/off -> restart. Capture backlight/LCD order and input gates; no new decorative boot screen. Preserve existing console opening. |
| 4 | H-14, L-06, L-07 / Lifecycle + coordinator | Source Bounding_00/01 rectangles and Select press feedback at `f17a1007`; same-button ownership preserved | Tests and muted Sidecar replay pass, including byte-identical dialog crop after cross-drag. Native input/default focus/motion comparison remains open. Physical, keyboard and touch keep the same actions. |
| 5 | H-03..H-10, H-14 / HOME | Navigation exists; button feedback and edge/cancel behavior need a complete visible interaction pass | Select/open with touch and A; B/Back; HOME/resume; toolbar; density ends; paging; footer variants; folder enter/close; pickup/drop/cancel. Repair captured failures only, preserving existing visual design. Run both physical-model and touchscreen routes. |
| 6 | H-12, L-05 / HOME + Lifecycle | Expanded/compact windows and source curved backing delivered; lower tint and paired pulse at `7b243793`/`47845dc5` | Preserve owner/mode readiness and capture ownership. Native pulse epoch/cadence, HUD, footer background shades and suspend/resume/close motion remain open. [Latest evidence and adaptations](../home-suspended-highlight-2026-10-02.md); no whole scenario passes. |

The [native held-HOME reference](../native-home-return-2026-10-02.md) now
supplies H-12's suspended-window/first-use notice capture. Health closes without
an observed confirmation; establish other-app close/switch separately rather
than applying the browser's universal placeholder policy to every title.

The existing browser route evidence already captures the close/switch placeholder
and suspended-HOME gap: [completion routes](../completion-routes-2026-10-02.md).
Current code: [placeholder painter](../../src/os/portfolio-screens.ts),
[dialog state and touch](../../src/os/system.ts),
[native transitions](../../src/os/native-system-presentation.ts),
[transition durations](../../src/os/system-transitions.ts).
Items 1-2 share an implementation; item 4 should be fixed in that delivery,
not left broken while power-on is built. HOME work can proceed independently
without editing Lifecycle's state files.

## Remaining Visible Work

**Replace** means an authored placeholder or generic body remains. **Finish**
means an existing UI has a missing visible state/control. **Preserve** means
the design exists: verify it and fix only observed defects. **Gated** means
source, a real caller, or user content is missing; it is not a ready design task.
These labels describe implementation, not native acceptance.

### HOME and Console

| IDs | Classification | Remaining work | Owner |
| --- | --- | --- | --- |
| H-01, H-02, H-13 | Preserve | Wallpaper, HUD, native banners, scoped tiles and empty slots. Correct named pixel/motion residuals only; do not redesign the HOME composition or add excluded apps. | HOME |
| H-03..H-06, H-14 | Finish | Input/pressed/selected/released states, long-press pickup, move/drop/cancel, folder-hover and edge-scroll behavior. Existing motion timings partly adapted; unsupported native modes stay explicit. | HOME |
| H-07, H-08 | Preserve | Folder creation, entry, contents, close and layout restoration; verify first/last slots and all densities. Text entry stays excluded. | HOME |
| H-07, H-08, H-14 | Finish/replace | Folder Settings settled native composition delivered at `79e77f58`; press/fade timing and keyboard selection remain unverified. Delete confirmation is still authored and requires its own capture/source replacement. Open-folder left gutter exposes root icons unlike native. | HOME |
| H-09, H-10 | Finish | Every toolbar/footer enabled, disabled, selected and suspended variant; Manual/Open/Resume/Close/Close Folder/Create Folder routes and button-edge behavior. | HOME |
| H-11 | Finish, deferred | Source HOME Settings and Save/Load now exist. Saved-slot LCD thumbnails, preview Zoom, first-use preparation and later Settings rows remain missing. Current-layout paired preview is implemented at `5232b9c5`; do not rebuild it. | HOME |
| H-11 | Replace, deferred | Theme picker remains authored. Replace native portions only from source; portfolio theme choices/preferences and reset stay labelled adaptations. | HOME |
| H-12 | Finish, priority 6 | Suspended upper software window and its source activation/return pose; retain existing cursor/balloon implementation. | HOME |
| H-15, L-13 | Preserve | Layout/folder/theme/brightness saves, reset, corrupt-save and storage failure UI. Verify; no new settings system. | HOME + Lifecycle |
| H-16 | Preserve; audio gated | Accessible controls/announcements, mute and volume. Silent cue scheduling checks can run; audible native comparison waits for user permission. | HOME |
| L-02, L-14, L-15 | Preserve | Original sourced model, leftward spin/opening, physical controls, framing, lid sleep/wake, loading/retry/teardown and reduced motion. Fix captured usability/overlap defects only. | Portfolio + coordinator |

### Cross App Menus and Transitions

| IDs | Classification | Remaining work | Owner |
| --- | --- | --- | --- |
| L-01, L-03, L-06, L-07 | Replace/finish, priorities 1-4 | Close/switch dialogs and progress, power-on/off, launch/reveal, exact button ownership. See ordered tasks above. | Lifecycle |
| L-04, L-05 | Finish | App -> HOME -> Resume -> HOME -> Close, including retained page/selection and first resumed pair; no double close or stale app image. | Lifecycle |
| L-08, L-09 | Preserve | Toolbar applet/nested helper Cancel/Close/Back returns to the correct caller, including helper -> Settings page. Notes retirement differs from ordinary application suspension. | Lifecycle |
| L-10 | Preserve | Paired loading, timeout, explicit unavailable-resource failure, Retry and escape. Browser recovery UI remains labelled adaptation, not a Nintendo dialog. | Lifecycle + coordinator |
| L-11 | Finish | Settings Manual later pages, Enlarge and scrolling only where source-established; no generic invented per-title Manual. | Settings |
| L-12..L-15 | Preserve | Link confirmation/intent, cancellation of late results, storage notices, teardown and hidden-tab/reduced-motion policy. These are shipping checks, not new screen designs. | Lifecycle |

### Settings Health and Helpers

| IDs | Classification | Remaining work | Owner |
| --- | --- | --- | --- |
| S-01, S-03 | Preserve | Settings main/exit and Parental intro/explanation/PIN boundary already source-backed. Verify return/focus and captured residuals; no account/PIN operation. | Settings |
| S-02 | Replace | Connection setup, SpotPass, DS Connections and information leaf bodies are generic/local adapters. Retain existing Internet/Connection menus; replace native bodies only with demonstrated source UI. | Settings |
| S-04 | Finish/replace | Data Software/Extra Data native lists exist; free-block/wait/entry states unfinished. Remaining DSiWare, StreetPass, blocked users, add-on and backup leaves are informational adapters. No delete/format operation. | Settings |
| S-05 | Preserve/replace | Profile, DS Profile, date/time/birthday controls exist. Region, nickname and Touch Screen leaves remain adapted previews. Keep read-only boundary and existing page-1 design. | Settings |
| S-06 | Replace | 3D Calibration and Mic Test generic bodies; Sound native choice screen exists and needs only verified interaction/return. No microphone access. | Settings |
| S-07 | Replace | Outer Cameras and Circle Pad calibration bodies are generic; Transfer helper/choice/return is implemented. No capture/calibration operation. | Settings |
| S-08 | Finish/replace | Language native list needs focus/hold/groove/confirmation sequencing; Update entry exists; Format leaf remains generic. No locale update, download or destructive action. | Settings |
| G-01, G-02 | Preserve | Health menu and three articles/scroll/Back are implemented. Fix measured differences, do not redesign article screens. Usage static-tier matches are not whole-scenario acceptance. | Settings |
| G-04, L-11 | Finish | Settings Manual Contents/page 1 exist; later content/scroll/Enlarge incomplete. Portfolio Guide's local content stays an adaptation. | Settings |
| G-05 | Replace/finish | NNID unsigned-in body is an authored unavailable notice; Transfer/Update Back restores parent. Source-supported offline body/caller arguments remain gaps. | Settings |
| G-03, G-06, G-08 | Gated | amiibo, Circle Pad Pro, Mii selector and Error helper need an actual in-scope caller; Error also lacks native painter. No invented HOME entries or writable/NFC operations. | Settings |

### Camera Sound and Personal Applets

| IDs | Classification | Remaining work | Owner |
| --- | --- | --- | --- |
| M-CAM-01..06 | Preserve/finish | Camera guide/grid/gallery/photo/Back exist; retain recent selection fixes. First-run replay policy and source scene/guide motion need finishing. Read-only Shoot/zoom/settings do not imply missing capture features. | Camera |
| M-SND-01, 02 | Preserve/finish | Sound guide/empty room already exist; guide repeat policy and measured cursor/footer/scene/motion residuals remain. No recording/import expansion. | Sound |
| M-SND-03..06 | Gated content; preserve UI | Supplied-song library/transport/error/suspend paths exist, but production track manifest is empty. Wait for user songs, then verify play/pause/seek/mode/next/error/close silently; don't build another player. | Sound |
| C-NOT-01..04 | Preserve/finish | Notes grid/read-only editor and suspended Double/Up/Down capture exist; finish demonstrated switch/intro states. Drawing tools are intentionally inert under UI-only scope, not a new editor backlog. | Social |
| C-FRD-01, 02, 04 | Preserve | Offline own-card/profile/Back; no invented Mii, codes, edit/account/register functions or errors. | Social |
| C-FRD-03 | Finish, source gated | Saved friend row can open a route with no native detail painter/projection/tests. Obtain actual detail evidence before publishing it as native-ready. | Social |
| C-NTF-01..03 | Finish | Notification list/badges/read lamps exist; fixed scrollbar pose, list movement and pulse/return states remain. Preserve read flags and explicit empty state. | Social |
| C-NTF-04 | Replace, source gated | Custom notification detail is generic; body/title/scroll/read presentation unproved. Source-profile rows stay inert until their real bodies are established. | Social |
| M-SEL-01, 02, C-NOT-05 | Gated | Photo/Sound selectors and memo alias lack established production callers; memo lacks dedicated native dispatch. Existing selector chrome has fitted bodies. No invented picker launch or media operation. | Camera / Sound / Social |

### Local Services and Portfolio

| IDs | Classification | Remaining work | Owner |
| --- | --- | --- | --- |
| O-01 | Preserve/finish | eShop welcome/wait/OK/exit exists; native HOME-launched entry state differs from direct launch evidence. Resolve actual entry/return before altering design. No store/purchase operation. | Services |
| O-03 | Finish | Zone Search and Information currently collapse to one detail; split source-established offline outcomes and Back. | Services |
| O-04, 05 | Preserve/finish | Local Browser start/settings/bookmarks/info exist; History state has no visible entry route. Add only source-established menu route; keyboard and remote browsing remain excluded. | Services |
| O-06 | Gated body; preserve chrome | Miiverse toolbar/background/Back exist; empty local interior has no source-supported offline body. Do not invent a feed or composer. | Services |
| O-02, 07 | Gated | mint and Miiverse-post lack real callers/native presentation. Registered IDs are not a mandate to invent screens. | Services |
| P-WORK, P-PROJ | Preserve | Work entries/links/HackUK cross-launch; Side Projects entries/Renu pages and Visit. Only repair captured overflow, unreachable controls or return failures. | Portfolio |
| P-HOB, P-LIFE | Preserve | Hobbies pages/three photos/Visit; Life entries/detail/Done. Keep user design. | Portfolio |
| P-HACKUK, P-NVIDIA | Preserve | HackUK pages/links and NVIDIA Renu detail/Visit. Keep user design. | Portfolio |
| P-ABOUT, P-CONTACT | Preserve | About intro/toolkit/pages and Contact's seven explicit links. Verify longest labels/last rows and link intent; no new contact form. | Portfolio |

## Execution and Shipping Gates

Use the [eight existing chats and worktrees](workstreams.md), not eight new
audits. These are **queued ownership assignments, not claims of running agents**.
The previous bounded deliveries are integrated. Coordinator reserves shared
files and integrates coherent commits sequentially; workers never operate
Azahar or the shared browser. New tasks name allowed files, base commit, feature
IDs, captured defect and one visible deliverable. Keep at most one bounded
source-only slice before a visible correction or explicit source gap.

1. Deliver Lifecycle close/switch plus button ownership first; HOME independently
   fixes captured control defects. Then Lifecycle does power-on. Do not return
   to Settings-row polish ahead of these user priorities.
2. App lanes take the next **Finish/Replace** row with a captured defect and
   source evidence. Gated rows wait without blocking independent work. No
   already-designed screen gets a redesign task solely because it lacks a pair.
3. For every applicable app: entry -> launch -> first-run/main -> every menu/
   detail -> Back/Cancel -> HOME -> Resume -> Close -> switch. Also cover empty,
   populated, first/last, disabled, loading/error/retry, lid and power interrupts.
   Use the [shared completion matrix](../feature-map.md#shared-completion-matrix)
   and detailed maps for exact routes. Record N/A with scope reason.
4. Each runtime delivery needs focused tests, full tests/typecheck/build and
   matched native/browser LCDs, inspected diffs and motion/input/cue evidence.
   All GUI is on iPad Sidecar; all 3DS audio remains silent. Audible acceptance
   stays open. No unverified whole scenario is called 1:1 or shipped as accepted.

No percentage or ETA is inferred from this map. **Implementation completion and
native acceptance are separate gates.** Existing dump provenance must survive
every change; fitted native composition and portfolio/offline differences stay
labelled adaptations. Missing sources/callers/content remain explicit blockers,
not silently waived requirements. No push or deployment is implied.

Detailed inventories: [HOME and lifecycle](home-and-lifecycle.md),
[Settings and services](system-and-online-apps.md),
[media, personal applets and portfolio](media-social-and-portfolio.md).
