# Native stock UI delivery

The current scope is stock screen presentation and basic navigation. Camera is
a read-only portfolio gallery and Sound plays supplied favourite songs. Software
Keyboard and the six previously excluded stock titles are not delivered.

`scripts/firmware/stock_ui.py` adds explicitly selected resources from a private
converter output to the existing public delivery. It verifies source hashes,
resolves layout/animation texture dependencies, retains original source identity
and style indexes, and validates HOME/shared records and actual bytes before
writing. Message labels are compacted; `uiSelection.sourceMessageIndices` maps
delivery indexes back to the original bank. No raw firmware is copied publicly.
Original full locale-selection provenance remains attached to narrow packs.

## Settings initial screen

Title `0004001000022000`; all URLs below are relative to
`public/os/firmware/10.7.0-32E/packs/settings/contents/0000-0000003d/`.

| Pack | Selected native resources |
| --- | --- |
| `base.json` | `Bg_U_00`, `Bg_D_00`, `TopBase_D_00`, `Base_D_00`; background SceneIn_Legacy clips |
| `up.json` | `TopText_U_00`, `CommonBG_U_00`; matching scene, icon-loop and background clips |
| `layout.json` | `Top_D_02`; matching SceneIn and Special clips |
| `button.json` | `I_TopLTs`, `I_TopRTs`, `I_TopLBs`, `I_TopRBs`, `I_TopTs`, `B_L`; each Select/Decide plus B_L_Invalid |
| `message_EU.json` | English mset labels `top_sysset_title`, `top_nnid`, `top_internet`, `top_parental`, `top_software`, `top_settings`, `top_btm_text`, `base_2b_back`, `dat_dlg_1b_close` |

The plan is `scripts/firmware/stock-ui-settings.json`. The button animations were
decoded with the integration converter's `pah1` hierarchy support; their `shares`
are retained. The title's `uiSelection.sourceConverter` records that converter's
script hashes independently of the unchanged HOME converter provenance.

Native lower-screen attachment panes are `N_I_TopLTs_00`, `N_I_TopRTs_00`,
`N_I_TopLBs_00`, `N_I_TopRBs_00`, and `N_I_TopTs_00`. Use the source English
messages to replace Japanese layout placeholders. `top_btm_text` contains the
native HOME glyph followed by “Close”. Shared `cbf_std.bcfnt` is borrowed from
the existing verified font delivery.

## Verification and remaining work

The selected Settings set contains 28 resources totalling 429,102 bytes including
shared dependencies. All 483 pre-existing resource records and corresponding
file hashes remain unchanged. Three publisher tests cover dependency closure,
message-index preservation, fail-before-write behavior and repeatability. Six
locale tests pass; the private-source test is skipped without its opt-in input.
The delivery audit passes; existing unsupported-field warnings remain reported.

Private artifacts are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/stock-ui/`:
`settings-converted/`, `delivery-audit.json`, and
`settings-button-textures.png`. The contact sheet was inspected; it demonstrates
decoded textures only. Combined screen composition and browser comparison belong
to the presentation/coordinator tasks and remain required for visual acceptance.

## Sound library/player components

Title `0004001000022500`, URL prefix
`packs/sound/contents/0000-0000000b/`; selection is
`scripts/firmware/stock-ui-sound.json`.

| Pack | Native layouts |
| --- | --- |
| `lyt-S_BG-arc-LZ.json` | `S_BG`, `S_BG_D-Ctr`, `S_BG_D-Grid` |
| `lyt-S_Play_D-arc-LZ.json` | `S_Play_D-CtrPanel3`, `S_Play_D-LRBtn` |
| `lyt-S_Common-arc-LZ.json` | `S_Common-BackBtn`, `S_Common-OpenBtn`, `S_Common-BrwCursor`, `S_Common-IconList`, `S_Common-ListScroll` |
| `lyt-S_Inf_U-arc-LZ.json` | `S_Inf_U-TitleBar`, `S_Inf_U-TrackNameU`, `S_Inf_U-TrackNameD`, `S_Inf_U-PlayTime`, `S_Inf_U-UnderBar` |
| `lyt-Parakeet-arc-LZ.json` | `ParakeetA_U` with Wait/InL_U/OutL_U only |
| `lyt-C-Sld.json` | `C_SldT` with `C_SldT_Default`, `C_SldT_Push`, `C_SldT_Rate` |
| `lyt-C-Dlg.json` | `C_Dlg`, `C_DlgTxt`, `C_Dlg1BtnB` with the button's Default/Disable/Push clips |
| `msg-EU_English.json` | Bank `S`: `C_T_00`, `C_T_03`, `C_B_01`, `C_B_02`, `P_B_00`, `P_B_02`, `P_BR_03`, `P_BR_04`, `F_N_00`, `E_00`, `E_I_00`; bank `S_dlg`: `C_ErrPlay`, `C_B_ErrPlay`; original sibling styles |

All matching clips are preserved for the selected non-parakeet layouts.
`S_Play_D-CtrPanel3` contains the native previous/play-pause/next controls:
Default is a 20-frame loop, In/Out are 9 frames, Push 3, Disable 2. Its
`PacIconM_Opt0..5_P0` panes are the six loop-mode icons (NoLoop, Folder,
Random, OneTime, Single, ABLoop). `C_SldT` is the source track slider; its
281-frame `C_SldT_Rate` clip moves the handle across the 280-pixel bar and the
`AB-` pane is its touch surface. `C_Dlg` with `C_DlgTxt` and `C_Dlg1BtnB` is
the common one-button dialog that carries the `S_dlg/C_ErrPlay` "Could not
play." message. The title pane is `TitlTxt`; track panes are
`TrkNamTxtU0`/`TrkNamTxtU1`; time uses `PlyTimeTxt`. The selected layouts
borrow `cbf_std.bcfnt`.

This subset is 136 resources and 740,830 bytes including shared dependencies
(122 resources, 681,315 bytes before the slider/dialog extension). The
integrity audit passes and HOME/shared manifest entries were preserved. `sound-player-textures.png` was inspected in the
same private artifact directory; screen composition is still presentation-owned.
The original English message container is now decoded through the bounded stock
table reader. It supplies title, playlist, Close, Back, Open, Play, Autoplay,
Resume and shuffle labels. Song labels still come from the portfolio's song
manifest. No recording layouts or recording behavior are delivered.

## Camera gallery components

Title `0004001000022400`, prefix `packs/camera/contents/0000-0000001a/`.
`scripts/firmware/stock-ui-camera.json` selects:

- `lyt-P_Brws_D-arc-LZ.json`: `P_BrwsBase_D`, `P_BrwsFld`, `P_BrwsPic`,
  `P_BrwsCursor_D`, `P_BrwsPhoMntBase`, `P_BrwsTxt_D` and their own clips.
- `lyt-P_SldShow_D-arc-LZ.json`: `P_SldNavi`, `P_SldShow_D` and their clips.
- `msg-EU_English.json`: bank `P`, labels `Brws_02`, `Brws_06`,
  `Brws_U_01_01`, `Brws_U_04`, `Brws_U_05`, `SShow_00_01`, `SShow_04_01`
  and `back`, with original sibling styles.

The folder label is `TxtThmb`, photo image pane `ThmbPic` (56 × 42), mask
`ThmbMask` (66 × 52), cursor `Cursor` and empty label `TxtNoData`. Large,
medium and small thumbnail clips retain native source sizes. The gallery
painter now requests `P_BrwsFld_PicL` and `P_BrwsPic_PicL` so those 2×3
textures load. Position repeated thumbnail instances around the real portfolio
photos. The capture/settings menu is deliberately omitted. The English bank
supplies Slideshow, empty-gallery, photo-count, chronological-order and Back
text. HOME navigation is presentation behavior. See
[the gallery comparison](camera-gallery-source-validation.md).

The final subset contains 47 resources totalling 198,509 bytes including shared
dependencies. Its delivery audit passes. `camera-gallery-textures.png` was
inspected as texture evidence, not assembled-screen verification.

CTRTool stopped while extracting Camera's primary RomFS. The bounded read-only
`scripts/firmware/romfs.py` recovered all 63 primary files and one manual file,
including an empty file. It follows local Project_CTR `romfs.h`, `ivfc.h` and
`IvfcStream.cpp`, verifies all three IVFC hash levels, and rejects unsafe paths,
parent cycles and out-of-bounds metadata/payloads. Four reader tests pass; an
independent comparison matches all 62 Sound/Health RomFS paths and bytes with
CTRTool output. The reader script hash is recorded in Camera's source converter
provenance. Private extraction lives in `stock-ui/reader-extracted/camera/`.

## Health and Safety

Title `0004001000022300` uses single-content prefix `packs/health-and-safety/`.
`stock-ui-health.json` publishes `bg.json` (Bg_U_00/Bg_D_00), `safehealth.json`
(SafeTop_D_00, SafeTop_D_01, SafeText_D_00), `btmbtn.json` (BtmBtn_White),
`slidebar.json` (SlideBar) and `messages-and-loose.json` (safe_msbt_LZ).
Matching source clips and all 16 English message labels are retained. The
converter now explicitly recognizes this title's English sibling MSTL table.

Use SafeTop_D_00 for the original-3DS three-topic screen. Replace both button
text layers T_BtnB_00/T_BtnF_00 through 02 with article_title_1..3. Upper
Bg_U_00 TextBoxTitle_00 uses title; lower T_Home_00 uses base_1b_menu. Article
content uses SafeText_D_00 TextArea_00..04 and TextBoxTitle_00. BtmBtn_White's
T_BtnB_00/T_BtnF_00 are also source-language placeholders requiring English back.

This pack set is 26 resources/431,611 bytes including shared dependencies.
The delivery audit passes, and the English sibling-style test passes alongside
existing locale tests. `health-textures.png` was inspected; browser composition
remains required. Native source messages are historical device UI content.

Toolbar resources are documented in `native-toolbar-ui-assets.md`; further
service/helper subsets and remaining format gaps are in
`native-service-ui-assets.md`. No keyboard or audio-behaviour reconstruction is
part of this delivery.
