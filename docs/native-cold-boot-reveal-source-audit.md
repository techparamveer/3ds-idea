# Cold boot, common fade and power sequence source audit

The current browser boot **already fades HOME in**. Its common SceneIn is a
source clip, while the three-second wait and final 350 ms mapping are browser
choices. This audit corrects the ambiguous earlier statement that cold boot
"opens HOME directly": it opens without the app-launch Nintendo logo sequence,
not without a fade. No runtime timing or visible artwork is changed because
the exact cold-start caller and physical display sequence are not yet proven.

## Evidence and current implementation

This isolated pass starts at integration `b644694`. It reads original EUR HOME
`code.bin` at base `0x100000`, SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
The analysis is static. Raw executable bytes and annotated listings remain on
the private firmware SSD, not in public delivery.

The current implementation is visible in
[`native-system-presentation.ts`](../src/os/native-system-presentation.ts),
[`system-transitions.ts`](../src/os/system-transitions.ts), and
[`system.ts`](../src/os/system.ts):

| Browser behavior | Actual mapping |
| --- | --- |
| Normal boot | 3000 ms phase. Source SceneIn frame 0 is held through 2650 ms; frames 0–20 are mapped over the final 350 ms. |
| Reduced-motion boot | 300 ms phase, with a 120 ms final fade. |
| Power options | `Slp_*_SceneIn` or `SceneInApp`, with the existing source messages. |
| Shutdown | `Slp_D_00_Decide`, common SceneOut starting at elapsed 180 ms, virtual power off at 550 ms; reduced motion uses 120 ms total. |
| App opening | Matching common and logo A/B/C clips, with a fixed browser B hold. |

These are implementation facts, not measured hardware timings. The source
clip's filename does not establish which startup route invokes it. Firmware
layout alpha also does not establish when the physical LCD backlight or blue
power indicator changes.

## Common SceneIn resources are paired and bounded

The converted `CmnFadeNinLogo_U_00_SceneIn` and
`CmnFadeNinLogo_D_00_SceneIn` each declare 21 frames, non-looping, bound to
`G_Scene_00`. Each has one Hermite alpha track on `P_00`, with zero-slope keys
at frame 0 / alpha 255 and frame 20 / alpha 0. The corresponding SceneOut
clips reverse those endpoints. There is no authored three-second hold in
these four clips, nor an upper/lower delay between their matching tracks.

This establishes the available fade poses. It does not establish milliseconds,
startup eligibility, update-to-first-draw order, or that a console cold start
always chooses these layouts instead of the other common layouts.

## Native request dispatcher and completion are stateful

The original table at `0x32ea28` contains these validated pointers:

| Field | String pointer | Value |
| --- | --- | --- |
| +4 | `0x32741f` | `_SceneIn.bclan` |
| +8 | `0x32771e` | `_SceneOut.bclan` |
| +0x18 | `0x322b0a` | `CmnFade_D_00` |
| +0x1c | `0x322b17` | `CmnFade_U_00` |

`0x1e20d8` submits request kind 1 to `0x231ba8`; `0x1e2084` submits kind 2
and sets the common flag byte. The request includes screen selector, kind,
option, post-animation count, lower/upper layout names and a text pointer.
A selector of -1 covers both screen slots. Null supplied names use the table's
default `CmnFade_D/U`, which differs from the browser boot's explicit
`CmnFadeNinLogo_D/U`.

At `0x231d38–0x231d88`, the dispatcher combines the chosen layout name with
the SceneIn/SceneOut suffix and registers separate animation objects. Kind 1
starts the SceneIn object through virtual +0x10 at `0x231e28`; ordinary kind 2
starts SceneOut at `0x231e54`. Options 8/9 have another path, so kind alone is
not a full equivalent of every transition. Per-screen request state and pending
request storage are explicit; a new request is not simply a global elapsed
clock reset.

The completion pass `0x105860` is called from the shared pass at `0x1022b4`.
For state 1 it waits while the SceneIn object's state +0x14 is 1 or 2, then
calls virtual +0x18 and enters state 3. State 2 similarly checks SceneOut and
an optional other controller. State 3 decrements a per-screen count; a negative
count holds, and an expired count releases the layout and can dispatch its
pending request (`0x105954–0x105a50`). This confirms completion-dependent
ordering and retained state. It does not yet trace the animation object's
advancement and drawing relative to this pass to a hardware clock.

## Reveal callers differ by entry context

The routine containing `0x293940–0x293b08` branches on an object's byte +0x89,
source globals and another availability check. Several branches explicitly
request the `CmnFadeNinLogo_U/D` pair, while another requests `CmnFade_U/D`
with `lau_title_menu`. For example:

- `0x293aec–0x293b04` submits kind 1 with the explicit Nintendo-logo fade
  layout pair and option -1.
- The +0x89 value-3 path at `0x293ac0–0x293adc` submits kind 2 with option 8.
- A branch comparing another source value with `0x119` selects a different
  option/layout/text combination (`0x2939e8–0x293a44`).

These concrete differences prevent assigning every call the label "cold boot".
This pass has not proven the startup writer of +0x89, its relationship to
original-hardware cold entry, or the source-thread readiness conditions for
that entry. It would be inaccurate to infer a three-second delay, replace it
with 21/60 seconds, or add a Nintendo launch-logo splash from these calls.

## Power animation and physical power are separate evidence

The power resource constructor builds both `Slp_*_SceneInApp` and
`Slp_*_SceneIn`, plus `Slp_*_SceneOut` (`0x2c0830–0x2c0b5c`). The branch at
`0x2c0fb0–0x2c10e0` changes local state, checks source flags and submits kind-2
common requests. Some paths explicitly select `CmnFadeNinLogo_U/D`; others
supply null names and text. This is evidence of conditional source composition,
not a validated 180 ms Decide delay or 550 ms shutdown deadline.

A faithful complete power sequence still needs the selected power action's
callback joined through Slp completion, common fade completion, final screen
publication and display/power service calls. The panel resources alone cannot
prove screen-backlight order, indicator latency or a physical shutdown duration.
No service command is executed or added to this UI-only portfolio.

## Verification and next bounded task

Private evidence directory:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/boot-reveal-source/`.
`verify.py` confirms four literal bindings and the full structure/endpoints of
four source clips. `source-validation.json` records seven bounded source ranges
and byte hashes; all assertions pass. The three existing launch/overlay tests
pass. They cover their stated browser mappings, not native boot timing.

Documentation links and `git diff --check` pass. No browser or native capture
was driven, no firmware was executed, and no changed visual required a source
render. Existing [system UI verification](portfolio-power-transitions.md)
remains the evidence for fade raster equivalence.

The next trace should resolve the concrete cold-entry context writer, then
follow common animation advancement/draw order and physical display activation.
A separate power-action trace should establish the exact selected shutdown
route. Until then, the current startup and shutdown timings remain explicit
browser adaptations; there is no source-complete visible replacement in this
commit.

The [entry-context follow-up](native-cold-entry-context-source-audit.md) now
locates the owner-relative `+0x3a89` writers and their shared flag query, and
records predicate-dependent waits before reveal. It still does not identify
which flag values constitute an original-hardware cold start or establish
physical display order or a fixed startup duration.
