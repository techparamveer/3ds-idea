# Data Management Software and Extra Data: source audit

2026-09-24. The **Data Management → Nintendo 3DS → Software** and **Extra
Data** leaves still use the adapted `TextBG_U_00` detail card. They were not
replaced because the executable's lower layout `SMngCTRData_D_00`, four of its
clips and eleven English labels are unpublished. Requesting an unpublished
layout would fail the whole Settings asset load, so this slice changes no
painter, runtime or input code.

The source evidence is now sufficient for the composition described below. Two
dependencies remain: publishing the resources, and choosing which native SD
state the portfolio represents.

## Provenance

Settings `0004001000022000`, content 0 / `0000003d`, code SHA-256
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5` mapped at
`0x100000`; original `table_LZ.bin` SHA-256
`1df90f560d13eb1fbc46f0a1c33b9f743b2686ad64eb5c0f980ac75224de7794`. See
[Settings scene validation](settings-main-source-validation.md) for the record
layout: header byte 0 selects the footer, and byte `0x23` selects the background
and title state.

| Record | SHA-256 prefix | Footer | State | Lower | Upper | Title |
| --- | --- | --- | --- | --- | --- | --- |
| `datamng_ctr_soft` | `7359037c3d7c4781` | 1 | 4 | `SMngCTRData_D_00` | `CommonBG_U_00`, `SMng_U_01`, `IconDataMa` | `dat_sof_title_u` |
| `datamng_ctr_data` | `f4c08d8b9bdac29d` | 1 | 4 | `SMngCTRData_D_00` | `CommonBG_U_00`, `SMng_U_01`, `IconDataMa` | `dat_opt_title_u` |

Both records have an empty instruction field and name no `TextBG_U_00`. The
footer name table at `0x2987bc` maps index 1 to `Base_D_00`, the Back-only
footer (`base_2b_back`). State 4 selects the existing `CommonBG_U_00_SceneIn_04`
palette and the default white backgrounds.

## Lower screen

List kind is stored at scene `+0x48`: `datamng_ctr_soft` stores 0
(`0x19987c`, `e5859048`) and `datamng_ctr_data` stores 1 (`0x199938`,
`e585a048`). Every kind except DSiWare and StreetPass then stores media
`+0x50 = 1`, the SD card (`0x199d48`, `e585a050`).

The constructor at `0x20cfa8` sets:

- `TextPageBox` from the kind table at `0x299c54`: `dat_soft_page` "Software",
  or `dat_opt_page` "Extra Data".
- `TextPageNow`, `TextPageBar` and `TextPageAll` hidden and cleared.
- `TextBoxTitle_01` to `dat_3ds_comm` "Software title list". The DSiWare
  branch instead labels the half tabs `dat_nand` / `dat_sd` and hides this pane.
- `TextIn` bound only to `Group_03` (`TextBoxTitle_00`), and `BtnIn` only to
  `Group_05` (`ScrollBg`, `Scroll`).

After loading, state 2 of the scene loop (`0x20d980`) plays `BtnIn` and
`TextIn` forward. `TextIn` (source 560–580) takes `TextBoxTitle_00` from alpha
0 to 255 at local frame 20.

The empty-state setter at `0x19793c` computes whether the current media has any
titles. With an empty list it makes `TextBoxTitle_00` visible, and hides
`TextPageNow`, `TextPageBar`, `TextPageAll` and `Window_00`. It applies the same
child-button virtual call (`+0x18`, arguments 0 and 1) to all 20
`N_B_SMngCIcon` entries. The constructor makes that call on the two half tabs
for non-DSi kinds; it is treated as hiding those buttons, but the button class
was not traced. It then fills `TextBoxTitle_00`:

| Media 1 and SD global `0x297be4` | Software | Extra Data |
| --- | --- | --- |
| 1 | `dat_no_sd` "No SD Card found." | same |
| 3 | `dat_ng_sd` "Could not access SD Card." | same |
| 4 | `dat_writeprotect` | same |
| other (2 is accessible SD) | `dat_no_software` "There is no accessible\nsoftware data." | `dat_no_option` "There is no extra data." |

## Upper screen

`CommonBG_U_00` carries the record title: "Software Management" or "Extra Data
Management". `SMng_U_01` initialization (`0x217e98`) binds `SMng_U_01_NonSD`
to `Group_00`. It sets `TextBox_00` to `dat_3ds_comm1_u` (Software) or
`dat_3ds_comm2_u` (Extra Data), `TextBox_03` to `dat_sd_u` "SD Card" and
`TextBox_04` to `dat_block_u` "Open Blocks", then shows `N_SD`.

The SD update at `0x218474` calls `0x1c70d0(NonSD, sd != 2)`. That helper
selects frame 0 when its flag is set and the clip's final frame otherwise
(`0x1bce84` stores the final frame at `+4` and 0 at `+8`). Frame 0 is the
no-SD panel: `TextBox_06` visible, `SDWindow`, `TextBox_04` and `TextBox_05`
hidden, grey card. Frame 1 is the accessible panel: SD window, "Open Blocks"
and a green card. States 1, 3 and 4 put `dat_no_sd_u`, `dat_ng_sd_u` or
`dat_protect_u` in `TextBox_06`. Only state 2 writes `TextBox_05`, the free
SD block count, which is device data.

## Portfolio state decision

Both native empty states are exact branches, but each makes a different
portfolio claim:

- **No SD (state 1)** needs no device values. Both leaves then show the same
  lower message, "No SD Card found.", and the upper no-SD panel. This conflicts
  with the portfolio Camera gallery, whose photos a real console reads from SD.
- **Accessible, empty SD (state 2)** shows the distinct "There is no accessible
  software data." and "There is no extra data." messages. Its "Open Blocks"
  window then needs a count; none is supplied, so it would be blank, as the
  DS Profile values are.

The coordinator should choose one before implementation. Do not substitute
authored text for either message.

## Publication request

Settings `packs/settings/contents/0000-0000003d/`, English `mset`, retaining
source styles:

- `layout.json`: `SMngCTRData_D_00`, `SMngCTRData_D_00_SceneIn_00`,
  `SMngCTRData_D_00_SceneIn_01`, `SMngCTRData_D_00_TextIn` and
  `SMngCTRData_D_00_BtnIn`, with texture dependencies.
- Labels `dat_sof_title_u`, `dat_opt_title_u`, `dat_3ds_comm`, `dat_sd_u` and
  `dat_block_u`, plus state-specific `dat_no_sd` / `dat_no_sd_u`. Include
  `dat_ng_sd`, `dat_ng_sd_u`, `dat_writeprotect` and `dat_protect_u` only if
  error states are wanted.

`SMng_U_01`, `SMng_U_01_NonSD`, `CommonBG_U_00_SceneIn_04`, `IconDataMa`,
`Base_D_00`, `dat_3ds_comm1_u`/`2_u`, both page labels and both SD-present
empty messages are already published. The audit found none of the missing
resources on any repository branch.

## Private source render comparison

A private, unshipped preview drew both leaves from the complete private
conversion (`assets/stock-ui/settings-converted/`, schema-identical to
publication) in both SD states. It composes the resources above, with
`SceneIn_00` frame 20 and `BtnIn`/`TextIn` frame 20 restricted to their bound
groups. The page counters and `Window_00` are hidden. Icon buttons, half tabs,
arrows and wait icon are not attached, and `TextBox_05` is blank. Twelve
renders had empty diagnostics and left the packs unchanged. The current leaf is
also visibly defective: its sentence is clipped at both edges of the scaled
panel ("o Nintendo 3DS software data is provide").

The preview found one renderer gap: `SMng_U_01/UpLineWide_03` has signed size
−330. It encodes a mirrored rule, as the `TextBG_U_00` corners do, so only the
32 px cap draws behind "SD Card". Implementation needs a mirror override like
`panelMirrors`, then paired verification.

## Unresolved

- Whether normal entry uses `SceneIn_00` or `_01` (both settle `NAND_SD` at
  alpha 255; the constructor does not choose). Both also hold
  `TextBoxTitle_00` at alpha 0; the preview applies `TextIn` afterwards,
  following the load sequence, rather than proving evaluation order.
- Child button class semantics, arrow (`R_Arrow*_Appear`, `ArrowSet`) and wait
  icon settled states for an empty list.
- SD global state 0, and native LCD or live browser comparison.

## Reproduction

```sh
python3 scripts/audit_settings_data_lists.py --romfs <settings romfs> \
  --code <settings exefs/code.bin> --published <published Settings pack dir> \
  --report <absolute report path>
```

The audit reads and decompresses resources and decodes PC-relative operands. It
checks the code and table hashes, and reports records, the footer and
page-label tables, range hashes, key instruction words, source members, label
texts and missing publication. It does not execute firmware.
`tests/test_settings_data_audit.py` covers the operand decoder and record
parser.

Private evidence is under the firmware SSD artifact root in
`presentation/settings-data-software-audit/`: `source-audit.json`, decoded
layouts and clips, annotated disassembly (`asm/`), `preview.mjs` and
`renders/`.
