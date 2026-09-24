# Camera gallery source comparison — 24 September 2026

Read-only Nintendo 3DS Camera gallery for existing portfolio folders. No
capture, import, zoom or slideshow behaviour is added. This note records the
two source-backed lower-screen repairs in `stock-native-camera.ts`. It is not
a matched native LCD acceptance.

## Source used

Title `0004001000022400`, content `0000-0000001a`. Public pack
`packs/camera/contents/0000-0000001a/lyt-P_Brws_D-arc-LZ.json` and bank `P` of
`msg-EU_English.json`. Private RomFS members under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/stock-ui/reader-extracted/camera/`
confirm those browse layouts. Converted but unpublished upper/common layouts
(`C_Titl_U`, `P_Tape`, `C_Hud`) were inspected and not consumed.

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

## Remaining gaps

- Six-cell centres still come from `stock-screen-layout.ts`. Native L/M/S
  placement and paging are not reconstructed.
- Photo-view left/right **hit rectangles** remain in the shared layout
  adapter even though the invented arrows are gone. D-pad/button previous and
  next still work.
- Presentation still paints the generic Back/Open footer over the native
  lower screen. Camera has no published Back layout in this pack; `P_Tape`
  and `C_Hud` were not delivered.
- Upper LCD is still the generic chrome plus selected portfolio image.
  `C_Titl_U` and `Brws_U_*` exist in private conversion but are not in the
  public pack. They were not invented here.
- `P_SldShow_D` / `P_SldNavi` are published and unused. Slideshow is outside
  this read-only folder gallery.
- Capture, zoom, edit and import stay hidden or unregistered.
- Empty `TxtNoData` still widens to 280×56 so two-line English `Brws_06`
  fits; the source pane is 96×24.
- Neutral `BG` remains forced over blue `UserBG`. Native background binding
  is unresolved.
- No Azahar or hardware LCD comparison. Unit tests lock pane math and draw
  contracts. `scripts/verify-stock-screens.mjs` wrote Camera pairs to SSD
  `presentation/camera-gallery-source/` with empty renderer diagnostics.
  Isolated `P_BrwsFld` probes there show Default versus PicL changing the
  folder’s top edge; the live folder cell still sits under the red cursor.
  This is a composition check, not a matched native LCD.
