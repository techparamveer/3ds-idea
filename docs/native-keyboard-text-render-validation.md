# Nickname text and attached cursor rendering

`scripts/verify-native-keyboard-text.mjs` verifies the real `TextArea_02` and
attached `DecorCursor` components using `nativeNicknameInitialTextPose`, the
strict title loader, native PNG decoder, shared bitmap font and CPU Canvas
renderer. It does not drive the browser or start a keyboard session.

The runner requires explicit absolute input and output paths. All compiled
modules, PNGs and reports are written beneath `--artifact-dir`; point it to the
SSD artifact directory. No firmware resources are copied into the repository.

```sh
node scripts/verify-native-keyboard-text.mjs \
  --artifact-dir "$TEXT_CHECK_ARTIFACT_DIR" \
  --reference-root "$NATIVE_KEYBOARD_REFERENCE_ROOT" \
  --pack "$NATIVE_KEYBOARD_TEXT_PACK" \
  --font-manifest "$NATIVE_KEYBOARD_FONT_MANIFEST" \
  --canvas-module "$NATIVE_CANVAS_MODULE"
```

`--reference-root` is the private `runtime/keyboard-native` directory containing
original members, decoded layouts and the frozen text contract. `--pack` is the
private converted common keyboard pack, with its texture URLs relative to that
file. `--font-manifest` points to the real shared `font.json`, whose sheets must
be adjacent. `--canvas-module` is the absolute `@napi-rs/canvas/index.js` path.

The checks cover:

- Original layout hashes, frozen fixture/result hashes, exact decoded layout
  agreement, and the presence of every required ASCII glyph.
- Every captured local text, visibility, color, position, scale, size and line
  spacing value after applying the module's overrides.
- Pixel equality between module-generated overrides and independently assembled
  frozen-contract overrides, including the cursor attached to `N_transDecor`.
- Cursor placement projected independently from frozen local fields plus the
  unchanged authored `P_textArea_00` container. This check consumes neither the
  renderer's parent cache nor its transform implementation.
- Actual glyph pixels, occupied-cell color pixels, visible cursor pixels,
  immutable source assets, empty renderer diagnostics and deterministic reverse
  repaints through the same renderer caches.

The cursor attachment uses the public `withPaneParent` final override argument,
with exactly the text-area draw's overrides. An earlier API inspection found
that parent drawing ignored those overrides; the coordinator fixed it in
`11537d6`. The runner does not work around this by replacing or pre-posing the
asset pack.

## Observed component results

The three 320×240 PNGs were inspected. The first ten cells occupy one row,
remaining cells stay hidden, unused cells are beige, occupied cells are pale,
and the orange cursor follows the text. All draws and assertions pass without
renderer diagnostics.

| Text | Cursor pixel bounds, exclusive right/bottom | Glyph-difference pixels |
| --- | --- | --- |
| empty | `[25, 11, 27, 48]` | 0 |
| `Ada` | `[106, 11, 108, 48]` | 664 |
| `ABCDEFGHIJ` | `[292, 11, 294, 48]` | 2204 |

Each cursor contributes 74 changed pixels relative to the same component with
cursor submission omitted. These are observed CPU Canvas output values, not
native LCD golden pixels. `verification.json` records source hashes, resource
hashes, projected cursor rectangles, fetches and per-case pixel hashes.

The actual artifacts are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/keyboard-text/`.
The matching test is `tests/native-keyboard-text-render.test.mjs`. Set all five
variables `NATIVE_KEYBOARD_TEXT_ARTIFACT_DIR`, `NATIVE_KEYBOARD_REFERENCE_ROOT`,
`NATIVE_KEYBOARD_TEXT_PACK`, `NATIVE_KEYBOARD_FONT_MANIFEST` and
`NATIVE_CANVAS_MODULE` to run it. It skips when the private environment is absent;
the standalone runner always requires its inputs and fails on missing data.
With the private inputs supplied, the text-pose, real-render and renderer suites
pass all 11 tests with no skips, including the coordinator's parent-cache
diagnostics fix `c54668f`. The script syntax check also passes. Latest outputs
from that combined run are in the artifact directory's `test/` subdirectory.

## Scope limits

The frozen contract stops after local first-text-update writes, before the
layout/controller pass. This runner does not advance blink, infer scene prepare
passes, reproduce the retained fade image, or compose other keyboard layouts.
It verifies that these local values reach the renderer, not that native world
matrices or glyph rasterization match a captured LCD frame.

The runtime worker's corrected English language-family replay preserves all
emitted frozen local fields. Its separate write to blank `T_trans` material
`+0x14` remains uninterpreted and outside this check; `T_trans` receives one
space. See the private lower-first-paint README for that correction. Full
English initialization, keyboard input, browser rendering and matched native
LCD acceptance remain separate work.
