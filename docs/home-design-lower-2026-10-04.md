# HOME Design later lower rows — 4 October 2026

Worker `codex/home-design-lower-20261004` from fidelity `176d112f`. Visible
H-11 bind: HOME Design / Settings lower now mounts dump-owned Image Share and
StreetPass rows plus their Theme-pose separators. This is implemented UI, not
whole-scenario native acceptance.

This is not a 1:1 claim. Tests and this note do not close pixels, input, motion
or audio. Offline HOME backing cannot be painted without preview 3021. After
counts await coordinator recapture.

## Assigned defect

Inventory entry 2, report
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-design-lower/compare-integrated/report.json`
SHA-256 `e70b0852c5404ff50c73aa9434f2366e67df8436cfab8504df540defa612e7f2`.
Native own PNG
`.../native-home-design-20261002/screenshots/_02.10.26_02.08.07.154.png`
`e9a87578a05c08e428f4c83669501c5744541c37245df1dcd9b135cbde53d839`.
Browser lower
`.../settings-lower-integrated/browser/lower.png`
`a81922e7b037eb479b19bf99787928068dde0fdbae70e992ef40bf952cc52511`.
Whole empty-mask over 2/255: **36195 / 9630**. Upper 36195 is an unmatched
HOME wallpaper/HUD/population epoch and is not this slice.

Inspected lower contact sheet (native | browser | heatmap): both stills are
**scroll 0**. Visible panes on this frame are Change Theme, HOME Menu Layout /
Save/Load Layout, and a Screen Brightness heading peek. Image Share and
StreetPass sit below y 240 at this scroll. Differing chrome on this still:

| Cluster | Rect | Inventory | Independent Pillow/sharp |
| --- | --- | ---: | ---: |
| Right scrollbar / panel strip | `[294,46,320,190)` | **3272** | **3288** (max 122 at `(318,157)`) |
| Left panel strip | `[0,37,26,205)` | **3110** | **3111** |
| Lower-right footer | `[294,212,320,240)` | **728** | **728** |
| Lower-right mid | `[294,185,320,207)` | **406** | **486** |

The left strip is missing later-row material once scrolled, plus current
panel-edge vs HOME backing. The scrollbar strip is the labelled 88px thumb
versus native's taller content. The footer is Close / symbols. Four icon boxes
on Theme/Layout remain a separate leftover.

## Dump owner

EUR 10.7.0-32E HOME **`0004003000009802`** v24576, content index 0 / `00000082`.
CIA `2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`, content
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`. Converter
**ctr-native-web 1.2.0** / CTRTool 1.3.0. Manifest `home.petit` →
`packs/home/petit.json` (`petit_LZ.bin` source `ea46084c…f473`, pack
`fefab482…eef3`). Messages `home.messages` → `packs/home/messages-and-loose.json`
(`3df11ee9…17d2`), `RomFS/message/EU_English/menu_msbt_LZ.bin`
`1df2193c…4350`.

Theme pose already has vis=1 (Prize / Cbnt / Info stay off):

| Mount | Layout | Messages | LCD |
| --- | --- | --- | --- |
| `N_BtnImgShr_00` | `PtBtnM_Shr_00` (`70b6af28…2959`) | `ptt_menu_upload` “Nintendo 3DS\\nImage Share” | center (160,400), box y 376–424; draw **[152,400]** after `N_Wrp_00` −8 |
| `N_BtnSft_00` | `PtBtn_Sft_00` (`606d6829…254d`) | `ptt_mset` / `ptt_tiger` | center (160,484), box y 448–520; draw **[152,484]** |
| `N_Line_02` / `N_Line_03` | `PtLine_00` (`d70592c7…6ac4`) | — | y **364** / **436** |

`MAX_SCROLL = 520−240 = **280**`. Six choices. Open on 4/5 **inert**. Keep
labelled **88px** thumb; do not guess lcd / snap / CSS / colour / font /
`azahar-12p4-fit`. StreetPass balloon `N_BllnPos_00` stays layout-default
alpha 0 at rest; `ptt_tiger` is required and not painted through a guessed
`BllnIn` clip.

## Change

- `src/os/firmware-presentation.ts` requests `PtBtnM_Shr_00` / `PtBtn_Sft_00`
  before publication, attaches them on `N_BtnImgShr_00` / `N_BtnSft_00`, and
  draws `N_Line_02` / `N_Line_03`. Scroll clamp follows `HOME_SETTINGS_MAX_SCROLL`.
- `src/os/stock-screen-layout.ts` extends 0..280, Share/StreetPass `B_*` hit
  boxes, and choice auto-scroll bounds `[376,424]` / `[448,520]`.
- `src/os/state.ts` walks six Settings choices; Open/touch on 4/5 stay on
  Settings.

No pack conversion. Already-converted petit members were unpublished by the
painter, not missing from the dump. Generation/owner guards, paired-LCD
readiness and disposal are unchanged. Missing Share/StreetPass layouts or
`ptt_menu_upload` / `ptt_mset` / `ptt_tiger` still fail explicitly.

## Before / after over 2/255

The hashed still is scroll 0, so assigned ROI counts **do not move** until a
scrolled recapture. Independent recount of that pair (empty mask, any channel
>2): whole lower **9630**; scrollbar box **3288**; left **3111**; footer
**728**. After counts await coordinator recapture. Binding the later rows is
still the visible H-11 dump fix: at scroll 184/280 the mounts enter the 320×240
clip.

## Recapture the coordinator should run

Rerun **`settings-lower-integrated`** with the same muted inputs as
`home-fidelity-20261001/home-design-lower/compare-integrated/` (see
[HOME Settings integration](home-settings-integration-2026-10-02.md)). Diff
empty-mask lower vs native `e9a87578…`. Do not treat upper 36195 as this
slice. A follow-up scrolled still (choice 4 at 184, choice 5 at 280) is
required before claiming the Share/StreetPass ROIs; this worker must not
drive Azahar or preview 3021 / CDP 9320.

## Remaining residual

Labelled 88px thumb versus native thumb size/pose. Close/symbols footer **728**.
Theme/Layout icon boxes. Panel-edge vs HOME backing on the left strip at
scroll 0. Saved thumbnails, Zoom, first-use preparation, authored Theme picker.
Exact input, motion and audio remain open. Not 1:1.
