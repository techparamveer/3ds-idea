# Native LCD destination-darken fast path

Date: 2026-09-23. Implements the upper-base section of integration's
performance contract (initial `c18a25f`, followed by the explicit opt-in revision).
This is a Canvas transport optimization, not a claim of native hardware pixel
parity or completed performance acceptance.

## Change and scope

`native-renderer.ts` recognizes only Add (1), source Zero (0), destination
OneMinusSourceAlpha (5), with explicit Always alpha comparison (7). The actual
`LncBase_U_00` material `CameraBaseS_00` matches this predicate. Its native visible
RGB is `D * (1 - As)`; source RGB contributes nothing.

After the existing material evaluation and byte packing, the cached picture or
text raster keeps its alpha bytes and replaces RGB with black. The compositor
can draw that raster with Canvas `source-over` under the guards below. On the
opaque LCD destination this produces the same RGB equation and retains opaque
output. It does not use
`destination-out`, which would leave alpha holes. Text's existing glyph readback
remains; the optimization removes the uncommon full-LCD blend readback.

The predicate is local to the renderer. `NativeDrawOptions.allowOpaqueDarken`
is false by default. Opting in guarantees an opaque target with no inherited
fractional clip, which Canvas cannot introspect. The renderer further requires:

- `globalAlpha === 1`;
- an axis-aligned final transform;
- whole-device-pixel final rectangle bounds and one raster texel per device pixel;
- whole-device-pixel bounds for its own `options.clip`, tested using the transform
  before applying that clip.

Text has an additional pane clip and always keeps the old compositor. Fractional
placement, resampling, rotation/shear, nonunit Canvas alpha, fractional explicit
clips and callers without the opt-in also keep the old compositor. Discarding
source RGB is safe there too: its native blend coefficient is zero.

Root integration owns the sole production opt-in at `upperBase`, with the
explicit clip `[0,212,400,28]`. The source hierarchy with SceneIn 40, Appear 10
and WhiteBlack 0 places the 400×28 camera raster at device `[0,215]`; the test
confirms that this draw reaches the fast path without an LCD readback.

Missing alpha comparison and all other blend equations retain their prior paths.
Material overrides use the same
predicate in both raster preparation and composition. Raster keys, immutable
dynamic texture identities, sampling regions, the 8 MiB LRU accounting and
disposal are unchanged. Canvas receives the existing transform, clip and global
alpha, with save/restore around the draw. Native primary alpha still enters TEV
evaluation before byte packing; no alpha factoring or animation change occurs.

This patch was made against the existing presentation renderer. It does not
import or replace integration's `withPaneParent` addition from `d30da2e`, and
does not edit the runtime worker's `native-layout.ts`.

## Verification

`tests/native-darken-blend.test.mjs` covers:

- every evaluated alpha byte 0–255, including zero and full coverage;
- all 65,536 opaque destination-channel/alpha-byte combinations against the
  independent `blendNativePixel` equation;
- other blend operations/factors, every non-Always alpha comparison and a
  missing comparison, plus unchanged ordinary, no-blend and multiply paths;
- zero LCD readbacks on the fast path, opt-in/default behavior, integer device
  bounds, one-to-one texels, transform/clip/Canvas-alpha guards and restored context;
- immutable dynamic texture identity, LRU eviction/accounting and disposal;
- effective material overrides and cropped-sampling cache keys;
- text alpha after its existing glyph/material evaluation and required fallback;
- actual decoded `CameraBase_06.bclim` and `CameraBaseS_00` material at primary
  alpha 0, 0.125, 100/255 and 1, with byte-exact retained alpha.

The recording Canvas in the mandatory tests checks transport/state only; it does
not simulate browser rasterization. Two additional tests can use a real Canvas
module supplied via `NATIVE_CANVAS_MODULE`. No dependency was added to the
project. The measured module was `@napi-rs/canvas` 1.0.9, installed in the SSD
artifact root under `presentation/native-darken-canvas/`.

Commands passed:

```sh
NATIVE_CANVAS_MODULE=/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/native-darken-canvas/node_modules/@napi-rs/canvas/index.js node --test tests/native-darken-blend.test.mjs tests/native-renderer.test.mjs tests/native-presentation.test.mjs
npm run typecheck -- --incremental false
```

Result: **41/41 tests passed**, no skips with the source assets and optional
Canvas module present; typecheck passed. The thirteen new tests include two
optional Canvas tests. Source-asset tests explicitly skip when the extracted launcher
pack is unavailable.

## Precision and remaining browser verification

CPU Skia measured zero differing output channels across all 65,536 opaque
destination/alpha byte pairs. Actual evaluated alpha is retained byte for byte;
black RGB introduces no unpremultiplication loss. Other Canvas implementations
may round compositing differently, so this is measured local evidence.

The optional test compares the actual 400×28 camera raster at pane alpha 100/255
with the old transformed readback compositor on an opaque RGB(173,219,247) target.
The maximum evaluated source alpha in this fixture is 18/255.

Initial unguarded experiments found up to 4 RGB bytes of difference under
rotation, up to 1 with a fractional clip, and up to 7 at a half-pixel translation.
These findings caused the guards above; they are not accepted precision losses.
The old path draws into an intermediate Canvas, reads quantized pixels, applies
an inverse-transform pixel-center inclusion test, then copies the result through
the destination clip. Direct Canvas coverage/resampling is not equivalent in
those cases. Nonunit Canvas alpha also changes the old final-copy semantics.

With the final guards, the optional test requires **zero differing RGBA bytes**
for all twelve cases:

| Case | Path | Maximum byte difference |
| --- | --- | ---: |
| Integer translation | Fast | 0 |
| Translations 0.1, 0.25, 0.5, 0.75, 0.9 | Existing readback | 0 |
| Axis-aligned scale 1.035 | Existing readback | 0 |
| Fractional rectangular clip | Existing readback | 0 |
| Rotation 0.025 rad / scale 1.035, with and without clip | Existing readback | 0 |
| Canvas global alpha 0.65 | Existing readback | 0 |
| Settled source hierarchy / actual upper-base clip / 400×240 LCD | Fast | 0 |

The tests validate this CPU Canvas backend; they do not establish universal
browser pixel parity. Transparent destinations and inherited fractional clips
are outside the opt-in contract. The actual browser/ANGLE output and before/after
close timing remain owned by root integration. No browser or Azahar session was
controlled for this change; no smoothness improvement is claimed from these
unit checks.
