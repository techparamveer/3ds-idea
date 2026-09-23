# Prepared native CPU raster kernel

The runtime raster now prepares texture sampling and TEV selectors once per
`rasterNativePicture` call. The pixel loop reuses a 33-number register bank and
four result channels; it allocates no arrays, closures, maps or subarrays.
Output storage and preparation still allocate once per raster. There is no
cross-raster cache, generated code, lookup approximation or animation change.

## Baseline and arithmetic contract

The imported `native-layout.ts` baseline is integration `d30da2e`. Its parent
pane path, explicit child binding, four-frame windows, effective-material
argument and cropped sampling API are retained. The shared acceptance contract
is `docs/native-raster-performance-contract.md` from integration `c18a25f`.

`evaluateNativeMaterial`, `sampleNativeTexture`, `interpolateNativeQuad` and
`transformNativeUV` remain unchanged, readable scalar oracles. A test-only
reference raster composes those helpers using the original raster algorithm;
there is only one shipped raster loop.

The prepared loop preserves texel-center coordinates, per-neighbor wrapping,
nearest/bilinear choice from `magFilter`, UV generator selection, matrix order,
per-texel division by 255 before interpolation, quad interpolation grouping,
inherited primary-alpha multiplication, composed constant registers, operand
complements, intermediate/final TEV clamps, and previous-stage buffer capture.
Alpha comparison precedes the unchanged final `Math.round(channel*255)` and
Uint8ClampedArray write. Scratch uses Float64, the same precision as JavaScript
numbers; it introduces no Float32 conversion. Unsupported generators, TEV
sources/operands/modes/constant selectors and missing resources still throw.

## Differential verification

`tests/native-raster-kernel.test.mjs` compares every RGBA byte, including hidden
RGB under zero alpha. Coverage includes:

- Real cursor windows at all six density endpoints 0–5, individually evaluated,
  and phases 0, .001, .5, 1, 4, 4.25, 15.5, 30, 39.999, 40, 44, 44.125, 59,
  59.999, 60. This explicitly covers the existing pose sampler's 59.999→60 loop boundary without
  changing that sampler or claiming its epoch matches hardware.
- Full and cropped rasters with pane alpha and additional inherited alpha;
  native one/four-frame folder windows, capture UV1, folder shadows, CameraBase
  and other upper-base materials; a dynamic capture texture with independent
  RGB/alpha channels.
- All eight TEV modes and sources, ten RGB/eight alpha operands, complements,
  scales, all seven constant register selectors, independently captured color
  and alpha feedback, staged saturation, and all alpha comparison functions.
- Texture counts 0–5, absent texture slot white defaults, implicit materials,
  half-byte rounding boundaries, clamp/repeat/mirror wrap, nearest/bilinear
  filters, flipped/degenerate UVs, rotation, generator remapping, crop-to-full
  byte equality and 250 deterministic randomized multistage cases.
- Explicit failures, including invalid unused combiner arguments, plus inert
  unreferenced constant selectors and empty rasters.

The selected raster/presentation/renderer/animation/PNG/banner suite passed
37 tests with zero skips; the separate firmware-model suite passed 11 with zero
skips. Type checking passed. The six-density expansion was then verified by a
targeted cursor-only rerun: 1,800 cursor rasters and 5,304,720 identical RGBA
bytes. The other real-resource cases cover 306 rasters and 4,692,760 identical
RGBA bytes, plus the dynamic capture replacement. No browser or Azahar session
was accessed here.

Resource inputs are the decoded HOME launcher pack and 33 referenced delivery
PNGs. `decodeNativePng` retains independent RGBA bytes; A8/A4 sampling projection
uses the same `nativeTextureSamplePixels` boundary as production. Launcher SHA256:
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
The private per-texture SHA256 receipt is `resource-provenance.json`, SHA256
`0359eb9ec12702765bd449797f17b7bf71b8d85128f034b8e48513f7f270629d`.

Logs and receipts are on the supplied SSD at:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/runtime/reference/native-raster/`.

## Local CPU measurement

On Apple M2, macOS arm64, Node 22.23.2, the benchmark renders 80 fresh cursor
rasters across eight phases, totaling 120,872 pixels. Every call includes
preparation and fresh output allocation; neither implementation uses a raster
cache. Texture decoding and layout posing are outside the timed region. Output
is consumed by a sampled-byte checksum, equal at 1293456129 for every run;
complete byte equality is checked separately by the differential suite.

| Measurement | Prepared | Scalar reference |
| --- | ---: | ---: |
| First 80-raster bundle in a fresh process | 287.0 ms | 1183.3 ms |
| Median of seven alternating-order rounds | 41.9 ms | 760.8 ms |

The median ratio is 18.15× for this CPU workload. The first prepared bundle runs
before the first reference bundle; these are not isolated per-frame startup
measurements. JIT warmup, GC and concurrent host activity affect the timings;
the observed range and all rounds are retained in `cpu-benchmark.log`. These
numbers do not establish browser FPS, eliminate the 907 ms browser close task,
or measure the independent Canvas blending change. Root owns ANGLE/Metal
profiling, actual screen comparison and final performance acceptance.

Reproduction (the real-resource tests fail instead of silently skipping missing
assets; `FIRMWARE_PRESENTATION_ASSETS` can override the delivery root):

```sh
node --test tests/native-raster-kernel.test.mjs tests/native-presentation.test.mjs tests/native-renderer.test.mjs tests/native-animation-binding.test.mjs tests/native-png.test.mjs tests/firmware-banner.test.mjs
node --test tests/firmware-model.test.mjs
npm run typecheck
NATIVE_RASTER_BENCHMARK=1 node --test --test-name-pattern='CPU benchmark' tests/native-raster-kernel.test.mjs
```

Parity here is with the existing JavaScript raster over decoded resource inputs,
not a new claim of pixel identity with original hardware, Canvas blending or
arbitrary malformed texture buffers. Raster API, filters, animation frames,
alpha inheritance and framebuffer blending are unchanged.
