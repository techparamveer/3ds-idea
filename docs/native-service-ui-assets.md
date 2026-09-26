# Native service and helper UI subsets

These selected local assets support the stock UI scope in
`portfolio-ui-scope.md`. They provide source layouts, clips, dependent textures,
fonts and selected EU English messages. They do not add application entrypoints
or implement network services, purchases, account operations, system updates,
transfers, calibration, recording, capture or editing. Camera remains a read-only
portfolio gallery; Sound remains a supplied-song player.

The exact layouts, clips and message labels are recorded in
`scripts/firmware/stock-ui-<slug>.json`. URLs are relative to
`public/os/firmware/10.7.0-32E/`. Each title uses `packs/<slug>/`, except eShop,
which uses `packs/eshop/contents/0000-0000006b/`. Counts include dependencies
shared with other titles and therefore are not additive.

| Slug / title ID | Selected components | Resources / bytes |
| --- | --- | --- |
| eshop / `0004001000022900` | Boot opening/splash/welcome; Common backgrounds/system menu/`info_U_00`; Entrance menu position/buttons; `cad-Hud-arc-lz` `HudMenu_00` | 46 / 793,248 |
| system-transfer / `0004001000022a00` | CARDBOARD backgrounds, title, choice buttons and return button | 16 / 154,438 |
| nintendo-zone / `0004001000022b00` | Help screens, HUD, bottom menu and supplied EU top banner | 103 / 3,462,735 |
| system-updater / `0004001000022f00` | Base backgrounds, upper text/icon, message/start layouts and B_L | 17 / 164,973 |
| nnid-settings / `000400100002c100` | Root, BG, TopButton, AccountHeader, ToolBar, OliveBack and ExitButton | 29 / 164,937 |
| camera-applet / `0004003000009902` | Flow dialog Dlg_A_D_00/01; no capture layout | 3 / 31,352 |
| manual / `0004003000009b02` | MainNull, PageBg00, IndexBase00, SoftTitleHeader, back/close/headline buttons, ContentsTxt and PageNum | 27 / 185,392 |
| miiverse-post / `000400300000ba02` | MainNull, MemoWin, CancelBtn and common dialog components | 20 / 156,213 |
| error / `000400300000c502` | Error background, normal error, bottom button, EULA and dialog button | 27 / 292,582 |
| circle-pad-pro / `000400300000cd02` | Backgrounds, AnalogPad screens, B_S and TextBG | 13 / 88,754 |
| mii-selector / `000400300000d102` | Select base, upper base, background filters and Mii-name pane | 56 / 705,891 |
| camera-picker / `000400300000d302` | Apt dialog/menu and browser base/folder/photo/cursor/text | 31 / 130,385 |
| sound-picker / `000400300000d402` | Voice-selection upper/lower components and balloon cursor | 35 / 147,909 |
| memo / `000400300000f602` | Memo upper/lower layouts and page/stamp buttons | 36 / 2,082,065 |

## Presentation contracts

All selected clips retain their source names and hierarchy fields. Source
layouts can contain non-English placeholders; replace those from the selected
English banks or documented portfolio content. A native asset's availability
does not authorize recreating its original hardware or service behavior.

- **eShop:** `cad-Boot-arc-lz.json`, `cad-Common-arc-lz.json`,
  `cad-Entrance-arc-lz.json` and `cad-Hud-arc-lz.json`; bank `tiger.msbt`
  supplies welcome, navigation, Search, News and Recent Arrivals labels, and
  `hud.msbt` supplies the welcome status-strip date/wireless labels. Remote
  catalog/promotional content is absent. The table count above predates the HUD
  pack and is not retallied here.
- **System Transfer:** `CARDBOARD-layout-layout-lz77.json`; bank `cardboard_ctr`
  supplies the title and four original transfer-choice labels.
- **Nintendo Zone:** `layout-nwcx.json` and
  `www-included_html-3dbanner_EU-nwcla.json`; bank `mars` supplies local welcome,
  HOME, back and close text. Remote content is absent.
- **System Updater:** `base.json`, `up.json`, `layout.json`, `button.json` and
  `message_EU.json`; bank `mset` retains exact EU English archive selection and
  source styles. These are presentation resources, not an updater.
- **NNID Settings:** `layout-*.json` and `messages-and-loose.json`; bank `cave`
  has `StartMenu_End` and `StartMenu_Close`. Its explicit shared-system-font
  binding for `font.bcfnt` is a presentation adapter, not verified original
  internal registration. Remote account content is absent.
- **Camera applet:** `lyt-PSS_FlowDlg_D-arc-LZ.json` and `msg-EU_English.json`;
  bank `P_ap_shoot` has `S_D_02_E`, `S_D_03_E`, `ToHome_00`,
  `App_Jump_02_Btn0` and `App_Jump_02_Btn1`.
- **Manual:** separate `layout-<name>.json` packs and bank `ebird` with
  `BtnBack`, `BtnBack_Picto` and `BtnClose`. This is viewer chrome, not complete
  per-title manuals. The Contents screen additions are described in
  [Manual Contents chrome](#manual-contents-chrome).
- **Miiverse post:** `cad-Main-arc-lz.json`, `cad-Common-arc-lz.json`; bank
  `message.msbt` has `STR_CANCEL`, `STR_OK`, `STR_ERROR_INIT`, `STR_ERROR_NNID`.
- **Error:** `erreula.json`; banks `error_msbt_LZ` and `eula_msbt_LZ` supply the
  title/back subset.
- **Circle Pad Pro:** `extrapad.json`; bank `extrapad_msbt_LZ` supplies initial
  instructions and cancel/next labels.
- **Mii selector:** `layout-Select.json` and `message-EU_English.json`; bank
  `appm` supplies selected text and back/confirm labels. No fabricated Mii model
  or Mii Maker functionality is included.
- **Camera picker:** `lyt-P_AptDlg_U-arc-LZ.json`,
  `lyt-P_Brws_D-arc-LZ.json`, `msg-EU_English.json`; bank `P_ap_psel` has
  `LU_06`, `LU_11`, `L_D_01`, `L_D_02`, `L_D_03_00`, `L_D_05`.
- **Sound picker:** `lyt-S_ApVoicSele_D-arc-LZ.json`,
  `lyt-S_ApVoicSele_U-arc-LZ.json`, `lyt-Balloon-arc-LZ.json` and
  `msg-EU_English.json`; bank `S_ap_vsel` has `B_close`, `B_confirm`, `M_title`.
  This internal helper's source title says “Select a recording.” It does not
  enable recording or imply a new HOME entrypoint.
- **Memo:** `Memo_D.json`; bank `memo3ds` has `Button_OK`, `Button_Quit`,
  `MoveSlidebar`, `ReturnCanvas`. Editing remains outside scope.

## Manual Contents chrome

Target capture: the first native Settings Manual Contents screen,
`/Volumes/Codex3DSIsolated/camera-guide-replay-20260926/screenshots/_26.09.26_23.19.14.606.png`
(SHA-256 `2efb7fa73192641b7448735f407cfaeebf7b79445ee1b92bf256f39c1566799b`).
It shows the title header with the Settings icon, a scroll indicator, the
Contents headline, a green selected-entry cursor, a green category band and a
two-button footer: X Close at left and Y Language at right.

Plan `scripts/firmware/stock-ui-manual-contents.json` publishes the
remaining source components with `stock_ui.py --additive` from the private
`manual-native14/` conversion (source manifest SHA-256
`644f10a7c3d1d8450db9e3ac0d55ed5cb4f5dbedfd5697eba1c044060522a8c6`, title
`0004003000009b02` RomFS SHA-256
`1ad09a3d260fbc7da5c91ab5a6bfa93944459a9b181f3ad92b0560b7eec6e657`). Earlier
manual packs are unchanged. Each pack records its source archive and member
hashes in `resourceSources`:

| Pack / layout | Selected animations | Source archive SHA-256 | Evidence |
| --- | --- | --- | --- |
| `IndexNull` | `_Change`, `_Wait` | `4919d69f…004911e` | 400×480 Contents root; null slots `BtnGroup/{IndexBase,HeadLineAll,CursorNull}`, `SoftTitleHead` (0,262), `BottomBtnNull/BtnShdw` (0,-120), `ScrollIndicator` (192,0), `Dialog` |
| `CsrHeadLine00` | `_FadeOut`, `_Push`, `_PushDown`, `_Wait` | `e2805597…afed68b` | Selected-entry cursor; `BtnArrow.bclim` 32×64 |
| `HLTxt` | none in source | `0116f4c8…ac3258e` | Category band, mirrored `IndexCategory00/01` with `CategoryColor00.bclim` 16×32 and `TextBox_00` |
| `ScrollIndicator` | `_Limit`, `_Wait` | `158be427…ac3847` | `StartPic`/`EndPic` with `ScrollIndicator.bclim` 8×8 |
| `BtnCloseLng00` | `_Decide`, `_Invalid`, `_SceneIn`, `_SceneOut`, `_Select` | `e4c80059…9143c6e` | Left footer button `P_Btn_01` (-80,-120), 160×28 |
| `BtnLngSel00` | same five | `e0c60c2c…3b52187` | Right footer button `P_Btn_02` (80,-120), 160×28 |
| `BtnShdw00` | same five | `8716c03e…ba9c5` | Footer shadow `P_Shdw_00` 320×9, matching the `IndexNull` `BtnShdw` slot name |

Archives are `layout/<name>.arc` in the manual RomFS. The existing
`messages-and-loose.json` bank `ebird` is merged with source labels
`BtnCloseLng` (`\ue071 Close`), `BtnLngSel` (`Language`) and `BtnLngSel_Picto`
(`\ue003`, the Y glyph); prior labels keep their text. Three textures are new
(`BtnArrow`, `CategoryColor00`, `ScrollIndicator`); the footer and shadow
textures were already delivered. The Settings title icon remains the existing
48×48 `icons/settings.png` (Settings content 0 `ExeFS/icon`, SHA-256
`40a78f71…8615f1`). No new icon was produced.

Checks: `test_stock_ui.py` (14 tests, including a delivery-closure test for this
plan) and `test_firmware_manual.py` pass. A second publisher run is byte-identical.
`audit.py --artifacts <assets>/stock-ui` resolves every `0004003000009b02`
resource against `stock-ui/extracted/manual`. Its only manual-related errors are
the Settings `Manual.bcma` paths, which live under the separate `multicontent`
root. The full private report is
`stock-ui/manual-contents-2026-09-26/delivery-audit-stock-ui-root.json`.

Remaining gaps: runtime composition is not included. How native code fills
the `IndexNull` slots, stacks `BtnHeadLineTxt` and `HLTxt` entries, positions
the cursor and colours categories is not source-proved here. In the capture,
the category bands are green, then blue. The source texture is a single
`CategoryColor00`; any colour change must come from material or code
parameters that have not been traced. The binding of the Settings SMDH icon to
`SoftTitleHeader/P_Icon_00` (32×32, `IconMask`) and its scaling are also
untraced. The upper-screen page striping, the Language screen and dialogs are
excluded. No native/browser comparison has been made, so this is delivery
evidence, not fidelity evidence.

## Provenance and verification

Converter v1.4.0 adds bounded SARC decoding and an explicitly allowlisted
Camera/Sound table wrapper. System Updater follows Settings' exact regional
message selection. The Camera/Sound apps and three helpers now deliver selected
English messages with original sibling styles; source message indices survive
selection. Each title records the actual converter dependency hashes and the
publisher/selection/source-manifest hashes. No raw archives are published.

Private artifacts live under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/stock-ui/`.
The `*-native14/` converter outputs supply this slice; helper messages use
`camera-applet-helpers14/`, `camera-picker-helpers14/` and
`sound-picker-helpers14/`. `service-textures.png` was visually inspected as source
texture evidence only.

`service-delivery-audit.json` passes with 1,256 resources, 374 layouts, 1,469
animations, 1,414 texture references, 26 message banks and 20 style tables.
`message-source-audit/audit.json` passes all 15 private-source checks for the five
Camera/Sound app/helper message packs. Existing unsupported-field/container and
unreferenced-file warnings remain reported; these totals do not claim every
firmware resource is supported. Four archive tests, four RomFS tests and three
publisher tests pass. Locale tests pass nine cases with one private-input case
skipped; general firmware tests pass 18 with five optional cases skipped.
All 483 original resource records and actual file hashes remain unchanged,
along with the HOME title and global HOME/font/model/converter fields. Every
current resource's size and SHA-256 were independently checked against delivery.

Screen assembly, clipping, animation behavior and browser/reference comparison
remain presentation/runtime/coordinator verification. Decoded contact sheets and
hash checks do not establish final visual fidelity.

## Remaining format gaps

amiibo Settings (`000400300000b902`) and the eShop helper
(`000400300000d602`) use newer FLYT/FLAN/FLIM graphics. Their SARC archives now
unpack privately, but graphics decoding remains unsupported: 394 members across
77 private packs for amiibo Settings and 457 across nine for the eShop helper.
Neither title is published as a pretend complete screen set.

Observed FLYT version `0x07020000` has larger pane/name/group records and a
different material schema. FLIM alignment/format/swizzle fields also differ
from CLIM. Relabeling these files and passing them to the old decoder is not a
valid conversion. A separately verified decoder is required before delivery.
