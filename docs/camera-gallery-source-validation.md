# Camera gallery source comparison — 24 September 2026

Read-only Nintendo 3DS Camera gallery for existing portfolio folders. No
capture, import, zoom or slideshow behaviour is added. This note records the
source-backed lower browse repairs and the later source-backed upper browse
composition in `stock-native-camera.ts`. It is not a matched native LCD
acceptance.

## Source used

Title `0004001000022400`, content `0000-0000001a`. Reader-extracted Camera
`code.bin` SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`. Public packs
under `packs/camera/contents/0000-0000001a/`:

- `lyt-P_Brws_D-arc-LZ.json` (lower browse)
- `lyt-P_Finder_U-arc-LZ.json` layout `P_FinderVS_U` (upper browse)
- bank `P` of `msg-EU_English.json`

Private conversion is
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/stock-ui/camera-native14`.
RomFS members under `stock-ui/reader-extracted/camera/` corroborate the browse
layouts. Shooting layouts (`P_Finder_U`, `P_FinderFC_U`, `P_FinderQU_U`),
`P_Tape`, `C_Hud` and `C_Titl_U` were inspected and are not consumed.

## Upper browse mapping

`N5notes5pnote11SceneBrowseE` uses `P_FinderVS_U` as the browse/view-select
upper. Pane flag bit 0 is visible. The executable has no `C_Titl_U` string.
`P_Set_U/-L-Titl` userdata is `LYT=C--Titl_U/C_Titl_U` and
`TEXT_TitlTxt=P/Set_Title` (`Settings`). `C_Titl_U` is therefore the Settings
title bar (`TitlBar` 400×38 at y=101), not the gallery.

| Pane | Source translation / size / flags | Notes |
| --- | --- | --- |
| `P_FinderVS_U` canvas | 400×240 | CTR browse upper |
| `BrwsNoData` | flags **0** | Empty copy parent; child `Txt_NoData` MSG `P/Brws_U_04` |
| `BrwsFolder` | flags **0** | Folder-summary parent |
| `Brws_U_fold` | `[-108, 0]`, **128×96**, flags 1 | Folder chrome `P_Fnd_Fold.bclim`, not a photo slot |
| `Brws_U_fold_Bir` | same slot | Birthday overlay; kept hidden |
| `Txt_data2` | `[80, 34]`, 92×64 | MSG `P/Brws_U_01_01` (`Photos:`) |
| `Txt_data3` | `[160, 34]`, 80×64 | MSG `P/Brws_U_02_01` (source text is a space; count replaces it) |
| `Txt_Date` / `Txt_total` / `Txt_data4` / `Txt_data5` | under `BrwsFolder` | Date/`Total`/day counts; unproven for portfolio folders, hidden |
| `FndEdge` | flags 1, 400×240 | Viewfinder frame; stays visible |
| `Preview` / `FocusAdj` / `ImageInfo` / `Fit` | flags 1 or 3 | Capture overlays; hidden |
| `BrwsError` / `MovInfo` / `ViewInfo` | flags 0 | Error/movie/3D; kept hidden |

`HudNOTES.bcfnt` is required because hidden capture text panes still index font 1.
The converter keys that font as `contents/0000-0000001a/HudNOTES.bcfnt.LZ`;
`stock_ui.py` publishes it under the layout name `HudNOTES.bcfnt`. `cbf_std.bcfnt`
(font 0, including `Txt_NoData`) remains the borrowed shared font.

Read-only composition:

- **Folder list:** black 400×240, then `P_FinderVS_U` with `BrwsFolder` visible
  and native fold chrome. Portfolio pixels are not drawn into `Brws_U_fold`.
- **Empty:** `BrwsNoData` / English `Brws_U_04`.
- **Gallery and opened photo:** existing portfolio image as the 400×240
  viewfinder framebuffer replacement, then the same layout with `BrwsFolder`
  hidden so `FndEdge` remains.

## Lower browse mapping

| Pane | Source translation / size | Notes |
| --- | --- | --- |
| `P_BrwsPic/ThmbPic` | `[0, 0]`, **56×42** | Photo slot; child `ThmbMask` is 66×52 at `[1, -1]` |
| `P_BrwsFld/ThmbBase` | `[1, -1]`, **66×52** | Folder frame; `TxtThmb` is the count on that frame |
| `P_BrwsPhoMntBase/-PhoMntPos` | `[0, 13]`, **256×128** | Album mount; canvas rectangle `[32, 43, 256, 128]` |
| `P_BrwsTxt_D/TxtNoData` | `[0, 13]`, 96×24 | Empty copy; English `Brws_06` still uses a wider adapter |

`P_BrwsFld_PicL` pattern 1 selects `P_Thmb_DatePho2x3.bclim` (66×52).
`P_BrwsPic_PicL` pattern 0 selects `P_Thmb_Pho2x3_SD.bclim` (66×52). The
unposed layouts keep the small 5×7 textures (`P_Thmb_DatePho5x7.bclim`,
`P_Thmb_Pho5x7_SD.bclim`, both 42×34) that the size clips replace.

## Defects repaired

1. **Small 5×7 artwork on large 66×52 cells.** The painter bound only
   `*_Default` (button-idle) clips, so the loader never requested the PicL
   textures and the 66×52 panes stretched the 42×34 placeholders. Folder and
   photo cells now bind `P_BrwsFld_PicL` / `P_BrwsPic_PicL` / `P_BrwsCursor_D_PicL`
   at frame 0 together with their idle Default clips.

2. **Portfolio pixels covered the native mask and missed the mount.**
   `ThmbPic:{visible:false}` skipped the whole pane, including child
   `ThmbMask`, then drew the photo afterwards. The photo view used
   `[48, 43, 224, 128]` plus invented `‹ ›` buttons and a title; source
   `P_BrwsPhoMntBase` has no previous/next or title panes. Photos now draw
   first at the source 56×42 slot or `[32, 43, 256, 128]` mount. A loaded
   thumbnail sets `ThmbPic` **alpha 0** so the unflagged `ThmbMask` child
   still composites; an unloaded image keeps the native load texture. The
   mount placeholder `-PhoMntPos` is hidden so the page-frame panes remain.
   Invented heading, cell labels, photo title and arrow chrome were removed.
   `TxtThmb` still shows the folder count. Physical left/right still change
   photos through the existing runtime.

3. **Upper LCD was generic portfolio chrome.** Folder/gallery/photo now share
   source `P_FinderVS_U`. Capture overlays stay hidden. `C_Titl_U` is not
   published.

## Remaining gaps

- Large-grid centres and touch bounds now follow the executable and data-only
  layouts; see [grid source audit](camera-grid-source-audit.md). Native paging
  motion and M/S modes are not reconstructed.
- Photo-view left/right **hit rectangles** remain in the shared layout
  adapter even though the invented arrows are gone. D-pad/button previous and
  next still work.
- Presentation still paints the generic Back/Open footer over the native
  lower screen. [The footer source audit](camera-footer-source-audit.md) confirms
  native browse instead has Shoot/Settings and Slideshow. `P_Tape` is a
  decorative strip and `C_HudBut_B` is battery status, not a Back control.
  Neither is delivered as a substitute for portfolio navigation.
- Folder-list upper does not place a portfolio still in the viewfinder; native
  SceneBrowse may show a live feed there. Gallery/photo stretch existing
  portfolio images to 400×240 as a framebuffer replacement, not a native
  capture buffer.
- Empty `Brws_U_04` uses the source black vertex colour. Native sits that text
  on the viewfinder framebuffer; this portfolio has no capture feed, so the
  empty upper is currently the `FndEdge` frame on black rather than readable
  white copy. Vertex colours were not invented.
- Date, total and day-count panes stay hidden: portfolio folders have no
  proven native date source.
- `P_SldShow_D` / `P_SldNavi` are published and unused. Slideshow is outside
  this read-only folder gallery.
- Capture, zoom, edit and import stay hidden or unregistered.
- Empty `TxtNoData` still widens to 280×56 so two-line English `Brws_06`
  fits; the source pane is 96×24.
- Neutral `BG` remains forced over blue `UserBG`. Native background binding
  is unresolved.
- No Azahar or hardware LCD comparison. Unit tests lock pane math, MSG labels
  and draw contracts. `scripts/verify-stock-screens.mjs` wrote Camera pairs to
  SSD `presentation/camera-upper-source/`. Isolated `P_BrwsFld` probes in the
  earlier `presentation/camera-gallery-source/` folder remain lower-cell
  evidence. These are composition checks, not matched native LCDs.
