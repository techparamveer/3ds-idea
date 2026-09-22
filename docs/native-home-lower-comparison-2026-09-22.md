# First native HOME lower-screen comparison

This pass compares the owner's European 10.7.0-32E HOME capture with the integrated browser output, then checks a software rendering of the corrections. It is a bounded presentation correction, not whole-screen visual acceptance. The integration task owns browser/Azahar operation and the final browser recapture.

## Reference and regions

Artifacts are under `/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`:

- Native: `reference/screenshots/_22.09.26_21.15.03.46.png`, SHA-256 `60f5a4e1e19c904115c07767f47a06c17fe7dae674888b6146d7459159844994`. The lower display is the 320×240 crop at `(40,240)` of the 400×480 capture.
- Browser before: `browser-home-first-bottom.png`, from integrated `9fc57bd`, SHA-256 `ee9717efe7ae6a2039a99710da407f5e84d611513ec80cc82802396e10d8eabd`.
- Software after: `presentation/comparison-fixed-idle.png`, plus gesture states in `software-comparison-fixed.png` and `software-comparison-fixed-extra.png`. These use the actual Canvas presenter and decoded resources, with a software Canvas implementation.
- Numeric samples: `presentation/comparison-pixels.json`. Diagnostic material alternatives are in `backplate-probe.png`, `tev-routing-probe.png` and `composed-constant-probe.png`; these are investigation artifacts, not delivered variants.

All coordinates below are lower-display logical pixels. Native and browser grid centers already agree at approximately `(76,82)`, `(160,82)`, `(244,82)` and the next row at `y166`. The native viewport is scrolled; different software artwork, selection, partial edge icons, notification badge and Manual action are not treated as geometry defects.

The first full native ordinary backplate is approximately 72×72 at `(40,47)–(111,118)`. The previous browser square was approximately 58×58 at `(47,53)–(104,110)`. The corrected ordinary plate follows the native bounds. On an unselected plate perimeter excluding icon artwork, the software comparison has mean absolute error 1.73 per RGB channel, with 81.6% of channels within two levels. Filtering and the native frame phase still limit pixel equality claims.

## Provenance-supported causes and corrections

### One composed constant per TEV stage

The old evaluator selected a complete constant register according to the output channel. That is incorrect when an RGB operand reads Constant.A, or an alpha operand reads Constant.R/G/B. It caused opaque rectangular backplate borders, white arrows and an overly dark toolbar shadow.

Native material setup at `0x1a3044..305c` reads the low and high selector nibbles separately. At `0x1a3188..31a4` it combines RGB from the low-selected register with A from the high-selected register; `0x1a3308` writes that one RGBA constant to the PICA stage. Selector zero names the original material buffer, while 1–6 name its six constants. Every operand then reads the same composed vector. This static evidence supersedes the incomplete per-output-channel interpretation in the external CLYTShader reference. The original material buffer remains distinct from mutable TEV feedback.

The evaluator now implements that composition. Swapping the selector nibbles is not the correction: that diagnostic alternative faded the toolbar. No textures, shader colors or individual pane colors were edited to compensate.

The independent asset evidence checkpoint is `d43b79d`, in `scripts/firmware/FORMAT_EVIDENCE.md` on the asset branch.

### Ordinary software source and density

Every app previously used `LncIconCard_00`, the cartridge-shaped layout. Native launcher initialization separately loads `LncIconSetSrc_00` and its Scale clip at `0x2b1ddc..1df4`, and Card at `0x2b1e04..1e1c`. SetSrc is rendered to a source texture; a subsequent material receives that texture descriptor. It contains the ordinary software plate at `x+32` and the empty-slot source at `x−32`.

The presenter now renders the ordinary subtree and its source shadow, hiding the opposite empty-slot roots. Empty slots use the other source roots. Existing portfolio icon pixels are still placed over the ordinary plate. The paired source offsets and native materials are retained without modifying the shared decoded pack.

Scale key 1 gives a 72-pixel plate and matches the captured two-row arrangement; key 2 gives 50 pixels and was incorrectly selected for that arrangement. Native density keys now map rows 2–6 to keys 1–5 across ordinary/folder plates, cursor, pickup and lifted-source artwork. The prior additional six-row shrink has been removed. Higher-density placement and input alignment still require captures; the legacy one-row runtime state uses the largest available native key and is not established by this reference.

The native update at `0x1d61d4` reads a density index and looks up the frame in table `0x308868` (`[0,1,2,3,4,5]`); `0x1d6324..6338` sends it to SetSrc. Transitions interpolate the frame. This establishes the native routing, while the index-to-row-count correspondence remains separately unconfirmed beyond the supplied two-row capture. This pass retains discrete runtime density changes.

The frozen `icon-tray` screenshot fragment no longer sits under native HOME rendering. The plain lower-tray fill is RGB `(223,219,215)`, sampled from the supplied native capture. This fill is observed reference data, not a claim that all runtime theme material parameters have been decoded.

## Shared chrome samples

| Region and point | Native RGB | Browser before | Software after |
| --- | --- | --- | --- |
| Toolbar shadow `(30,32)` | 206,208,217 | 136,136,136 | 206,208,217 |
| Right arrow `(309,122)` | 161,193,187 | 254,254,254 | 161,193,188 |
| Exposed tray `(120,120)` | 223,219,215 | 223,219,215 | 223,219,215 |
| Left edge `(0,40)` | 223,219,215 | 246,246,252 | 227,227,235 |
| Footer boundary `(160,210)` | 202,198,194 | 189,185,181 | 223,223,231 |

Toolbar colored-glyph bounds already match: Notes `(65,4)–(88,26)`, Friends `(106,6)–(129,26)`, Browser `(191,5)–(212,26)` and Miiverse `(230,3)–(257,27)`. Footer geometry also largely matches; native Open ink is `(190,221)–(231,236)`, while the prior browser text was one pixel to the right.

## Remaining differences and checks

- The native layout's default violet edge materials and footer boundary differ from the reference. Their runtime theme parameter changes have not been inferred or replaced with hand-painted shading.
- The reconstructed scrollbar is visible around `x15–304,y204–208`, while none is visible in this native frame. Its appearance timing still requires a native scroll comparison.
- After aligning selected slots, the software cursor threshold is about one pixel inward on three sides. Loop phase, alpha and filtering make this insufficient evidence for another geometry change.
- Folder initials, other densities, native clip timing, theme behavior, upper background/banner and stock app interiors remain outside this lower-screen correction.

The focused presentation, native-layout, bitmap-font, font-metrics and CGFX suite passes **33/33**, including cross-channel constant operands, selector-zero buffer independence, real source-template transparency, native green arrow ink and density selection. Nonincremental TypeScript and diff whitespace checks pass. Updated software gesture captures were inspected. Browser/GPU acceptance and any final native comparison are still owned by integration.
