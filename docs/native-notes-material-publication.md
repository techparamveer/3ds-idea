# Notes material sampling, retained properties and list gates

This continues the [pane publication contract](native-notes-panel-publication.md).
Material enable/apply dispatch is now resolved, and retained-property fixtures
show how to preserve source state between update passes. Live title/HUD wiring
remains disabled because the surrounding list transition has additional gates
that the immediate browser `main`/`drawing` adapter does not implement.

## Material enable and apply are separate operations

The picture constructor reaches material constructor `0x1455a4` at `0x17bde4`.
It installs material vtable `0x1b784c`. Its relevant entries are:

| Offset | Target | Behavior |
| --- | --- | --- |
| +0x18 | `0x17c858` | Locate the animation link through `0x17cacc`. |
| +0x20 | `0x17c860` | Find that link and write its disable byte at +0x0e. |
| +0x14 | `0x17c8bc` | Traverse enabled links and call animation virtual +0x0c. |

Animation vtable `0x1b74cc` +0x0c resolves to material sampler `0x179764`.
For material-color tracks it reads the stored frame at `0x17980c`, samples keys
through `0x1463c4` at `0x179838`, then performs its native conversion/write.
Thus the material enable callback does not sample the newly reset frame.
The update-time local-pane apply method invokes the material +0x14 traversal.

This closes the earlier uncertainty about material +0x20/+0x14. Late event 9
does not immediately sample pane or material animation tracks. It changes
controller/frame/link state after the scene-3 apply opportunity.

## Applied values must survive disabled tracks

Both pane and material apply traversals skip disabled links. They do not restore
resource defaults. Values previously written by a now-disabled animation remain
until another active animation or explicit setter writes them.

The existing `poseNativeLayout` can preserve this behavior by using the last
applied layout as its input. Starting each update from the untouched shared
resource would erase retained values. This is a verified composition primitive;
it is not a new live Notes state owner or a native initialization implementation.

Four original-resource fixtures in `tests/notes-retained-properties.test.mjs`
verify these distinctions:

- Applied HUD geometry survives subsequent title-only application.
- Sampled title Stay indicator material alpha survives HUD-only application.
- A later enabled title clip overwrites the retained material channels.
- A late Open reset is distinguishable from the existing applied layout and
  must wait for the next scene-3 sampling opportunity.

The last fixture uses an explicitly seeded HUD pose. It does not claim that seed
is the native startup layout. The source pack remains unchanged in every case.

## Render-leaf dispatch is now concrete

| Pane type | Virtual +0x68 |
| --- | --- |
| pan1 / bnd1 | `0x1981e4` — returns the incoming command pointer. |
| wnd1 | `0x1983c0` — window/frame rendering. |
| pic1 | `0x199234` — reads material +0x13c and submits picture geometry. |
| txt1 | `0x1996b8` — reads material +0x100 and submits text geometry. |

The picture leaf calls `0x140458` to use current material state and `0x145e14`
to prepare texture state. Text can refresh its glyph geometry through
`0x17c038`, then draws through `0x17a970`. This resolves the top-level leaf
targets and their current-property inputs. It is not a claim that every nested
GPU/text helper or every native pixel has been verified. The full window leaf
and reachable render-helper graph still need an explicit no-resampling audit
before declaring the entire draw path closed.

## Entry and return are not one completion timer

For nonzero entry, list event 0 chooses state 1. That state's update reads the
note context's status +0x150 at `0x13d9c4`. Status zero enables list input and
sets list state zero (`0x13d9cc–0x13d9d0`). Other status branches are distinct.
It also starts list controller +0xfa0 slot 0. This is separate from the
priority-0 applet intro and the priority-4 title/HUD clock.

The bounded Back route immediately sends list event 1 and title event 8 while
starting the lower return controller. List event 1 clears its input flag and
enters **state 4**. That state's exact sequence is now traced:

1. Read selected-note controller slot 3's frame. At exactly **5.0f**
   (`0x40a00000`, compared at `0x13db24–0x13db28`), start list controller
   +0xf80 slot 1.
2. Wait for +0xf80 slot 1, selected-note slot 3, and +0xfa0 slot 11 to all
   become not busy (`0x13db50`, `0x13db70`, `0x13db88`).
3. Disable the selected-note transition, start the list base slot, clear the
   selected note, enable input and set state zero (`0x13db98–0x13dbd0`).

Independently, write scene state 7 waits for +0x98c slot 2, then queues its own
draw/update disablement (`0x1654a0–0x1654e8`). This slot was already identified
as `MemoWriteDown_SceneOut` by the sleep/reentry audit. HUD reverse completion
does not replace either the lower return gate or the three list gates.

The next implementation must bind the list-controller slots above to their
verified resources, reproduce their update/input gates alongside the intro and
write scene, seed the correct initially applied layout, and use the existing
owner-bound metadata barrier and source scheduler. The selected history branch
and browser-to-source update clock must remain explicit. Only then can combined
startup/Open/Switch/Back specimens justify live panel connection.

## Verification and handoff

The expanded `scripts/verify-notes-panel-publication.py` passes **96 original
byte/resource assertions** and writes **29 hashed source listings** under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/notes-material-publication/`.
The four retained-property fixtures pass alongside the existing Notes tests.
No application code or live output changed; no new browser/raster fidelity claim
or application rebuild is needed for this static-source/test slice.
