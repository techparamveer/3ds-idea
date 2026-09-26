# Camera capacity symbol: remaining horizontal source gap

After the vertical-overhang correction, all **258 upper LCD pixels over 2/255**
in `camera-guide-page1-glyph-1fda6c7` belong to the Camera symbol. The digits,
2D cube and SD indicator have no remaining pixels over that threshold in this
specific static capture. This investigation adds an audit, not a runtime change.

## Source facts

The original `P_Finder_U/RootPane/PhoRem/ShootCapa_Pho` pane is 172×16 with
center origin4, translation `(31,-2)` under parent `(-140,108)`. Its left edge
is LCD X5. `P/Finder_Pho_00_00` begins with U+E01E and selects RI.mstl style110.
Original HudNOTES metrics for that glyph are bearing0, advance22, width23 and
cell height24. The already traced writer Y produces LCD Y1. Thus the currently
interpreted layout/font pair emits the symbol quad at `(5,1)`; its bright ink
starts at X8. Original atlas pixels need no replacement or rescaling.

The preserved native symbol is exactly explained, within the 2/255 threshold,
by the **same source glyph** at `(3,1)`, with bright ink starting at X6. The
hash-pinned font is recorded in the [vertical-overhang evidence](camera-guide-upper-glyph-overhang.md).
The new audit asserts the original glyph metrics and message/control data.

A concrete source clue remains:

- Style110's unnamed word at byte offset0 is **176**, four greater than the
  authored pane width172. If the controller installs this as the center-origin
  pane width, its left edge becomes X3.
- Immediately after the Camera glyph, the message contains group2/type0 with
  argument `0200`, followed by the group3/type39 numeric substitution with
  argument `0000`, followed by another group2/type0 `0200`.
- If the first group2 control advances the writer by2, the numeric glyphs
  retain their currently matching positions after that width change.

These two conditional interpretations fit the capture together. They are
**not yet established executable behavior**. The delivered schema deliberately
names only fontScale/lineSpacing/characterSpacing and retains offset0 as
`unresolvedWords['0']`; see `scripts/firmware/README.md`. Existing Camera counter
width adapters do not prove the capacity controller's style application.
The group2/type0 consumer has no traced writer-state effect in this task.
A bounded executable string inspection found `RI.mstl` at `0x31bf90`, but did
not resolve the consuming style/control functions. The source executable is
still the Camera hash `3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.

## Reproducible diagnostic

`scripts/audit_camera_capacity_symbol.py` reads the original delivered message
pack, font/atlas and preserved native/browser captures. It requires Pillow and
absolute `--pack`, `--font`, `--native`, `--browser`, `--output` paths. It records
input hashes and distinguishes its diagnostic transformations from production.
The executed report is private at:

`/Users/paramveer/.codex/3ds-artifact-overflow/presentation/camera-capacity-symbol-source-gap/report.json`

| Comparison | Pixels over2 | Maximum RGB error |
| --- | ---: | ---: |
| Original native versus browser upper | 258 | 221 |
| Outside symbol columns X0–27 | 0 | 2 |
| Browser symbol moved −2px diagnostically, every other pixel retained | 0 | 2 |
| Original atlas U+E01E at diagnostic origin `(3,1)`, symbol region only | 0 | 2 |

Native input SHA-256:
`52a6dcf75c85d9be6cdc9e245f5767acfcf4373400a06c584f5dbd3a915bdf6b`.
Browser upper input SHA-256:
`54b2439c71d1eb2227cdbadfe03b4c40a54c8986877e372c4eb2c1e7cfb66fcb`.

The executed audit establishes that the outstanding upper defect is the symbol's
horizontal origin, and supplies the exact next source targets: style110 +0
installation into this pane and group2/type0 writer-X handling. It does not
establish that every Camera or native text pane should receive that width or
control interpretation. No symbol-specific fitted offset, source-font mutation
or unsupported global tag rule has been installed. Runtime/tests/build are
unchanged; the diagnostic itself was executed successfully. The original
integrated capture remains a failing scenario until a source-backed correction
and fresh native/browser comparison are complete.
