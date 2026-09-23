# Ordinary empty-slot opacity

2026-09-23. The existing direct SetSrc vacancy draw now applies the native
ordinary category-5 final-pane opacity **128/255**. This corrects the missing
opacity without claiming full native source-target fidelity. The authority is
the committed [original-ARM evidence](../scripts/firmware/BLANK_SLOT_ALPHA_EVIDENCE.md)
and the integration [implementation contract](native-empty-slot-opacity-contract.md).

Only `empty()` in `firmware-presentation.ts` changes: it saves Canvas state,
multiplies the current Canvas alpha by128/255, executes the existing draw, and
restores state in `finally`. It preserves the caller's alpha and returns the
draw result, including failure. The density binding, subpixel center, source
material/texture inputs, and generic raster path are unchanged.

Native `P_IconBtnDmy_00` receives this alpha after source rendering. The current
browser assembly directly renders the selected source picture. For the
supported resource configuration it contributes one picture, so the wrapper
adds the missing final opacity without attenuating overlapping layers
individually. `N_BlankAnime_00` keeps its native inherited closing transform
and alpha through `withPaneParent`; that alpha remains separate from the final
Canvas factor. The native configurable alpha32 route remains unsupported until
its runtime configuration is modeled.

## Resource and transport checks

[native-empty-slot-opacity.test.mjs](../tests/native-empty-slot-opacity.test.mjs)
uses the actual converted firmware resources and real presenter/renderer:

- **31 density samples** cover endpoints0–5, quarter steps, two irrational
  values, and both sides of every in-range visibility key. The visibility
  tracks are step tracks. Every sampled active subtree contains exactly one
  of `P_Blank_00` through`03`, with alpha255, white vertex colors, an always-pass
  alpha test and Add(SourceAlpha, OneMinusSourceAlpha) color blending. There
  are no active text or window draws in this subtree.
- Actual texture/material rasters across11 density samples retain identical
  RGB for inherited alpha0,0.145,0.625,0.865 and1. Their alpha independently
  follows the existing byte conversion. Source texture bytes and decoded
  resource data remain unchanged.
- Recording checks preserve fractional center/size/density, apply128/255 once
  on top of a caller alpha0.65, and restore alpha/composite state on successful
  draw, false return and thrown error. Subsequent software, folder, cursor and
  pickup-source draws retain the caller's original alpha.

## CPU Canvas comparison and its boundary

The optional SSD `@napi-rs/canvas` runtime compares the actual wrapper with a
diagnostic path that paints the same source subtree to a transparent
**320×240** surface, then composites that surface with128/255 opacity. Both
paths retain the existing inherited source alpha/transform. This synthetic
surface is **not** the original native64×128 source-target/atlas oracle.

The132 cases combine11 density samples, six parent states (ordinary, settled
frame16, closing frames12/8/6/0), and placements with zero or0.25-pixel offsets:

| Diagnostic result | Cases |
| --- | ---: |
| Byte-exact | 60 |
| Maximum RGB byte difference1 | 64 |
| Maximum RGB byte difference2 | 8 |

All12 ordinary/settled integer density-endpoint comparisons are byte-exact.
Fractional placement, fractional size and inherited closing transforms/alpha
can differ after the extra transparent-surface quantization and resampling.
The largest case changes556 channels. Both outputs remain opaque on the LCD.
These are measured bounds for this fixture, **not an accepted global tolerance**
or a claim of native/browser parity. Fractional cases are characterized rather
than asserted equal. Source atlas layout, target format, filtering and native
effective-alpha quantization remain unresolved by this patch.

The implementation adds no intermediate allocation or cache; the renderer
continues to own the existing source raster cache. No source pixels, colors,
folder ancestry, occupied artwork or generic raster math are modified.

## Validation

With `NATIVE_CANVAS_MODULE` pointing to the existing SSD Canvas package,
the focused suite passed49/49 with no skips; `npm run typecheck` and
`git diff --check` passed:

```sh
node --test tests/native-empty-slot-opacity.test.mjs \
  tests/native-cursor-presentation.test.mjs tests/home-presentation.test.mjs \
  tests/native-presentation.test.mjs tests/native-renderer.test.mjs
npm run typecheck
```

Logs and the132-case JSON remain under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/empty-slot-opacity/`.
Set `NATIVE_EMPTY_SLOT_RESULTS` to a private output filename to retain the
per-case diagnostic JSON. Without the optional Canvas runtime, that comparison
is skipped; the three other focused tests still run when firmware assets exist.
Root owns actual matched native/browser capture and integration/build checks.
No browser or Azahar session was used for this worker patch.
