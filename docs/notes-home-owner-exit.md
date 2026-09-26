# Game Notes HOME return owner correction

Pressing HOME while already at HOME with Game Notes as the suspended
`homeReturn` now closes that Notes instance and leaves HOME visible. Reopening
Notes creates a new owner. Previously this second HOME press resumed the same
Notes instance, including its old drawing/list state.

## Evidence and bounded scope

The [accepted HOME source trace](native-notes-accepted-home-entry-audit.md)
establishes that completed native HOME exit destroys Notes scenes and its
capture/icon allocations before returning to destination `0x101`. The crucial
chain is scene-9 hooks `0x13b810`/`0x13b838`, callback `(1,2)` at `0x1628bc`,
scene-9 completion `(9,2)` at `0x13b9ec`, manager loop termination at `0x162a88`,
then the explicit APT return at `0x102280`. A completed exit cannot resume that
old Notes controller.

This change applies that owner rule at the browser's existing second-HOME
boundary. The first HOME still performs the shared suspension operation. It
therefore does **not** claim to port native SceneOut timing, accepted/rejected
HOME arbitration, or complete title/HUD scheduling. `W_TextPanel` stays hidden.

## Runtime contract

`system.ts` identifies a suspended, non-closing Game Notes `homeReturn` that
also occupies `runtime.systemApplet`. It calls `completeApplet` rather than
removing a record manually. The existing lifecycle closes the owner and its
descendants, releases capabilities, clears its slots and delivers its normal
cancelled applet result. Late capability completions cannot reach it.

`completeApplet` normally resumes its caller. In this route its result passes
through `showRuntimeHome` in the same reducer operation, so the caller remains
suspended and HOME remains visible. No intermediate caller frame is painted.
For Notes entered from HOME with no caller, the application slot is still
preserved; a later HOME press can resume that application. Other titles retain
their existing HOME toggle behavior. Sleep blocks HOME input as before.

The LCD capture cache belongs to the application instance, not the Notes
instance. Dismissing Notes preserves that valid frozen pair and its generation;
closing the application releases both surfaces. This is not permission to
reuse future Notes-owned title metadata across Notes instances.

## Verification

- `notes-home-owner-exit.test.mjs`: five passing checks for empty/parent/no-caller
  routes, fresh reopening, late completion rejection, other-title resume, sleep
  and invalid input time.
- `notes-suspended-capture.test.mjs`: seven passing checks, including both Notes
  entry routes retaining application capture identity and releasing pixels when
  the application closes. Existing source UV/pixel checks pass.
- Combined owner/capture/switch/native-session run: 25 pass, zero skips.
- Source verifier: 18 source assertions, 18 hashed executable ranges and hashes
  for all 31 existing title-panel specimens pass. No new panel pose is claimed.
- Typecheck passes. Full suite in this skip-smudge checkout: 1095 pass, 39 fail,
  21 skip; failures are model/GLB checks against LFS pointer files.
- Default build encounters Turbopack's outside-root `node_modules` symlink
  restriction. The webpack fallback encounters the existing missing WGSL
  loader configuration. A production build remains for the hydrated integration
  environment; neither failure concerns the changed reducer.

Artifacts are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/notes-home-owner-exit/`.
The coordinator owns live browser verification after integration; this isolated
worktree did not operate the browser or change integration files.

## Camera route investigation — 26 September 2026

**Decision: no runtime fix.** The coordinator's browser observation at
`8f0eb39` matches the deliberate second-HOME retirement boundary introduced by
`34ebf75`; it does not establish a new resume regression. This does not establish
that the browser's two-press exit placement matches native behavior.

The coordinator observed: open Camera → `h` suspends Camera → Open Game Notes
shortcut → A opens the editor → touch Switch twice → `h` shows HOME with Camera
suspended → another `h` leaves HOME and its accessibility text unchanged → A
resumes Camera. The second `h` changes invisible owner state: it closes Notes,
clears its `homeReturn` and system-applet slot, and preserves Camera suspended.
The generic control label, “HOME: Suspend or resume”, does not describe this
Notes-specific retirement action. That wording is an accessibility limitation;
it is not evidence that the input was ignored.

A pure state/input reproduction at `661cd4d` used `launchHomeShortcut` for Camera
and Notes, `dispatchSystemEvent` keyboard down/up phases for A/HOME, and touch
down/up at `(252, 226)` for Switch. Camera settled after 3000 ms of ticks;
Switch touches were separated by 500 ms and advanced the capture mode
Double → Up → Down. Native HOME controls were tested both enabled and disabled.
Both runs confirmed:

- First HOME after editing suspends Notes and retains it as `homeReturn`.
- Second HOME retires Notes, leaves Camera suspended and selected, and stays HOME.
- From that same state, either a third HOME or A resumes the original Camera
  owner. The third-HOME result is reducer evidence, not an observed browser step.

Existing `notes-home-owner-exit`, `notes-capture-switch` and
`notes-suspended-capture` tests pass **17/17**. They already cover no-caller Notes
entry, later HOME resumption, Switch routing and application capture retention;
no runtime patch or duplicate regression test was added.

The accepted source trace above supports Notes owner destruction after completed
exit. It does not establish the browser's first-suspend/second-retire input
placement or native transition timing. Those remain adaptations pending an
implemented and matched native exit sequence.

The coordinator's private
`reference/scenario-matrix/v1/captures/notes-grid-browser-smoke-20260926/browser/`
under the firmware artifact root contains the initial Notes grid only; it is
not a capture pair for this final HOME state. Later flow observations are
coordinator-inspected screenshots. No matched native pair, mask or diff report
is available because native input remains blocked. No native acceptance or
scenario pass is claimed. L4 did not operate either UI session.
