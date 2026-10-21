# Folder cursor source and transport handoff

15 October 2026. Owned branch `codex/folder-cursor-sampling-20261015`, base
`5099bd5365b39618db9dc9314834e2d7f2fb0c2c`. This handoff is the only repository
change. Runtime source, assets, builds, profiles and existing captures remain
unchanged. The coordinator alone may operate the browser or native reference.

## Finding

The active cursor route rasterizes each window strip into local-grid RGBA, then
Canvas filters that already evaluated result onto the LCD. On the real cursor
resources, that operation is not interchangeable with evaluating the material
at destination sample positions. This identifies a concrete transport owner,
not a new geometry, asset, alpha, sampler or animation-clock correction.

At fixed primary center 76,137, Select 0, Scale 1 and Loop 41, an independently
drawn frame pixel at 55,99 is RGB 49,207,140 with direct texture/TEV evaluation
and RGB 75,211,154 under an ideal premultiplied-bilinear model of the current
two-stage route: maximum channel delta 26. The frame has 756 of 7,688 tested
interior pixels above delta 2; the halo has 484 of 12,784, maximum delta 7.
These are mathematical isolated-pane values, not the captured browser's final
overlapping composite. They cannot be summed into an LCD mismatch score.

Holding texture filtering fixed and changing only TEV/interpolation order gives
a separate frame counterexample at 41,100: RGB 50,224,167 versus 50,222,163.
There are 36 frame pixels above delta 2, maximum 4. The halo control is exact
for the tested phases. Thus the frame's nonlinear six-stage TEV has an order
effect; the halo's linear three-stage TEV still has a second-spatial-filter
effect. This does not establish original GPU precision or native-pixel parity.

## Source Closure

- EUR HOME `0004003000009802`, version 24576, content index 0, content `00000082`.
- CIA SHA-256 `2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`.
- Content SHA-256 `c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
- Raw `romfs/launcher_LZ.bin` SHA-256 `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.
- HOME `exefs/code.bin` SHA-256 `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
- Delivered `packs/home/launcher.json` SHA-256 `f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.

Fresh archive extraction and decoding reproduce the selected layout, Select,
Scale and Loop render fields and both texture PNGs. Only current decoder-only
`contents` and `contentIndex` metadata is projected out, explicitly recorded.
The six member hashes, source paths, delivered descriptors, manifest identity,
converter `ctr-native-web 1.2.0` / `CTRTool 1.3.0`, and current decoder hashes are
in the sealed `resources.json`. No decoded native visual was substituted.

Original HOME ARM entry `0x2e32c4`, executed with intercepted GPU/material/
transform endpoints, yields the same four-strip sizes, positions and UVs as
`nativeWindowPatches` for the 95x95 frame and 78x78 halo with 32x32 textures.
That validates window geometry arithmetic only. Both material sampler records
use linear min/mag and clamp S/T, source-over blend, and always-passing alpha.
The Loop-41 halo is scaled 1.5 with alpha 178. Both panes translate Y by -1;
primary center 76,137 therefore gives visible pane center 76,138. The unallocated
frame texture-matrix-1 tracks are explicit native skips, not missing bindings.

The active call is `cursorAt` in [firmware-presentation.ts](../../src/os/firmware-presentation.ts).
It does not opt into `pictureSampling: 'lcd'`. The window branch in
[native-renderer.ts](../../src/os/native-renderer.ts) therefore uses its local
picture raster plus Canvas composite. The prepared raster and scalar helpers in
[native-layout.ts](../../src/os/native-layout.ts) agree on all 279,040 tested
RGBA bytes at fixed phases 0, 4, 40, 41 and 44.

## Immutable Evidence

Private prefix:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/`.

Source audit directory: `folder-cursor-source/`.
Its sealed `manifest.json` SHA-256 is
`8a9087fe6b2b55a22f40336bb70fb70400e1a819cdaacf6f74188a48a9e52f9f`.
It covers source replay scripts, resource/geometry/sampling reports and limits.
Final `sampling.json` SHA-256 is
`4935f277de5dcef2b9ae718d9e7dcfa5a9b5f204a24aa5314b5240a658b24857`.
The initial approximate-center diagnostic remains separate; the final probe
uses actual capture metadata and records its hash. Earlier strict metadata,
null content-UV and signed-zero assertion refusals remain disclosed.

The existing native own-PNG endpoint SHA-256 is
`3ffce5be84a22358467a9b81fb5623c074a3b9d4e0ed70eec5cd1c3641b655fc`;
the browser first-Open receipt 354 lower PNG SHA-256 is
`dee64f9124448a3f2010534164fdd6cda56deff8f0da2216d26191b6d691ce94`.
The native and browser phases remain unmatched, with empty whole-LCD masks.
The existing endpoint sheet was inspected read-only. No nearest-phase search,
new native capture or pixel-acceptance claim was made.

## Prepared Experiment

The coordinator authorized a private static harness in
`folder-cursor-transport-control/`, not a production edit. Its README contains
the exact server command and coordinator-only run procedure. The server binds
only `127.0.0.1` and serves 11 hash-verified allowlisted files. No package,
executable, arbitrary path or generic upload is exposed.

The current renderer and its imports are transpiled with existing TypeScript
5.9.3. A private copy adds one optional pane-name field and one guard to the
existing window LCD opt-in. Four final-composite variants are baseline,
frame-only LCD, halo-only LCD and both LCD. The frame/halo variants isolate
each pane's route effect after overlap; they are not isolated-pane renders.

The predeclared policy fixes center 76,137, Select 0, Scale 1, opaque background
223,219,215, and every integer Loop phase 0 through 59. Full authored ROI is
15,77,122,122. Exact outside-ROI equality and opaque output are safety gates.
A known-byte opaque Canvas PNG must round-trip exactly before frames are saved.
All four phase-41 views repeat after the sweep and are compared byte-for-byte
against their own first saved phase 41. PNGs, hashes and receipts are preserved
with exclusive writes. The page returns to side-by-side Loop 41.

Default Canvas contexts match the production target, but direct routes perform
more internal readbacks. Exact repeats would demonstrate stability, not equal
backend history or equivalence to a long-running production context.

Prepared manifest SHA-256:
`083d8eeeca1e8cab2d2b84c4203ee9234552f80b4a320f247e6e851aa4d017be`.
Policy SHA-256:
`00889a7079ccf74908b1f3a8fe015eb902145970c0f004122270c9bb76281f92`.
The 18-file preparation seal `ready-manifest.json` SHA-256 is
`26e799d9d0b1db4d95285ccead6ed22ad126c9d50bf779e250a15d61683b746b`.
Offline syntax/import closure, frame validation, pngjs control and ROI metric
checks pass; read-only server verification confirms no server was started.
Independent source replay is clean; harness review and browser metrics are
pending at handoff preparation. The coordinator will run only after review.

## Decision Boundary

The earlier direct-LCD candidate remains rejected, as recorded in
[home-cursor-compare.md](home-cursor-compare.md) and
[home-settings-cursor-2026-10-04.md](../home-settings-cursor-2026-10-04.md).
This control removes its live background and upper-LCD confounders; it does not
silently revive that candidate. Prepared/scalar agreement is only a supporting
check under [native-raster-kernel-validation.md](../native-raster-kernel-validation.md).
The current cursor clock is already known to traverse all 60 phases; it was
not reinvestigated.

Source identified: yes. Delivery closure: yes. Offline numerical tests: yes.
Production implementation: none. New browser inspection: none. New matched
native comparison: none. Strict 1:1, motion, input and audio remain unproven.
Portfolio population, existing fitted visibility/empty-slot adaptations and
partial-neighbour loading remain outside this bounded slice. No native visual
or sound adaptation was added. The next action is the reviewed visible control,
then a coordinator decision based on its exact saved results, not another broad
source audit or a source-only shipping recommendation.
