# Toolbar native UI subsets

These additive resources follow the stock UI scope in `portfolio-ui-scope.md`.
They provide original local screen components and EU English messages for basic
UI navigation. They do not provide network services, note editing, profile
editing, keyboard input or a recreated remote Miiverse website.

Exact layout and clip requests are listed in `scripts/firmware/stock-ui-*.json`.
All URLs below are relative to `public/os/firmware/10.7.0-32E/`.

| Title | Pack prefix | Selected layout groups | Resources / bytes including dependencies |
| --- | --- | --- | --- |
| Game Notes `0004003000009c02` | `packs/game-notes/` | `memo-Bg_U_00-arc-l`, `memo-Bg_D_00-arc-l`, `memo-MemoListDown-arc-l`, `memo-MemoTutorialUp-arc-l`, `memo-MemoTutorialDown-arc-l`, `memo-MemoWriteDown-arc-l`; layout names are the middle name | 35 / 3,003,226 |
| Friends `0004003000009f02` | `packs/friends/` | `friend.json`: FrdTopBG_U_00/D_00, FrdTopUIUp_D_00, FrdTopUIDw_D_00, CmnBtmBtn_D_00, FrdElemCard_DB_00/DF_00/UB_00/UF_00 | 42 / 1,906,264 |
| Notifications `000400300000a002` | `packs/notifications/` | `news.json`: NewsTopUI_U_00/D_00, NewsTopBtn_D_00, NewsUnread_U_00, NewsWndwNews_U_00/D_00, NewsDetailUI_00, NewsElemCnt_00; `slidebar.json`: SlideBar | 41 / 241,116 |
| Browser `0004003000009d02` | `packs/browser/contents/0000-0000001f/` | Root, BG, StartDialog and six menu buttons; ToolBar, StartMenuButton, ExitButton, PrevButton, NextButton, UpdateButton, ZoomPlusButton, ZoomMinusButton | 76 / 497,235 |
| Miiverse `000400300000be02` | `packs/miiverse/` | Root, BG, TopButton, ToolBar, OliveBack, OliveManualButton, CommunityButton, ActivityButton, MyMenuButton, NotificationButton, ExitButton | 39 / 353,271 |

For Browser/Miiverse, single-layout packs use `layout-Root.json`,
`layout-BG.json`, `layout-start-dialog-<name>.json`, and
`layout-toolbar-<name>.json`; TopButton uses `layout-TopButton.json`.
All five titles include `messages-and-loose.json` with selected labels. Banks
are `message`, `friend_msbt_LZ`, `newslist_msbt_LZ`, `spider`, and `cave`
respectively. Complete label lists are in each selection plan. Friend and
notification messages retain their source English sibling MSTL tables.

The original converter allowed Chinese/other regional loose banks to claim a
basename before EU English. Stock conversion now selects an exact EU_English
directory before creating bank keys. The regression test covers Chinese,
Japanese, Korean, Taiwan English and US English alternatives. HOME conversion
and previously delivered resources are unchanged.

Browser and Miiverse's native layouts refer to `font.bcfnt`, absent as a local
font file. Their explicit `presentationFontBindings` map it to the already
verified shared system font. This is a documented presentation adapter, not
proof of their original internal font registration. The native layout files
retain their source font names. No generic browser font is substituted.

Eight locale tests and three publisher tests pass (one private-source locale
test remains opt-in). The combined delivery audit passes. Representative source
textures are in the inspected private `stock-ui/toolbar-textures.png` contact
sheet; it is not assembled-screen proof. The coordinator owns browser comparison.
Native layouts contain source-language placeholders, which presentation must
replace from the delivered English banks. Remote service content remains absent.
