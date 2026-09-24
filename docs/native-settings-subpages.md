# Native Settings subpage assets

The Settings selection now includes the native Internet, Parental Controls,
Data Management, Other Settings and Profile components, plus read-only detail
components. It preserves the previously delivered main screen. All pack URLs
remain under `packs/settings/contents/0000-0000003d/` and all messages below use
`message_EU.json`, bank `mset`, with the original English sibling styles.

This is a source component contract for presentation/runtime assembly, not
proof of the original executable's complete composition or routing. Mounts and
text are read directly from source layouts/messages. Menu actions below are
the intended read-only web navigation. No keyboard, PIN entry, network setup,
profile editing, data deletion or device configuration is implemented here.

## Shared screen composition

Use `base.json` native backgrounds and `Base_D_00` back footer. Override both
`TextBox_00` and `TextBoxShdw_00` with `base_2b_back`. `up.json` supplies
`CommonBG_U_00`, `TextBG_U_00` and section icons `IconNet`, `IconParental`,
`IconDataMa`, `IconBasic`, `IconUser`, `IconDateTime`, `IconSound`, `IconLang`.
`TextBG_U_00/TextBox_00` is its source text pane; title placement/composition
must follow the existing native upper-screen assembly.

Many `layout.json` screens contain only attachment panes. Rendering that root
without its child `button.json` layouts produces an empty menu. Child button
labels generally use `TextBox_00`; inspect the specific native layout for
additional text layers. Source coordinates are native centre-origin coordinates,
not browser hit rectangles.

## Menu contracts

| Screen / parent layout | Mount → child layout | English label / navigation |
| --- | --- | --- |
| Internet / `NetTop_D_01` | `N_B_LBlue_00` → `B_LBlue` at (0,64) | `net_set` / Connection Settings |
| Internet | `N_B_S_00` → `B_S` at (0,1) | `net_bg24` / SpotPass |
| Internet | `N_B_S_01` → `B_S` at (0,-32) | `net_ds_card` / Nintendo DS Connections |
| Internet | `N_B_S_02` → `B_S` at (0,-65) | `net_option` / Other Information |
| Parental / `PareTop_D_00` | `N_B_L_00` → `B_L` at (0,72) | `par_change` / Parental Controls Settings |
| Parental | `N_B_S_00` → `B_S` at (0,16) | `par_change_pin` / Change PIN |
| Parental | `N_B_S_01` → `B_S` at (0,-18) | `par_change_mail` / Change Email Address |
| Parental | `N_B_S_02` → `B_S` at (0,-66) | `par_delete` / Clear Settings |
| Data / `SMngTopO_D_00` | `N_B_SMngCTRO_00` → `B_SMngCTRO` at (-68,64) | Native Nintendo 3DS artwork; `dat_software` for data label |
| Data | `N_B_SMngDSiO_00` → `B_SMngDSiO` at (80,64) | Native Nintendo DSi artwork; `dat_dsi_page` for semantic label |
| Data | `N_B_M_00` → `B_M` at (0,-8) | `dat_ce` / StreetPass Management |
| Data | `N_B_S_00` → `B_S` at (0,-64) | `dat_blist_reset` / Reset blocked-user settings |
| Other / `BasicTop_D_00` | `N_I_Button_00/01/02` at y44,-4,-52 | Source icon buttons such as `I_User`, `I_Date`, `I_Touch`; page assembly is presentation-owned |
| Other | `N_R_ArrowL_00`, `N_R_ArrowR_00` → `R_ArrowL/R` | Source animated page controls |
| Profile / `UserInfo_D_00` | `N_B_M_00/01/02` → `B_M` at y64,19,-26 | `user_name`, `birthday`, `region` |
| Profile | `N_B_S_00` → `B_S` at y-66 | `ds_user_info` / Nintendo DS Profile |

Parental `_00` is a configured-menu component. Do not imply that a real PIN
exists in the portfolio. `PareTop_D_01` is also delivered: its source text says
restrictions are already configured and asks whether to change them
(`par_top_comm2`); it is not evidence of a never-configured initial state.
The introductory texts `par_top_comm0`, `par_top_comm0_n`, `par_top_comm1`,
`par_top_comm_u`, `par_top_comm_u_n` are available for an explicitly read-only
information view. `MessageOnly_D_00/01` and `Btn2Text_D_00` are also delivered.

Upper titles/instructions: Internet `net_top_title`/`net_top_comm_u`; Parental
`parental_title_u`/`par_top_comm_u_n`; Data `dat_title_u`/`dat_comm_u`; Other
`settings_title`/`settings_comm_u`; Profile `user_info_title`/`user_info_comm_u`.
Main-screen labels remain `top_internet`, `top_parental`, `top_software`,
`top_settings` and `top_nnid`.

## Details and additional components

`UserInfo_U_00` exposes `TextBox_01` (user-name label), `_02` (value), `_03`
(region label), `_04/_05/_06` (region value variants), `_07` (birthday label),
`_08` (birthday value), and `_00` (instructions). Use portfolio preferences for
values and source `user_name_u`, `region_u`, `birthday_u` for labels. The nickname
detail can reuse this read-only presentation; no keyboard asset is added.

`Birthday_D_00` has title `TextBoxTitle_00`, value/unit panes `TextBox_01/02`,
and up/down small-arrow mounts. `DateTime_D_00` has year/month/day panes
`TextBox_00/01/02` and large/small arrows; `_01` has hour/minute panes
`TextBox_01/02`. Source labels are `birthday_comm`, `date_comm`, `time_comm`;
upper instructions use corresponding `_comm_u` labels. Read-only values must
not inherit source placeholder text such as HHHHHH or Japanese strings.

`Sound_D_00` mounts `T_OnOff` at y74,18,-38 with `surround`, `stereo`, `mono`.
`LanguageA_D_00` and `LanguageUS_D_00` are regional layout variants, not an
eight-language European screen; do not call the US layout a faithful EU
language page. EUR redirects `language` to `language_eu`, which uses the
`Country_D_00` list of `T_SB` rows and an `R_SlideBar`. See the
[Language source audit](settings-language-source-audit.md).

`NetSetTop_D_00`, `B_CnctW1/2/3`, `PareSelect_D_00`, `B_PareSB/Qst`,
`SMngCTR_D_00/01/02`, `SMngComm_D_00`, `SMngBackup_D_00`, upper `SMng_U_00/01/02`,
and corresponding selected button components provide further native submenus.
Exact lists and source clip names are in `scripts/firmware/stock-ui-settings.json`.

## Animation and verification

`NetTop_D_01`, `PareTop_D_00/01` and `SMngTopO_D_00` each have a two-frame
`SpecialIn_00` clip with source range 99–100. Its settled source values place
`Null_00` at y0 and alpha255. `BasicTop_D_00_SpecialIn_00` has source range
300–301; settled values include Scroll=(0,5), ScrollBg=(270,5), arrows x±180.
The 21-frame SceneIn clips and 16-frame Special page-shift clips are also kept.
Use the runtime's decoded local clip time convention, preserving source range
metadata; source absolute frames are not local clip offsets. Do not use a
page-shift Special clip as the initial settled screen.

The extended Settings selection contains 109 resources / 2,201,302 bytes,
including shared dependencies. Publishing validates every selected native
layout/clip and its dependencies before writing. The complete delivery audit
passes with 1,331 resources, 454 layouts and 1,560 animations. Private report:
`stock-ui/settings-subpages-audit.json` under the established firmware artifact
directory. Browser verification of the assembled screens remains required.
