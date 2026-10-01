# Performance, cache and recovery architecture

`render-quality.ts` is the single policy for DPR, antialiasing, shadow size,
scene/LCD cadence, VGPU surface size and constrained-device fallback. State and
native controller clocks advance independently of render cadence.

## Quality and degradation

Constrained devices use 30 FPS scenes, 12 FPS idle LCD paint, DPR at most 1,
512 shadows, no antialiasing and baked materials. Balanced/high tiers use
45/60 FPS scenes, 18/24 FPS LCD paint, bounded DPR, 1024 shadows and optional
VGPU. Counted short transitions may paint LCDs at scene cadence.

## Render scheduling

The cadences above are upper bounds. `render-schedule.ts` skips a console
render when it would repeat the presented frame: the animated pose (hinge, yaw,
pitch, scale, zoom, aspect, pad vectors, pressed-cap depths) is unchanged
within 1e-6 and no LCD texture, material or drawing-buffer change invalidated
it. Idle HOME therefore renders at the LCD paint cadence, not the scene cadence.
The shadow map (`autoUpdate=false`) is recomputed only when geometry moves; LCD
content, LED colour and backlight changes reuse it. Anything new that changes
the canvas without moving the sampled pose must call `schedule.invalidate()`.

Resize allocates the drawing buffer once (`setDrawingBufferSize`) and renders
immediately, so a cleared buffer is never composited. Startup compiles the
hidden LCD display materials before the opening clock starts, and fetches the
firmware presentation pack and HOME banner models in parallel with the GLB.

State-driven LCD paints (keys, pointer, saves, minute) replay the HOME
background sampled by the latest cadence paint instead of a synchronous
`readPixels` in the handler; cadence sampling is unchanged. Full-screen native
rasters (≥ 65536 px, including launch logos) use a structure-specialised TEV
loop that is tested byte-identical to the generic loop. The `AudioContext` is
constructed while idle after the opening and adopted by the first gesture
`unlock()`. See the [1 October lag note](../performance-2026-10-01.md).

## Model delivery

The page never loads the sourced `joshua-xl.glb` directly. `scripts/pack-model.mjs`
derives one content-hashed lossless file, named in `src/scene/model-delivery.ts`:
gltfpack without quantisation (all attributes kept, triangles reordered), then
exponential-filter/v1 re-encoding accepted only where it decodes to identical
bytes. Textures are byte-identical and every device loads the same model. It is
served immutable. `tests/model-delivery.test.mjs` proves the packed model draws
the source triangles with bit-identical vertex records and keeps the scene
contract. Portfolio photos load after the first frame. See the
[size note](../size-2026-10-01.md).

Measure with `scripts/perf/benchmark.mjs` (see its README): headed Chromium,
interleaved builds, three runs per profile, medians.

Degrade in this order: LCD cadence, scene cadence, DPR/shadows, baked materials
instead of VGPU, then Canvas banner fallback if a secondary WebGL context fails.
The model, controls and portfolio content remain available.

## Bounded caches

| Cache/resource | Bound / invalidation |
| --- | --- |
| Native raster canvases | 8 MiB LRU by default; oversize results are not retained |
| Native layout poses | 16 entries, oldest evicted |
| Stock media images | 64; cleared on owner replacement/disposal |
| Stock LCD pair | One private upper/lower pair keyed by owner, view, revision and font |
| Native title session | One foreground owner/view; replacement aborts and disposes |
| HOME/banner resources | One console-session owner; scene teardown disposes |
| Portfolio music | One foreground audio element; revision/owner guarded |

Do not add unbounded caches to animation or paint paths. Keys must include every
mutable pixel/pose input. Caches are not persistence; IndexedDB stores user state.

## Loading and recovery

Stock native views have a 20-second resource deadline. Both screens hold the
source black fade endpoint and app input is gated until a complete pair is
painted. HTTP/decode/font timeout, selected unsupported data or drawing failure
invalidates the generation and publishes an authored website recovery pair.
A retries; B/HOME escapes. No automatic retry or generic native-looking fallback
hides failure.

GLB/scene-start rejection reaches React's static console and Retry. Failed VGPU
retains baked materials. HOME banner failure can retain documented Canvas art.
Missing portfolio media gets an explicit placeholder. IndexedDB failure keeps
an in-memory session and reports unavailable saving.

## Disposal and races

Native sessions abort cooperative work and generation-check noncooperative
completion; late resources are disposed. Effect callbacks validate owner and
revision. Save writes preserve order and settle before database close. Scene
teardown cancels frames/idle work/listeners/observers and disposes audio, screens,
banners and GPU objects. Every new async resource needs stale-completion handling
and idempotent release.

Initial scene startup does not yet have one abortable, deadline-bound phase
controller, so stock-view recovery evidence cannot be generalized to all startup
failures. See [proposed improvements](proposed-improvements.md).

Record startup milestones, cadence, long tasks, GPU time, cache bytes, audio
underruns and resources before/after teardown. Pair performance data with matched
screenshots. Historical detail remains in
[performance architecture](../performance-architecture.md).
