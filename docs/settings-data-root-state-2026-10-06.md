# Settings Data root state — 6 October 2026

Worker U21 on `codex/settings-data-root-state-20261006` from fidelity
`743512b6`. Pair `settings-data-software-empty` root: official Azahar
`/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-data-parental-20261006/data/native/azahar-data-400x480.png`
`686d3dfb…` vs browser `a788e2fc…` / `cc40fb23…`, empty mask, report
`a4ab4d9e…` → **4956 upper / 20096 lower**. Internet settled lower
**24076** (`/Volumes/Sandisk1/3ds-fidelity-artifacts/settings-internet-20261006/compare-settled/`).
This is implemented and unit-tested. It is **not** native-compared. The
coordinator recaptures after integration. Not 1:1.

## Captured defects

Data root lower has two named differences:

1. Native "Reset blocked-user settings" is the disabled button (grey text,
   dashed/faded outline) because no users are blocked. The browser drew it
   enabled.
2. Native was entered by touch, so no button has the yellow Select pose. The
   browser showed Nintendo 3DS at Select frame 1.

Internet settled lower is the same unfocused-entry rule: Connection Settings
is native unfocused blue versus browser selected yellow (region
`[17,17,286,82]` **23076** of **24076**).

## Sources

Settings title `0004001000022000`, version EUR 10.7.0-32E, content 0 /
`0000003d`. Converter `ctr-native-web` **1.2.0** (CTRTool 1.3.0). Published
`button.json` `sourceSha256`
`4a356ef05cd4b17f330ab78a2c8dfe218749c404f2aaef1e1f8a9e7e48b91f04`.
Mapped executable SHA-256
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`
(from the existing Settings audits). The private RomFS / `code.bin` path
used by those audits was not reachable in this worktree (broken
`firmware-10.7.0-32E/assets` symlink). This slice therefore stopped at one
bounded search of the **published** pack plus the existing Other/main focus
audits. It does not invent a `B_S_Invalid.bclan`.

| Element | Manifest / pack key | CIA-internal path | SHA-256 |
| --- | --- | --- | --- |
| Data Reset layout | `button.json` / `B_S` | `button_LZ.bin/blyt/B_S.bclyt` | `91bafd9231453642591cbecd3d4c096ddd6812b8ebc275538a5fbe435a0736e1` |
| Invalid clip (published) | `button.json` / `B_L_Invalid` | `button_LZ.bin/anim/B_L_Invalid.bclan` | `da9b098bd8784beebff8684425e7e1390dc403e87b6e8422ba7d2125a6d44277` |
| Dashed corner tex | `B_LInvalid01.bclim` | `button_LZ.bin/timg/B_LInvalid01.bclim` | `acc227c60114034fa8db530fcca6c18fa63ac53ae868bff671845b349f56d233` |
| Dashed edge tex | `B_LInvalid03.bclim` | `button_LZ.bin/timg/B_LInvalid03.bclim` | `7339bb3a0bfebb94d282628865fafb39d3edfca0b644d67891e636f4db67e3f2` |
| Reset label | `message_EU.json` / `mset` / `dat_blist_reset` | `message_EU_LZ.bin/message_mset/EU_English/mset.msbt` | published pack |
| Data lower host | `layout.json` / `SMngTopO_D_00` | `layout_LZ.bin/blyt/SMngTopO_D_00.bclyt` | already delivered |
| Internet Connection button | `button.json` / `B_LBlue` + `B_LBlue_Select` | `button_LZ.bin/blyt/B_LBlue.bclyt` | already delivered |

`B_S` already contains `N_Invalid` (`B_LInvalid01_00`–`_03`,
`B_LInvalid03_00`/`_01`, `Window_00` 268×32). `B_L_Invalid` frame 1 shows
that group, hides `N_Picture`, and sets `TextBox_00` material colour
`(197,183,140)`. Frame 0 is the inverse. The published animation list has
no `B_S_Invalid` / `B_SB_Invalid`. Binding `B_L_Invalid` onto `B_S` is the
published clip that writes those exact pane names; it is **not** a CSS grey
and not a reconstructed outline. If a distinct dump `B_S_Invalid.bclan`
exists and differs, that is a labelled source gap for recapture.

## Input path

The shared Settings path does **not** distinguish touch versus A. Both call
`activate` → `settingsNavigate` → `menuState`.
`settings-completion-routes.test.mjs` requires those routes to match.
Other Settings already starts `selectionActive:false` for both, with first
D-pad restoring focus ([Other focus audit](settings-other-focus-source-audit.md)).

This slice extends that same split to `data` and `internet`. It does not
change Other page 1: that screen already entered unfocused, and the painter
condition `selectionActive!==false` is equivalent to the previous
`other && selectionActive===false` special case while `menuState('other')`
still writes false. Held Other p1 lower **0** and official **217 / 0** are
predicted unchanged. Main cold-entry `selectionActive:false` is unchanged.
Back from a Data/Internet child restores `selectionActive:true` on the
originating row, matching Other's non-Profile/Date return. Profile/Date
return to Other page 1 stays unfocused.

First D-pad on Data/Internet uses the existing reducer: a direction that
cannot move (Up on row 0) only restores focus; Down from Data row 0 still
moves to StreetPass, as Other Down from Profile moves to Date & Time.

## Changes

- `settingsChoices` marks `blocked-users` `disabled` (portfolio has no
  blocked users). `activate` already refuses disabled rows; A/footer OK
  stay inert.
- Data/Internet `menuState` writes `selectionActive:false`. View exposes
  that flag. Shared D-pad restore includes those screens.
- Data Reset (`B_S` / `N_B_S_00`) binds `B_L_Invalid_DirectSettings`
  frame 1 and skips Select. Other Data/Internet buttons use Select frame 0
  until D-pad.

## Predicted residuals (pending coordinator recapture)

| Pair | Current | Predicted after this slice | Why |
| --- | ---: | --- | --- |
| Data root upper | **4956** | **4956** | HUD clock/battery + title AA. Untouched. |
| Data root lower | **20096** | **~8** plus any Invalid-on-`B_S` AA | Named regions are Nintendo 3DS yellow `[16,17,152,82]` **11898** and Reset `[26,170,268,31]` **8190**. Leftover report hairline `[210,140,8,1]` **8**. |
| Internet settled upper | **4760** | **4760** | HUD clock/battery. Untouched. |
| Internet settled lower | **24076** | **~1000** | Connection Settings `[17,17,286,82]` **23076** should clear. Footer `[144,203,33,37]` **980** plus 1 px hairlines remain (STATUS: native helper face). |

Tests, this note and a painter bind are not acceptance.

## Other p1 and related captured pairs

| Pair | Why this slice should not move it |
| --- | --- |
| `settings-other-page1` held **0 / 0** | Still `menuState('other')` + Select frame 0. |
| `settings-other-page1-home-a-touch` **217 / 0** | Lower already 0; painter equivalent for Other. Upper HUD untouched. |
| Settings main cold white buttons | Main already uses `selectionActive:false`. |
| Parental intro lower **0** | Parental is not an inactive-entry screen here. |
| Software empty **6852 / 22** | Different scene (`SMngCTRData_D_00`). Untouched. |

## Untouched gaps

- Open Blocks 65,536 vs empty bar (Software/Extra Data).
- Extra Data native `?` row vs empty copy.
- DSiWare / StreetPass / Add-on / Backup informational adapters.
- Internet first-run helper scene-mismatch **95922 / 76800**.
- Transfer eShop-required dialog (labelled adaptation).
- Motion, audio, and matched input timing.
- Whether dump `button_LZ.bin` also contains a distinct `B_S_Invalid.bclan`.
- Disabled+focused Reset (D-pad onto the inert row) is uncaptured; this
  painter keeps Invalid and does not add Select.
- A-entry versus touch-entry remain the same unfocused `menuState` (Other's
  accepted contract). A separate stylus-hide-on-miss path was not added.

## Still non-native

- Empty blocked-user list is portfolio device-data: no friend-block NAND
  was supplied. That selects the native empty Invalid pose; it is not a
  reconstructed graphic.
- `B_S` Select/Decide still alias `B_SB` clips (pre-existing).
- `B_L_Invalid` on `B_S` because `B_S_Invalid` is unpublished. Labelled.
- HUD charging / Internet / 42 coins remain the declared reference-session
  adaptation.
- Read-only Data leaves other than this Reset pose stay informational
  adapters where previously labelled.
