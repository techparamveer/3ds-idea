# Ordinary native tile touch integration

The frozen source authority is [GRID_STYLUS_EVIDENCE.md](../scripts/firmware/GRID_STYLUS_EVIDENCE.md),
integrated at `87cf9ca`. Its private report SHA-256 is
`66b6f7fc4ae96bd03b531449e9f65a51ef1ca28d035ff1c9693bcd74cffe2174`.
This slice hosts ordinary settled grid widgets. Dragging, long press,
scroll recognition, native hit geometry and complete opening lifecycles remain
separate boundaries. Existing authored gestures must remain available.

## Pure widget ownership

Runtime owns only new `src/os/home-tile-widget.ts`, focused tests and a compact
numeric fixture projected from the frozen report, plus its validation note.
Do not modify System, the host, presentation, source scripts or public assets.
Use the shared `HomeTilePose` in `home-tile-pose.ts`.

Export `HomeTileWidget`, `createHomeTileWidget()`,
`setHomeTileWidgetEnabled(widget, enabled)`, `resetHomeTileWidget(widget)`,
`updateHomeTileWidgetInput(widget, input)`, and
`advanceHomeTileWidget2D(widget)`.
The widget exposes `state` (0/1/2/3), `enabled`, `capture`, the Select and Decide
controllers, and `pose: HomeTilePose | null`. Controller state retains current,
applied, status, direction and binding enable separately. Extra source fields
such as the held count belong here if required by the executed leaf.

Input is `{ current: boolean, previous: boolean, inside: boolean,
globalCapture: boolean }`. The host skips this function when the producer does
not traverse widgets. The result is `{ state: HomeTileWidget, events,
unsupportedLongPress: boolean }`, where
ordered events are `{ kind: 'cue', cue: 'touch' }` or
`{ kind: 'callback', value: 0 | 1 | 2 }`. Preserve the source's enable and
own/global capture gates. The initial cue precedes callback0. Do not invent
reentry, cleanup or delayed-selection cues from unused config values.

The separate 2D function advances both controllers, then applies enabled
bindings in Select→Decide order, retaining only the last actual writer as
`pose`. Disabled old applied frames write nothing. Reset immediately restores
Select0 and disables bindings, without generating callback2. Enabling/disabling
and reset must follow their distinct source leaves. All operations are pure
and immutable. Do not bind navigation or elapsed milliseconds into this module.
The source's static held threshold20 starts an unhosted long-press route. Report
that boundary before executing it; the coordinator owns explicit takeover.

Tests must replay the relevant widget/controller/pose/capture fields from all
43 source cases, including quick release, leave/reentry, second tap, waiting
interference, disable/re-enable, reset and producer-skipped input. Selection and
opening remain host callbacks; field-only context mutations are not lifecycle
proof. Report any source/API mismatch before guessing.

## Painter ownership

Presentation owns `src/os/firmware-presentation.ts`, `src/os/screens.ts` and
focused painter tests/validation. Runtime controller files and host files are
outside its ownership. Add a pure sampling method to NativeHome named
`tilePressOffset(pose: HomeTilePose | null | undefined, density: number): number`.
Sample the actual LncIconDist_01 Select/Decide track and relevant layout ancestry;
derive the LCD Y sign/scale instead of assuming two physical pixels at every
density. Document any runtime transform boundary not proved by these resources.

`HomeControls.tilePoses[slot]` is the retained applied writer for the active
container. Native painting uses it instead of the old immediate `pressed`
offset. The translated P_IconBtnDmy_00 subtree contains the icon artwork;
translate the current assembled plate/glyph/artwork consistently while leaving
hit geometry and the main cursor fixed. Do not replay both retained frames or
animate the primary LncCsr_00 Select clip for ordinary grid contact.

Keep primary/effects painting eligible during ordinary grid `press`. Existing
authored `scroll`/`drag` routes retain their separate suppression policy.
Painting never advances controllers. Preserve legacy/fallback rendering,
folder close/capture, toolbar/density states, reduced-motion behavior and native
region preservation. Use the SSD artifact directory for any canvas outputs.

## Coordinator ownership and ordering

Root owns browser touch adaptation, per-container widget storage, System,
home-controls, scene journals, integration and browser verification. It samples
physical input and captures once per shared count; native widget input runs
before producer key notifications, upper manager and lower tasks, with its 2D
phase last. Delayed acceptance re-reads the current slot mapping, current
selection and content. It emits the existing accepted-touch observations and
no new selection cue. A same occupied slot may hand off to existing opening;
a same vacant slot must not create a folder. Footer creation stays separate.

Initial touch emits the existing native `touch` cue. Eligible ordinary open
emits existing `open` at the audited handoff. Folder opening is an explicitly
separate existing bridge. A handoff must stop remaining HOME work in that pass
and cancel/rebase pending HOME work when ownership changes. Scene journals
must avoid a second generic action cue.

The browser may preserve an otherwise unobserved down/up for consecutive
eligible samples; this is an explicit adapter policy, not native HID evidence.
Browser cancellation, blur, overlays, context replacement and takeover by an
authored drag/scroll route use explicit lifecycle resets. Never describe them
as native state2 context validation. Global capture scans must preserve the
source's one-pass lag after a widget clears its own capture. Existing physical,
keyboard, toolbar and fallback paths remain shared and testable.
