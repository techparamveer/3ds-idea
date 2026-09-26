# Native glyph endpoints belong to the writer's coordinate space

This follow-up narrows the [Touch Screen endpoint correction](settings-touch-glyph-endpoint-2026-09-26.md)
after independent review of `600bf6f`. The original correction recovered three
missing pixels, but applied float32 rounding in the generic alpha rasterizer,
after its caller had already translated coordinates. That is a different
arithmetic boundary from the native glyph writer.

The retained HOME writer source trace is
`runtime/reference/font-sampling/07-glyph-quad-and-uv.asm`, executable SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
At `0x1ac050` and `0x1ac058`, local float32 positions and scaled dimensions
produce endpoint vertices; `0x1ac05c..0x1ac078` stores those vertices.
The traced single-line writer origin is computed before the browser's pane
origin conversion (`width/2`, `height/2`). Rounding after that conversion can
change precision with coordinate magnitude. Health's article caller additionally
provides already transformed and scrolled coordinates; this trace does not
support re-rounding those values in the shared rasterizer.

`nativeSingleLineGlyphQuads` now carries explicit `right` and `bottom`
endpoints, rounded in writer coordinates and translated with the other vertices.
`rasterNativeAlphaGlyph` consumes those endpoints when supplied and otherwise
retains the caller's original coordinate arithmetic. Health's article path
therefore regains its pre-`600bf6f` coverage behavior. Assets, glyph dimensions,
positions, sampling formulas, color and edge tie rules are unchanged.

The regression tests retain the original shared-font Touch Screen case and
add horizontal and vertical boundary cases where a pane translation crosses
a float32 precision boundary. A transformed article-style quad test checks
both sides of fractional scroll/translation edges without writer endpoints.

## Offline checks

Artifacts, commands and before/after renders are under the private
[endpoint audit directory](/Users/paramveer/.codex/3ds-artifact-overflow/presentation/glyph-local-endpoints/comparison.json).
The base is `437f2c6`, which includes `600bf6f`.

| Existing native lower comparison | Before >2/255 | After >2/255 |
| --- | ---: | ---: |
| Other Settings page 1 | 0 | 0 |
| Settings main cold source-verifier pose | 395 | 395 |
| Health entry | 0 | 0 |

Other lower RGB MAE remains 0.155143; Health entry remains 0.024852. The cold
main verifier pose is not the production main pair and does not replace its
59 upper / 20 lower measurement. Every Settings main render and all Settings
upper renders are byte-identical in decoded pixels before/after.

Both Settings verifier runs pass five main and 44 subpage pairs. Of 100
individual Settings PNGs compared, nine lower images change: Internet (4
pixels), 3DS data (16), Sound detail (17), Software and Extra Data detail (23
each), Time detail and supplied Time (10 each), Birthday detail and supplied
Birthday (4 each). These source-supported coordinate corrections still need
native comparison for those subpages; they are not fidelity passes.

Eight Health paired source views cover entry and article top/interior/end,
including pressed/released scrollbar poses. Seven pairs are byte-identical;
3D article interior lower changes at nine pixels. A separate replay using the pre-`600bf6f` bitmap-font source confirms the
article body is restored: the only differences from that older baseline are
four title pixels at x30, y11..14 on each 3D article view. Those title pixels
retain the single-line writer endpoint correction. The Health-specific source
assertions for title/Back coverage, scrolling and pressed-thumb bounds pass.
The private runner adapts the existing stock verifier to Health only because
the full stock verifier has an unrelated missing `camera-browse` compilation
dependency and missing lane portfolio JPEGs; no full stock-verifier pass is
claimed. Tests and typecheck are separate from raw LCD acceptance.

All 59 focused bitmap-font, native-renderer, Health and Other Settings tests,
TypeScript checking and `git diff --check` pass. No browser/Azahar session was
operated. Health upper animation remains frozen at frame zero and is a separate
slice. Strict application fidelity and motion/audio acceptance remain open.
