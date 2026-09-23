# Remaining helper entry-screen asset audit

This audit concerns native components available for read-only initial screens.
Source layouts establish panes and artwork; they do not by themselves establish
the executable's complete initial-state composition. Keep missing bodies, user
data and hardware behavior explicit. No keyboard or executable research is used.

All prefixes below are `packs/<slug>/` under the current firmware delivery.

## NNID Settings — `000400100002c100`

The dual-screen `layout-Root.json` has `AccountHeaderPos` (0,120), `ToolBarPos`
(0,-226), `DialogPos` (0,-120), and `DialogHeaderPos` (0,120). Compose native
`BG`, `AccountHeader`, `ToolBar`, `OliveBack` and/or `ExitButton` in those mounts.
`AccountHeader` has two text layers `T_HeaderTitle_00/01`; both default to a
Japanese create-ID label and need replacement for the intended screen.
`AccountHeader_ApltFade` is 11 frames and `TextFade` 17; ToolBar FadeIn is 21.
ExitButton uses `TextBox` and `EmbossTxb` with `cave/StartMenu_End`.

New generic `DialogBaseNormal`, `DialogNotice`, `DialogNormal`, `ButtonNormal`,
`BottomButtonF`, and `DialogHeaderNormal` packs provide local readonly notice
components. `DialogNotice/TextBox` is 280 × 192 at (0,0). `cave/Button_Return`
is the native B-glyph Back label; `Dialog_NonIconOk` and `Dialog_Cancel` are
also added. There is no supplied local account body or source initial Link/Create
message pair in this selected archive. A generic native notice with an authored
availability explanation is a web adapter, not the original remote account page.
Do not use the source Miiverse title from this shared bank as the NNID title.

## System Update — `0004001000022f00`

Use `base.json` backgrounds and `Base_D_00`; both `TextBox_00` and
`TextBoxShdw_00` take `mset/base_2b_back`. Upper `CommonBG_U_00/TextBoxTitle_00`
takes `update_title`; mount `IconUpdate` at its `Icon` pane (-174,82).
`TextBG_U_00/TextBox_00` takes `update_comm_u`. Lower
`MessageOnly_D_00/TextBoxTitle_00` can use `update_comm`, the source question
about connecting and updating. It does not imply an update has occurred.
Its SceneIn clips are 21 frames and SpecialIn is two; backgrounds have 41-frame
SceneIn_Legacy clips. The newly included `B_M` satisfies the two mounts in
`StartBtn2_D_00` should that component be used, but a readonly intro needs only
the message and Back. Never display `dlg_update_new` as a checked system status.

## System Transfer — `0004001000022a00`

Single `CARDBOARD-layout-layout-lz77.json` includes backgrounds,
`CommonBG_U_00`, `title_D_00`, `position_D_00`, two button types and return button.
`CommonBG_U_00/T_title_00` takes `cardboard_ctr/Title_Name`;
`title_D_00/T_title_00` can use newly delivered `CM_00_Header` (select an option).
`button_D_01/T_button_00` takes `Button_CM_00_CTR` or `Button_CM_00_TWL` for the
two transfer choices. `position_D_00` exposes two-choice mounts `N_button_20/21`
at (0,65)/(0,-27) beneath `N_position_D_00` at (0,-55), plus other state-specific
mounts. These are alternative arrangements, not all simultaneous buttons.
`N_returnBtn_D_00` is (-160,-120). Return text/shadow panes
`T_returnBtn_00/T_returnBtnS_00` use newly added `Button_Return`; the alternate
pair `_01` must be hidden unless intentionally used. System Settings/HOME return
labels are also supplied. No transfer is started.

## Circle Pad Pro — `000400300000cd02`

The previous selection exposed a calibration step, not proven initial readiness.
`extrapad.json` now also supplies `Dialog_D_00/01` and `Base_D_00/01`, with all
matching source clips. The source readiness message `cepd_dlg_ready` explains
when recalibration may be needed; it fits native `TextBoxDialog_00`.
`Dialog_D_00` has a 264 × 184 text pane at (0,0); `_01` adds a button text/shadow
pair. `Base_D_00` is a single native footer; `_01` has two text/shadow pairs.
Use source Cancel or OK labels as appropriate for readonly navigation.
`top_comm_u` belongs to the upper description. Do not show a confirmed
connection, reset or calibration success, nor claim that virtual input calibrated
the accessory.

amiibo Settings (`000400300000b902`) still has no public native screen set:
its FLYT/FLAN/FLIM graphics remain unsupported. Generic presentation is not a
native conversion and must not be described as one.

## Manual — `0004003000009b02`

`MainNull` is a 400 × 480 dual-screen root. It exposes central `ContsM`,
offscreen `ContsL/R` at x±340, `BtnNull` (0,-120), and `BtnPageNull` (0,-144).
Use the existing `PageBg00`, `IndexBase00`, `SoftTitleHeader`, `ContentsTxt` and
native buttons. `SoftTitleHeader/TextBoxTxt_00` must be the actual manual title;
`ContentsTxt/Contents_Txt` now has source `ebird/ContentsText`.
`BootMsg_Ebird` and `PageNum` are also supplied. Back text pairs are
`T_BtnB_Text/F_Text` plus B-glyph `T_BtnB_Pict/F_Pict`; Close uses
`T_BtnB_01/F_01`. No manual chapters are invented from `BtnHeadLineTxt`'s
Japanese sample title. This remains viewer chrome without a supplied manual body.

## Selectors and camera helper

- **Mii selector `000400300000d102`:** `layout-Select.json` contains the native
  upper/lower bases and filters. Lower `T_BgMessage_00` is the short prompt,
  `_01` the empty-body text. Use `appm_text_00` and `appm_text_03` respectively.
  Left/right base text+shadow pairs `_00/_01` can use `appm_btn_back_down` and
  `appm_btn_dec_down`; the central `_02` is an alternate arrangement, not a
  third simultaneous action. Show the source empty state when no Mii exists;
  do not generate Mii models or permit confirmation of a nonexistent selection.
- **Camera picker `000400300000d302`:** existing gallery base/folder/photo/cursor
  components are joined by `AptTxt/Apt1TxtUp` (312 × 24) for `L_D_03_00`.
  `P_BrwsTxt_D/TxtNoData` uses `L_D_05`; `AptMenu_D/TxtApt2BtnB/W` uses
  `L_D_01/02` for Back/Confirm. `P_AptDlg_U` is delivered but has no embedded
  text pane. `LU_06/11` are available source upper messages; attaching them
  requires a verified text component or a documented composition adapter.
  Confirm requires an actual supplied photo; no capture is available.
- **Sound picker `000400300000d402`:** `AptTxt/Apt1TxtUp` uses `M_title`;
  `Apt_D/TxtApt2BtnB/W` uses `B_close/B_confirm`. Native upper and balloon
  components are already present. No recordings are supplied, and no recording
  behavior or fabricated selection is introduced.
- **Camera applet `0004003000009902`:** the selected FlowDlg components and
  English title/quit/cancel/OK labels are dialog-only. The capture view was
  intentionally excluded; these assets do not establish a full initial camera
  applet screen. Keep the portfolio's Camera gallery route distinct.

## Delivery result

Only the visible gaps above were added. Existing HOME/global records remain
protected by the publisher. The combined audit passes with 1,519 resources,
554 layouts and 1,744 animations; report `stock-ui/helper-entry-audit.json` is
private. Screen assembly and browser checks remain coordinator/presentation work.

Updated title totals including shared dependencies: NNID 44 / 243,496 bytes;
Updater 18 / 174,864; Transfer 16 / 154,853; Manual 27 / 185,660;
Circle Pad Pro 20 / 203,858; Camera picker 32 / 135,263.
