# Game Notes accepted HOME exit and metadata entry boundary

The previously missing accepted-HOME link is resolved: **scene 9 handles the
permitted HOME hooks before the concrete manager callback runs**. Its callback
starts the staged applet exit, whose completion reaches scene/capture teardown
and the HOME system-applet destination. The prior audit correctly identified
the manager overrides, but had not traced every scene's hook.

This narrows [the interruption audit](native-notes-sleep-reentry-source-audit.md)
without enabling the live title panel. The remaining work is an ordered
controller and owner-bound metadata integration, plus the entry-context branch
coverage described below. The existing 31 title specimens remain component
proof, not a live lifecycle implementation.

## Accepted HOME is mediated by scene 9

All addresses use original Notes executable SHA-256
`8a2feea02c2a6ef62c8a8d3e4cc20faa5639fe5af47d3876f8a5d3ea43064cc6`
at base `0x100000`. The source chain is:

1. For pending HOME bit 1 and manager +0x2dc equal to 1,
   `0x10730c–0x10733c` invokes **every** scene's virtual +0x34. It does not
   check each scene's update flag. The bit-2 path similarly invokes +0x38.
2. The scene factory's index-9 table entry at `0x13aae0` selects `0x13aba8`,
   which constructs `0x13bc1c`. That constructor installs vtable `0x1b6890`.
   Its +0x34 is `0x13b838`; +0x38 is `0x13b810`.
3. Both functions call `0x14f6ec`, then immediately emit manager callback
   **(scene 1, event 2, parameter 0)** through `0x151928`. They are not the
   scene-3 no-op hooks examined previously.
4. The active callback `0x1626f8` handles that pair at `0x1628bc`. It sets
   sleep-query inhibition, clears manager +0x2dc, inhibits the HOME indicator,
   queues update disablement for scenes 4, 5, 1, 3, 2, 6, 7, 8, 11 and 0,
   then immediately sends event 1 to scenes 9 and 10.
5. Scene-9 event 1 at `0x13b518` enables that scene's update and draw flags,
   sets its pending state to 2 and clears its current state. On its next
   update, state 0 starts controller +0x2c4 slot 1 with reset=1,
   sibling-disable=1 and direction-selector=2. The resource table at
   `0x1aa248` and registration at `0x13b6e8` identify slot 1 as
   **`ApltBoot_D_00_SceneOut.bclan`** (slot 0 is SceneIn).
6. Scene-9 state 2 waits until slot 1 is no longer busy and the additional
   storage/status gates pass (`0x13b964–0x13b9c4`). It disables its update and
   emits **(scene 9, event 2, parameter 0)** at `0x13b9dc–0x13b9ec`.
7. That callback takes `0x1627fc–0x162810` and writes manager +0x2ec=0 at
   `0x162a88`. The main loop therefore ends and reaches the previously traced
   scene destruction and release of three capture buffers and the icon.

A subtle ordering matters: the scene hook clears +0x2dc before the dispatcher
later loads it for the concrete manager +0x2c/+0x30 call. The exit callback has
already inhibited scene 11. The manager's later indicator dispatch is therefore
not evidence that this accepted route was rejected. The original native code
uses ordered side effects here; inspecting the manager callback in isolation
loses the exit.

This accepted route cannot resume the old title controller after it completes.
The earlier rejected/unavailable route and the sleep fence remain different
cases: sleep preserves scene-3 state, whereas completed accepted HOME exit
releases it.

## Final destination is explicit

After teardown, main loads destination `0x101` at `0x102280`, calls
`0x105a6c`, then tail-calls `0x1057b8` with zero argument pointer/length.
The former reaches `0x108e10` with command header `0x190040`; the latter
reaches `0x108dc0` with `0x1f0084` and the same destination. These headers
match PrepareToStartSystemApplet and StartSystemApplet in the public
[libctru APT command implementation](https://raw.githubusercontent.com/devkitPro/libctru/master/libctru/source/services/apt.c).
This cross-check names IPC constants only; the native Notes call chain above
establishes behavior. No APT call was executed.

## Metadata is acquired for the application slot before scene startup

Native entry allocates three 0x60000-byte buffers and a 0x2000-byte icon buffer
through `0x103548`, clears availability +0x131, and initializes selected note
to -1. The captured-software branch at `0x1017e8–0x1018f4` then:

1. Checks the incoming context (+0xc/+0x10) before attempting acquisition.
   The exact numeric predicates are retained in the source listing; this pass
   does not rename every incoming parameter case as the same startup route.
2. Receives a 0x20-byte capture record through `0x105700`. On success,
   `0x15f51c` copies its three source buffers into the new owned allocations,
   then entry marks +0x131 available. A failed capture acquisition clears it.
3. Queries application ID `0x300` through `0x161104`, obtaining the title
   identity and media byte. It reads the matching 0x36c0-byte `icon` payload
   through `0x1053a0`. An error branches to entry failure; it is not a reason
   to display stale title metadata.
4. Calls `0x103608` with this payload to populate the expanded icon and long
   description, before the later scene initialization. The conversion also
   queries application `0x300`; it does not derive the title from the Notes
   applet ID or a selected HOME label.

The allocations and copy belong to one Notes context. Sleep does not re-run
this entry code in the traced fence. Completed accepted HOME exit frees them.
A subsequent entry must acquire a fresh context and title rather than keep the
old panel's clock or icon. The supplied entry predicates' upstream writers and
all no-capture/error cases still need a complete route fixture before claiming
full native startup coverage. The source makes two application identity queries;
it is not evidence of an atomic browser metadata transaction.

## Concrete browser ownership mismatch and integration contract

At integration `3698dae`, `showRuntimeHome` suspends an active Notes owner and
stores it as `homeReturn`. Pressing HOME again calls `resumeRuntimeApplication`
and resumes that same owner. In contrast, invoking Notes via
`invokeSystemApplet`/`openApplet` completes the previous system applet and makes
a new owner. A focused state probe confirms both routes. The application-only
`launch` same-title shortcut is **not** a Notes route.

Consequently, a title controller cannot simply inherit the generic HOME toggle
behavior. It needs a Notes-specific completed-exit boundary, while retaining
the suspended application's separate owner. Closing Notes must not close that
application or discard its valid frozen LCD pair. Sleep must retain the panel's
phase instead of imitating an exit/reentry.

The existing loader only validates the pack/font subset of title metadata.
The capture cache has application owner/generation, while the native session
has the foreground Notes owner. A live acquisition must snapshot both plus
title ID, source SMDH identity, content identity and selected manifest resources.
On asynchronous completion it must confirm that both owners and the capture
generation still match, then publish description/icon and the paired LCDs
consistently. A same-title new application is a new owner. Unsupported SMDH
(including portfolio apps with none) must remain unavailable; use neither a
HOME short label nor the native scratch placeholder as a title substitute.

The later [HOME owner correction](notes-home-owner-exit.md) fixes the specific
second-HOME same-instance resume route. The observations above describe the
pre-correction integration baseline; native exit timing and title scheduling
remain separate work.

## What still prevents enabling the live panel

The title's static pixels are available in the
[31 validated specimens](native-notes-icon-panel-validation.md). Their seven
supported descriptions fit the source rectangle, and their icon masks and
independent group bindings are already proven. This pass does not invalidate or
regenerate them.

The live painter still hides `W_TextPanel`, starts selected-note presentation
from settled poses, and does not request the title/HUD animations. The reducer
has only the switch elapsed time; it changes drawing/list immediately and
settles switch motion on sleep/suspend. The native flow starts the independent
title before note selection and overlaps it with HUD, switch and return clips.
A complete implementation must replace those shortcuts as one tested ordered
controller, including the newly resolved accepted exit and separate sleep case.
Unhiding a Stay specimen or resetting on note-open would invent the sequence.

Remaining bounded implementation work is therefore:

- Port the ordered list/open/return/HUD/title and applet-exit transitions, with
  deferred scene flags and independent clocks, and verify combined source frames.
- Wire the Notes completed-exit owner boundary into HOME return/reentry without
  affecting the suspended application; cover incoming context/failure cases.
- Load and publish owner-bound SMDH metadata/icon with explicit unavailable and
  stale-completion cases. Validate sleep and reopen races before exposing it.

## Verification

Private artifacts live under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/notes-accepted-entry/`.
`verify.py` passes 18 pointer/string/branch assertions and hashes 18 bounded
source ranges. It also records hashes of all 31 existing PNG specimens.
`browser-state-probe.json` records the pure current-runtime HOME-toggle and
Notes-toolbar owner difference; it is not a browser screenshot or native oracle.

All 19 existing session/capture/switch tests pass. They establish their existing
contracts, not an implemented native title controller. Documentation links and
`git diff --check` pass. No browser, integration files, firmware execution,
editable Notes or audio were touched. The accepted HOME source gap is resolved;
strict end-to-end title/HUD fidelity remains unimplemented.
