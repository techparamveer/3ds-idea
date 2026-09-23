# amiibo initial UI conversion checkpoint

The supplied EUR amiibo applet is `000400300000b902`. Its layout archives use
little-endian FLYT/FLAN/FLIM **7.2.0.0**, not CLYT/CLAN/CLIM. Converter 1.5.0 adds
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
parent origins remain unsupported. Source magnification flags are retained;
part magnification has not been applied.

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
corroborates that layout link, record lengths and offsets. Usage/basic/material
flags and exact records are retained, with `flytPartComposition` blocking strict
publication until those overrides are implemented. This checkpoint does not
flatten or omit parts to manufacture a complete screen.

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
and99,149 bytes, including reused textures. Global HOME/launch/converter records
are preserved by the stock publisher; the amiibo title records its own converter.

PortalSceneCTR, Header and PortalBtnSub stay private until the remaining features
are supported. Runtime must not describe the public subset as the original
complete initial screen. No network action, NFC operation, amiibo edit, deletion,
reset or update is implemented by this resource conversion.

## Verification

The owner-supplied source run reads all76 layouts,159 animations and159 textures
without structural errors. It still reports56 part instances,14 texture
combiners,4 projection coordinate generators and4 projections as unsupported.
Tests cover bounds/version rejection, non-square texture orientation, hierarchy,
24-byte pane names, group stride, source part/text bindings and strict rejection
of unsupported compositions. Set `FIRMWARE_AMIIBO_ROMFS` to the private extracted
RomFS when running `tests/test_firmware_cafe.py`; no firmware fixture is committed.
The combined delivery audit has no errors:1,533 resources,559 layouts,
1,752 animations,1,750 texture references,27 message banks and20 style tables.
Browser/native-reference comparison remains pending. Tests establish decoding
and source integrity, not native screen equivalence.
