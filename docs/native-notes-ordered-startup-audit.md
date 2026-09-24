# Game Notes startup and HUD dispatch ordering

The owner-bound metadata path is now present, but a live title panel is still
unsafe to connect to the existing immediate list/drawing adapter. This audit
resolves **where initialization occurs within the manager pass** and the
asymmetry between opening a note and returning from it. The panel remains
hidden; no timer or source pose is substituted for the missing scheduler.

This follows the [metadata lifetime](notes-metadata-lifecycle.md),
[accepted HOME](native-notes-accepted-home-entry-audit.md),
[startup/return](native-notes-startup-return-followup.md), and
[scene-manager](native-notes-title-lifecycle-audit.md) traces. Their resolved
ownership, persisted-history and sleep facts are not reopened here.

## Initial event occurs before the first relevant scene update

The native manager has a pending state selector at +0x54. Its state-change
section `0x1046f4–0x104788` constructs the selected state, stores it at +0x4c,
and calls `0x15e9e4` at `0x104778`. That helper invokes the object's virtual
+0x2c. For the concrete Notes active state, vtable entry `0x1b6a50` is
`0x162c28`, the previously traced initialization callback.

This call precedes the same manager pass's pending update/draw requests and
priority traversal. Thus its immediate scene-3 event 0 and queued scene-3
enablement are **not** an event issued after the first update or at note open.
The subsequent pending-flag stage can apply those requests before priority 4
reaches scene 3 in that pass.

For the established nonzero persisted-history branch with suspended software,
event 0 starts title slot 0 at `0x1675a8`, setting its phase to 0. The later
scene-3 update examines the phase, then advances that independent controller
by 1.0 at `0x168790`. This establishes a source-update boundary; it does not
establish browser download latency, source wall-clock rate or when a user first
sees the title through the applet introduction.

The persisted-history zero/tutorial route remains distinct. It must not be
silently converted into the nonzero branch by labelling every browser entry
"resume". The existing portfolio omits editable Notes and firmware persistence;
any fixed first-use choice is an adaptation that must be explicit.

## Open and Back do not share the same update position

The scene-1 factory entry selects constructor `0x13dde4`, whose vtable
`0x1b6904` binds update +0x24 to `0x13d8f4`. Its state-0 update calls
`0x13bea0` at `0x13d9a4`. The selected-note path within that routine sends
scene-2 event 1, optionally scene-8 event 2, and scene-3 event 9 at `0x13c968`.
This completes the missing list-update-to-HUD call chain.

The active initialization gives scene 2 priority 3, scene 3 priority 4, and
scene 1 priority 6. The manager traverses increasing priorities. Combined with
the already proven immediate dispatch and return path:

| Bounded source route | Relevant order in the manager pass | Controller consequence |
| --- | --- | --- |
| Nonzero initialization with software | State initializer → pending flags → scene 3 update | Initial title starts before its first +1 advance. |
| Selected-note open in scene 1 state 0 | Scene 3 update → scene 1 update → event 9 | HUD forward is reset **after** its advance opportunity in that pass; its next advance is in a later scene-3 update. |
| Bounded scene-2 return | Scene 2 update → event 8 → scene 3 update | HUD reverse is reset **before** its advance opportunity in that same pass. |

Events 8/9 start the selected HUD slot at `0x167330`/`0x1673ac` with reset,
reverse/forward respectively. The current source HUD clips have 21 frames, so
those resets select frame 20/0. The table above concerns stored controller
frames, not a claim that the first rasterized HUD image is exactly frame 19/0.

That distinction matters. Scene-3's update tail calls layout virtual +0x34
through `0x14f7cc`, or its selected pane callbacks, after controller advancement.
Its draw method `0x1675dc` runs a captured-software callback `0x167634` which
switches the left/right capture visibility, then uses shared draw `0x14e030`.
The capture callback itself does not advance title/HUD time. The exact combined
animation application and matrix/material publication after a late event must
be verified before turning the controller-order table into a pixel oracle.
A timer started identically on every browser command would already violate the
proven update ordering, even before that raster question.

## The applet introduction is concurrent

Initialization also sends scene 9 event 0 and enables its update/draw. Event 0
sets current state 0 and pending state 1 (`0x13b488–0x13b514`). On its update,
scene 9 starts controller +0x2c4 slot 0 with reset at `0x13b8e0`; the resource
binding previously established in the HOME trace identifies this as
`ApltBoot_D_00_SceneIn`. It advances independently at `0x13bbec` by 1.0.

When slot 0 is no longer busy, its state-1 branch directly clears scene 9's
draw flag at `0x13b93c`, changes manager +0x2dd, and proceeds through the
status/tutorial continuation helper. Scene 9 is priority 0, ahead of scene 3.
Consequently, the title clock's start cannot be delayed to "after applet intro"
without evidence. Both are initialized for the active pass and have separate
controllers. This does not claim that the lower applet introduction covers the
upper title or that all introduction/status branches share a single duration.

## Concrete browser integration boundary

At base `40b0539`, the metadata helper correctly binds a selected SMDH/icon and
LCD pair to Notes owner, application owner and capture generation. It synchronizes
before painting and rejects retired owners. That resolves acquisition ownership;
it does not establish the first source-controller update.

The live Notes module still changes `main`/`drawing` immediately, advances only
`captureSwitchElapsed` while drawing, and settles that switch on Back/suspend/
sleep. Main currently uses the tutorial-style upper presentation; drawing uses
settled capture slots. There is no ordered manager-equivalent initialization,
list/open/return scheduler, intro controller or independent title/HUD clock.
Native screen readiness currently checks the view-pack session, while the hidden
metadata request can still be pending after that session becomes ready.

The next implementation needs one coherent boundary:

1. Define the UI-only entry branch and explicit unavailable metadata/capture
   behavior. Preserve the original no-software route; do not use a title-label
   fallback or treat missing browser SMDH as successful native acquisition.
2. Complete required pack/font/metadata acquisition before starting the selected
   source initialization sequence. Starting at network completion after an
   already-running title timer, or restarting on note selection, is incorrect.
3. Port immediate events, pending enable/disable flags, relevant scene priorities,
   independent controller updates and layout application in order. Include the
   concurrent intro and the open/return asymmetry above.
4. Verify combined list/open/switch/return specimens with immediate and delayed
   selection, then sleep and close/reopen ownership. Only then connect the
   title's `G_Panel_01` pixels to the live upper LCD.

The existing 31 component specimens continue to prove original glyph fit,
icon sampling and isolated poses. They cannot choose any of these missing
live-frame gates. Re-rendering them would not establish the new ordering.

## Reproducible evidence

`scripts/verify-notes-startup-order.py` takes absolute `--code`, `--listing`,
`--asset-root` and `--artifact-dir` paths. It verifies the original Notes SHA-256,
40 vtable/call/instruction/resource assertions and writes 16 bounded source
listings with byte-range hashes. It reads firmware bytes without executing them.

Artifacts live at
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/notes-ordered-startup/`.
All 36 existing metadata/owner/capture/switch/session regressions pass. This
commit changes only the audit and static verifier, so no app build or new
render is required. No integration checkout, browser, app state, title pixels,
audio or firmware storage was changed. Live native title/HUD fidelity remains
open for the specific scheduling and publication boundaries above.
