# HUD original texture-sheet identity — 26 September 2026

The compact HUD font used by Settings combines six original BCFNT sheets into
one delivery PNG. Native cached text batches glyphs by original texture sheet
in first-use order. Losing that identity prevented the renderer from expressing
the source draw order for overlapping date glyphs (`)` is sheet 0; `t` is sheet
3). The Stock lane owns rendering and matched native/browser verification.

`scripts/convert_bcfnt.py` now adds `sourceSheet` to every glyph and fallback in
both compact and original-sheet outputs. It does not change `sheet`, coordinates,
metrics, texture formats, color modes, or image generation. The optional runtime
field allows older assets to continue using `sourceSheet ?? sheet`.

Only `fonts/hud/font.json` was regenerated in public delivery; its resource size
and SHA-256 were refreshed in the manifest. Other converted resources retain
their existing converter provenance. This bounded reconversion uses the updated
converter SHA-256 `63c261607c5a2f146a5aa8574f28b2288050cfe75cf7cc3b2761b1766f381512`.
The source is byte-identical to the manifest's HOME `font/Hud_JP.bcfnt`
(title `0004003000009802`), independently read from Settings content index 0,
content ID `0000003d`, `romfs/font/Hud_JP.bcfnt` (title `0004001000022000`).

| Identity | SHA-256 |
| --- | --- |
| Original BCFNT | `172b12ad40f2feb04d4422ec67dead3b579a4706ca2a6413f652e1f7de026bb8` |
| New delivered font JSON | `295bd5b072eec425d1862b220a3623497fec56398e9ff3176d1aff0625cf66a2` |
| Unchanged sheet-0.png | `c41bb1a929dd5755dbc6724afad2d3552474bfad9312019529029eb31b4fec28` |

The synthetic two-sheet regression checks identity across a sheet boundary,
fallback identity, unchanged metrics and exact compact PNG pixels. Real source
reconversion additionally verified that removing `sourceSheet` reproduces the
previous font JSON object exactly and that the generated PNG matches delivered
bytes. This is source/delivery evidence, not native visual acceptance. Browser,
Azahar, residual pixels and runtime behavior require coordinator integration.

Validation: seven synthetic converter tests, TypeScript checking, production
build and `git diff --check` pass. The lane's full JavaScript suite reports
1,309 pass, 40 fail, 23 skip and one todo; the coordinator identifies the 40
failures as known absent private/sparse model fixtures (including
`silver-audio-finish-web.glb`). Full integration validation remains separate.
