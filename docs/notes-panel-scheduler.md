# Bounded Game Notes title/HUD scheduler

`src/os/notes-panel-scheduler.ts` ports the proven stored-controller subset of
the [ordered startup trace](native-notes-ordered-startup-audit.md). It is not
imported by the live renderer. The native title panel remains hidden because
layout application and the surrounding source scene gates are still incomplete.

## Implemented boundary

The explicit `nonzero-history` entry requires ready metadata matching the Notes
owner, suspended application owner, capture generation and title ID. The paired
capture identity and live 64×64 icon are checked again before every update.
Required assets must be ready before initialization. This aggregate readiness
must include the packs and font if a future caller integrates it. Metadata
loading, unavailable content, missing capture and the unported zero-history
tutorial route never start the clock. No firmware history value is fabricated.

The module borrows metadata; it does not acquire or dispose it. A changed owner,
capture generation, title, metadata resource or startup branch invalidates the
command ticket. Disposed icon bytes invalidate an existing controller on its next
step. Sleep and temporary pack loss freeze an initialized controller without
replaying event 0. Paused commands are dropped, not queued. This is browser owner
safety around the previously established native pause/lifetime boundary.

Each explicit step represents one source manager update, not a millisecond or
browser paint. The supported commands model already-accepted native events; they
do not decide whether the source list/drawing scene currently accepts input.
The caller must eventually supply those gates. Concurrent commands in one pass,
tutorial events, early title-reverse events 5/6, introductory scenes, lower return
animation completion and scene enable/disable requests are outside this subset.

## Exact controller facts

| Rule | Original source |
| --- | --- |
| Event 0 starts InOut before first scene-3 advancement | `0x167518–0x1675b0`, manager initializer `0x104778` |
| Open/event 9 arrives after scene 3; Back/event 8 arrives before it | list priority 6 vs scene 3 priority 4 vs write priority 3; `0x13c968`, `0x165228–0x1652c8` |
| HUD/switch completion checks precede title phase checks | `0x168454–0x168698` |
| Phase checks precede +1 advancement | `0x168698–0x1687a8` |
| InOut 21 frames; Stay 121; HUD 21; Switch 26; all nonloop | original `memo-ImageScreenUp-arc-l` resources |
| Stay completion writes InOut frame **30**, then reverses without reset | `0x168710–0x168738`, constant `0x168868` |
| Reverse only clamps at zero; forward clamps at last authored frame | `0x152508–0x152658` |
| Mode retrigger checks both title slots; busy retains InOut frame, idle resets; both force forward | `0x1674a0–0x16750c` |

The unusual frame-30 reverse matters. During reverse, controller frames 21–30
remain valid stored values even though the clip's authored last frame is 20.
A switch during reverse frame 29 forces forward; the next busy test immediately
selects Stay, leaving the now-disabled InOut frame at 29. A switch during Stay
similarly retains disabled InOut frame 20 and starts Stay again in that update.
Neither case is equivalent to unconditionally restarting the title at zero.

The scheduler returns immutable observations before scene 3, after scene 3 and
after the list scene. Event 8 therefore stores HUD frame 20 then advances to 19
in its pass; event 9 stores frame 0 after that pass's advance opportunity.
These are **controller observations, not applied poses or reference screenshots**.

## Remaining pixel-publication blocker

Scene 3's update tail calls layout virtual +0x34 via `0x14f7cc` or individual
pane callbacks. Its draw path `0x1675dc` runs the capture visibility callback
`0x167634`, then shared draw `0x14e030`, which reaches layout virtual +0x5c via
`0x14f7e8`. The exact animation application/matrix/material publication across
that sequence is not yet proven, particularly after event 9 arrives late.
The scheduler intentionally has no `appliedPose` output or source-panel binding.

Before live connection, resolve those virtual methods and their concrete layout
objects, port the necessary scene enable/input/intro/return gates, establish the
browser-to-source update clock, and verify the composed ordered frames. The 31
existing component specimens prove glyph/icon/isolated-pose behavior; regenerating
them cannot validate the missing publication order. No new pixel specimens or
browser fidelity claim are made by this commit.

## Verification

The 17 focused scheduler tests cover resource lengths, acquisition barriers,
phase boundaries, Open/Back asymmetry, five switch retrigger boundaries,
completion timing, pause/reload, owner/capture/title replacement, retired tickets,
bad or disposed metadata and immutable observations. Existing Notes metadata,
capture, switch and HOME owner regressions also pass (45 tests total). Typecheck
passes.

The static verifier `scripts/verify-notes-startup-order.py` now pins 63 original
source/resource assertions and 23 byte-hashed disassembly ranges, including the
busy/start/advance helpers and retrigger branch. It reads but never executes
firmware. New outputs are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/notes-panel-scheduler/`.
