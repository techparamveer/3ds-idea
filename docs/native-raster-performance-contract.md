# Native raster performance contract

Baseline: integration `d30da2e`. The actual ANGLE Metal browser trace in the
firmware artifact root's `reference/close-render.cpuprofile` identifies cursor
CPU texture/TEV rasterization and upper-base uncommon blending as the main costs.
The no-capture close input produced a 907 ms task. No smoothness acceptance is
claimed. This work preserves the current renderer's pixel math; parity with the
original hardware remains a separate reference requirement.

## Prepared raster kernel

Runtime worker owns `src/os/native-layout.ts`, a new pure kernel module if useful,
`tests/native-raster-kernel.test.mjs`, and a dedicated validation note. Preserve
the public `rasterNativePicture` signature and return shape. Keep the existing
scalar `evaluateNativeMaterial`, `sampleNativeTexture`, interpolation and UV
helpers as independent readable reference oracles. A test-only reference raster
can compose these helpers; do not ship two whole runtime rasterizers.

Prepare material constants, source/operand selectors, UV trig and texture
metadata once per raster. Reuse per-pixel scratch and avoid arrays, closures,
maps and subarrays in the hot loop. Preserve the order of floating-point
operations, bilinear texel-centre/wrap behavior, generator selection, staged
clamps, previous/buffer update order, alpha comparison, final Math.round,
inherited primary alpha and cropped sampling regions. Do not introduce Float32
rounding, approximate lookup tables, generated eval, animation rounding, changed
filters or alpha factoring. Unsupported inputs must still fail explicitly.

Acceptance: byte-for-byte differential tests over real decoded cursor animations
(integer and fractional phases), native window/capture/shadow materials and
textures, primary alpha and crop regions; focused adversarial tests for all
supported TEV modes/operands, delayed buffer writes and wrap/filter behavior;
existing native-layout/firmware tests and type checking. Record CPU timings as
local evidence only; root owns actual browser profiling and visual checks.

## Upper-base blend fast path

Presentation worker owns `src/os/native-renderer.ts`,
`tests/native-darken-blend.test.mjs` and a dedicated validation note. Keep the
material APIs stable. For the exact blend predicate Add (1), source
Zero (0), destination OneMinusSourceAlpha (5), with Always alpha comparison (7),
source RGB is discarded and visible LCD RGB is D*(1-As). Reuse the same evaluated
alpha, set cached RGB to black and draw source-over to the opaque LCD target.
This must avoid the uncommon full-canvas readback while preserving visible RGB.
Do not use destination-out. Preserve cache accounting, dynamic texture identity,
clip/transform behavior and other blend paths. Keep this predicate local to the
renderer to avoid concurrent native-layout edits.

Measured Canvas coverage requires a bounded opt-in: `NativeDrawOptions` may add
`allowOpaqueDarken?: boolean`. Its caller guarantees an opaque target and no
inherited fractional clip. The renderer additionally requires axis-aligned
transforms, globalAlpha1 and whole-device-pixel bounds for its own options.clip.
Text draws with their additional pane clip use the existing path. Root opts in
only at upperBase, whose caller has an opaque400×240 LCD with no inherited clip
and whose explicit clip is [0,212,400,28]. All other calls remain unchanged.
Keep the generic path for rotated/sheared/nonunit-alpha and fractional-clip
cases: CPU Canvas comparison found up to4 RGB byte differences in rotated edges,
and up to1 with a fractional clip. Cache preparation may discard source RGB
under this exact blend predicate even for fallback because its coefficient is0.

Acceptance: actual CameraBase material and all alpha endpoints, guarded negative
cases, no fast-path readback, cache/clip/transform behavior, and type checking.
Report any Canvas premultiplication or edge precision differences; do not assume
mathematical equivalence proves byte parity. Root verifies actual browser output.

## Cursor clock investigation and integration

Assets worker owns only a dedicated cursor-loop evidence note/script. Establish
constructor/reset/start epoch, update increments, loop endpoint and restart
conditions from the supplied executable/resources. Do not change live animation
timing or access the centralized Azahar/browser sessions. No cursor-clock change
is authorized from elapsed-time rounding alone.

Root owns shared contract changes, scene cadence, stale integration tests,
architecture updates, browser/native reference sessions and sequential commit
integration. All workers use their existing separate task/worktree and Astra
Extra High. Scratch and reports go to the specified SSD firmware artifact root.
