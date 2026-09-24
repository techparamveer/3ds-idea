# Data Management Software and Extra Data: source audit

2026-09-24. The **Data Management → Nintendo 3DS → Software** and **Extra
Data** leaves now draw the source scenes `datamng_ctr_soft` and
`datamng_ctr_data` in the accessible, empty SD state (state 2). They no longer
use the adapted `TextBG_U_00` card. The sections below record the source trace;
[Implementation](#implementation) records publication, composition and evidence.

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
  window then needs a count; none is supplied, so it stays blank, as the
  DS Profile values do.

**Chosen: state 2**, a working SD card with zero installed software and extra
data, consistent with the read-only Camera gallery. The free-block count is
never invented. No authored text replaces either message.

## Implementation

### Publication

`scripts/firmware/stock-ui-settings.json` is now the complete cumulative
Settings plan (it previously lagged the parental dialog publication). It adds
exactly these resources from converter 1.3.2's private
`assets/stock-ui/settings-converted/` to `packs/settings/contents/0000-0000003d/`:

- `layout.json`: `SMngCTRData_D_00` and its four clips `SceneIn_00`,
  `SceneIn_01`, `TextIn` and `BtnIn`. Its only texture, `BtnBG.bclim`, was
  already delivered with an identical hash.
- `message_EU.json` `mset`: `dat_sof_title_u`, `dat_opt_title_u`,
  `dat_3ds_comm`, `dat_sd_u` and `dat_block_u` (source indices 698, 782, 702,
  704 and 706, with their original style indices).

Each resource keeps its `resourceSources` member path and decoded hash. These
match the source audit hashes. `SceneIn_01` is unused at runtime. It is
published so that the verifier can prove from delivered bytes that it settles
identically to `SceneIn_00`. The SD-error labels `dat_no_sd`, `dat_no_sd_u`,
`dat_ng_sd`, `dat_ng_sd_u`, `dat_writeprotect` and `dat_protect_u` belong to
other states and remain unpublished. The publisher preserved HOME, shared fonts
and all other packs. Only the manifest, `layout.json` and `message_EU.json`
changed. The manifest's Settings `planSha256` is now `e2900d23…`.

### Composition

`stock-native-settings.ts` draws both leaves with the Data Management palette
(state 4) and these components:

- **Upper LCD:** `CommonBG_U_00` shows the record title, with `IconDataMa` in
  its icon mount. `SMng_U_01` follows, with `NonSD` at its final frame 1 (the
  accessible-SD panel). It sets `TextBox_00` to `dat_3ds_comm1_u`/`2_u`,
  `TextBox_03` to "SD Card" and `TextBox_04` to "Open Blocks", and leaves
  `TextBox_05` blank. `UpLineWide_03`'s signed width is drawn as the absolute
  size with a reflected X scale. Its origin is left (`origin` 3), so this
  covers the same span, x −149…181, as the signed size.
- **Lower LCD:** `SMngCTRData_D_00` binds `SceneIn_00`, `BtnIn` to `Group_05`
  and `TextIn` to `Group_03`, each at local frame 20. `TextBoxTitle_00` is
  visible and shows the empty message. `TextPageBox` shows the page label and
  `TextBoxTitle_01` shows "Software title list". The page counters and
  `Window_00` are hidden. No child is attached to the icon-button, half-tab,
  arrow or wait-icon mounts.
- **Footer and controls:** `Base_D_00` Back. The only touch target is the
  existing detail Back rectangle, and B, keyboard and touch share the existing
  Back path. The leaves emit no effects and leave shared data unchanged.

`stock-settings-navigation.ts` uses the two source messages as the leaves'
view text. That text feeds the fallback card and the view's accessible text.

### Evidence

Artifacts are under `presentation/settings-data-source/` at the firmware SSD
artifact root:

- **Source audit:** `audit-after.json` reports zero missing dependencies for
  state 2, plus the six unpublished alternative-state labels.
  `audit-before.json` reproduces the earlier report exactly.
- **Delivery audit:** `delivery-audit*.json`, each with a `-baseline` twin.
  The publication adds no errors. The two public-only errors are
  converter-script hash drift that the base commit already had. With the
  verified multi-content extraction, five more private sources pass
  (2,621 → 2,626) and there are no Settings errors.
- **Source render comparison:** `comparison/`. Both lower LCDs are
  pixel-identical to the earlier private source preview. Both upper LCDs differ
  only in x 51–378, y 73–98, where the reflected rule now draws. The other 52
  Settings renders are byte-identical to the previous verifier run.
- **Verifier:** `scripts/verify-stock-settings.mjs` covers five main and 23
  subpage paired renders. For these leaves it asserts the source calls, labels
  and styles, blank free-block count, absence of attachments and the Back-only
  footer. It also asserts that `SceneIn_00` and `SceneIn_01` settle identically
  and that the rule is undrawn without the reflection and covers the panel with
  it. Output is in `verifier/`.

Browser inspection and native LCD comparison are still to do; both belong to
the coordinator.

## Unresolved

The later [Open Blocks audit](settings-open-blocks-source-audit.md) traces the
free-block value to SD filesystem IPC and verifies the orange window's source
registers. The missing SD allocation value and native material comparison remain
open; the field stays blank.

- Which clip normal entry uses, `SceneIn_00` or `_01`. The constructor does not
  choose, and both settle to identical poses at frame 20. `TextIn` is applied
  after `SceneIn`, following the load sequence; evaluation order is not proven.
- Child button class semantics, and the settled states of the arrows
  (`R_Arrow*_Appear`, `ArrowSet`) and wait icon for an empty list. These mounts
  stay unattached.
- SD global state 0, the `SDWindow` implicit-material fill (drawn as orange by
  the shared renderer) and native LCD or live browser comparison.
- Entry and exit motion. Both leaves present settled frames only.

## Reproduction

```sh
python3 scripts/audit_settings_data_lists.py --romfs <settings romfs> \
  --code <settings exefs/code.bin> --published <published Settings pack dir> \
  --report <absolute report path>
python3 -B scripts/firmware/stock_ui.py --source <private settings-converted> \
  --output <delivery dir> --plan scripts/firmware/stock-ui-settings.json
node scripts/verify-stock-settings.mjs --artifact-dir <abs> --asset-root <abs delivery> \
  --canvas-module <abs @napi-rs/canvas> --font-manifest <abs fonts/shared/font.json>
```

The audit reads and decompresses resources and decodes PC-relative operands. It
checks the code and table hashes, and reports records, the footer and
page-label tables, range hashes, key instruction words, source members, label
texts and missing publication. It does not execute firmware.
`tests/test_settings_data_audit.py` covers the operand decoder, record parser
and state classification. `tests/settings-data-lists-delivery.test.mjs` pins
the delivered resources to their source member hashes and texts.

Earlier private evidence is under `presentation/settings-data-software-audit/`:
`source-audit.json`, decoded layouts and clips, annotated disassembly (`asm/`),
`preview.mjs` and `renders/`.
