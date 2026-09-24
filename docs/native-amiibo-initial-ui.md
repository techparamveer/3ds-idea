# amiibo initial UI conversion checkpoint

The supplied EUR amiibo applet is `000400300000b902`. Its layout archives use
little-endian FLYT/FLAN/FLIM **7.2.0.0**, not CLYT/CLAN/CLIM. Converter 1.5.1 includes
an isolated, version-bounded reader in `scripts/firmware/cafe.py`; build dispatch
is enabled only for this title. No executable, NFC hardware, account, audio or
3D model implementation is involved.

## Format evidence and limits

[3DSkit's layout notes](https://github.com/Tyulis/3DSkit/blob/master/doc/BFLYT.md)
and [animation notes](https://github.com/Tyulis/3DSkit/blob/master/doc/BFLAN.md)
provide the initial structure, checked against the actual archive members.
[Switch Toolbox PAN1](https://github.com/KillzXGaming/Switch-Toolbox/blob/master/File_Format_Library/FileFormats/Layout/CAFE/Panes/PAN1.cs)
clarifies that the pane field is a **24-byte name plus 8-byte user data**, not a
single 32-byte name. Transforms start at section offset44 and pane bodies at84.
Own-origin bitfields are converted to the existing 3×3 origin schema; noncentral
parent origins remain unsupported. Source magnification flags are retained. Initial portal parts have unit
magnification; nonunit magnification is explicitly rejected.

Observed FLAN target records have 28-byte names, with tag offsets at+32. Actual
7.2 `pat1` groups occupy **36 bytes**, differing from the older note's28. Pane
SRT/visibility/vertex color, texture SRT/pattern and black/white material channels
map to existing properties. Further material-color channels remain unsupported.
Source keys, split tangents, clip ranges and grouping are retained.

FLIM has separate alignment, format and orientation fields. The observed
alignment is128; other versions/alignment or inconsistent padded payloads are
rejected. Tiled8 Morton/PICA channel decoding is reused. Logical dimensions stay
in the output; orientation4 swaps storage axes and rotates counterclockwise
before output cropping. For example, HeaderBg is46×26 with32×64 padded storage.
[ObsidianX's 7.2 decoder](https://github.com/ObsidianX/3dstools/blob/master/bflim.py)
provides the swapped-axis/rotation reference. Its old packed-channel routines
are not copied: the existing tested PICA decoder remains authoritative for those.
Synthetic asymmetric rectangular fixtures cover orientations0/4/8. A source
texture contact sheet was inspected; this is not an LCD/browser fidelity check.

Simple FLYT material records preserve black/white registers, texture transforms,
8-byte coordinate-generator records and blending. Multi-texture combiners,
projections, indirect and shadow blending remain explicit unsupported fields.
They are not approximated as ordinary single-texture materials.

## Original model portal dependencies

`Body/Portal/PortalSceneCTR.arc.cmp` is the original-model variant. Its five
`prt1` panes link these components:

| Instance | Component | Source y | Text call name |
| --- | --- | ---: | --- |
| L_EditBtn | PortalBtn |87| BtnSetNicknameOwner |
| L_DeleteBtn | PortalBtn |35| BtnEraseGameData |
| L_InitializeBtn | PortalBtn |-17| BtnInitializeAmiibo |
| L_UpdateBtn | PortalBtnSub |-65| BtnUpdateFangate |
| L_StopBtn | BtnBtm_03 |0| Finish (two layers) |

The first three instances have seven override entries each, including inline
text/picture records and separate52-byte pane-info records. The source part
name follows the40-byte-per-entry table; it is not an invented lookup.
[Switch Toolbox PRT1](https://github.com/KillzXGaming/Switch-Toolbox/blob/master/File_Format_Library/FileFormats/Layout/CAFE/Panes/PRT1.cs)
corroborates that layout link, record lengths and offsets. Usage/basic/material flags and exact records are retained. The five original
portal instances now carry an explicit `amiibo-portal-v1` capability. The bounded
adapter accepts the observed size (`0x10`), translation+size (`0x18`), and
translation+scale (`0x28`) basic overrides, plus text usage1. The flag roles are
inferred from these source records; the public format references corroborate
record structure, not native visual equivalence. Other combinations remain
unsupported. No part is flattened into its parent's pane/material namespace.

`instantiateNativePart` clones the selected child layout, applies those fields,
rebinds parent material/texture indices, and inherits the child font for the
source `0xffff` font sentinel. `NativeLayoutRenderer.draw` accepts explicit
`parts` links, independent `partBindings`, and `textByCallName`. Child transforms
and primary alpha remain in the parent's traversal scope. Parent animation state
is included in the child pose cache key. Explicit pane text overrides take
precedence over the call-name map. Missing links, duplicate targets, unsupported
flags and excessive recursion fail. The stock publisher rejects missing,
ambiguous or cyclic selected part dependencies before writing anything.

FLYT windows now accept source frame sizes only when they equal the actual frame
texture extents. Existing CLYT handling is unchanged. Unsupported FLYT material
fields now fail explicitly in both scalar evaluation and the raster path; they
cannot silently use the CLYT single-texture fallback.

Header materials `P_Header_00/01` use two textures/combiners. PortalBtnSub's
`W_BtnShade_00C/LT` also use projection source4, option6. These are concrete
initial-screen rendering dependencies. The generic PortalScene differs from
PortalSceneCTR and cannot silently replace it. The upper text's `SelectMenu`
call is present in the EU English bank. Header's `IGN_Header` call has no matching
English bank label; its embedded sample title is Japanese.

## Public supported subset

`packs/amiibo-settings/` now contains CommonBg, CommonBgUp, PortalSceneUp,
PortalBtn, BtnBtm_03, their8 source animations, and6 selected cabinet messages.
There are5 layouts and13 texture references. `cbf_std.bffnt` is explicitly bound
to the verified shared font as a presentation adapter; that is not proof of the
applet's internal font resource lookup. The selected records total17 dependencies
and99,897 bytes, including reused textures. Global HOME/launch/converter records
are preserved by the stock publisher; the amiibo title records its own converter.

PortalSceneCTR, Header and PortalBtnSub stay private until the remaining features
are supported. Runtime must not describe the public subset as the original
complete initial screen. No network action, NFC operation, amiibo edit, deletion,
reset or update is implemented by this resource conversion.

## Verification

The owner-supplied source run reads all76 layouts,159 animations and159 textures
without structural errors. It still reports51 other part instances,14 texture
combiners,4 projection coordinate generators and4 projections as unsupported.
Tests cover bounds/version rejection, non-square texture orientation, hierarchy,
24-byte pane names, group stride, source part/text bindings and strict rejection
of unsupported compositions. Set `FIRMWARE_AMIIBO_ROMFS` to the private extracted
RomFS when running `tests/test_firmware_cafe.py`; no firmware fixture is committed.
The combined delivery audit has no errors:1,533 resources,561 layouts,
1,753 animations,1,756 texture references,27 message banks and20 style tables.
The13 Python source/structure tests pass with the private RomFS. The4 part
instantiation tests pass with `FIRMWARE_AMIIBO_CONVERTED` pointing to private
`stock-ui/amiibo-settings-native151`; six renderer tests also pass. CLYT raster
regressions preserve9,997,480 RGBA bytes:
5,304,720 bytes across1,800 cursor rasters and4,692,760 across306 window/capture/
shadow rasters. Type checking passes. The broad worktree run had809 passes,
42 failures and8 skips:39 failures concern unhydrated model/LFS pointer files,
and3 concern missing `fake-indexeddb`. This is not a clean full-suite result.

`tests/helpers/native-cafe-browser.mjs` is a local diagnostic for the three
supported action parts and Close. It deliberately hides the unresolved update
part and does not render the unsupported header; it must not be used as a native
opening-screen reference. Set `FIRMWARE_AMIIBO_CONVERTED` and a private
`FIRMWARE_AMIIBO_BROWSER_OUTPUT` directory, then open the printed localhost URL.
The browser attempt was blocked by two IAB webview-attachment timeouts; Chrome
was unavailable. No browser screenshot or native-reference equivalence is claimed.

## Material blocker audit (2026-09-24)

The follow-up audit used the same decrypted EUR `10.7.0-32E` title identified
above and private conversion manifest
`be336f8ce4feacf356e5420cb34e10ae5d1c50fc3d5284ba49c99bb6e745ced5`.
It pinned these source layout records:

- `Header.bflyt`
  (`680775e63bcdd86fe3e9c1c5687744e1904984215ca1fdc8a1c0f8e75043fd59`)
  names `Gradation16.bflim`, `HeaderBg.bflim`, `IconAmiibo.bflim` and
  `light_00.bflim`. `P_Header_00` has material flags `106`, texture indices
  `[0, 3]`, coordinate sources `[0, 1]`, combiner bytes `{color: 1,
  alpha: 0}`, and a `0.1` S translation on the second texture matrix.
  Its `400 x 26` pane supplies two UV sets, including
  `[0, 0, 0.859375, 0, 0.078125, 6.5, 0.9375, 6.5]`.
  `P_Header_01` also has flags `106`, but uses texture indices `[0, 0]`,
  identity matrices and combiner bytes `{color: 0, alpha: 0}` on a
  `400 x 25` pane.
- `PortalBtnSub.bflyt`
  (`b03445e1ed98efb3389d2c077b77e6f9996cf84064a64f0e57340d92c9ee47b0`)
  names the four button textures listed above. Both
  `W_BtnShade_00C` and `W_BtnShade_00LT` use texture indices `[2, 0]`,
  coordinate sources `[0, 4]`, and a pane-based projection record with
  transform `[0, 0, 1, 1]` and option byte `6`. The centre material's first
  texture scale is `[0, 0]` and its combiner bytes are `{color: 0, alpha:
  0}`; the frame material uses identity scales and `{color: 1, alpha: 1}`.
  The source window is `240 x 32`, uses content material `7`, frame material
  `8`, frame widths `16`, and starts at pane alpha `16`.
- `PortalSceneCTR.bflyt` places that component at `L_UpdateBtn`, `y = -65`
  and calls `BtnUpdateFangate`. This establishes placement and message
  selection, but not the component's pixel result.

These values are no longer merely inferred from converted JSON. The
real-source test hashes each BFLYT payload, checks the material records, and
continues to require rejection by the supported-layout gate.

The remaining gap is semantic rather than structural:

- [3DSkit's BFLYT notes](https://github.com/Tyulis/3DSkit/blob/2fb6077654c6aa77348fd0c7c3cd8c108da86a74/doc/BFLYT.md)
  label the two combiner bytes with `Overwrite`/`Multiply` and `Max`/`Min`,
  but do not specify the shader inputs or full operation.
- [LayoutExporterU](https://github.com/aboood40091/LayoutExporterU/blob/8c644cfad606ead47e6ce9eae2d315a5e70afe61/bflyt.py)
  can decode the fields but exposes the combiner values as generic TEV modes.
  Its projection option bits explain that `6` selects pane fitting plus
  projection scale/rotation adjustment, not the coordinate equation.
- [Switch Toolbox's BFLYT shader](https://github.com/KillzXGaming/Switch-Toolbox/blob/9fe41401d246d31c99fcbfdd0a7fe4253a95b31f/Toolbox/Shader/Layout/Bflyt.frag)
  is not native evidence: its active path returns before material processing,
  and the unreachable combiner path retains source-selection TODOs.
- Static inspection of this title's `code.bin`
  (`316c8a1cb37c2aab7813a5546f355ab0bdd3f635fe56b606abf91bb191a1d2d9`)
  did not establish the NintendoWare draw-state function, and the retained
  evidence has no native opening-screen capture matched to this source.

Consequently, the audit does not establish the combiner input order, the
alpha operation, the pane-based projected-UV equation, or the exact A8/L8
texture-channel interaction. Implementing any of those from decoded byte names
would be a guess. No renderer/converter behavior or public
`Header`/`PortalBtnSub` resource was changed or published.

The blocker can be closed only with a source-backed NintendoWare implementation
or a native draw-state trace that establishes those equations and texture
inputs, followed by a matched native opening-screen capture. A generic Portal
scene render is not sufficient evidence.

Integration checkpoint (2026-09-24): the original supplied amiibo RomFS was
retested after merging part composition with the current animation shares and
inline child attachments. All13 Python converter tests and14 renderer/part
checks passed, zero skips. Evidence is in SSD firmware root
`reference/integration-amiibo-real-python.log` and
`reference/integration-amiibo-real-renderer.log`. This verifies the bounded
supported resources only; unresolved Header/PortalBtnSub materials and the
missing matched native reference remain unresolved.

## Native command trace follow-up

The [material command trace](amiibo-material-command-trace.md) now locates the
applet's constructor, two-texture PICA command builder and source-4 projection
routine. Source alpha 0 selects saturated addition in that bounded command
path; external Max/Min labels are not sufficient equations. Native texture
metadata patching, complete later-stage state and projection composition still
prevent a defensible full renderer implementation. Header and PortalBtnSub
remain unsupported; the follow-up includes reproducible source ranges, command
tables, passing focused checks and fresh explicit render-rejection evidence.

### Material resolution follow-up

Converter 1.5.2 and the bounded renderer path now source-render Header and
PortalBtnSub, including the full five-part original-model portal. The earlier
unsupported-material result above is historical. The
[resolved native command trace](amiibo-material-command-trace.md) records texture
format mapping, post-combiner registers, whole-window projection, tests and
private renders. Public selection is unchanged in this worker commit. The
`IGN_Header` English binding and matched native comparison remain unresolved.
