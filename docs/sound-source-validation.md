# Sound source composition validation

2026-09-24. The Sound library/player now mounts its controls, slider, Open
button, Back button and playback-error dialog where the original 3DS Sound
layouts place them, and drives them from the source loop-mode icons and message
bank instead of authored portfolio labels. The production song manifest in
`portfolio-media.ts` is still empty; the empty library therefore shows only the
source background, grid, title bar, parakeet and Close, with no invented text.
The synthetic verifier tracks are the only playback specimens.

## Sources

Title `0004001000022500`, content `0000-0000000b`, source pack
`sound-native14` (manifest SHA-256 `81d258c3…`). The republished selection in
`scripts/firmware/stock-ui-sound.json` adds `lyt-C-Sld.json` (`C_SldT`),
`lyt-C-Dlg.json` (`C_Dlg`, `C_DlgTxt`, `C_Dlg1BtnB`) and the `S_dlg` messages
`C_ErrPlay` ("Could not play.") and `C_B_ErrPlay` ("OK"). The publisher reported
136 resources / 740,830 bytes with HOME and shared entries preserved; only the
Sound title changed in the shared manifest. The delivery audit passes.

## Mounts adopted from the layouts (screen pixels, lower LCD)

| Control | Source pane | Bounds x,y,w,h |
| --- | --- | --- |
| Previous | `S_Play_D-CtrPanel3` `BB-Big3L_P0` | 98,178,33,60 |
| Play/pause | `S_Play_D-CtrPanel3` `CB-Big3C_P0` | 133,178,54,60 |
| Next | `S_Play_D-CtrPanel3` `BB-Big3R_P0` | 189,178,33,60 |
| Loop mode | `S_Play_D-CtrPanel3` `CB-MiniP0` | 230,210,90,28 |
| Seek | `C_SldT` `AB-`, mounted at (0,−39) | 20,150,280,18 |
| Open ("Play") | `S_Common-OpenBtn` `CB-Open` | 98,178,124,60 |
| Back/Close | `S_Common-BackBtn` `CB-Back` | 0,210,90,30 |
| Dialog OK | `C_Dlg1BtnB` `BB-Dlg1BtnB` | 96,184,128,40 |

`C_SldT_Rate` has 281 frames and moves `S_Rate` from x −140 to 140, so the
handle frame is `round(fraction × 280)`. The `S_Common-BrwCursor` first-row
mount is y 49; library rows are paged three at a time at that pitch.

## Behaviour

- The four authored repeat/shuffle labels are replaced by one loop-mode control
  cycling `PacIconM_Opt0` NoLoop → `Opt1` Folder → `Opt4` Single → `Opt2`
  Random → NoLoop. Only the current icon pane is visible.
- Play/pause and previous/next use the CtrPanel3 icons at their mounts; the
  play icon is swapped for the pause icon while playing.
- Seeking touches the `C_SldT` bar; the handle follows the reported position.
- A media failure raises the source one-button dialog. While it is open, the
  transport and slider are inert; OK, B or the shared Back closes it.
- The list footer shows the source Open button with `P_B_02` "Play" only when
  rows exist. The upper track panels are drawn only when a track is selected.

## Adaptations and open gaps

- The cycle order above is the order of the source icon panes; the executable's
  actual mode sequence was not traced. OneTime (`Opt3`) and ABLoop (`Opt5`) are
  not offered.
- Sound effects, percussion, the visualiser, the recorder, SD-card status text
  and the `DefUndBar` battery/clock HUD slots are not composed. The source has
  no SD-card-empty list message in this pack, so the empty library stays blank.
- The upper half of the lower playback screen is blank; the original shows
  effect/visualiser panels there.
- Three-row paging at the cursor pitch is an adaptation of the source list,
  which scrolls continuously.
- Verification is the offline render verifier (`presentation/sound-native-favorites`
  under the artifact directory, no diagnostics) plus unit tests; the browser
  result on the console has not been re-inspected in this worktree.
- User songs remain absent until a manifest is supplied; nothing here fakes a
  track.
