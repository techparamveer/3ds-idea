# HOME Settings banner edge source gap — 26 September 2026

One bounded Experience source slice at `cb1869b` found no source-supported
visible sampling/compositing correction for the remaining **190 banner pixels**.
No runtime or asset changes were made. The existing diagnostic remains fail;
this finding does not establish pixel, timing, input or audio acceptance.

## Target and evidence

Native screenshot:
`/Users/paramveer/.codex/3ds-artifact-overflow/reference/screenshots/_26.09.26_04.14.35.203.png`,
SHA-256 `4adc0ef0cbba7175b641fbe4107f697f15ff7a4aadd482c746e389ea7abf5bdb`.
Browser pair root:
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v1/captures/home-settings-frame304-common303-hud97-88719fb-20260926/`.
Its `browser/upper.png` SHA-256 is
`5cdf4105bd997c5593e56850d68a576674beacf2ec2d24b25121c202ed478704`.
`diff/report.json` and `diff/upper-contact-sheet.png` were inspected. The mask
is empty. Upper differences above 2/255: wrench 3, green cards 105, blue globe 1,
yellow notes 81, plus 32 HUD pixels outside this lane. Orange, pink, title,
wallpaper and footer contribute zero. Lower remains 36,258. See the
[existing pixel audit](home-settings-icon-residual-audit-2026-09-26.md).

## Source and renderer findings

- The [independent texture audit](settings-banner-mip-audit-2026-09-26.md)
  established byte-equivalent decoded images and one authored level per texture.
  All five samplers use linear magnification, LinearMipmapNearest minification,
  zero bias and minimum LOD zero. Base-only linear sampling is consistent with
  the available images; synthesizing mipmaps has no source support.
- `mt_pict` uses COMMON2 with clamp-to-edge and identity UV transform. `mt_btn`
  uses COMMON3, repeat V and source `Mirror` U. The renderer recognizes
  `MirroredRepeat`, so `Mirror` currently falls through to clamp-to-edge.
  However, every button mesh U lies within [0,1], its transform is identity,
  and the banner has no material animation. Linear mirrored and clamped
  sampling agree within that interval, including the half-texel edge taps.
  Correcting the enum would not supply a visible candidate for this target.
  This latent generic mapping mismatch is recorded, not presented as the cause.
- Source RGB blending for plates/artwork is SourceAlpha/OneMinusSourceAlpha,
  FuncAdd; the renderer maps those factors. The wrench uses One/Zero. Alpha
  tests are disabled. The overlay deliberately tracks coverage alpha for the
  Canvas transfer, then unpremultiplies and composites over the HOME background.
  Its RGBA8 intermediate, unpremultiply rounding and Canvas recomposition can
  differ from blending directly into a native opaque framebuffer. No native
  per-fragment values or matched arithmetic trace in this slice establishes
  which operation explains the 187 icon pixels (maximum delta 8).
- The wrench contour disagreement at (164,63) is a separate coverage question;
  a global blend or sampler adjustment is not justified by it. The other two
  wrench pixels differ by at most 3. Geometry/pose precision and native
  interpolation remain untraced at this sample.

The next useful evidence is a matched native render submission with texture
coordinates, fragment/blend output or raster coverage for these exact regions.
There is no justified integer quantization, UV bias, palette adjustment or
live clock offset to implement from the current evidence. The yaw304/COMMON303
relationship remains an independent diagnostic, not a traced native schedule.

## Asset provenance

Visible elements map through manifest `models.settingsBanner` to
`models/settings-banner/model.json` (SHA-256
`908b4dbe6ef22bbf3c47d37e9ed512ea6a37654afd0f1db611f3d4f68c5e93e1`).
Firmware EUR 10.7.0-32E, Settings title `0004001000022000`, version 9220,
content index 0 / ID `0000003d`, CIA-internal `exefs/banner.bin`, SHA-256
`5804ba5a7768d2ae9b7487e4d277923502646d89768668b19d666e3e4d30fbac`.
EUR-English common CBMD slot at 0x88 decodes to CGFX SHA-256
`96ea28f70671cf2b62aded3e3ef203cdf365929ae9422798255c628499c0910d`.

| Element | Source binding | Manifest resource beneath `models/settings-banner/` | SHA-256 |
| --- | --- | --- | --- |
| Card/globe/NNID/figure/notes artwork | mt_pict / COMMON2 | texture-1.png | `30210ac601a78d152ceb438cb3b9c1681cd75c156fb5bfd2d4a3ac19015e69a3` |
| Icon plates | mt_btn / COMMON3 | texture-2.png | `0d0b8951024024f772feae0f4154beed40826b3bb998795293f13c5d3bb8f927` |
| Wrench | mt_spanner / COMMON4 | texture-3.png | `65f62f8b11a988f70b7ffc923a283e63110782e0a4a270e0f1964948cd51e1dc` |

Model converter: ctr-cgfx-web 1.4.1, SPICA
`bd29a7828595d7839cda2ac61c76bb63f9071250`; wrapper SHA-256
`bd70d8e8aa34191011d38e726c9105c625a8fc72cdfda866df940c5726138a90`,
exporter SHA-256
`0a450efe7fbdba7a3bda05635c7abe9448080b719f9703e728efd46cc189a7d4`.
No replacement native resources or new visual adaptations were introduced.

## Handoff

Documentation-only: relative links and `git diff --check` pass; application
tests/build/shader checks were not rerun. No Azahar or production browser was
operated. No new browser comparison is requested for this unchanged runtime.
Any later visible candidate must first repeat the exact named diagnostic pair
with an empty mask, then compare another recorded native phase before claiming
general improvement. All 190 banner differences remain unexplained.

## Compositing A/B rejection - 3 October 2026

At runtime `d53cbe32` / documentation base `bb6ea378`, the coordinator rendered
the current `createFirmwareBanner` in a private headed-browser fixture, with
the existing independent yaw304 / COMMON303 pose and background Loop337.
The baseline body rectangle `(0,28,400,184)` is byte-identical to the preserved
production capture above. This reproduces all 190 banner residuals without
new phase fitting, geometry changes or reference-pixel substitution.

One private candidate renders the decoded background immediately before
Frame/primary into the same GPU target, without an intervening clear or
readback, then transfers that result without overlay unpremultiplication.
All source resources, poses, materials and stencil settings remain unchanged.
This is an isolated source-render experiment, not a production modification.

| Fixed region | Baseline pixels above 2 | Candidate pixels above 2 |
| --- | ---: | ---: |
| Wrench `(140,32,110,101)` | 3 | 3 |
| Icons `(60,133,280,43)` | 187 | 189 |
| Title `(80,176,245,36)` | 0 | 0 |
| Body `(0,28,400,184)` | 190 | 192 |

Candidate-versus-baseline maximum channel change is 1 throughout the body.
The proposed transfer change therefore does not explain the icon maximum8
or wrench maximum54 residuals and is **rejected as a fix**. Do not repeat this
candidate or promote it to runtime without materially new evidence. The
remaining gap is still fragment/interpolation/raster coverage or native pose
precision; no particular cause or correction is established.

The coordinator inspected the raw renders and native/baseline/candidate/diff
sheet. HUD/footer are deliberately absent from this source fixture, not
masked away from a whole-scenario claim. No fresh Azahar session, paired lower
LCD, input, timing or audio acceptance was performed; the native target is
the unchanged PNG identified above. Native whole-scenario status remains fail.
All native assets and existing adaptations remain unchanged.

Private artifact directory:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/banner-composition-20261003/`.
`serve.mjs` records exact consumed source/resource hashes in `inputs.json`;
`compare.mjs` records both PNG identities, empty-mask fixed-ROI statistics and
limits in `report.json`. Report SHA-256
`ceaedec58d8b1cf3de98735de0fd08839488bc62786c5e85ba7ae4326f8fe067`;
sheet SHA-256
`aead11d433cd7b8ac74623b141acff2f7b0ab087a75e713cbfe8d5c48a4acecc`.
Candidate source SHA-256
`3d5dc97e8c235ca9e09968b19ce2f16a29e6003cf7c9bb45c5d5b5ddc407880b`.
Independent GPT-5.6 Sol/high review verifies the one-statement injection,
byte-identical baseline body and fully opaque outputs. The experiment uses
two ordered render calls, not one globally sorted scene traversal; it isolates
the intermediate transfer, not every possible native depth/order difference.
Only documentation is integrated. Tests/build/shader checks are not rerun for
this rejected private experiment; relative links and diff whitespace are checked.
