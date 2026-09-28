# Camera Welcome underlay: runtime state audit

The lower perimeter mismatch in the [underlay handoff](camera-guide-underlay-source-handoff.md)
remains open. This bounded follow-up on `c4e7098` establishes the model update
inputs and narrows the missing bindings. It does not establish a settled Welcome
pose, final projection, framebuffer draw order or guide attenuation. No runtime
change is justified by these facts alone.

## Source and delivered resource

EUR Camera `0004001000022400`, version 4097, content index 0 / `0000001a`.
The private executable SHA-256 was rechecked as
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.
Addresses below use ARM image base `0x100000`. Source remains at
`/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/reader-extracted/camera/contents/0000-0000001a/exefs/code.bin`.

Integration `dbb3eb7` (Assets `59916fc`) now publishes
`models/camera-shoot-background/model.json`, converted from the same hash-pinned
`romfs/res/P_Shoot_D.bcenv.LZ` identified in the handoff. Its four models,
textures, camera and light are delivered; resource publication is no longer the
blocker. The earlier bounded Python CCAM reader rejection does not describe
this SPICA delivery path.

## Per-object visibility and transforms

The constructor resolves Z_Arw/X_Arw/A_stick/P_Shoot_D into owner
`+0x148/+0x14c/+0x150/+0x154`. Function `0x28e0e4` changes the first three
objects each update. Let `u`, `v`, `t` be owner floats
`+0x1ec`, `+0x1f0`, `+0x1f4`; let `clamp` bound a value to 0–1:

- `h = clamp(t * 0.2)`;
- `sx = (1 - u / 8) * (1 - h)`;
- `sz = (1 - v / 8) * (1 - h)`;
- `sa = 1 - clamp((t - 5) / 3)`.

These formulas describe the original single-precision instruction arithmetic;
0.2 and 1/3 are the source float constants, not exact rational arithmetic.

| Object | Writes in `0x28e0e4` |
| --- | --- |
| A_stick | `+0x1f6 = (sa > 0)`; transform scale `(sa,1,sa)`; X/Z translation updated (`0x28e1d4–0x28e20c`) |
| Z_Arw | `+0x1f6 = (sz > 0)`; transform scale `(1,1,sz)`; X translation updated (`0x28e210–0x28e254`) |
| X_Arw | `+0x1f6 = (sx > 0)`; transform scale `(sx,1,1)`; X/Z translation updated (`0x28e258–0x28e2a4`) |
| P_Shoot_D | No write through its `+0x154` handle in this function; this does not prove whole-scene visibility. |

Translations depend on the retained target1/target2 components at owner
`+0x1a0/+0x1a8/+0x1ac/+0x1b4`, resolved at `0x28ebe8–0x28ec5c`, and
normalized input coordinates `+0x1c8/+0x1cc`. Authored bind transforms alone
therefore cannot reproduce the runtime objects.

Constructor zeroes the three phase floats (`0x28eadc–0x28eae4`), but update
`0x28e318` advances them toward 0 or 8 using owner flags `+0x1e9/+0x1ea/+0x1fe`
and delta `+0x38`. Calls at `0x208364`, `0x2083b4`, `0x2088a0`, `0x2088b0`
set those flags/phases through `0x28e038`, `0x28de94`, `0x28de18`. These calls
depend on enclosing state and helper results. Their selected values at settled
T_003 page 1 are not established. Constructor zeros must not be promoted to
Welcome values.

## Camera and composition boundary

The published camera is Perspective/Aim, authored aspect 1.5, FOVY 0.660595,
near/far 0.34/34000, position `(0,680,661.113)` and target `(0,0,20.4593)`.
Those are resource fields, not a verified 320×240 runtime projection.

Construction at `0x28ebbc–0x28ebd4` passes index 0 to `0x30fba0`, then binds
its result via `0x267c48` into owner `+0x88`. The accessor indexes the loaded
resource's pointer collection; this pass has not proved the collection's
resource-to-camera identity. Update `0x28e2d0`, conditional on incoming bit 8,
calls `0x267cd8`, then submits owner `+0x94/+0x8c` to `0x20e300`.
`0x267cd8` copies the selected object's `+0x1a8/+0x148` structures into a
retained object and calls `0x25c240` with argument 1. Final viewport and projection
semantics remain unbound; substituting the exported camera directly is premature.

`0x25e6d8` is child-list insertion, using `0x25a5d4`, plus parent/reference
bookkeeping. Its third argument selects insertion position. It is not itself a
framebuffer draw call. Shoot registration uses argument 1 at `0x2a6398`; guide
child registrations use argument 0 at `0x2736f4` and `0x2737fc`. Traversal,
pass filtering and compositing must still connect this list order to lower-LCD
draw order. No half-alpha dimmer or other Welcome attenuation was identified.

## Checks and handoff

Fresh Capstone decoding of 562 instructions across the cited update,
constructor, setter, camera and registration ranges agrees with the existing
private `reference/camera-grid-source/disasm.txt` (zero differences). Literal
float constants were read directly from the hash-pinned executable.
`git diff --check` and the local documentation link check pass. This is static
source inspection, not an executed Welcome controller replay. No application
build, emulator/browser action, public asset change or external-drive write was
performed. No new native comparison or scenario pass is claimed.

The decisive missing evidence is a settled T_003 owner snapshot or source replay
binding the three phases and target/input fields, selected camera and viewport,
and guide draw/compositor state. The published resource can then use the
existing injected model-background contract. Repeating extraction or rendering
all authored objects at constructor defaults cannot resolve these bindings.
