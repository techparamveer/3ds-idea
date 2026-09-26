# Browser and Miiverse local interior components

These selections provide native local screen components for read-only navigation.
They do not provide a remote website/feed, editable bookmarks, network settings,
keyboard input, authentication or account operations. Source packs use exact EU
English directory selection. `browser-converted-english` and
`miiverse-converted-english` are the private converter outputs; the earlier
non-English outputs must not be used as message sources.

Browser URLs remain under `packs/browser/contents/0000-0000001f/`; Miiverse
uses `packs/miiverse/`. Each layout listed below has the single-layout filename
`layout-<name>.json`, with original matching clips. Exact delivered selections
are in `scripts/firmware/stock-ui-browser.json` and `stock-ui-miiverse.json`.

## Browser

| Native component | Text and attachment contract |
| --- | --- |
| `favorite-Container` | `ItemsNul` receives repeated bookmark rows; `ItemsBackNul` and `ItemsFrontNul` are separate layers |
| `favorite-Item` | `TitleTxb` contains the actual saved bookmark title |
| `favorite-EmptyMessage` | `TextBox` uses `Favorite_EmptyMessage` |
| `favorite-EditDialog` | Header `TextBox`; `TitleTxfRct` at (0,44), `UrlTxfRct` at (0,1), `DelBtnPos` at (0,-39); attach native text-field components for read-only values |
| `browse-pageinfo-PageInfoDialog` | Header `TitleTxb`; body mount `ScrollAreaRct` at (0,7) |
| `browse-pageinfo-PageInfoItem` | `LabelTxb` at (-120,-16), `ContentTxb` at (-119,-36) |
| `option-item-1Button` | `PositionNul` at (10,0); `ButtonRct` at (-17,-39), `HelpButtonPos` at (110,-39) relative to parent |
| `option-item-2Button` | `TextBox`; `Button1Rct` at (-64,-71), `Button2Rct` at (64,-71), `HelpButtonPos` at (110,-31), beneath `PositionNul` |
| `sceneinfo-SceneInfo` | `TitleTxb`, `RegisterTxb`, `NumberTxb`, `MaxNumberTxb`; counts must reflect actual saved items |
| `dialog-DialogInput` | `TitleTxb`, `TextBox`, field mount `TxfRct` at (0,-16) |
| `dialog-DialogNormal` | `TitleTxb`, `TextBox` |
| `error-DialogError` | `ErrCodeTxb` and `MainMsgTxb`; do not invent an error number |

Additional source components include `option-HelpButton`,
`option-item-NetworkInfo`, `option-item-Separator`, `option-item-VersionInfo`,
`sceneinfo-SceneInfoText`, scene icons `IconFavorite/Option`, `favorite-EditButton`,
`browse-pageinfo-IconSecurity` and `scrollbar-ScrollBar`. Generic assembly
components include `TextField`, `TextField2`, `TextFieldFavicon`,
`button-ButtonNormal/Select/SelectH/SelectHSearch`,
`dialog-Dialog/BaseNormal/Input/Normal/NormalNT/Notice/ScrollArea` (the actual
base filename is `layout-dialog-DialogBaseNormal.json`), native BottomButton
variants, DialogHeader variants and toolbar `BackButton/CloseMenuButton`.

The English `spider` bank adds source Settings title, help text and labels for
the runtime's read-only menu fields:

| Runtime field | Source label |
| --- | --- |
| auto-wrap | `Option_AutoWrap` |
| search-engine | `Option_SearchEngine` |
| delete-cookies | `Option_DeleteCookie` |
| clear-history | `Option_DeleteHistoryAll` |
| network | `Option_Network` |
| proxy | `Option_Proxy` |
| version | `Option_VersionInfo` |
| reset | `Option_Initialize` |

Corresponding nonempty `Option_Header*` explanatory messages are retained.
Bookmark labels use `Favorite_HeaderTitle`, `Favorite_HeaderInfo`,
`Favorite_HeaderRegisterNumLabel`, `Favorite_EmptyMessage` and
`FavoriteMode_EditTitle`. Page information labels are `PageInfo_Title`,
`PageInfo_Url`, `PageInfo_Security`, with `PageInfo_SecurityInvalid` available
only when that state actually applies. Unknown connection/security/version
values must not be fabricated from source placeholders.

`Keyboard_InputSearch`, `Keyboard_InputURL` and `Keyboard_InputDefault` are
source prompt strings only. The original entry flow depends on the excluded
keyboard. Reusing `DialogInput` with a native `TextField` for a read-only web
view is a documented composition adapter, not a verified original standalone
search/address screen. Do not render an active input or submit action.

## Miiverse

Miiverse includes the same generic native dialog/header/footer/button families,
plus `browse-Canvas`, `browse-jsdialog-BaseDialog`, `browse-jsdialog-Content`,
`AccountBelt`, `sysinfo-AccountHeader`, `PageFade`, and `toolbar-TextButton`.
These are local shell components; a canvas is not evidence of downloaded feed,
community, notification or account content. Account fields require actual data
and must not retain sample source values.

The `cave` bank adds `lau_title_olive`, local OK/cancel labels, connection and
communication error text, and the source recovery/exit messages. Do not use an
error message to imply an actual network attempt. The local Miiverse interior remains unpopulated: do not insert an availability
notice or a hand-authored section heading. Error codes require an actual
supplied error value. See [the bounded source-gap decision](miiverse-empty-interior-source-gap.md).

## Typography and verification

Neither title's selected source includes a sibling message style table. Original
message style indices remain intact. The documented plain-message adapter must
retain the native pane's typography rather than resolving those indices against
an unrelated title's table. Both titles keep explicit `font.bcfnt` bindings to
the verified shared native font.

The extended Browser set contains 181 resources / 1,144,700 bytes; Miiverse
contains 99 resources / 729,538 bytes, including dependencies shared with other
titles. Publishing verifies source hashes, native supported fields and texture
closure before writing. The combined delivery audit is recorded privately in
`stock-ui/browser-miiverse-interiors-audit.json`. Browser comparison and final
visibility, clipping, placement and navigation remain presentation-owned.
