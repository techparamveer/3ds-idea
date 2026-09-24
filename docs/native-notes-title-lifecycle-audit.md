# Game Notes title lifecycle and scene-manager audit

The published icon and title specimens are usable source components, but the
live title panel remains disabled. This pass resolves manager dispatch and
update/draw ordering. It does **not** establish the complete applet startup,
resume and suspended-owner timeline needed to connect those components without
inventing timing. It follows [icon/panel validation](native-notes-icon-panel-validation.md)
and [local controller semantics](native-notes-title-controller-followup.md).

## Source identity and method

All addresses refer to Game Notes `code.bin` loaded at `0x100000`, SHA-256
`8a2feea02c2a6ef62c8a8d3e4cc20faa5639fe5af47d3876f8a5d3ea43064cc6`.
The analysis is static; no executable firmware was run. Thirteen bounded
annotated listings and their byte-range SHA-256 hashes are retained under the
private firmware SSD artifact root in `reference/notes-title-lifecycle/`.
`source-validation.json` additionally checks the original vtable pointers:
scene 3's update slot +0x24 points to `0x168454`, and event slot +0x60 points
to `0x166f84`. The callback table at `0x1b6a50` points to `0x162c28`.

## Manager ordering is not a render-driven clock

`0x161ce0` returns the manager at `0x1d0cbc`. The following operations have
different semantics:

| Operation | Source behavior |
| --- | --- |
| Dispatch `0x14f78c` | Immediately calls the selected scene's vtable +0x60 with event and parameter. There is no queue in this routine. |
| Update request `0x151ca4` | Writes pending value 1/2 into manager +0x40's per-scene byte array. |
| Draw request `0x151c78` | Writes pending value 1/2 into manager +0x44's per-scene byte array. |
| Priority assignment `0x151c50` | Calls `0x168a44`, moving the scene into one of nine doubly linked priority lists. |

In the manager pass, pending update requests call `0x15e950`, which changes
scene +0x68 and invokes its enable/disable callback. Pending draw requests
change scene +0x69. The pass then clears both request bytes
(`0x104838–0x104a3c`). A request made after this section cannot take effect
through this section until a subsequent pass; an immediate event can already
have changed a controller.

Next, priorities 0 through 8 are traversed. Within each priority list the
manager walks to its +0x64 end and then follows +0x60. Scenes with nonzero
+0x68 receive their update callback +0x24 (`0x104a40–0x104ad4`). Drawing
later traverses priorities 8 through 0 in the opposite linked-list direction,
checks +0x69 and invokes callback +0x58 (`0x104b68–0x104c3c`). There are
separate draw paths/arguments; this trace does not identify them as a browser
frame cadence.

The initialization callback assigns scene 2 priority 3, scene 3 priority 4,
scene 1 priority 6, and scenes 4/5 priority 8; scenes 6–9 and 11–13 are moved
to priority 0 (`0x162c28–0x162cfc`). Thus scene numbers are **not** the update
order. The relative order within a shared priority also depends on insertion.
No simple ascending-scene loop is an equivalent port.

## Initial title start precedes note selection

`0x162cfc–0x162d1c` derives the event-0 parameter: it is 1 if context
`0x1f3024` +0x44 equals 5, otherwise it reads that context's byte +4 through
`0x196700(context, 0)`. The semantic meaning and writers of this startup
state are not proven by this slice; it must not be labelled a browser
"resumed" flag just because it branches during initialization.

The callback immediately sends scene-1 event 0 with that parameter, requests
its update/draw enablement, then does the same for scene 3
(`0x162dbc–0x162e48`). It proceeds to initialize/enable scene 8. There is also
a different callback path which sends scene-1 and scene-3 event 0 with literal
parameter 1 (`0x162860–0x162890`). That path is reached from callback argument
1 equal to 6 and argument 2 equal to 3 (`0x1626f8–0x162828`); naming it HOME
resume requires tracing its caller, not guessing from the constants.

For scene-3 event 0, a nonzero parameter sets scene state +0x3c0 to 1. If
suspended software is available, execution reaches `0x167518`. There, state 1
and availability enable both display indicators and start title slot 0 with
reset=1, disable-siblings=1, direction-selector=2 (preserve direction), then
write title phase +0x3c2=0. The zero-parameter branch uses scene state 2 and
does not take that title-start condition. These events do not wait for a
selected note.

The title phase is checked before controller advancement inside scene 3's
update. Its established InOut → Stay → reverse-InOut sequence has an
independent animator and advances by 1.0 per source update. Other scene-state
branches converge on the title update at `0x168698`; the manager's update
enablement, rather than whether the browser is drawing a selected note,
controls whether that advancement is reached.

## Note open, switch and HUD return

The selected-note action at `0x13c888–0x13c974` immediately sends scene-2
event 1 with the selected slot; if software is available it then sends scene-8
event 2; it always sends scene-3 event 9 and sets the list's state to 3.
Event 9 starts the HUD forward. It is not the event-0 title-start path.

The mode-switch path at `0x1637ac–0x1637c4` sends scene 3 the mode-indexed
event. The previously traced events 1/2/3 choose Double/Up/Down indicators and
restart/preserve the independent title InOut clip according to its busy state.
Consequently a switch can overlap an existing title phase. The title and
Switch/HUD clips must retain their separate `G_Panel_01` / `G_Panel_00`
bindings.

A return path at `0x165228–0x1652c4` changes manager/context state, starts a
separate scene controller, dispatches scene-1 event 1, then tail-dispatches
scene-3 event 8, which starts the selected HUD in reverse. The enclosing
conditions and completion callbacks are not fully mapped to the current
UI-only Back action. Dispatching event 8 is established; claiming its exact
browser Back/reset schedule is not.

## Concrete integration gaps

Current `stock-apps.ts` advances `captureSwitchElapsed` only in Notes'
`drawing` screen, settles it on back/suspend/sleep, and exposes that value as a
Switch pose. It has no independently running title or HUD controller, list
initialization epoch, pending scene flags or source callback ordering. Starting
a new title timer when a note is selected would be wrong for the proven
nonzero initialization branch; settling it on every back/suspend is unproven.

`notes-suspended-capture.ts` safely owns a copied LCD pair by application
instance and generation. It releases on owner replacement/close and converts
only the frozen generation. It does not bind the suspended owner's original
SMDH metadata or Notes icon. `native-title-assets.ts` currently loads renderer
packs/fonts rather than making that metadata part of a frozen capture record.
An asynchronous title/icon result therefore cannot safely be attached solely
to "the currently open Notes screen"; its application identity and capture
generation need validation at binding time, with rejection after replacement
or disposal. Missing captures, source metadata and unsupported portfolio
owners also need explicit states rather than a fabricated title.

Before enabling the live panel, the remaining bounded work is:

1. Trace the startup-context writers and callback caller for the literal-1
   reinitialization path, including applet entry, exit, HOME return and sleep.
   Establish the controller epoch and whether the scene object survives each.
2. Trace the selected-note return path's enclosing conditions and scene-8
   completion effects, and record the exact point of each event relative to
   pending flags, scene updates and drawing. Verify overlapping mode switches.
3. Port that ordered lifecycle with owner/generation-safe metadata loading,
   then verify event traces and combined source frames for initialization while
   on the list, immediate/delayed note open, switch during each title phase,
   Back, resume and owner close/replacement. Map browser elapsed time to source
   updates explicitly; the local float step does not itself prove wall time.

The seven validated stock descriptions avoid the native overflow branch.
They do not validate general truncation/wrapping or metadata for portfolio
applications. System Transfer's literal source `???` remains unsuitable for a
claimed accepted title panel.

## Verification and scope

The source SHA, 13 bounded range hashes and three callback/vtable pointers
were checked against the original bytes. All 11 existing Notes capture/switch
tests pass, including capture ownership through HOME, applets, resume, sleep,
close and instance replacement. Those tests do not exercise a live title
controller. The 31 previously validated source title specimens remain
component evidence; no new combined lifecycle frame is claimed.

This is a documentation-only audit. No runtime, delivery manifest, browser,
integration checkout, audio, editable Notes or keyboard behavior changed.
No application build was needed. Strict live 1:1 title/HUD acceptance remains
open for the specific lifecycle and binding gaps above.
