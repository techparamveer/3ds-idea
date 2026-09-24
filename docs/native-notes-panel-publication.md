# Game Notes pane application and matrix publication

Follow-up: [material sampling and list gates](native-notes-material-publication.md)
resolves material +0x20/+0x14, identifies render-leaf +0x68 targets, verifies
retained properties and traces the three-controller list-return gate.
[Composed publication](native-notes-composed-publication.md) then proves the
first applied ImageScreenUp title pose and Open→Back owner replacement. The
counts below describe this earlier pane-dispatch pass.

This trace resolves the concrete layout methods behind the two previously
unidentified virtual calls. It establishes an **update-time pane-property
application contract**, not a complete raster oracle. The scheduler and metadata
remain disconnected from live title pixels until the material/render-leaf and
surrounding scene gates below are verified.

## Concrete object chain

Scene 3 construction at `0x168884` calls the base scene constructor `0x14f148`.
That constructs the layout wrapper at scene +0xdc through `0x17b738`, installing
vtable `0x1b75e8`. The wrapper's virtual +0x40 is pane factory `0x17b58c`.

The ImageScreenUp initializer calls layout parser `0x14f970` at `0x167770`.
The parser dispatches the factory at `0x14fadc` and saves the first created pane
as wrapper +0x10 at `0x14faf8`. The resource has exactly one root, `pan1 RootPane`.
The factory's pan1 branch reaches constructor `0x145c40`, which installs vtable
`0x1b753c`. These are concrete bindings, not inferred Nintendo SDK method names.

The relevant vtable entries match for all five pane types in the factory:

| Virtual offset | Concrete method | Observed behavior |
| --- | --- | --- |
| +0x34 | `0x17a5d4` | Apply local animations, then conditionally recurse into children. |
| +0x38 | `0x179dec` | Visit enabled pane animation links; then material callbacks. |
| +0x54 | `0x17a3fc` | Enable/disable matching pane links; material callbacks; optional child recursion. |
| +0x5c | `0x179ec4` | Calculate local/parent matrices and derived alpha; recurse into children. |

The ImageScreenUp resource uses pan1, pic1, txt1 and wnd1. The matching bnd1
entries are also checked, although the upper layout has no bnd1 pane.

## Property sampling happens in the update apply traversal

`0x17a5d4` invokes virtual +0x38, then traverses children through +0x34. The
local method `0x179dec` reads each animation link's disable byte at +0x0e. For
an enabled link it invokes the bound animation's virtual +8. The original
animation object vtable `0x1b74cc` resolves that call to `0x179488`.

For pane transform tracks, that method reads the stored animation frame at
`0x179520`, evaluates keys through `0x1463c4` at `0x17954c`, writes the result
into the pane at `0x17955c` and invalidates relevant transform flags. Thus
advancing a controller frame and sampling its pane properties are distinct
operations.

Scene 3 advances controllers before its update tail. That tail either applies
the full root through `0x14f7cc` when scene state/dirty flag requires it, or
applies selected subtrees. The selected +0x358 subtree is **W_TextPanel**, proven
by the lookup at `0x167b8c` and store at `0x167ba0`; it contains the icon, title
and indicator children. Even the idle branch applies that title subtree at
`0x168828–0x168838`. The independent title clock does not stop merely because
the scene's primary state becomes idle.

## Late Open is not immediate pane sampling

The software branch of event 9 starts the HUD controller at `0x1673ac` and
exits directly at `0x1673b8`. Controller start `0x14efec` changes direction,
link enablement and frame reset. Its reset helper `0x14e830` writes only the
animation frame. The pane enable helper writes the link disable byte; it does
not invoke the pane sampler.

As previously established, event 9 arrives from the priority-6 list after the
priority-4 scene-3 update. Therefore the newly reset **pane track** values are
not sampled by that already-completed scene-3 apply traversal. The next enabled
scene-3 update advances the HUD and reaches the apply traversal. Back/event 8
arrives before scene 3, so its reverse start participates in that pass's advance
and apply. This closes the earlier uncertainty about what the root +0x34 call
does. It does not certify a complete first visible HUD image.

## Draw-time +0x5c is matrix and alpha work

Shared draw calls `0x14f7e8` at `0x14e0d8`. That wrapper dispatches the root
pane's concrete `0x179ec4`. The method uses pane transform fields, combines
local/parent matrices through `0x134ee0`, writes derived alpha at `0x17a190`,
and recurses through child +0x5c. It does not call the pane animation-link
sampler. The captured-software callback before this still only selects left or
right capture visibility.

The later rendering traversal is a **third** stage: `0x197924 → 0x17b480 →
0x198144`, whose leaf dispatch is virtual +0x68. Resolving +0x5c must not be
mistaken for auditing every render-leaf/material operation.

## Remaining integration gates

The list update clears its input accumulator via `0x150e10` when scene flags
+0x6a/+0x6b disallow input (`0x13d934–0x13d948`). Only state 0 calls the
selected-note routine. An accepted note index is 0–15; the route clears +0x6a,
starts list transition controllers, sends write/event 1 and title/event 9, then
stores list state 3. The pure scheduler intentionally accepts already-approved
events; it does not yet reproduce this input gating or the transition states.

The lower intro remains an independently updating priority-0 scene. Its
completion affects manager/status/tutorial continuation; it cannot be replaced
with a title timer started after intro. The previously traced return branch
dispatches title/event 8 before its lower SceneOut finishes. Live wiring still
needs those scene enable/disable and completion boundaries around the current
immediate browser `main`/`drawing` adapter.

Before live connection, finish these concrete pieces:

1. Trace material virtual +0x20 enable and +0x14 apply callbacks and render leaf
   +0x68 for the relevant pane subclasses. The pane sampling contract above
   does not assert that material values are applied at an identical boundary.
2. Reproduce initial applied values, then retain sampled pane/material values
   across disabled slots. A current controller snapshot alone is not an applied
   layout: disabled tracks leave previously written values behind.
3. Port the scene input/intro/return gates and choose an explicit portfolio
   startup-history branch. Define the source-update clock independently of
   metadata download and painting.
4. Verify composed startup/Open/Switch/Back frames and owner replacement,
   including the late Open pass, before importing the source panel into live
   rendering. The existing isolated 31 specimens do not cover these gates.
   The applied-layout subset of that item is now in
   [composed publication](native-notes-composed-publication.md); the remaining
   visibility gate is unpublished ApltBoot_U over the first title apply.

## Reproducible validation

`scripts/verify-notes-panel-publication.py` pins the original code SHA-256 and
passes **60 source/resource checks**, producing **19 hashed source listings**.
It validates wrapper/factory/root binding, all five pane vtable sets, animation
sampling and enable/reset instructions, selective title application, matrix
recursion and the accepted list-input route. It executes no firmware.

Artifacts:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/notes-applied-pose/`.
The existing ordered-startup verifier is rerun alongside this contract. No
application code, browser, integration checkout, title pixels or source-render
oracle changes in this slice; an application rebuild would not validate these
static-source findings.
