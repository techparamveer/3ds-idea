# HOME grid ↔ toolbar interaction source audit

Date: 2 October 2026. Base: coordinator `5fd6a99c`. This is a bounded
source/resource audit. It changes no runtime, painter, public asset, browser,
Azahar session or private scenario matrix. In particular, it does not repeat
the rejected idle-cursor LCD-sampling experiment.

## Result

The current directional consumer already implements the source-backed native
grid/toolbar route. A clean vertical round trip preserves the grid column and
returns to the opposite edge selected by the return direction:

- Up from a grid column's top row enters the toolbar; Down returns to that
  column's top row.
- Down from a grid column's bottom row enters the toolbar; Up returns to that
  column's bottom row.
- With one row, either vertical direction enters the toolbar and either return
  direction selects that sole row.

No implementation candidate is justified before matched native captures. The
unresolved visible question is the exact focus/press/activation presentation,
not the existing table-driven selection arithmetic.

## Exact key route

Direction masks are Right `0x10`, Left `0x20`, Up `0x40` and Down `0x80`.
`src/os/home-scroll-consumer.ts` applies these source-backed rules in both the
root and an open folder:

1. At a vertical grid boundary, preserve the selected slot and save its
   viewport-relative column. If a previous toolbar focus is remembered, reuse
   it; otherwise map the column through the density row below. Entering the
   toolbar clears the remembered focus and seeks cursor Scale frame 10 for
   focus 0, frame 11 for focus 1–5, or frame 12 for focus 6–7.
2. Left/Right while toolbar-active wraps modulo eight. It clears both the saved
   grid column and remembered focus, so a later return uses the focus-to-column
   table rather than the entry column.
3. Up/Down from the toolbar uses the saved entry column when it still exists;
   otherwise it maps the current focus through the second table. Down selects
   the first row; Up selects the last row. Return clears active/current focus,
   remembers the departed toolbar focus and seeks the current density Scale
   frame.
4. A successful toolbar entry or toolbar horizontal move requests
   `SE_CTR_HOME_SELECT` (`0x0100003f`). A successful return to the grid requests
   `SE_CTR_HOME_ICON_SELECT` (`0x0100002c`). The shared cursor-selection effect
   follows the cue. The primary cursor takes the new focus or slot; the separate
   effect is anchored to the departed focus when it changed, otherwise to the
   departed grid slot. Primary Loop phase is preserved, and direction changes
   do not start primary Select or Decide.

The root and folder native mapping tables have identical values:

| Density | Grid visible column → toolbar focus | Toolbar focus 0…7 → grid column |
| --- | --- | --- |
| 0 | `1,3,5` | `0,0,1,1,1,2,2,2` |
| 1 | `1,3,5` | `0,0,1,1,1,2,2,2` |
| 2 | `0,2,3,4,6` | `0,0,1,2,3,4,4,4` |
| 3 | `0,1,2,3,4,5,6` | `0,1,2,3,4,5,6,6` |
| 4 | `0,1,1,2,3,4,5,5,6` | `0,1,3,4,5,7,8,8` |
| 5 | `0,1,1,2,3,3,4,5,5,6` | `0,1,3,4,6,7,9,9` |

These values come from root addresses `0x314e74` / `0x314f64` and folder
addresses `0x314eec` / `0x315024` in the pinned executable; they are navigation
indices, not inferred labels or evenly spaced geometry.

For a deterministic first capture at density 1 (the saved `columns: 4` token;
three grid columns are visible):

| Context/start | Key | Expected focus | Return key/result |
| --- | --- | --- | --- |
| Root slot 0, top row of visible column 0 | Up | 1, Notes, LCD `(76,16.5)`, Scale 11 | Down → slot 0 |
| Root slot 2, top row of visible column 1 | Up | 3, Notifications, LCD `(160,16.5)`, Scale 11 | Down → slot 2 |
| Root slot 4, top row of visible column 2 | Up | 5, Miiverse, LCD `(244,16.5)`, Scale 11 | Down → slot 4 |
| Folder slot 0, sole row of visible column 0 | Up | 1, Notes, LCD `(76,16.5)`, Scale 11 | Down → slot 0 |

This recipe assumes no remembered toolbar focus. A prior toolbar exit stores
that focus and intentionally overrides the column-to-focus entry table on the
next grid boundary. Capture setup must therefore start from a known clean HOME
state or record the remembered focus. A useful second capture is entry,
Right, Down: the horizontal move clears the saved column, so density-1 focus 2
returns to visible column 1 rather than the original column.

## Focus anchors and visible resources

`LncBase_D_01` supplies the toolbar's named cursor anchors. LCD coordinates are
the exact resource-pane translations transformed by `(160+x,120-y)`:

| Focus | Anchor pane / current adapter meaning | LCD centre | Cursor Scale |
| --- | --- | --- | --- |
| 0 | `N_CPos_Lgt_00` / HOME settings-light group | `(26,16)` | 10 |
| 1 | `N_CPos_Memo_00` / Notes | `(76,16.5)` | 11 |
| 2 | `N_CPos_Frd_00` / Friends | `(118,16.5)` | 11 |
| 3 | `N_CPos_News_00` / Notifications | `(160,16.5)` | 11 |
| 4 | `N_CPos_Web_00` / Browser | `(202,16.5)` | 11 |
| 5 | `N_CPos_Mvs_00` / Miiverse | `(244,16.5)` | 11 |
| 6 | `N_CPos_Dw_00` / decrease density, larger icons | `(281,16)` | 12 |
| 7 | `N_CPos_Up_00` / increase density, smaller icons | `(307,16)` | 12 |

The delivered source is EUR HOME `0004003000009802` version 24576, content
index 0 / ID `00000082`, `romfs/launcher_LZ.bin`. The HOME CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
decrypted `code.bin` is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`;
the launcher archive is
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`;
and the delivered launcher pack is
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Manifest key `home.launcher` selects `packs/home/launcher.json`, converted by
`ctr-native-web` 1.2.0 with CTRTool 1.3.0. Member paths below are relative to
`romfs/launcher_LZ.bin`.

| Visible role | Pack key and CIA-internal member | Member SHA-256 |
| --- | --- | --- |
| Toolbar layout and anchors | `layouts.LncBase_D_01` → `launcher_LZ.bin/blyt/LncBase_D_01.bclyt` | `787e6b58e0455130ae1f7f4f35a5edf4472c8a21151a53bbce782e813fab5adf` |
| Toolbar settled reveal | `animations.LncBase_D_01_PaletteOut` → `anim/LncBase_D_01_PaletteOut.bclan` | `b9ed23763ae5564e9239de237ad73ac2032cde4a374df2b97c5e59549855de16` |
| Miiverse toggle | `animations.LncBase_D_01_MvsToggle` → `anim/LncBase_D_01_MvsToggle.bclan` | `3820514e9e4a91dc9435c0d5afcfe0290b486377074df64221fe32174f252168` |
| Disabled density endpoint | `animations.LncBase_D_01_Invalid` → `anim/LncBase_D_01_Invalid.bclan` | `d8167f86a74f324ff88f0b9baae43106e56ddc805b2e8fe0ab87f3c18a417502` |
| Toolbar press | `animations.LncBase_D_01_Select` → `anim/LncBase_D_01_Select.bclan` | `77887eff1bf874d8f330b15c31d5a92fe968d3e57441921d7a977a8fc23697b8` |
| Toolbar activation candidate | `animations.LncBase_D_01_Decide` → `anim/LncBase_D_01_Decide.bclan` | `5455d54839789fe06173fc45515cf907d5abaa59da84b2fcff2c8e32a0578a4a` |
| Primary cursor | `layouts.LncCsr_00` → `blyt/LncCsr_00.bclyt` | `72f59f9f3d0a327c6c1e3e012a1aa9f1a1a84ab3d0c829772ae4a2a43ecd0738` |
| Cursor size / pulse / selection | `animations.LncCsr_00_Scale`, `Loop`, `Select` | `74277ac0ec8debf4f035b6e4c629fb9605c897fcb50e6b5ed2447250c671c2dd`; `0bf11061be32b1af39749b8ae8342b8010b65ed9dfd257dbce76e38618b76744`; `ecdf8761f6e0c07c9405dc12f9d4d65f1b97b4c70bb110da4a0afc52fdc46e02` |
| Departed-selection effect | `layouts.LncCsrEfct_00`; animations `Scale`, `DisAppear` | `d790461dba3bb8ebb6653c5366b9d502d4b8c709f37ec65224bbe7286c1da6b9`; `7c0e503b5daf23d68d73cd7d10bb1392a1f05a4def06ef1322589569bc5e61f9`; `9790cbd0c4c94495251af6bd10a838b882b77eae4b7706b5ca5f619780f724f3` |
| Folder chrome / open-close | `layouts.LncFolder_00`; `animations.LncFolder_00_FadeIn` | `9581b9f24f79646159ee161e589fd62b92edd7b55dd5e0e2b2f1db6980fb6a24`; `0cc21b182087829e94470dbd171a2c0af5d61118668eeb9a550b70e74cdecfda` |
| Folder Back press | `animations.LncFolder_00_Select` → `anim/LncFolder_00_Select.bclan` | `69b1e0c444c116ec93e65c9fbbdef8182490a5366338fd2eaa38890b1ffedabd` |

## Press presentation and capture boundary

The current presenter draws toolbar `PaletteOut` frame 12 and `MvsToggle`
frame 0. It binds `Invalid` frame 0 to unavailable density groups. It binds
`LncBase_D_01_Select` frame 1 only while a pointer gesture is actively pressed
inside the toolbar group; a D-pad focus change does not press the icon.

Keyboard/physical A while toolbar-focused currently re-enters the generic touch
action at the focus anchor. Focuses 1–5 open their applet adapters and expose an
Open footer; focus 0 opens the settings panel; focuses 6/7 request density
changes when enabled. That synthesized action does not create a pointer-press
gesture. Although `LncBase_D_01_Decide` is delivered, the current toolbar
presenter does not bind it. Native A-button Select/Decide phase, duration and
feature-transition timing are therefore **not established** and must be
captured before any runtime change.

An open folder uses the same directional focus tables but different row counts
(`1,1,2,3,4,5` rather than root `1,2,3,4,5,6`). Its chrome is
`LncFolder_00_FadeIn` frame 16 when settled. The native Back hit rectangle is
lower-LCD x `23…95`, y `43…65`, inclusive, derived from
`LncFolder_00/Bounding_00` (translation `(-101,55)`, size `72×22`, origin 7).
The current presenter binds folder `Select` frame 1 only while a touch starts
and remains inside that rectangle. Physical B shares the folder-close state
route but does not synthesize the touch press frame.

Coordinator capture should therefore separate two questions:

1. Capture only D-pad `grid → toolbar → grid` first. Expect cursor Scale/Loop,
   the departed effect and the two source-identified cues; do not expect a
   toolbar `Select`/`Decide` press from focus movement alone.
2. Capture toolbar A activation and folder touch-Back versus physical B as
   separate scenarios, including the first pressed frame and release/transition
   boundary. Those captures decide whether the current touch-only Select
   binding and missing keyboard Decide presentation are defects.

## Evidence boundary

The native executable fixtures already cover 144 three-action root/folder
round trips and 12 remembered-focus overrides; the repository
[numeric fixture](../tests/fixtures/home-scroll-consumer.json) preserves the
portable observations. See the
[cursor anchor/resource audit](../scripts/firmware/TOOLBAR_CURSOR_EVIDENCE.md),
[direction and cue ordering](../scripts/firmware/HOME_DIRECTION_MASK_EVIDENCE.md),
[density availability](../scripts/firmware/DENSITY_TOOLBAR_EVIDENCE.md), and
[folder hit contract](home-folder-input.md) for the underlying bounded evidence.

This audit is source-identified only. It is not browser-inspected or
native-compared and does not establish pixel, motion, input-timing or audio
parity. Until the coordinator produces matched captures, the relevant scenario
status remains fail/unverified rather than pass.
