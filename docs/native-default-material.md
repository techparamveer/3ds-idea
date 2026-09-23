# Default banner material investigation

**Follow-up:** [Executed native draw-time installation](native-directional-light-installation.md)
now proves that HOME negates the view-transformed cached direction before writing
the PICA light-position registers. The unresolved sign and proposed diagnostic
below describe this investigation's earlier boundary; the linked follow-up
supersedes that blocker with exact source evidence. GPU comparison remains with
integration.

The current default shader can reproduce the observed washed-out cubes and cyan
Internet ink directly from the authored material. The immediate mechanism is
zero fragment-primary illumination on front-facing normals, followed by the
material's inverse-primary addition. This establishes the failing shader input;
it does **not** yet establish whether native light installation reverses the
resource direction or whether another native coordinate conversion is missing.
No renderer or public asset changes are included in this investigation.

## Observed mismatch and scope

Integration supplied `reference/home-folder-open-a.png` and
`reference/browser-default-final-top.png` under the firmware artifact root
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E`.
The native upper display has blue, green and orange ink with white details on
shaded cubes. The browser has cyan/lime/yellow ink on flat white blocks. Their
animation phases and image storage widths differ; this comparison establishes
material/color semantics, not matched pixel alignment or geometry accuracy.

The source is `BannerDef`, SHA-256
`e5711a422d51e11c7047ebcb415401451335c39c46ecfbf1e3abdbffe8985955`.
All five materials use fragment lighting, white diffuse and specular 0, black
ambient-light/emission/specular 1 contributions, no distribution LUT and no
highlight clamp. `Light1` has direction `(0,-0.41036466,-0.9119215)` and white
diffuse/specular colors. Its source SRT and both stored transform matrices are
identity; an omitted authored transform does not explain the sign here.

## What the source rules support

- **Keep specular 0.** Disabled distribution 0 contributes a factor of one, not
  zero. This follows the [pinned Azahar PICA generator, lines 690–700](https://github.com/azahar-emu/azahar/blob/b8c29a64c306bac3866a5ed293ebee94ef6dcb00/src/video_core/shader/generator/glsl_fs_shader_gen.cpp#L690).
  With this material/light pair, fragment-secondary RGB is white. It provides
  the white artwork; removing it leaves the cyan/white-block problem and makes
  those details gray.
- **Keep the decoded buffer timing.** The [SPICA CGFX decoder](https://github.com/gdkchan/SPICA/blob/bd29a7828595d7839cda2ac61c76bb63f9071250/SPICA/Formats/CtrGfx/Model/Material/GfxFragShader.cs#L44)
  stores hardware update bit 0 on JSON stage 1. Copying the previous stage's
  output after stage 1 therefore agrees with the delayed buffer in
  [Azahar's stage writer](https://github.com/azahar-emu/azahar/blob/b8c29a64c306bac3866a5ed293ebee94ef6dcb00/src/video_core/shader/generator/glsl_fs_shader_gen.cpp#L476).
  Moving the copy to the current output would introduce another error.
- **Keep the LA4 masks and hidden RGB.** The actual Web texture contains 905
  black/opaque texels, 722 white/opaque texels and 1,838 white/zero-alpha texels.
  Their luminance and alpha are independent combiner inputs. The current PNG
  decoder and data-texture path preserve them. The separate A4 HOME texture's
  display-white RGB issue cannot explain this EUR result: the selected EUR
  material clip sets constant 5 alpha to one, selecting the LA4 Miiverse input
  instead of HOME in `mt_00`; the other four materials use LA4 only.

Azahar's generator consumes the **installed PICA position vector** for a
directional light. It does not establish how Nintendo converts a CGFX direction
into that vector. [SPICA's preview uses the resource direction directly](https://github.com/gdkchan/SPICA/blob/bd29a7828595d7839cda2ac61c76bb63f9071250/SPICA.Rendering/Light.cs#L94);
that convention was the earlier folder implementation's documented assumption,
not verified HOME runtime behavior.

## Numerical reproduction

For representative front normal `N=(0,0,1)`, the normalized source direction
gives `max(dot(N,L),0)=0`. The source front-face vertex normals are also positive
Z (approximately `(+/-0.097567,+/-0.097567,0.990435)`), so this is representative
of the broad face when it faces the camera. Actual bone/yaw transforms change
the per-frame normal.

The private CPU fixture evaluates the six authored `mt_04` stages with real
texture values and current floating-point stage arithmetic:

| Input | Current direction: primary 0, secondary 1 | Opposite-direction diagnostic: primary 0.911922, secondary 1 |
| --- | --- | --- |
| Black opaque mask: blue ink | RGBA `(145,255,255,255)` | `(28,147,255,255)` |
| White opaque mask: white detail | `(255,255,255,255)` | `(255,255,255,255)` |
| White zero-alpha mask: cube surface | `(255,255,255,255)` | `(162,162,162,99)` |

The diagnostic changes no authored colors. At primary exactly one the blue
returns to its source constant `(17,136,247)` and the cube is gray
`(140,140,140,76)`. Cube alpha is created by the TEV stages; it is not simply the
texture alpha. This explains both the color saturation and lost cube shading.
These are shader outputs before framebuffer blending, not a rendered reference
match. PICA stage byte rounding is a separate precision gap, not an explanation
for a change of this size.

## Executed native loader evidence

The private Unicorn fixture executes bounded original ARM from the supplied
HOME `code.bin`, SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`:

| Native operation | Evidence |
| --- | --- |
| Generic loader `0x24e638..0x24e700` | Walks the real BCRES light dictionary and passes `Light1` at resource offset `0x4f40` to object creation. Object construction is stubbed for this slice. |
| Factory `0x184500` | Dispatches source type `0x400000a2` to fragment-light constructor `0x1858a4`. Execution stops at constructor entry. |
| Constructor copy `0x185908..0x185934` | Copies resource direction at `+0x10c` to object `+0x184` unchanged. Allocation/base construction are outside the executed slice. |
| Update `0x18552c` | With authored flags `1`, copies that direction unchanged both with and without a parent. A synthetic flags-9 control applies the supplied world matrix without negating the vector. |

The source direction and stored local/world matrices are verified from the raw
resource, not inferred from SPICA's H3D export. The native **draw-time PICA light
installation** and native vertex-normal convention remain unresolved. Loader
execution alone is insufficient to approve a sign correction.

## Bounded correction proposal

The next isolated diagnostic should keep the existing default material, masks,
TEV stages, specular rule, blending and explicit frame unchanged, and vary only
the direction convention supplied to default lighting. Capture both results at
the same explicit frame. Integration owns those GPU/native captures. This is a
diagnostic proposal, not an implementation in this commit.

Before promoting a production correction, establish the installed native PICA
direction and its coordinate basis, or execute the missing original installation
path. If it reverses resource ray direction, encode that verified conversion at
the CGFX-lighting boundary with a focused numeric fixture. If it instead changes
normal/view space, correct that proven mapping. Do not encode guessed banner
colors, zero secondary lighting, or special-case a material name to mimic the
reference.

Preserve the current folder path during the diagnostic. A global direction flip
changes its authored Dist0 half-vector input: for representative `N=V=(0,0,1)`,
the LUT moves from 0 to 0.214974, adding about 21.93 channel levels through its
0.4 specular term. That is a real regression risk even though the folder's
earlier light sign was not independently verified. Any shared correction needs
a matched folder capture as well as the default comparison.

## Reproduction and limits

Private fixtures live in `presentation/banner-default-material/` under the
artifact root: `evaluate.mjs`, `evaluated.json`, `execute-light.py` and
`executed-light.json`. [Committed evidence](evidence/native-default-material.json)
contains their hashes, all stage values, source references and ARM results.
Both fixtures pass. JSON parsing and `git diff --check` pass. No application
rebuild is required for this documentation-only change; no GPU visual parity
claim is made.
