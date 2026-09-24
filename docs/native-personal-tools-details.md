# Friend profile and selected Game Note components

These additions support read-only interior screens. They retain source layouts,
clip groups, labels and message styles; they do not provide editing, generated
Miis, a friend identity, a suspended-game capture or a keyboard.

## Friend own-card profile

The existing `packs/friends/friend.json` layouts contain the own-card branch;
there is no separate profile layout in this source archive. In
`FrdTopUIUp_D_00`, group `G_RotateOwn_00` contains `N_BtnTopPivot_01` and
`N_BtnRegF_01`. The pivot contains the native Favourite Title and Message
controls. Main settings/registration controls use `N_BtnTopPivot_00`, and the
friend-join branch uses `_02`. Select the intended branch in presentation;
applying the full multi-group clip without controlling visibility may combine
mutually exclusive source states.

| Layout / pane | Source label or portfolio value |
| --- | --- |
| `FrdTopUIUp_D_00/T_Box_08` and `_09` | `fri_edit` (Favourite Title) |
| `FrdTopUIUp_D_00/T_Box_06` and `_07` | `fri_twitt` (Message) |
| `FrdElemCard_UF_00/T_FrdName_00` | Saved nickname |
| `FrdElemCard_UF_00/T_FrdCode_00` | `fri_code` |
| `FrdElemCard_UF_00/T_FrdCodeNum_00` | Actual supplied friend code, otherwise absent; do not retain the source repeated-3 placeholder |
| `FrdElemCard_UF_00/T_FavName_00` | `fri_favorite_u` |
| `FrdElemCard_UF_00/T_FavAppName_00` | Supplied favourite title or `fri_edit_fav_none` |
| `FrdElemCard_DB_00/T_Box_03` | Saved status message |
| `FrdElemCard_DB_00/T_NoComment_00` | `fri_twitt_none` when no message exists |

`FrdElemCard_UB_00/N_MiiDummy_00` and lower `N_Mii_00` require external Mii
content; no Mii asset is fabricated. Native edit controls may be visible as
read-only chrome without implementing edits. Screen state and Back routing
remain runtime-owned.

`CmnBtmBtn_D_01` and its five matching clips are now delivered. Its two-button
text pairs are `T_BtnB_00/F_00` and `T_BtnB_01/F_01`. Added English labels in
`messages-and-loose.json`, bank `friend_msbt_LZ`, are `fri_edit`, `fri_twitt`,
`fri_dlg_2b_back` (native B glyph plus Back), `fri_base_1b_deci`,
`fri_base_2b_deci`, and `fri_base_2b_canc`. These preserve the original styles.
Friends now totals 42 resources / 1,960,343 bytes including dependencies.

## Selected Game Note

The previously delivered `memo-MemoWriteDown-arc-l.json` already contains the
native lower canvas and tool strip. `P_BtnMemoALL` is 320 × 216 at (0,12), with
`P_MemoFrameALL` as its border. Its bottom tool centres are x=-138,-92,-46,0,
46,92,138 for Back, black, red, blue, eraser, screen switch and folder/settings.
Source y=-120 is the rest position; use the source scene animation before
deriving final hit rectangles. `TextBox_00/01` and `EmbossTxb_00/01` are the
extended tool labels; `0200DescriptionAllClear` and `0200DescriptionPhotoSave`
are now delivered. Clear/export/drawing remain disabled by scope.

New pack `packs/game-notes/memo-ImageScreenUp-arc-l.json` delivers
`ImageScreenUp` and all its 14 source clips. Its source text panes `T_TextList`
and `T_TextWrite` are each 326 × 116 at (0,-8). The complete English empty-state
message is `9900NoBreakGameMesList`. `9900NoBreakGameMes` starts with a space and
requires a dynamic subject; do not display it bare as a complete sentence.

The native upper layout contains `P_ScreenUpR/L`, `P_ScreenDown` and shadow
panes for externally supplied suspended-software images. The runtime now supplies
the suspended application's last complete browser LCD pair
([suspended capture](native-notes-suspended-capture.md)). `PanelNoGameIn` is a 21-frame clip that settles those image/shadow
alphas to zero, puts `W_TextPanel` at y=-80 with alpha255, and also sets both
text panes invisible/alpha0. `TextPanelInOut` and `TextPanelStay` retain that
text visibility state. `SceneIn` alone instead restores screenshot alphas.
Consequently clip names alone do not define the complete no-game screen:
presentation must explicitly select the required native text pane and its
visibility for the read-only empty state. Document that composition adapter;
do not rewrite source clips or invent a captured game image.

Game Notes now totals 46 resources / 3,194,151 bytes including dependencies.
The combined audit passes: 1,385 resources, 474 layouts and 1,610 animations.
Private report: `stock-ui/personal-tools-details-audit.json`. This validates
delivery dependencies and source structure, not final browser appearance.
