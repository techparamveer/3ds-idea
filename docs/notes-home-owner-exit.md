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
