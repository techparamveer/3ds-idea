# amiibo native material command trace

This follow-up locates the original applet's material constructor, two-texture
command builder and projected-coordinate routine. It advances the
[initial material audit](native-amiibo-initial-ui.md#material-blocker-audit-2026-09-24),
but does **not** enable Header or PortalBtnSub. The missing equations are now
bounded to specific source functions; a complete material result remains
unverified. No runtime, public asset, network, account or NFC behavior changes.

## Pinned image and reproducible audit

Use the supplied EUR title `000400300000b902`, decompressed `exefs/code.bin`,
SHA-256 `316c8a1cb37c2aab7813a5546f355ab0bdd3f635fe56b606abf91bb191a1d2d9`,
with addresses mapped from `0x100000`. Function names below describe roles inferred
from their data flow; the image has no corresponding debug symbols.

Run `scripts/audit_amiibo_material_commands.py --code <absolute-code-path>
--report <absolute-report-path>`. It reads the image as data, verifies its hash,
pins six source ranges and three command tables, and decodes the bounded PICA
records. It does not execute or emulate any applet instruction. The retained
report is at SSD firmware root
`reference/amiibo-material-semantics/commands.json`.

## Material construction and command selection

- Picture construction at `0x1ce7b0–0x1ce804` reads its material index, resolves
  the source record via `0x1d0a8c`, allocates an `0x84`-byte object and calls
  `0x1cfdb0`. Window construction calls the same function for content
  (`0x1ce3f8`) and frame (`0x1ce508`) materials.
- The constructor `0x1cfdb0–0x1d0984` copies source black/white registers from
  record offsets `0x1c/0x20`, reads flags at `0x24`, and advances past texture
  maps, matrices and coordinate generators. `0x1cfec8–0x1cfed0` uses **three**
  combiner-count bits (6–8), rather than the converter's current two-bit bounded
  interpretation. All four audited opening materials have count 1, so this
  does not alter their record boundaries. Wider support must fix that count.
- `0x1d0654–0x1d06b8` stores the count in runtime flags and copies the 4-byte
  combiner records. It does not translate their enum labels at this stage.
- Material dispatch `0x1ca458–0x1ca480` branches on the texture count. Count 2
  calls `0x1cb42c` at `0x1ca688`. This is the relevant path for both header
  materials and both missing button-shade materials.
- `0x1cb49c–0x1cb4c0` reads color byte 0 and selects the native template case:
  source 0/default→0, 1→1, 2→2, 3→4, 5→3. `0x1cb4c4–0x1cb4d0` reads alpha
  byte 1, distinguishing value 1 from the other values. Only source color 0/1
  and alpha 0/1 are relevant to these four materials.

The command packet structure and field interpretation are corroborated by
[Azahar's pinned PICA register definitions](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/video_core/pica/regs_texturing.h#L266).
These definitions interpret commands extracted from the applet; they do not
prove a matched native framebuffer.

| Source table | PICA stage | Color before texture-format patches |
| --- | --- | --- |
| `0x1ed5bc` | 0 | Replace with texture 0 RGB |
| `0x1ed5d4` (source color 0) | 1 | `texture1.rgb * texture1.a + previous.rgb * (1 - texture1.a)` |
| `0x1ed5ec` (source color 1) | 1 | `texture1.rgb * previous.rgb` |

At stage 1, both templates initially have zero alpha-operation bits.
`0x1cb698–0x1cb6a8` sets operation 1 for source alpha 1 (multiply), or
operation 2 otherwise (add). Its two alpha inputs are texture 1 alpha and
previous alpha. The normal PICA stage clamp applies. Thus alpha 0 here is
**saturated addition**, not a Max operation inferred from an external format
label. This is stronger evidence than the earlier enum-name audit.

These are intermediate stage equations only. `0x1cb640–0x1cb694` conditionally
replaces each texture's RGB source selector with constant selector `0xe` when
runtime texture metadata bits 8–15 equal 1 or 13. Those are **native texture
object codes**, not established public `picaFormat` values. Their mapping must
be traced through texture setup (`0x19b5e4` and its callers) before interpreting
A8/L8 behavior or implementing this path. Later stages and black/white register
application also need a complete register-state reconstruction; the constant
writer at `0x1cc890` alone does not establish those stages.

## Projected coordinates

The coordinate dispatcher `0x1dc71c` selects on the source byte. Its table entry
at `0x1dc7e8` sends source 4 to `0x1dcc58`, which calls `0x1c85c8` at
`0x1dcc78`. The constructor has already linked source 3/4/5 coordinate records
to their projection records at `0x1d03e8–0x1d040c`.

`0x1c85c8–0x1c89dc` is the source projection-matrix builder:

- `0x1c8684–0x1c869c` reads projection option bits 0, 1 and 2 separately.
- Option 6 selects pane dimensions at `pane+0x3c/+0x40`
  (`0x1c86b0–0x1c86b8`), not texture dimensions or the layout dimensions.
- Source 4 branches at `0x1c86e4` to `0x1c8854`. Option bit 2 takes the path
  that consumes the pane matrix at `pane+0x48`, calls `0x18c590`, then
  composes matrices via `0x182a64` (`0x1c8900–0x1c8910`). The mathematical
  role of that first matrix helper still requires independent validation.
- The common tail also composes `drawInfo+0x74` at `0x1c8790–0x1c879c`, and
  applies source texture-matrix/extent adjustment through `0x1cfcec` at
  `0x1c87ac`, followed by another composition at `0x1c8804`.

Therefore replacing source 4 with the window's ordinary normalized UV set
would discard real native dependencies. The mapping of native pane/draw
matrices, matrix multiplication order, logical versus padded texture extents,
and frame-patch coordinates to the browser renderer must be established before
adding a bounded implementation. The audit does not assert a projected-UV
formula or any complete rendered header color.

## Verification and handoff

The pinned command audit passes. The original RomFS converter checks pass
**13/13**, and real converted-resource part/renderer checks pass **14/14**, with
no skips. Current supported portal parts were source-rendered and visually
inspected; their registers, labels and Close button remain intact. The diagnostic
intentionally hides the unresolved update part and omits Header. It is not a
complete opening-screen reference.

Fresh attempts to render the original Header and PortalBtnSub both return
`false` with `Unsupported FLYT material fields`. No source resources were
mutated and neither incomplete render was published. The source-render report,
reproduction scratch and inspected PNG are under SSD firmware root
`reference/amiibo-material-semantics/` (`renders.json`, `render.mjs`,
`supported-parts-diagnostic.png`). No browser or emulator was launched.

Next bounded work: establish the native texture metadata mapping and complete
post-combiner stage state, then validate the source-4 projection math against
known transforms and original material samples. Only after these checks should
the converter's unsupported flags be removed and selected resources published.
A matched native opening-screen comparison and the unresolved header call-name
selection remain acceptance dependencies.
