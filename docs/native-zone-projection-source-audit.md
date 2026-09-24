# Nintendo Zone upper banner projection audit

24 September 2026, integration base `3698dae`. **Audit only.** The existing
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
for five bounded ARM ranges, and records source descriptor, geometry, animation
and literal constants. ARM addresses below use image base `0x100000`. The report
explicitly marks the camera candidate as **not confirmed for the banner**.

## Resource and placement chain established

| Executable/resource evidence | What is established |
| --- | --- |
| `0x18766c`–`0x1876c0` | Resolve `ext:/boss_page/3dbanner.nwcla`; fallback branch `0x1876a8` selects `rom:/www/included_html/3dbanner_EU.nwcla`. This audit concerns the bundled fallback, not external content. |
| Archive `index.nwlx` | Root `nwl` has version `1.1`, `layoutName="U_top"`, `fullscreen="true"`; `startAnimation` is `Loop_anim`. No camera or clipping parameters occur in this descriptor. |
| `0x23c500`–`0x23c538` → `0x218cf8` | The HTML NW4C component allocates the archive/layout wrapper. |
| `0x218dd0`–`0x219000` | Loads `index.nwlx`, checks its root/version, resolves `layoutName`, appends the layout suffix, and constructs the layout wrapper via `0x18c330`. |
| `0x1075f0`–`0x10770c` | Upper-page object from service slot 12, upper target allocation width 400/height 220, then size and position calls. Literal pool `0x1078a4`–`0x1078b0` contains y −10, x 0, height 220, width 400. These are **placement constants**, not near/far or eye coordinates. |
| `0x23c990`–`0x23cafc` | HTML draw callback computes the element centre, subtracts the document centre, accounts for viewport offsets via `0x1330b4`, and uses a 20-row upper-screen adjustment. It writes x/y/z=0 to the layout root through `0x18c15c` → `0x1fd600`. |
| `0x23c5a0`–`0x23c5b4` → `0x23421c` → `0x252b4c` | Registers the HTML layout root with the selected upper/lower page object's list. The upper selection uses object field `+0xaf8`; following that object's actual draw traversal remains the useful next entry point. |

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

## Camera candidate, not a banner binding

There is a concrete perspective setup at `0x21fecc`:

- `0x21fef4`–`0x21ff2c` computes aspect ratio from a rectangle returned by
  `0x271134`, then loads fovy **45**, near **0.05000000074505806**, far
  **10000** from `0x21fff4`–`0x21fffc`.
- Calls at `0x21ff30` and `0x21ff58` pass the same values to `0x1a8854`,
  with r1=1 and r1=0 respectively. That helper converts the angle and dispatches
  matrix generation plus a further transform; the final raster convention is
  not established by these constants alone.
- `0x21ff68`–`0x21ffcc` computes eye z from `(rectangle height / 2) /
  tan(22.5 degrees)`, with eye x/y=0, up `(0,1,0)`, target `(0,0,0)`, and calls
  the look-at helper `0x1cfd20`.
- Two direct callers are `0x1cbfcc` and `0x1cc014`. The former is gated by
  byte `+0x30` of its caller object. Many UI objects call these wrappers. The
  trace does **not** establish that the registered `U_top` root traverses them,
  which rectangle it supplies, or that this is the upper-page camera.

Using 220 or 240 as that rectangle's height produces different eye distances.
Neither value may be selected merely because a layout or LCD has that height.
No speculative candidate-camera render was accepted as source validation.

## Exact remaining gates before renderer work

1. Follow the registered-root list in the upper-page object through its draw
   traversal, identify the actual view/projection matrices and rectangle, and
   establish how fullscreen and stereoscopic selection affect them.
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

Five focused Python checks passed with `FIRMWARE_ZONE_CONTENT` pointing at the
original extraction: fail-closed executable guard, descriptor/target constants,
ground geometry/alpha/UV/material, original-to-public z tracks, and explicit
non-promotion of the camera candidate.

`scripts/verify-native-services.mjs` passed all five service/helper pairs.
The current Nintendo Zone paired LCD was visually inspected. Its two expected
projection diagnostics remain; the HUD whole-turn battery rotation is an
identity as already documented. No runtime or published resource changed, so
there is no before/after visual improvement to claim and no build was needed.

Private evidence is in `reference/zone-projection-source/` beneath the firmware
artifact root: `source-audit.json`, the bounded executable trace helper, and
`current-renders/verification.json` with the PNG LCD pairs. Coordinator-owned
browser/native comparison remains outstanding.
