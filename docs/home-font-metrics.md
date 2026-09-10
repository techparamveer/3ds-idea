# BCFNT glyph metrics and atlas handling

This increment extends the existing converter and font renderer. It does not change `src/os/screens.ts`, its API, or any hardware/runtime surface file.

## Primary format basis

[libctru's font implementation](https://github.com/devkitPro/libctru/blob/master/libctru/source/font.c) distinguishes signed left bearing, glyph width and character advance. It selects glyphs through CMAP, substitutes the alternate glyph when needed, falls back to FINF widths when no CWDH entry applies, and calculates atlas positions with one-pixel cell gutters. Its baseline placement subtracts the scaled baseline from the requested baseline coordinate. [The structures](https://github.com/devkitPro/libctru/blob/master/libctru/include/3ds/font.h) also distinguish cell height, font height and line feed. These are the basis for the implementation; no upstream code is vendored.

## Implemented changes

- `measureBitmapText()` returns baseline-relative glyph rectangles and per-line advances. It respects signed bearings, zero-width glyphs such as spaces, fallback glyphs, scaling, CRLF/newlines, line feed, and per-line alignment. Multiline alignment is an explicit browser API convention, not a claim about HOME Menu message layout.
- `BitmapFont.draw()` uses that measurement while preserving its existing single-line middle positioning and tint cache. Existing screen calls remain compatible.
- Manifest validation checks the CFNT character-map range, required glyph fields, signed bearing limits, advance limits, sheet names and rectangle bounds. The constructor copies caller-provided metadata. Font loading validates decoded atlas dimensions before constructing the renderer.
- The converter rejects unsupported CFNT revisions and undersized FINF/TGLP/CWDH/CMAP blocks. It checks scan-map ranges and retains the first width/mapping for repeated entries. A4/A8 Morton decoding, original glyph mappings and the source hash remain intact.

No default production asset request was added. `loadBitmapFont()` is still opt-in, and the website continues to use its existing fallback until original converted data is supplied.

## Verification

```sh
node --test tests/font-metrics.test.mjs
python3 -B -m unittest discover -s tests -p 'test_bcfnt.py'
```

Five JavaScript tests and six Python tests pass. Coverage includes bearings versus advance, baseline and line feed, spaces, unknown/supplementary characters, per-line alignment, original draw positioning, tint reuse, loading/atlas bounds, A4 nibble order, A8 tile layout, three CMAP methods, default widths, second-sheet glyph lookup, missing fallback, malformed blocks and unsupported revisions. Strict standalone TypeScript checking passes for the renderer.

All fonts/atlases in tests are tiny synthetic structures. The loader test substitutes a decoded image object; it does not demonstrate browser PNG rasterization. The source-dependent orientation, antialiasing, baseline appearance and exact HOME Menu label sizes still require visual verification.

## Asset dependency

Required: a standalone decrypted, little-endian CFNT v3 UTF-16 font with A4 or A8 sheets, ideally both the HOME Menu font directory and the shared-font title contents. A relocated `CFNU` shared-memory dump requires separate pointer normalization and is rejected. Other sheet formats require a verified sample and decoder extension. The supplied encrypted CIA ZIP still does not provide usable glyph data to this pipeline. No Nintendo font or artwork is included in this commit.
