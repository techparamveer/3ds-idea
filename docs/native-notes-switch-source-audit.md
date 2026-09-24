# Game Notes display-switch source audit

Game Notes' selected note shows the suspended application's frozen LCDs
([capture validation](native-notes-suspended-capture.md)). The initial mode,
the `B_BtnSwitch` control and the Up/Down modes were untraced. This audit
establishes them from the EUR executable and the source layout/animation
resources, and records the bounded correction built on them. The follow-up below animates the source Switch clips; no firmware was executed.

## Reproducible evidence

Source: EUR Game Notes system applet `0004003000009c02` (product `CTR-N-HGMP`,
version 4096), firmware reference `10.7.0-32E`. `exefs/code.bin` SHA-256 is
`8a2feea02c2a6ef62c8a8d3e4cc20faa5639fe5af47d3876f8a5d3ea43064cc6`; mapped
base `0x100000`. Layout packs are the existing converted
`public/os/firmware/10.7.0-32E/packs/game-notes/memo-ImageScreenUp-arc-l.json`
and `memo-MemoWriteDown-arc-l.json` (`ImageScreenUp` source SHA-256
`b042e28a08e66c3fc545688ac79e835503819e82ac08261c20cf082efb9b74f3`).
`extracted/memo` in the artifact root is a different title (`000400300000f602`,
`Memo_D.bclyt`) and was not used.

Static ARM disassembly (capstone) and pointer-table scans over the extracted
`code.bin`; the private listing and probe outputs live under
`reference/cursor-notes-switch/` in the firmware artifact root.

## Executable records

| Address | Record | Meaning |
| --- | --- | --- |
| `0x13aaac` | scene factory | index 2 = `MemoWriteDown` (ctor `0x165d5c`), index 3 = `ImageScreenUp` (ctor `0x168880`) |
| `0x1688ec–0x1688f0` | `mov r1,#3; str r1,[r0,#0x430]` | `ImageScreenUp` constructs in mode **3 = Double** |
| `0x165d98–0x165da0` | `mov r4,#0; strh r4,[r1,#0x5a]` | `MemoWriteDown` constructs with switch index 0 |
| `0x16322c–0x163238` | `bl 0x1603a8; moveq r0,#5; strbeq r0,[r4,#0x42a]` | scene enter: without suspended software the switch button state is 5 |
| `0x164030–0x16414c` | button clip registration | button animator slots 0 `Base`, 1–2 `Select`, 3 `Decide`, 4 `KeyDecide`, 5 `Invalid` |
| `0x1632c8–0x1632d0` | `cmp r7,#1; beq 0x163754` | button 1 (`B_BtnSwitch`) decide → switch handler |
| `0x163754–0x163780` | `0x156f94(…,0x100000a,…)`, `0x156f94(…,r8,…)` | two switch sounds |
| `0x163784–0x1637a0` | `ldrh; add #1; cmp #2; strh; strhgt #0` | index = index+1, wrapping to 0 after 2 |
| `0x1aa954` | `{1,2,3}` | event per index, copied to the stack |
| `0x1637b0–0x1637c4` | `0x14f78c(mgr, 3, event, 0)` | dispatch to scene 3 (`ImageScreenUp`) |
| `0x166f88–0x166fc8` | `cmp r1,#0xb; ldrlo pc,[pc,r1,lsl #2]` | `ImageScreenUp` event table |
| `0x1670c0` | event 1: `0x14efec(scene+0x388, slot 0)`, mode `[+0x430]=3` | **SwitchDouble** |
| `0x167060` | event 2: slot 1, mode 4 | **SwitchUp** |
| `0x167090` | event 3: slot 2, mode 5 | **SwitchDown** |
| `0x1aa9cc` | clip pointer table | slots 0 `SwitchDouble`, 1 `SwitchUp`, 2 `SwitchDown`, 3 `HudDoubleInOut`, 4 `HudUpInOut`, 5 `HudDownInOut`; `0x1aa9e4` `PanelGameIn/Out`, `PanelNoGameIn/Out` |
| `0x168454` | update | modes 3/4/5 wait for the switch clip, then notify scene 2 event 2 (button release) |

Scenes are persistent objects owned by the manager (`[mgr+8][index]`); only
the constructor and the handler write the index, so the mode persists across
Back/reopen within one applet session and resets on relaunch.

## Resource records

`memo-ImageScreenUp-arc-l.json`, settled frame 25 of each 26-frame clip
(`origin 1` = top-centre, upper LCD 400 × 240):

| Clip | `P_ScreenUpL` | `P_ScreenDown` | Frame 0 equals |
| --- | --- | --- | --- |
| `SwitchDouble` | 190 × 114 at (0, 115) | 152 × 114 at (0, −1) | `SwitchDown` frame 25 |
| `SwitchUp` | 400 × 240 at (0, 120), fills the LCD | hidden | `SwitchDouble` frame 25 |
| `SwitchDown` | hidden | 320 × 240 at (0, 120), x 40–360 | `SwitchUp` frame 25 |

The frame-0 chaining confirms the executable's order Double → Up → Down →
Double. `P_ScreenShdwUp/Down` follow their panes; `P_ScreenUpR` is never
shown. `P_Mask` (alpha 140) is a source overlay present in all three poses
and remains hidden by the painter, as before.

`memo-MemoWriteDown-arc-l.json`: bounding panes `B_BtnBack` (origin 6, −160,
−120) and `B_BtnSwitch` (origin 7, 92, −120), both 44 × 28 → lower-LCD
rectangles (0, 212, 44, 28) and (230, 212, 44, 28). `MemoWriteDown_Invalid`
(2 frames, group `G_Btn_Switch`) changes only `P_BtnSwitch` material colour 1
(230/230/220 → 180), `P_GradSwitch` material colour 1 (255 → 180),
`P_MemoSwitchB` vertex colours (255 → 180) and `P_MemoSwitchF` vertex colours
(100/20 → 140).

## Implemented correction

- `stock-screen-layout.ts`: `NotesCaptureView`, `notesCaptureView`,
  `notesNextCaptureView` (`double→up→down→double`) and the `switch` target at
  (230, 212, 44, 28) beside the existing Back target.
- `stock-apps.ts`: on the selected Game Note, `switch` advances `captureView`
  in state. It is not saved and emits no effects; `memo` is unchanged.
- `stock-native-personal-tools.ts`: binds `SwitchDouble`/`SwitchUp`/`SwitchDown`
  at frame 25 by mode with the same capture textures; without suspended
  software it also binds `MemoWriteDown_Invalid` over `Base`/`SceneIn`.

Adaptation: the pure reducer cannot observe the application slot, so tapping
the switch without suspended software still advances the hidden mode. Native
disables the button (state 5). Nothing visible changes because the suspended
title cannot change while the applet is open, and the painter shows the source
Invalid pose; a new launch starts at Double either way.

## Verification

- `tests/notes-capture-switch.test.mjs`: cycle order, targets and dead zones,
  session persistence through Back/reopen, no save/effects, `memo` inert, and
  the real `system.ts` route Health → HOME → Game Notes → lower-LCD taps →
  relaunch reset.
- `tests/notes-suspended-capture.test.mjs`: settled Up/Down poses and frame-0
  chaining through the real pack; `Invalid` changes exactly the four switch panes.
- `scripts/verify-native-personal-tools.mjs --title notes-suspended`: renders
  Double, Up, Down and no-software; checks quadrant orientation per mode, that
  the lower LCD is identical across modes, and that the Invalid pose differs
  only inside the switch button. Output: `reference/cursor-notes-switch/
  notes-suspended/` in the artifact root.

## Not established

- The source Switch poses now animate as described below. The button
  `Select`/`Decide` animations and the two switch sounds are not reproduced.
- HUD events 8/9 (`HudDoubleInOut`, `HudUpInOut`, `HudDownInOut`) and the
  software-title panel (`W_TextPanel`, `P_ObjIcnUp00/Down00`, `TextPanelInOut`
  /`Stay`) remain hidden; their timing and inputs are untraced.
- No matched Azahar/native LCD comparison of these modes has been performed.


## Switch motion follow-up (24 September 2026)

`stock-apps.ts` now advances an in-memory `captureSwitchElapsed` from zero on
an accepted switch to source frame 25, using the existing foreground tick path.
`notesSwitchFrame` quantizes elapsed time at nominal 60 Hz and clamps the last
frame; this frequency is a browser adaptation, not measured native latency.
Further switch taps are ignored until completion. The source update branches
at `0x1684d4` (Up), `0x1684f0` (Down), and `0x168530` (Double) wait on the
matching clip before sending scene 2 event 2; that establishes the bounded
release order, not whole-applet scheduler equivalence.

The actual source `ImageScreenUp_Switch*` tracks now supply the intermediate
pane geometry and visibility. They continue to use the frozen paired capture;
there is no interpolation invented by the browser painter. Lower note chrome
and saved strokes remain unchanged. Back, sleep and suspend settle the display
mode so a reopened note cannot retain a partly played transition; this is an
explicit browser lifecycle adaptation. The initial mode and the session-persistent
Double → Up → Down order remain unchanged, and none of this is saved.

Reduced motion flows from `createScreens` through portfolio and stock presentation
to the painter. It paints frame 25 immediately while preserving the same bounded
input release time. The presentation cache includes that preference, so changing
it invalidates the visible pair even when no app state changes.

The HUD and software-title panel remain hidden: the existing static evidence
lists their clips/events but does not yet establish the input/timing conditions.
This change does not infer them from clip names.

Verification artifacts live under `reference/notes-switch-motion-render/` in the
firmware artifact root. The actual painter renders all three source clips at
frames 0, 6, 12, 18 and 25, checks frame-0 chaining and frame-25 endpoints,
checks unchanged lower pixels, verifies reduced motion equals the settled target,
and reports no resource/render diagnostics. These synthetic quadrant sheets
establish source-pose consumption and orientation, not a native LCD comparison.
`tests/notes-capture-switch.test.mjs` checks intermediate timing, repeat-tap
blocking, finite deltas, endpoint stability and lifecycle settling. Browser
inspection remains the coordinator's integration step; strict 1:1 is unproven.

Worker checks: 11 focused Notes tests pass, the full suite reports 1,165 passes
and 19 skips with zero failures, TypeScript checking passes, and the production
build passes. Logs: `reference/notes-switch-motion-{focused,tests,build}.log`.
The worktree's initial external `node_modules` symlink was rejected by Turbopack;
the successful build used a local APFS clone of the integration dependencies.

## Title/HUD and sound follow-up

The [title-panel/HUD source audit](native-notes-title-hud-source-audit.md)
corrects the HUD event IDs to 8/9, identifies the independent title-panel
controller and dynamic title/icon inputs, and resolves the two switch sound
names. It records the metadata, controller and audio-delivery gaps; these
panes and sounds remain unimplemented.
