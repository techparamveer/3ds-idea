# Settings HUD source texture batching — 26 September 2026

Target: production `settings-other1-coverage-fit-b5543c4-20260926` has two upper
pixels above2, lower0, against native `_26.09.26_04.31.13.302.png`.
The pixels are(304,15),(305,16). They belong to the date's final `t)` overlap,
not the clock colon (which is at x339..342).

## Exact source cause

The date text `26/09(Sat)` is right-aligned in `HudMset_00/T_Date_00`.
Source `t` has advance5,width7, at screen x299..305; `)` has advance6,width7,
at x304..310. Shared edge positions are integer; no coverage or filtering
adaptation is needed.

The original HUD CFNT has six source texture sheets. `)` is on sheet0, `t` on
sheet3. The compact delivery packs them into one PNG, and previously discarded
the original sheet identity. Native cached text renders by **first-used source
texture batch**, retaining glyph order within each batch. It does not render
all glyphs in string order and does not globally reverse them.

Original Settings executable SHA-256:
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`.
Direct disassembly establishes:

- `0x1eb944..0x1eb984`: find first unprocessed glyph and its record;
- `0x1ebbf0..0x1ebc00`: compare each glyph's source texture identity against the
  current batch, skipping nonmatching records;
- `0x1ebd74..0x1ebd80`: mark emitted glyph as processed;
- `0x1ebdec..0x1ebdf4`: return to the first-unprocessed scan until all are drawn.

The corresponding retained HOME writer anchors are0x1ac638,0x1ac8e4,0x1aca68,
0x1acae0. The Settings instruction spans match directly; the result is not
inferred solely from another title. Private disassembly is in lane
`.local/hud-overlap/settings-cached-writer.asm`.

Date first-use batches are0,1,2,3, so `)` draws before `t`:

| Pixel | t RGBA | ) RGBA | Old browser RGB | Source-batched replay | Native RGB |
| --- | --- | --- | --- | --- | --- |
|304,15|17,17,17,255|0,0,0,170|245,240,206|237,232,199|236,232,199|
|305,16|0,0,0,51|102,102,102,255|170,167,146|186,182,159|186,183,159|

Both replay results are within1/255. No native image pixels are copied into
runtime. The original LA4 atlas and implicit material remain unchanged.

## Implementation and dependency

`Glyph.sourceSheet` is optional; fallback is the delivered `sheet` for legacy
manifests. `BitmapFont.drawNative` preserves original positions, then batches
luminance-alpha glyphs by source identity in first-use order. Centered and generic
native LA paths share this batching. Alpha-mask glyph paths remain unchanged.
A focused test uses source order2,0,3,2,0 to distinguish first-use batching from
numerical sheet sorting, reversing the text, or merely retaining string order.
It also checks glyph positions and compatibility with legacy manifests.

The Assets lane supplies converter preservation and regenerated HUD JSON. Native
font source is Settings `romfs/font/Hud_JP.bcfnt`, SHA-256
`172b12ad40f2feb04d4422ec67dead3b579a4706ca2a6413f652e1f7de026bb8`.
The regenerated delivery JSON SHA-256 is
`295bd5b072eec425d1862b220a3623497fec56398e9ff3176d1aff0625cf66a2`;
PNG pixels, glyph coordinates and all metrics are unchanged. Runtime and this
metadata must be integrated together to correct compacted original-sheet order.

## Evidence and limitations

Combined source replay uses the independently decoded original source-sheet
metadata and changes exactly the two named pixels in each of the three retained
Saturday HUD specimens. All other Settings verifier images, including all50
lower renders, are identical. Their default date is Thursday, which has no such
two-pixel overlap. The correct production prediction is upper2→0 for the
matched Saturday pair; this remains pending coordinator recapture.

121 focused font/renderer/Health/Settings tests pass, one existing TODO;
typecheck, build and diff-check pass. No shader changed. Logs and comparison are
under `.local/hud-overlap/`. No browser or Azahar session was operated. This
source-backed correction does not establish full scenario timing/input parity.
