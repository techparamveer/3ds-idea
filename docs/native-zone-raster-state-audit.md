# Nintendo Zone camera replay and raster-state boundary

24 September 2026, integration base `734ac98`. **Source audit only.** This
continues the [upper-page camera binding](native-zone-projection-source-audit.md).
The original matrix routines now execute as a bounded ARM fixture. Renderer
publication remains blocked by final placement, draw-time state and shader
raster validation. There is no claimed visible fix or native capture.

## Exact camera arithmetic

`scripts/replay_zone_camera.py` accepts the same pinned private `code.bin` as
`audit_zone_projection.py`, verifies its SHA-256 before loading Unicorn 2.1.4,
and executes `0x21fecc` and `0x1a8d68` without substituting any camera instruction.
Synthetic object memory supplies the source-proven `page_transition` 320 × 240
canvas. All perspective, angle-table, look-at, frustum extraction and stereo
reconstruction calculations run from the original image.

The camera eye is exactly `z = 289.70562744140625` in this fixture. The source
projection is stored as four rows below, after the upper-eye rotation and the
zero-slider stereo reconstruction:

```text
 0                    2.4142136573791504   0                    0
-1.8106600046157837   -0                  -0                   -0
 0                    0                   1.0000050067901611    0.05000025033950806
 0                    0                  -1                    0
```

Its view is the identity 3 × 3 with translation `(0, 0, -289.70562744140625)`.
Both eyes return the same matrices. The initial projection's second value is
`2.4142134189605713`, one float32 step below the post-stereo result. The source
frustum extraction also reconstructs far as `9986.48828125`, despite the original
setup argument being 10000. A generic perspective formula or the initial matrix
is therefore not an exact substitute for the selected draw matrix.

The calibration block is normally populated by `0x14c8b8` through configuration
service request `0x50005` (`0x11d5dc`). The fixture does not call that service:
positive finite display-width/separation pairs `(100,5)`, `(200,10)`, `(400,0)`
are explicitly synthetic. Each is tested with slider/status `(0,0)` and `(1,1)`;
the latter status suppresses the slider value. All six cases return identical
zero-stereo matrices. This proves the bounded zero-stereo invariance, not native
calibration or nonzero stereo behavior. It does not yet exercise source pane
hierarchy multiplication, clipping, shaders or PICA float24 conversion.

## Enclosing pass and initial GPU state

The pass entry is now bound to the actual service callbacks:

| Source | Fact |
| --- | --- |
| `0x2043f0`–`0x204460` | Selects target from `0x11cbc0`, sets viewport using target fields `+0x30/+0x34` through `0x1fdb80`, then calls state reset `0x122708`. |
| `0x204678`–`0x204684` | Dispatches service virtual `+0xc` for upper-left pass. Slot 12's callback is the established `0x249054`. |
| `0x204810`–`0x20481c` | Dispatches service virtual `+0x10` for upper-right pass, reaching `0x249004`. |
| `0x122730`–`0x122754` → `0x1f95d4` | Disables GL capabilities `0xc11` (scissor), `0x8037` (polygon offset), `0xb44` (cull), `0xb71` (depth test) and `0xb90` (stencil test). |
| `0x122758`–`0x122770` | Enables all four color writes through `0x13616c` and depth writes through `0x136264`. |
| `0x145fc4`, depth branch `0x146040`–`0x146074` | Disabling depth clears bit 0 of register shadow `0x2e79e8` and emits a byte-masked write to register `0x107`. |
| `0x136264`–`0x1362e8` | Depth-write state controls bit `0x1000` of that shadow, independent of depth-test enable. |

The fixture additionally executes the original bounded reset body
`0x122730..0x12277c`, starting from a synthetic enabled shadow `0x1fff` and forced
cached-state emission. The returned shadow is `0x1ffe`: depth test off, color and
depth write bits on. The exact emitted packet is asserted in the focused test.
Scissor disabling updates cached state; this packet is not proof of a final
scissor rectangle at the later banner draw.

**This is pass-entry state, not established U_top draw-time state.** The pass
iterates ordered services and queued work before individual dispatches;
`0x2045e8`–`0x204638`/`0x204780`–`0x2047d0` execute work through `0x1fd82c`.
The [placement follow-up](native-zone-placement-inputs-audit.md) identifies that
work as framebuffer readback, not arbitrary draw commands. Earlier service state
and the readback synchronization helpers still need bounded closure. The target object's dimensions also remain unexecuted in
this fixture. Do not infer a full-screen scissor or disable banner depth solely
from these defaults.

## Fullscreen and HTML placement narrowed

The fullscreen bit is consumed by `0x262478` → `0x1f8e70`, testing document
`+0x2f4 & 0x200`. Its upper-page caller at `0x232be8` chooses two actions:

- Fullscreen true calls `0x1c11d0(page,0)`, which gets `N_ScreenU` from page
  `+0x8c` and clears its visibility via `0x1f9a0c`.
- It also calls `0x253310(page,0)` to store the companion page flag `+0xde`.
  False passes 1 to both actions. Page update reads that flag at `0x254710`
  and invokes virtual `+0xc`; the upper implementation is `0x256b78`.

Thus fullscreen replaces the parent's ordinary textured screen presentation;
this particular flag consumer does not write GPU scissor state. The remaining
upper-page update callback still needs a bounded behavior audit.

The startup and English offline HTML both set body margin zero and contain the
`nw4c` element without explicit coordinates. That is not sufficient to claim
its resolved element rectangle. Original callback `0x23c990` yields:

```text
x = zoom * (elementX + trunc(elementWidth/2) - paintOriginX)
    - trunc(documentWidth/2) + viewportX
y = trunc(documentHeight/2)
    - zoom * (elementY + trunc(elementHeight/2) - paintOriginY)
    - viewportY + 20                 [upper screen]
```

Zoom applies only when `0x1f9620` enables it; otherwise the multiplier is 1.
`0x1330b4` supplies the viewport from the selected view object's integer fields
`+0x80/+0x84`, and the callback sets root z to zero via `0x18c15c`. The original
layout engine's resolved element rectangle, paint origin and final viewport
values have not been captured/replayed. The source target-picture y = -10 is
still not proof that this root is also at -10.

## Remaining implementation gates

1. Capture/replay the HTML callback inputs and parent update state; derive the
   final root translation instead of choosing a plausible centering offset.
2. Close target dimensions and all state changes between the pass-entry reset
   and service 12 draw, including fullscreen scissor and depth/write behavior.
3. Decode and bind `nwlyt_PaneShader.shbin` to the emitted picture batch. Prove
   position output, perspective divide, color/UV interpolation, clipping,
   texture filtering and blend for the real ground and overlapping depth panes.
4. Add bounded real-source raster checks, then compare aligned native LCD frames.
   The executed matrix fixture alone does not validate any banner pixels.

No runtime or public pack changes were made. Keeping the existing projection
diagnostic is preferable to silently publishing unsupported camera/raster
behavior as source fidelity.

## Verification and artifacts

Three new focused tests pass against original source: wrong-image rejection,
exact zero-stereo matrices across six synthetic calibration/status cases, and
pass-entry command/reset semantics. The seven previous projection source tests
also pass. The five service/helper LCD pairs were regenerated; their existing
Zone projection diagnostics and flattened banner remain expected. The paired
Zone image was inspected, and no visual improvement is claimed.

Private evidence: `reference/zone-raster-state/camera-replay.json` and
`current-renders/verification.json` beneath the firmware artifact root. No title,
network operation, device operation, integration checkout or browser was used.

The [placement-input follow-up](native-zone-placement-inputs-audit.md) executes
the bound document viewport callback and the root arithmetic with explicitly
conditional HTML inputs. It also narrows GL command writers and corrects the
queued-work classification above.
