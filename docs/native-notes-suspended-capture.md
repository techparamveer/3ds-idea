# Game Notes suspended-software capture

Defect: with Health and Safety (or any application) suspended, the selected-note
upper screen said "There is no suspended software." The painter always used
the empty-state text and hid every capture pane. Resource contract:
`docs/native-notes-capture-assets.md` in the assets worktree (commit `b30bcc0`).
No new resource was published; `ImageScreenUp` source SHA-256 is
`b042e28a08e66c3fc545688ac79e835503819e82ac08261c20cf082efb9b74f3`.

## Snapshot lifecycle

`src/os/notes-suspended-capture.ts` holds one in-memory LCD pair for the
current `runtime.application` instance (≈0.69 MB of canvases, plus one rotated
readback while suspended). It is not serialized into saves, JSON or state.

- `portfolio-screens.ts` records after the application's own draw and before
  host overlays (system fade, runtime notice, dialogs). It records only in the
  `app` phase, without sleep/preferences/dialog, when the active instance is the
  application slot and not suspended.
- Stock screens count as complete only when `stock-screen-presentation.ts`
  publishes a whole pair. Its source-black loading and recovery frames return
  `false`, so an earlier complete frame of the same instance survives.
- HOME, system/library applets (including Game Notes), a Settings parent under
  its helper and sleep cannot record. Instance IDs are serial, so a relaunch
  starts empty.
- `sync` runs on every paint; closing, power-off or replacement frees the
  canvases and readback. Resume invalidates the readback; the next suspension
  exposes the newest frame. Graphics disposal releases everything.

`read` returns `none` without a suspended application, `ready` with rotated
pixels, or `missing` when the suspended instance never completed a frame (e.g.
HOME during native loading). `missing` hides the no-software text, both LCD
panes and their shadows; it never substitutes invented pixels.

## Source presentation

With a suspended application, `drawSelectedNote` binds
`ImageScreenUp_SwitchDouble` at its settled frame 25 (`G_Panel_00`/`G_Panel_01`
filtered by the existing renderer). `P_ScreenUpL` and `P_ScreenDown` receive
`suspended-capture-upper/lower` through `textures` and
`PaneOverrides.textureBindings` (slot 0), cloning only their materials.
`P_ScreenUpR`, `T_TextList`, `T_TextWrite`, `P_Mask`, `W_TextPanel` and
`N_BtnMemoUp` are hidden. The no-software branch is unchanged.
`T_TextWrite`'s label `9900NoBreakGameMes` is " can only be used when suspended
software is present." after `P_IconSwitch`. It is a no-software hint for the
switch control, not capture chrome. SwitchDouble has no material tracks and
`unsupported: []`, so it adds no textures or renderer diagnostics.

`PanelGameIn` and `PanelNoGameIn` (group `G_Scene_01`) slide `N_BtnMemoUp` from
y −234 to −4/−14 and fade `P_MemoFrameALL`. They move the memo to the upper
screen; they do not select capture visibility. The capture view therefore omits
them.

Both capture materials use the implicit TEV, with buffer black and constant 0
white. They output the texel times white vertex colour. Their UVs are
`[1,0, 1,1, 0,0, 0,1]`; `rotateCaptureForNativeUV` writes upright pixel (x,y)
to `(x·H + H−1−y)`. Rasterizing the posed source panes at 400 × 240 and
320 × 240 reproduces every byte of a unique-pixel capture.

## Verification

- `tests/notes-suspended-capture.test.mjs`: rotation indices; exact source raster
  through the real pack and SwitchDouble pose; real `system.ts` lifecycle for
  HOME, Game Notes, sleep, resume, close and relaunch.
- `tests/stock-screen-preparation.test.mjs`: completeness is false for loading
  and recovery; capture generation repaints without pixels in the cache key.
- `scripts/verify-native-personal-tools.mjs --title notes-suspended`: draws the
  real composition with a synthetic quadrant capture and checks orientation at
  eight pane points. It needs the integration canvas module.

In the implementing session, node/npm/Python execution and writes to the SSD
artifact directory were permission-denied. These tests, typecheck and build
were written but **not run**. Integration must run them before merging.

## Remaining gaps

- The initial mode (Double) and Up/Down cycling are untraced. `B_BtnSwitch`
  input and `SwitchUp`/`SwitchDown` are unimplemented; they need coordinator
  input geometry and a traced order.
- `SceneIn`, `HudDoubleInOut` and the switch transitions are shown at their
  endpoints, not animated.
- The software-title panel (`W_TextPanel`, `P_Icon_00`, `T_TextTitle`,
  `TextPanelInOut`/`Stay`) stays hidden. Its dynamic title/icon inputs and
  display timing are untraced.
- The capture is the browser canvas composite. Portfolio-app upper frames
  include the HOME status strip that remains visible above their content.
  Stereoscopic right-eye content does not exist.
- Browser/Azahar comparison of the delivered screen belongs to integration and
  was not performed here.
