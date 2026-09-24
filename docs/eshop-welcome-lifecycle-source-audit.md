# eShop welcome lifecycle source audit — 24 September 2026

This audit traces the start, replacement, looping and stopping of
`welcome_U_00_in_00`, `welcome_U_00_balloonIn_00` and `welcome_U_00_wait_00`
in the EUR eShop executable. It then derives a browser pass timeline from that
trace. It is a static ARM trace, not a matched native capture. The executable was
not run.

## Evidence

- **Executable:** title `0004001000022900`, content `0000006b`, `exefs/code.bin`,
  SHA-256 `f69159121397ecca0164654f3f4771836f26fa9ea19f351c454f8e7364d1f4fa`,
  base `0x100000`. The file stays private under the SSD extraction root.
- **Layouts and clips:** the published `cad-Boot-arc-lz.json` and
  `cad-Common-arc-lz.json` under `public/os/firmware/10.7.0-32E/packs/eshop/`.
- **Reproducible probe:** SSD `reference/eshop-idle-source/`. `probe.py`
  checks the hash, then writes `source-audit.json` and `listings/*.txt`.
  `armdis.py` and `xref.py` are its Capstone helpers. It runs with the existing
  `camera-grid-venv` interpreter.

## Verified welcome controller

The boot sequencer step at `0x3624d4` waits until the splash object reports
that it has finished (`0x22077c`). It then destroys the splash (`0x2206f8`) and
allocates a `0x3e0`-byte welcome object. That object's constructor is at
`0x2e4498`. The welcome is therefore not composited over the splash or the
opening scene.

The constructor does the following, in order:

1. `0x295b48` loads `welcome_U_00` for the upper screen at draw priority 0.5.
   `0x2403cc(this+0x70, this, "in_00", 1)` then starts `welcome_U_00_in_00`
   on the upper animator.
2. It loads `welcome_D_00` for the lower screen at priority 0.5. It builds the
   OK button at `+0x120` (`0x26f298`) and disables it (`0x291450(…,0)`).
3. `0x2a5560` registers two tasks at priority 0.5, first `+0x388` and then
   `+0x3b0`. `r7` holds `0x3b4590` from the literal pool at `0x2e45d0`. Task
   `+0x388` gets the member pointer at `r7+8` (`0x3b4598`, which is
   `0x2e4280`). Task `+0x3b0` gets the one at `r7+0x10`, after
   `add r7, r7, #0x10` at `0x2e46e0`. That entry is `0x3b45a0`, which is
   `0x2e4454`.
4. It calls `0x285fa0(BG, 2)` and starts sound cues `0x100002f` and
   `0x1000009`.

**Brief check.** The brief placed `wait_00` at ARM `0x2e4454`, called via
`0x2403cc` through callback table pointer `0x3b45a0`. This is **confirmed**.
Nothing in the binary stores `0x3b45a0` as a word: the pointer comes from the
`+0x10` offset added to the table base. `0x2e4454` checks the upper animator's
playing byte (`+0x70+0x38`). If that byte is 0, it starts `"wait_00"` with
argument 1 and then removes its own task (`0x2952b0(this+0x3b0)`).

The member table at `0x3b4590` holds these entries:

| Entry | Function | Role |
| --- | --- | --- |
| `0x3b4590` | `0x2e3f90` | OK decide callback: stores `+0x3d8`, disables OK and schedules `0x2e4058` |
| `0x3b4598` | `0x2e4280` | When the animator is idle, starts `balloonIn_00`, plays SE `0x1000033` and then runs `0x2e4380` |
| `0x3b45a0` | `0x2e4454` | When the animator is idle, starts `wait_00` and removes its own task |
| `0x3b45a8` | `0x2e4380` | When the BG inOut clips are idle (`0x286514`), enables OK and switches to a no-op |
| `0x3b45b0` | `0x2e427c` | `bx lr` |
| `0x3b45c8` | `0x2e4058` | Waits until the `+0x3b0` task is inactive, then starts `out_00` and plays SE `0x1000032` |
| `0x3b45b8` | `0x2e415c` | When the animator is idle, starts `out_01` and covers the BG (`0x286580`) |
| `0x3b45c0` | `0x2e4248` | When the BG is idle, removes the `+0x388` task |

## Animator and scheduler semantics

- **One slot per layout.** `0x2403cc` has one animation slot. If a clip is
  already bound, it removes that clip's tick task, unbinds it and clears
  `+0x38`. It then resolves `<layout>_<suffix>.bclan`, binds the new clip and
  sets speed `+0x34` to 1.0 and playing `+0x38` to 1. Finally it registers the
  tick task `0x2eae38` at priority 0.85. The three clips therefore **replace
  one another; they never play at the same time**. After a clip is unbound, its
  last applied pose persists on the panes; the library does not restore
  defaults. That persistence comes from the NW layout library's behaviour, not
  from an instruction traced in this pass.
- **Tick.** The tick computes `next = frame + speed`. It reads the frame count
  from the resource header (`+8`, u16) and the loop flag from `+0xa`
  (`0x373878`). A non-looping clip clamps to `frames − 1` once
  `next ≥ frames − 1`, and clears `+0x38` in the same tick. A looping clip
  subtracts `frames` whenever `next ≥ frames`. `wait_00` therefore shows frames
  0 to 74 and never samples its keys at frame 75 or later. The delivered loop
  flags match: in 0/11, balloonIn 0/59, wait 1/75.
- **Scheduler.** `0x10b8c4` keeps the tasks sorted by their double priority,
  in ascending order. Equal priorities stay in insertion order. The main loop
  calls the dispatcher `0x2a63f8` once per iteration (`0x103d98`). The
  dispatcher walks the list in order, and the mode gates at `0x3e05c0` are
  initialized to `0x01010101`. Removing a task other than the current one
  (`0x2952b0`) erases it immediately. Registering one (`0x2a5560`) inserts it
  immediately. A clip's new tick task is therefore visited **later in the same
  pass** as the step that started it.

## Pass timeline

Pass n is dispatcher pass n after the welcome constructor. The upper animator
shows the following:

| Passes | Upper animator | Mechanism |
| --- | --- | --- |
| 0–10 | `in_00` frame n | The pass-10 tick clamps to frame 10 and clears `+0x38`. |
| 11–68 | `balloonIn_00` frame n − 10 (1…58) | `+0x388` runs first at pass 11 and starts the clip; the same pass ticks it to frame 1. `+0x3b0` then sees the animator playing. |
| 69 onward | `wait_00` frame (n − 68) mod 75 | The pass-68 tick clears `+0x38`. At pass 69 `+0x3b0` starts `wait_00`, the clip ticks to frame 1, and `+0x3b0` removes itself. |

The `wait_00` loop never stops by itself. It is replaced only after OK is
decided: `out_00` starts, then `out_01` once `out_00` finishes, then the BG
cover and the exit. These clips come from one authored timeline. Their source
frame ranges are 0–10, 11–69 and 70–145, and the pass mapping skips source
frames 11 and 70 once each.

## Browser implementation

`eshopWelcomeBindings(pass)` in `src/os/stock-native-services.ts` returns the
bindings for each span. The table above lists the clip frames.

| Passes | Bindings |
| --- | --- |
| 0–10 | `[in@n]` |
| 11–68 | `[in@10, balloonIn@f]` |
| 69 onward | `[in@10, balloonIn@58, wait@f]` |

Applying the bindings in that order reproduces the persistence of each
replaced clip's final pose. With no pass, which covers reduced motion, the
function returns the settled pair from before this change.
`stock-screen-presentation.ts` owns one welcome clock, and that clock is
owner-bound:

- **Start.** It starts at 0 on the first published native eShop pair for that
  owner. Loading time is not credited.
- **Pauses.** It advances only while that owner's welcome pair is being painted.
  It pauses when the owner changes, for example to HOME, sleep or an applet, and
  it pauses under reduced motion. Each host step credits at most
  `ESHOP_WELCOME_STEP_LIMIT_MS` (250 ms).
- **Reset.** It restarts only for a different eShop owner, which means a new
  launch. `main` and `detail` (the OK and Close labels) share the clock.
- **Repaint and cache.** The stock-pair key holds the pass's bindings, not
  milliseconds. The pair therefore repaints at most once per source pass, and at
  most at the scene's LCD paint rate (12–24 Hz on the current tiers). Each
  repaint adds one posed `welcome_U_00` to the renderer's 16-entry LRU pose
  cache, which bounds its size.

## Adaptations and open gaps

- **Pass rate.** One dispatcher pass is assumed to take 1/60 s. The main loop's
  VSync wait was not traced. Native animation is locked to passes and would slow
  down if frames were dropped.
- **Constructor pass.** The constructor runs inside a boot-sequencer step. It is
  unresolved whether `in_00` also ticks in pass 0, so native may be one pass
  ahead throughout the timeline.
- **Epoch.** The browser epoch is the first published welcome pair after the
  coordinator's launch transition. It is not the native splash handoff.
- **Background curtain.** This is a newly found composition gap. The global BG
  object `0x3dfddc` (`0x2e60c0`) loads `BG_U_00` and `BG_D_00` at priority
  **1.0**. It starts `inOut_00` and immediately stops it at frame 0, where
  `N_root_00` alpha is 255. Each render screen draws the priority list in
  ascending order (`0x107a08`–`0x107a64`), so BG is painted **after**, and
  therefore over, welcome. `0x285fa0` plays the inOut clips forward at speed
  +1, taking `N_root_00` (InfluencedAlpha) from 255 to 0 over four passes.
  `0x286580` plays them back at speed −1.
  - **Native:** BG is a transition curtain, and the steady welcome shows
    **no BG** above it. The native backdrop beneath welcome, whether a clear
    colour or another list entry, is untraced.
  - **Browser:** it still paints BG beneath welcome at full alpha. The earlier
    trace's statement that the unbound backgrounds "already show the entered
    state" is therefore not supported.
  - **Status:** these pixels were left unchanged pending a backdrop trace or a
    native capture.
- **Unimplemented behaviour.** The OK button enable waits for the BG curtain;
  the browser does not gate input. The browser returns HOME on OK without
  playing `out_00` and `out_01`. Sound cues `0x100002f`, `0x1000009` (via
  `0x28c184` with 60) and `0x1000033` are not delivered.
- **Fidelity.** A source-rendered frame does not prove strict 1:1 native
  fidelity.

## Verification

- **Unit tests.** `tests/eshop-welcome-lifecycle.test.mjs` covers the pass
  mapping, the pack request, first-publication start, per-pass repaint, the
  step bound, HOME pause and resume, the new-owner restart and reduced motion.
- **Source-render verifier.** `scripts/verify-eshop-welcome.mjs` loads the
  real packs and checks the clip frame counts and loop flags, together with
  these results:
  - The poses match: `N_chara_00` y is −158 and then −112, `N_root_00` alpha is
    0 and then 255, the balloon is hidden until pass 11, and the eyes are
    closed at pass 110 (wait frame 42).
  - The pass-68 frame is pixel-identical to the settled and reduced-motion
    frame.
  - `wait_00` has a 75-pass period.
  - No change reaches the lower LCD.

  It writes PNGs, a contact sheet and a benchmark to
  SSD `reference/eshop-idle-source/render/`.

  ```sh
  node scripts/verify-eshop-welcome.mjs \
    --artifact-dir <SSD>/reference/eshop-idle-source/render \
    --asset-root "$PWD/public/os/firmware/10.7.0-32E" \
    --canvas-module <SSD>/reference/eshop-idle-source/canvas-runtime/node_modules/@napi-rs/canvas/index.js
  ```

- **Benchmark.** An offline run with `@napi-rs/canvas` 0.1.100 on Node 22 drew
  the complete pair for 219 passes (the entrance plus two loops). Mean 1.65 ms,
  p95 2.51 ms, maximum 23.9 ms, total 361 ms. This is not browser, WebGL or
  device evidence.
- **Not done by this worker.** Browser inspection and native comparison are
  coordinator work and were not performed.
