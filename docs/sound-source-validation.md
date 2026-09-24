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
| Speed/pitch (inert) | `S_Play_D-Effect` `GrpEjyP0` | 70,56,72,74 |
| Filter (inert) | `S_Play_D-Effect` `GrpEjyP1` | 178,56,72,74 |
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

## Resting playback Effect panel

The upper half of the lower playback screen now shows the source
`S_Play_D-Effect` layout: two 72 × 74 `BtnPlay` frames at (106,93) and
(214,93) carrying the 64 × 64 `IconGraph` (speed/pitch) and `IconFilter`
icons, bound to `S_Play_D-Effect_Default` frame 0 (constant tracks). It is drawn
after CtrPanel3 and beneath the error dialog, and it is not shown in the library.
The buttons are inert: in the original they open the speed/pitch plate and
filters, which alter the audio.

`scripts/firmware/sound_playback_audit.py` checks 58 instruction facts in the
original `code.bin` (SHA-256 `3c57f2c4…`) with Capstone, without emulation:

- The scene constructor `0x23c50c` loads `S_Play_D` CtrPanel1, CtrPanel2,
  CtrPanel3, Effect, PullBtn, Filter and `Graph_D-Plate` into fields
  `+0x254…+0x26c`. It enables only CtrPanel1 (`bic 0x1e`); the rest start with the
  four per-object disable bits the engine tests before update/draw/input
  (`0xc2`/`0xc4`/`0xc8`/`0xd0`). An `In` animation clears them (`0x1e5ca4`).
- The playback controller (`0x230118…0x23016c`) binds `-B-EjyP0`/`-B-EjyP1`
  beside previous, play, next and the loop-mode button. The scene's button map
  sends them to `0x23ce54`/`0x23cea0`, which set mode `+0x28a` to 4
  (`Graph_D-Plate`) or 5 (`Filter`).
- Closing a mode (`0x23ceec` → switch `0x23d180` cases 4/5) plays Effect `In`,
  PullBtn `PullIn` and `Out` on the plate or filter. Mode 0 is therefore Effect
  plus the pull cord. Leaving playback (case 3) plays Effect/CtrPanel3 `Out` and
  `PullOut` together.

The report is written to `sound-playback-audit/sound-playback-audit.json` under
the private stock-UI artifact directory. It was run with the
`camera-grid-venv` interpreter, which provides Capstone:

```sh
S=/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/stock-ui
python3 scripts/firmware/sound_playback_audit.py \
  --code $S/extracted/sound/contents/0000-0000000b/exefs/code.bin \
  --pack $S/extracted/sound/contents/0000-0000000b/romfs/res/S.pack \
  --layouts $S/sound-native14/packs/sound/contents/0000-0000000b/lyt-S_Play_D-arc-LZ.json \
  --report $S/sound-playback-audit/sound-playback-audit.json
```

The publish plan adds `S_Play_D-Effect` and its four clips, which adds three textures
(`BtnPlay`, `IconGraph`, `IconFilter`). The Sound set is now 139 resources /
763,733 bytes. Only the Sound title's selection and its `S_Play_D` pack changed
in the manifest, and the delivery audit passes with no errors.

The render verifier draws `S_Play_D-Effect` alone. Every pixel it draws lies inside the two
source pane rectangles: x 71–140 and 179–248, y 57–128, symmetric about the centre.
All 9,380 opaque pixels appear unchanged in the playing, paused, three
loop-mode and two seek frames. The library frame differs from them.
`tests/sound-effect-panel.test.mjs` checks the published pane geometry,
texture hashes, pack request, draw order and inert touch points.

## Adaptations and open gaps

- The cycle order above is the order of the source icon panes; the executable's
  actual mode sequence was not traced. OneTime (`Opt3`) and ABLoop (`Opt5`) are
  not offered.
- The call that first brings CtrPanel3/Effect in on entering playback was not
  located. The resting state comes from the mode-close path and the shared
  controller registration.
- The `S_Play_D-PullBtn` pull cord is absent. It is a custom class (`0x31fce0`)
  whose `BallPull0` material uses two TEV stages, and its pulled behaviour was not
  traced. The speed/pitch plate (`Graph_D-Plate`, custom class `0x32009c`) and
  the Filter panel alter playback, so they are not composed.
- Upper-screen visualisers are 12 LZ11-compressed CGFX models in `res/S.pack`
  (`S_Back_U`, `S_Vis_Clock_U` with its cogwheel, `ExBike`, `Lifting`,
  `PlayYan` with four stars, `Span`, `Wave`), all named by the executable.
  The stock-screen path is 2D layout-only, and the repository's CGFX renderer is
  scene-owned HOME code. The models' animation drivers, including any link to
  audio levels, were not traced, so no visualiser is shown.
- Percussion, the recorder, SD-card status text and the `DefUndBar`
  battery/clock HUD slots are not composed. The source has no SD-card-empty list
  message in this pack, so the empty library stays blank.
- Three-row paging at the cursor pitch is an adaptation of the source list,
  which scrolls continuously.
- Verification is the offline render verifier (`presentation/sound-native-favorites`
  under the artifact directory, no diagnostics) plus unit tests; the browser
  result on the console has not been re-inspected in this worktree.
- User songs remain absent until a manifest is supplied; nothing here fakes a
  track.
