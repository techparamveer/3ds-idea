# amiibo native material command trace

The bounded Header and PortalBtnSub material path is now supported in converter
1.5.4 in the combined integration branch and the native renderer. This resolves the material blockers in the
[initial audit](native-amiibo-initial-ui.md#material-blocker-audit-2026-09-24).
The resources are privately source-rendered, not published or native-compared.
The header's `IGN_Header` call-name remains unresolved; its embedded fallback is
Japanese. No account, update, network or NFC behavior is implemented here.

## Pinned image and reproduction

Supplied EUR title `000400300000b902`, decompressed `exefs/code.bin`, SHA-256
`316c8a1cb37c2aab7813a5546f355ab0bdd3f635fe56b606abf91bb191a1d2d9`;
addresses are mapped from `0x100000`. Function names below describe inferred
roles, not debug symbols. Run `scripts/audit_amiibo_material_commands.py --code
<absolute-code-path> --report <absolute-report-path>`. This reads bytes as data,
checks the image hash, pins 12 code ranges, checks six command tables and all 14
texture-format mappings. It never executes the applet.

The report and inspected source renders are under SSD firmware root
`reference/amiibo-material-semantics/validated/`. Original unsupported-render
reports remain in the parent directory as the previous checkpoint.

## Construction and texture combination

- Picture construction `0x1ce7b0–0x1ce804` resolves a material and calls
  `0x1cfdb0`. Window content and frame constructors call the same routine at
  `0x1ce3f8` and `0x1ce508`.
- `0x1cfdb0–0x1d0984` copies source black/white registers from offsets
  `0x1c/0x20`, then texture maps, matrices and generators. The combiner count
  at `0x1cfec8–0x1cfed0` uses bits 6–8. The converter now retains all three
  bits. `0x1d0654–0x1d06b8` copies four-byte combiner records unchanged.
- Dispatch `0x1ca458–0x1ca480` selects texture count; count 2 calls
  `0x1cb42c` at `0x1ca688`. `0x1cb49c–0x1cb4c0` selects a template from
  source color mode. Only modes 0/1 and alpha 0/1 are enabled here.

[Azahar's pinned PICA definitions](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/video_core/pica/regs_texturing.h#L266)
corroborate command fields. These definitions interpret the extracted commands;
they do not prove an identical framebuffer or hardware quantization.

| Table | Stage | Equation |
| --- | --- | --- |
| `0x1ed5bc` | 0 | texture 0 RGBA |
| `0x1ed5d4` | 1, source color 0 | `texture1.rgb * texture1.a + previous.rgb * (1 - texture1.a)` |
| `0x1ed5ec` | 1, source color 1 | `texture1.rgb * previous.rgb` |
| `0x1ecdf8` | 3 | black register |
| `0x1ece10` | 4 | `white * combined + black * (1 - combined)` |
| `0x1ece58` | 5 | previous RGBA × primary vertex RGBA |

`0x1cb698–0x1cb6a8` patches stage 1 alpha: source alpha 1 multiplies
texture 1 alpha and previous alpha; source alpha 0 adds and saturates them.
It is not a maximum operation. `0x1cb520–0x1cb568` writes buffer-update
register `0xe0` with `0x2200`, capturing the combined stage. Initialization
`0x152aa4–0x152ad0` installs the later tables; helper `0x1db818` restores
normal black/white interpolation and `0x1db7f0` restores vertex multiplication.
Material dispatch selects this normal path for audited flags 106/32874.
`0x1cc890` writes white to register `0xf3`, black to `0xdb`.

The browser lowers this algebra into the existing canonical TEV evaluator,
retaining alpha comparison and framebuffer blending. It does not claim exact
intermediate PICA precision. Single-texture alpha-only FLYT materials use the
same traced black/white and vertex composition.

## Texture object codes 1 and 13

`0x19b5e4` loads the texture resource. Instructions `0x19b608/0x19b60c`
copy source format byte `info+8` to texture object byte `+9`. The switch
`0x1a2884–0x1a294c`, table `0x1a28a4`, maps these source codes to PICA
formats in order:

`[7, 8, 9, 5, 6, 3, 1, 2, 4, 0, 12, 13, 10, 11]`.

Thus source codes **1/13 are PICA A8/A4 (8/11)**. The two-texture builder
`0x1cb640–0x1cb694` replaces only their RGB selectors with constant white;
alpha continues sampling the texture. Single-texture paths `0x1ca588–0x1ca5b8`
and `0x1ca650–0x1ca66c` perform the same replacement. This is material behavior,
not a change to decoded image pixels. The existing A8/A4 zero-RGB sampling
representation remains; `NativePixels.picaFormat` carries the distinction to
FLYT material preparation. CLYT behavior is unchanged.

## Source-4 projected window coordinates

Dispatch table entry `0x1dc7e8` selects `0x1dcc58` for source 4, calling
`0x1c85c8` at `0x1dcc78`. The observed option 6 identity projection uses
pane width/height at `+0x3c/+0x40` (`0x1c86b0–0x1c86b8`), producing the
pane-fit matrix with rows `[1/w,0,0,.5]` and `[0,-1/h,0,.5]`.

Option bit 2 branches to `0x1c8854`. Helper `0x18c590` computes the affine
inverse of the pane matrix at `pane+0x48`; its cofactor/determinant operations
establish that role. `0x182a64` composes affine matrices as `A * B`, including
translation. The projection therefore becomes `paneFit * inverse(paneMatrix)`.
The common tail composes `drawInfo+0x74` at `0x1c8790–0x1c879c`. The window
draw visitor `0x1c993c` copies this exact pane matrix to that DrawInfo field at
`0x1c996c–0x1c99d4`. The inverse and matrix cancel for nonsingular transforms.
Picture visitor `0x1c9c5c` has an equivalent copy, but general picture projection
is not enabled by this work.

`0x1cfcec` supplies texture scale/rotation around the center and translation;
it does **not** read the apparent texture-extent argument. The source projected
texture matrix is identity. After the native Y convention is converted, each
frame patch samples the second texture using its own bounds normalized across
the **whole window**, independent of the first texture's mirrored corner UVs.
No padded-texture adjustment is justified or added for this case.

Support is deliberately restricted to centered windows, two generators `[0,4]`,
one identity projection with option 6 and zero padding, and an identity second
texture matrix. The derived patches change source 4 to a separate explicit UV
set without mutating the source layout. Other projections fail explicitly.

## Capability boundary and evidence

The converter grants `amiibo-two-texture-v1` only to flags 106/32874 with two
maps and unrotated matrices, one color/alpha 0/1 combiner and zero reserved fields, valid
zero-extra generators `[0,1]` or the exact projected case above. Other unsupported
fields prevent the capability. General FLYT materials are not enabled.

The source hashes remain pinned in the real-resource tests. Header materials
and all projected button patches match independent equation-composed raster
bytes. Tests also cover A8/A4, saturated alpha, tint, immutable source records,
unknown combiner rejection and invalid projection rejection. Converter tests
mutate real source records to ensure unsupported variants stay rejected.

Private converter candidate:
`assets/stock-ui/amiibo-settings-native152-materials/` (169 resources). It was
rebuilt with `Builder`/`convert_title` from the previously verified extraction,
retaining title/source identity and current converter script hashes; it is a
private diagnostic manifest, not public publication provenance.

`Header.png`, `PortalBtnSub.png` and `portal-all-parts.png` were rendered and
visually inspected. All five original-model portal parts now draw together,
including the update button, without renderer diagnostics or source mutation.
The header's Japanese fallback remains visible in its diagnostic. These images
are source-layout evidence only. Live publication, English header binding and
matched native comparison remain separate acceptance work.

Verification: 14 real RomFS converter tests, 18 material/part/renderer tests and
39 presentation/raster checks pass without skips. The latter retain 9,997,480
identical baseline RGBA bytes. Typecheck and shader validation pass. The isolated
production build is blocked by Turbopack rejecting the shared `node_modules`
symlink outside its filesystem root; integration must run the production build.
No browser or emulator was launched by this worker.
The full isolated `npm test` attempt records 1,090 passes, 39 failures and 18
skips. Failures are model/geometry fixtures left as Git LFS pointer files by this
worktree's skip-smudge checkout; focused material and OS raster checks pass.
Full integration verification remains the coordinator's responsibility.
