# Nintendo Zone upper banner projection audit

24 September 2026, follow-up integration base `e402db8`. **Audit only.** The existing
`U_top` painter remains an incomplete orthographic approximation. No camera,
clipping rule, timing or material behavior was guessed, and no native title was
launched. This does not close the 1:1 banner gap.

## Pinned inputs and reproducer

Owner-supplied title `0004001000022b00`, private extraction
`assets/stock-ui/extracted/nintendo-zone/` beneath the firmware artifact root:

- `exefs/code.bin`: SHA-256
  `6f250e8b33361a4a3f418ec778055f0056a1a11fd70bae6dcf3e9b6a3fe4395c`.
- `romfs/www/included_html/3dbanner_EU.nwcla`: LZ11-compressed DARC, decoded
  read-only. The audit independently decodes its original CLYT/CLAN resources
  and compares the relevant fields with the published pack.

`scripts/audit_zone_projection.py` requires that exact executable, emits hashes
for twelve bounded ARM ranges, and records source descriptor, geometry, animation
and literal constants. ARM addresses below use image base `0x100000`. The follow-up binds the upper-page camera through the service callbacks, but
explicitly keeps **raster validation false**. Call edges, vtable entries and
parent-layout fields are decoded from the pinned executable/resources.

## Resource and placement chain established

| Executable/resource evidence | What is established |
| --- | --- |
| `0x18766c`–`0x1876c0` | Resolve `ext:/boss_page/3dbanner.nwcla`; fallback branch `0x1876a8` selects `rom:/www/included_html/3dbanner_EU.nwcla`. This audit concerns the bundled fallback, not external content. |
| Archive `index.nwlx` | Root `nwl` has version `1.1`, `layoutName="U_top"`, `fullscreen="true"`; `startAnimation` is `Loop_anim`. No camera or clipping parameters occur in this descriptor. |
| `0x23c500`–`0x23c538` → `0x218cf8` | The HTML NW4C component allocates the archive/layout wrapper. |
| `0x218dd0`–`0x219000` | Loads `index.nwlx`, checks its root/version, resolves `layoutName`, appends the layout suffix, and constructs the layout wrapper via `0x18c330`. |
| `0x1075f0`–`0x10770c` | Upper-page object from service slot 12, upper target allocation width 400/height 220, then size and position calls. Literal pool `0x1078a4`–`0x1078b0` contains y −10, x 0, height 220, width 400. These are **placement constants**, not near/far or eye coordinates. |
| `0x23c990`–`0x23cafc` | HTML draw callback computes the element centre, subtracts the document centre, accounts for viewport offsets via `0x1330b4`, and uses a 20-row upper-screen adjustment. It writes x/y/z=0 to the layout root through `0x18c15c` → `0x1fd600`. |
| `0x23c5a0`–`0x23c5b4` → `0x23421c` → `0x252b4c` | Registers the HTML layout root with the selected upper/lower page object's list. The upper selection uses object field `+0xaf8`; the callback and traversal follow-up below binds its camera. |

`fullscreen="true"` is evidence of an input flag. It is not proof that the
renderer should ignore the 400 × 220 content viewport or bypass the HUD scissor.
The existing 20-row HUD/content composition is described in
[the service screen trace](native-service-screen-trace.md).

## Geometry and material obligations

The original layout contains 59 panes, including 38 with nonzero local z.
The 800-frame looping clip contains 37 `translation.z` tracks. The published
depth tracks match the independently decoded original resource exactly.

`BG_grid` is a centred 800 × 300 picture at `[-1, -145, 0]`, rotated
`[-80, 0, 0]`, scale `[1, 1]`. Its four primary vertex alpha values are
`[0, 0, 255, 255]`; its UV set spans u 0–1 and v 0–0.75. The original ground
material also matches the public material at index 12. A replacement must
preserve that alpha gradient and UV range under perspective-correct sampling.
Simply drawing a trapezoid with a stretched pre-rasterized rectangle does not
prove equivalent interpolation or blending.

Current `NativeLayoutRenderer` drops translation.z and replaces X rotation with
a cosine y-scale. The tilted ground consequently has a flat height of about
52.1 pixels before clipping. Local z does not move the other panes toward the
camera. The checked paired LCD source render visibly retains the narrow
flattened objects along the lower edge of the upper LCD.

## Upper-page camera binding established

The previous audit left the call path open. This follow-up closes the page-camera
binding, while retaining the separate raster and native-comparison gates.

| Original source evidence | Established relationship |
| --- | --- |
| Service table entry `0x2e5b2c` → `0x249108` → `0x249130` | Service slot 12 constructs upper page via `0x256f70`, stores it at service `+0x34`; the lower page is `+0x38`. Main object stores them at `+0xaf8` and `+0xaf4`. |
| `0x256f70` → `0x2547a0`; original `layout.nwcx` | Upper page loads `page_transition.bclyt`. Its **layout canvas is 320 × 240**, independent of the banner's 400 × 220 canvas and the 400 × 220 target picture. |
| `0x254898` onward | Upper page caches `N_ScreenU_P` at `+0x98`, `N_ScreenU` at `+0x8c`, and `N_Content_P` at `+0x88`. |
| `0x253f18`–`0x253f40` → `0x1bcb60` → `0x1eba70` | Registered, unattached HTML layout roots are appended under `N_ScreenU_P`; native parent and child-list links are set. This is a pane hierarchy, not a second independently projected canvas. |
| Service vtable `0x2d64f4`, entries `+0xc/+0x10` | Upper-left callback `0x249054` and upper-right callback `0x249004` both draw service `+0x34`. Their calls at `0x249090` and `0x249040` reach `0x1cbfa8` with aspect correction and stereo enabled; eye selection is 0 or 1. |
| `0x1cbfa8`–`0x1cbfe4` | If page byte `+0x30` enables drawing, its layout wrapper `+4` is passed first to camera setup `0x21fecc`, then to traversal `0x220198`. |
| `0x220198`–`0x22028c` | Calculates pane matrices, selects upper-eye projection/view, recalculates pane matrices, begins drawing via `0x217afc`, then draws the layout via `0x20d7ec`. |

`0x21fecc` obtains the rectangle from native layout width/height through
`0x271134`, rather than from the HTML element or target picture. It loads fovy
**45**, near **0.05000000074505806**, far **10000** and half-angle **22.5**
from `0x21fff4`–`0x220000`. Calls at `0x21ff30` and `0x21ff58` invoke
`0x1a8854` with rotation flag 1 and 0 respectively. Eye x/y are zero; eye z
is `(240 / 2) / tan(22.5 degrees)`, approximately 289.7056, with up `(0,1,0)`
and target `(0,0,0)`. The source uses its angle-table helper, so this decimal
approximation is explanatory rather than an exact source-float fixture.

The wrapper allocation is 0xa0 bytes (`0x13d334`). Its native layout is at
`+4` and its camera/frustum storage at `+0x40`; the latter is not a resource
accessor. The same page layout supplies the camera in both upper callbacks.
`0x1fd624` resizes the `N_ScreenU` picture and shadow, and `0x1227cc` moves that
picture to the target's `(0,-10)` placement. Neither changes the layout canvas
used by the camera.

### Parent aspect and stereo state

The original `N_ScreenU_P` pane has flags 5, zero local translation/rotation,
and unit scale. Flag 4 activates per-pane aspect correction in `0x20c484`
when DrawInfo `+0x88` bit 1 is enabled. The upper callbacks enable it through
`0x20e9e8`. Initializer `0x102674`–`0x102678` loads DrawInfo aspect multipliers
**0.8f and 1.0f** from `0x1026c4`/`0x1026c8`. Thus the parent x correction is
part of the source transform; simply projecting U_top as a 400 × 220 standalone
layout loses both the parent camera and this correction. A 400-pixel output
viewport would cancel the nominal 320-to-400 width expansion at z=0, but that
calculation alone does not prove the actual viewport or scissor command state.

`0x220200` calls stereo helper `0x1a8d68` with scale 1 and a separate convergence
constant **289.84271240234375**. This is not the camera eye distance. The helper
reads the source 3D-slider shared-memory field at `0x1ff81000 + 0x80` under its
status check, then uses that value in the stereo offset. The zero-slider path
has not been executed as a matrix fixture and must not be assumed equivalent to
the pre-stereo matrix merely because its eye offset appears zero.
`0x1cfea8` handles the projection's portrait-axis rotation (row 1 becomes row 0,
negative row 0 becomes row 1 when enabled). Browser viewport orientation and
clip conventions still require an explicit mapping.

### Raster path narrowed, not validated

`0x217afc` invokes DrawProcessor Begin, then uploads the selected projection.
`0x20d7ec` selects the root and `0x2710c4` traverses visible panes in child-list
order. For a picture, virtual draw `0x271ffc` selects material (`0x1b4800`,
`0x1cec54`), prepares vertex data (`0x1b4390`), and copies the pane's full matrix
from `+0x80` into the batch (`0x2720f4`–`0x272104`). `0x1cee90` flushes those
batches and submits indexed drawing. This confirms that source z and rotations
reach the draw path; it does **not** establish that painter order replaces depth
testing or that Canvas affine sampling is equivalent to the original shader.

Depth discovery `0x25cfa4` → `0x25cee8` recursively checks local z and stores a
wrapper flag. HTML load sets document `+0x2f4` bit `0x100` when depth is found,
and bit `0x200` from `fullscreen`. Those document flags are not themselves GPU
depth/scissor settings. DrawProcessor Begin (`0x217bb0`/`0x217bfc`) and the batch
flush have been inspected, but the enclosing render-pass viewport, scissor and
depth-test/write commands have not been bound to this draw. The exact HTML root
y offset also remains separate from the `(0,-10)` target-picture placement.

## Exact remaining gates before renderer work

1. Execute or independently emulate the now-bound camera/stereo-zero matrix
   helpers and parent transforms. Resolve the final HTML root offset and how
   fullscreen changes attachment/clipping; do not use the target-picture offset
   as a substitute for the HTML root offset.
2. Trace viewport/scissor at the 20-row HUD boundary, near/far clipping and
   homogeneous divide. Determine whether local z affects depth test/write or
   only projection, and whether list order remains the compositing order.
3. Validate a bounded projective picture raster using real `BG_grid` primary
   alpha, UVs, filtering and material blend, plus an overlapping depth-pane
   case. Clip before divide; preserve interpolation at clipped edges.
4. Check representative source clip frames against a matched native LCD
   capture. Source poses and software raster agreement are not native visual
   acceptance. The live banner's fixed frame 120 is still a separate timing
   adaptation; this audit does not activate its loop.

## Verification

Seven focused Python checks pass with `FIRMWARE_ZONE_CONTENT` pointing at the
original extraction: fail-closed executable guard, ARM call-opcode rejection,
descriptor/target constants, ground geometry/alpha/UV/material, original-to-public
z tracks, parent camera/resource fields, and actual executable vtable/call edges.
These checks establish source facts; none labels a generated image native.

No runtime or public resource changed. The existing five service/helper source
pairs were rendered again and the Nintendo Zone pair inspected; its flattened
banner and two projection diagnostics remain. This checkpoint deliberately has
no claimed visual improvement. No application rebuild, browser operation or
native-title launch was performed.

Private follow-up evidence is in `reference/zone-draw-camera/` beneath the
firmware artifact root: `source-audit.json`, `page-base.txt`, and
`current-renders/verification.json` with the PNG LCD pairs. The earlier descriptor
and camera trace remains in `reference/zone-projection-source/`. Coordinator-owned
browser/native comparison remains outstanding.
