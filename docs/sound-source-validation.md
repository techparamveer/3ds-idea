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
- Upper-screen visualisers are 12 LZ11-compressed CGFX models in `res/S.pack`.
  The [visualiser audit](#upper-screen-visualiser-audit) below converts and
  classifies them and traces their selection; no visualiser is shown because
  the resting pose is code-driven and unproven.
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

## Upper-screen visualiser audit

`scripts/firmware/sound_visualiser_audit.py` extracts the twelve LZ11 entries of
`romfs/res/S.pack` (SHA-256 `05550cfa…`), converts each with the pinned SPICA
exporter through `scripts/firmware-cgfx/convert.py`, classifies every material
against the vocabulary `firmware-model.ts` and `cgfx-lighting.ts` accept, and
checks 88 instruction facts in `code.bin` (`3c57f2c4…`) with Capstone. Nothing is
emulated or rasterised. The public summary is
`docs/evidence/sound-visualiser-models.json` (hashes, features and executable
facts only); the private report, decompressed sources, converted `model.json`
files and decoded PNG textures go under the stock-UI artifact directory:

```sh
A=/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E
S=$A/assets/stock-ui
python3 scripts/firmware/sound_visualiser_audit.py \
  --code $S/extracted/sound/contents/0000-0000000b/exefs/code.bin \
  --pack $S/extracted/sound/contents/0000-0000000b/romfs/res/S.pack \
  --dotnet $A/presentation/dotnet/dotnet --exporter $A/presentation/exporter/Exporter.dll \
  --output $S/sound-visualiser-audit --report $S/sound-visualiser-audit/sound-visualiser-audit.json \
  --summary docs/evidence/sound-visualiser-models.json
```

The summary is byte-identical across two runs into fresh output directories.
`tests/sound-visualiser-audit.test.mjs` checks the summary against the renderer
source and confirms the production Sound composition still requests no model
and that the song manifest is empty.

### Format

All twelve resources decode with the pinned exporter (revision `bd29a782…`).
Every one is static: **no skeletal, material, visibility or camera clip exists in
any of them**, so the only asset-defined pose is the bind pose and all motion is
written by the visualiser classes at runtime. Each resource except the cogwheel
and the stars embeds one perspective `Aim` camera. Texture formats are ETC1,
ETC1A4, L4, L8, LA8, A8 and HiLo8 (the clock normal map).

| Model | Meshes / bones | Renderer classification |
| --- | --- | --- |
| `S_Back_U` | 5 / 6 | supported; Replace combiners, depth off; `lambert2` alpha reads `FragmentPrimaryColor` with no light in the resource |
| `S_Vis_Span_U` | 34 / 35 | supported; LightLine00–31 share one bind transform (0,−45,0), LightLineSide sits at (0,−40,0) |
| `S_Vis_Wave_U` | 4 / 5 | supported; one directional light that no combiner reads |
| `S_Vis_PlayYan_U` + Star1–4 | 23 / 24 + 15 / 16 ×3 + 5 / 6 | supported; Star1–3 are byte-identical resources |
| `S_Vis_Clock_U`, `_Cogwheel` | 20 / 24, 16 / 17 | approximate: `AsBump` bump mapping with a Dist0 LUT falls back to the fixed lighting |
| `S_Vis_ExBike_U` | 10 / 11 | divergent: `ProjectionMap` coordinates; the renderer applies UV mapping only |
| `S_Vis_Lifting_U` (+`_TB_A`) | 26 / 16, 4 / 5 | divergent: `ProjectionMap` coordinates on the main model |

### Selection

- The visualiser host method `0x266300(host, index)` stores the index at
  `host+0x148` and dispatches indices 0–8 through the jump table at `0x26635c`.
  Index 0 creates nothing; 1 Span, 2 Wave, 3 ExBike, 5 PlayYan (star paths in
  the literal table at `0x372578`), 6 Lifting, 7 Clock (its class also loads the
  cogwheel) allocate one class each and store its vtable; index 4 allocates a
  0xe2ac-byte class (vtable `0x3218f0`) that names no model or layout and stays
  unidentified; index 8 enables the layout object at `host+0x14c` instead.
- L/R cycling is `0x1de8c8(app, delta)`: the signed index byte wraps modulo 9,
  index 8 is skipped unless `host+0x260 > 0`, indices 3 and 6 pass an extra
  check, and the result is applied through `0x266d04 → 0x266300`. The callers
  at `0x237d44`/`0x237d5c` pass −1 and 0; leaving playback calls the factory
  with 0 (`0x1c4f6c`).
- The index byte is `[0x3771ec] + 0x10b4` in the 0x117c-byte settings singleton
  (constructor `0x2bbca4`, vtable `0x320174`); the application object keeps a
  pointer to it at `app+0x13c` (`0x238dd4…0x238de0`). Singleton vtable slot 5
  (`0x320188`) is a `this+0x24` thunk (`0x1908d8`) into the save-block defaults
  initializer `0x1908e0`, which writes **1** to block `+0x1090` = singleton
  `+0x10b4` (`0x1909ec`). The same block offsets `+0x92`/`+0x93` are read
  through `singleton+0x1000+0x24` elsewhere (`0x1ec91c…0x1ec930`), and the two
  sub-objects the initializer assigns at `+0xc64`/`+0xe78` are the ones the
  constructor builds at `+0xc88`/`+0xe9c`. **The default visualiser is index 1,
  `S_Vis_Span_U`.** The save-load path that may restore a user-changed value
  was not traced.
- `S_Back_U` is not the playback backdrop. Its object (constructor `0x192030`,
  vtable `0x31fa58`, loader `0x191e98` with camera constants 11.5 and 0.5) is
  created disabled at `app+0x8c` by `0x1c65c8`, and all five toggle sites gate
  on the slot-`0x70` predicate of the current type-`0x372190` object. That type
  is returned by `0x2903a0`, the `getType` of the eight `S_Cec` StreetPass scene
  classes (vtables `0x321b80…0x32207c`). No music playback path enables it.

### Conclusion and next gate

There is no source-proven static resting upper-screen pose that can be shown
without audio: the default Span model's bars all sit at one bind transform and
are placed by its class at runtime, and none of the resources carries a clip.
Drawing any bind pose would invent a pose, so nothing is composed. Before a
visualiser can be shown:

1. Trace the Span class (vtable `0x321890`; slots `0x252b70`, `0x252670`,
   `0x251b2c`) for its bar layout and silent-audio heights.
2. Confirm how the save-load path treats block `+0x1090`, so a fresh save is
   known to start on Span.
3. Add a stock-screen upper CGFX path (scene-owned renderer fed by the model's
   embedded `Aim` camera, Canvas transfer) — the HOME banner renderer is
   hardwired to HOME resources — then publish the converted model through the
   manifest with `convert.py --manifest`.
4. Span, Wave, PlayYan and the stars are within the current PICA support; Clock
   needs bump lighting and ExBike/Lifting need `ProjectionMap` coordinates.
