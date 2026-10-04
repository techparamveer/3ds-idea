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
  `curtain/probe_curtain.py` adds the pacing, splash-exit, backdrop, OK-button
  and render facts to `curtain/source-audit.json` and `curtain/listings/`.
  `armdis.py` and `xref.py` are their Capstone helpers. Both run with the
  existing `camera-grid-venv` interpreter.
- **Native run:** an isolated Azahar direct title launch reached an NNID
  account-linking information page, not the welcome. That run is recorded on
  the integration branch in `docs/native-eshop-direct-launch-2026-09-24.md`. It
  cannot validate welcome timing, so every timing below is static.

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
4. It calls `0x285fa0(BG, 2)` at `0x2e474c`, which reveals the BG curtain on
   both screens (see below). It then starts sound cues `0x100002f` and
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

## Pass rate

The interval byte at `0x3e0560` is 1 in the file data. App init `0x2e4e00`
(vtable `0x3c81fc`) sets it to 2 at `0x2e4eac` (`mov r0, #2; bl 0x2eb2fc`), and
a whole-binary scan finds no other caller of `0x2eb2fc`. The VSync/swap task
`0x107c2c` (priority 1.0) waits until the VSync callback `0x107c14` has counted
`interval` VSyncs. One dispatcher pass therefore takes **two VSyncs**, which is
30 Hz at a nominal 60 Hz VSync. The earlier assumption of 60 Hz ran the welcome
twice as fast as native.

## Composition and backdrop

Each render screen paints its draw list in ascending priority order
(`0x107a08`–`0x107a64`), so later entries paint over earlier ones. Every layout
load (`0x295b48`) registers itself through `0x23fb44` with a screen mask. The
render path has no per-frame colour clear: `0x2a08b4` is a state-dirty mask,
`0x2a0a98` writes the viewport, and `0x10da8c` transfers the render image to the
displays. Welcome layouts draw in mono with a zero stereo offset (`0x2eb2ec`).
The orthographic projection `0x2ee8e0` uses z for depth only.

During the welcome, each screen paints in this order:

| Priority | Layer | Source | Alpha |
| --- | --- | --- | --- |
| 0.01 | App backdrop `BG_U_00` / `BG_D_00` | App init `0x2e514c`; the literal at `0x2e5388` is 0.01 | 255; no clip bound. `P_BG_00` covers y 20–240; `P_BG_01` is hidden |
| 0.5 | `welcome_U_00` / `welcome_D_00` | Welcome constructor | Upper animated as above |
| 0.9 | `OKBtn_D_00` (lower screen only) | `0x26f298` at `0x2e4634`, mounted at `welcome_D_00`'s `OKBtn_D_00` pane | Layout |
| 0.91 | Common `info_U_00` | HUD ctor `0x36b0e8` at `0x36b480`; `N_info_00` hidden | `P_bg_01` is the 400×20 fill |
| ≈0.911 | `HudMenu_00` | Same ctor at `0x36b274`, constructed from app init `0x2e589c` | Default `N_Scene_00` visible; Appear is not started |
| 1.0 | BG curtain `BG_U_00` / `BG_D_00` | Global `0x3dfddc`, created from app init at `0x2e51f0` through thunk `0x2e60b8` | `inOut_00` on `N_root_00` |

The status strip is eShop-owned. See
[welcome HUD audit](eshop-welcome-hud-source-audit.md). It is not a system
applet and not inherited HOME chrome.

The backdrop beneath the welcome is therefore the same BG layout at full alpha,
which the browser already painted. The curtain is an extra layer over
everything, including the OK button. In the delivered `inOut_00` clips,
`N_root_00` falls from 255 through 215, 128 and 40 to 0 over frames 0 to 4.
Both screens' clips are identical.

**Curtain state at the constructor.** The splash (constructor `0x2e3510`,
called at `0x364e78`) leaves the curtain covered:

- `0x2e33e0` runs once the splash's upper animator is idle. It covers the BG
  (`0x286580` at `0x2e340c`, speed −1) and starts `out_01` on both splash
  layouts.
- Member `0x2e34e0` (table `0x3b4580`) sets `+0x340`, the flag that boot step
  `0x3624d4` polls through `0x22077c`, and removes the splash task.
- The reversed curtain ticks in the covering pass, so it reaches frame 0 on the
  same pass that the five-frame splash `out_01` goes idle. The curtain is
  therefore at frame 0 (alpha 255) when the welcome is constructed.

`0x285fa0` then sets speed +1 and playing on both curtain animators. They share
the constructor's epoch with `in_00`, so the curtain shows frame min(n, 4) and
is idle from pass 4.

## OK gate

- **Disabled at construction.** The constructor disables OK with
  `0x291450(btn, 0)` at `0x2e465c`. That call stores byte `+0x39` and releases
  any held press.
- **Enabled at pass 12.** At pass 11, `0x2e4280` starts `balloonIn` and switches
  task `+0x388` to `0x2e4380`. From pass 12, `0x2e4380` confirms the BG is idle
  (`0x286514` at `0x2e439c`) and enables OK (`0x291450(btn, 1)` at `0x2e43b0`).
- **No input while disabled.** The touch dispatcher `0x107348` processes a
  target only when both `+0x38` and `+0x39` are set. A disabled OK therefore
  receives no event at all: no decide, and no `invalid_00` from input.
- **One decide.** The decide callback `0x2e3f90` stores `+0x3d8`, disables OK
  again (`0x2e3fb8`) and switches `+0x388` to `0x2e4058`.

## Exit sequence

A decide at pass d first runs `0x2e4058` at pass d + 1. That step returns while
task `+0x3b0` is active. `+0x3b0` removes itself at pass 69 and runs after
`+0x388` within a pass. `out_00` therefore starts at s = max(d + 1, 70).

| Pass | Upper animator | Curtain | Source |
| --- | --- | --- | --- |
| s | `out_00` frame 1; SE `0x1000032` | Idle (alpha 0) | `0x2e4058` starts the clip and switches to `0x2e415c` |
| s + 14 | `out_00` frame 15, idle | Idle | Non-looping clamp |
| s + 15 | `out_01` frame 1 | Frame 3 | `0x2e415c` starts `out_01` and covers the BG (`0x286580` at `0x2e419c`); the same pass ticks the reversed clip |
| s + 16 … s + 18 | `out_01` frames 2–4 (idle at s + 18) | Frames 2, 1, 0 | `0x2e4248` waits for the BG to be idle (`0x286514` at `0x2e425c`) |
| s + 19 | `out_01` frame 4 | Frame 0, idle | The reversed tick clamps at 0 |
| s + 20 | — | — | `0x2e4248` removes `+0x388`; native continues to the network step |

Because each replaced clip persists through its last pose, the upper bindings
during the exit are `[in@10, balloonIn@58, wait@w, out_00@f]`. From s + 15 they
are `[…, out_00@15, out_01@f]`. Here w is the `wait_00` frame of pass s − 1. In
the delivered clips, `out_00` returns `N_chara_00` to y −158 and fades
`N_root_00` to 0. `out_01` then shrinks the balloon and rotates the feet.

## Browser implementation

`src/os/stock-eshop-welcome.ts` holds the pure timeline. It provides
`eshopWelcomeBindings(pass, decided)`, `eshopCurtainFrame(pass, decided)`, the
pass-12 gate, the exit arithmetic and the tick/decide reductions.

- **Clock.** The eShop reducer in `stock-apps.ts` accumulates `tick` time for
  its own instance, at most `ESHOP_WELCOME_STEP_LIMIT_MS` (250 ms) per step. The
  pass is floor(ms × 30 / 1000). Only the active owner receives ticks, so HOME,
  sleep and applets pause the clock. A new launch creates a new instance at
  pass 0. `view.data` exposes `welcomePass` and `welcomeDecidedPass`, not
  milliseconds.
- **Input.** The OK row and its touch target (`stock-screen-layout.ts`,
  unchanged geometry) now use the action `ok`. A, the touch target and the
  footer OK share one path. Before pass 12, and after a decide, OK changes
  nothing. B keeps its existing HOME route.
- **Exit.** A decide records its pass. When the clock reaches s + 20, the
  reducer emits `home` and resets the welcome to pass 0.
- **Paint.** `drawNativeServiceFrame` paints the backdrop, the welcome, the OK
  button, Common `info_U_00` (`N_info_00` hidden), `HudMenu_00`, and then the
  curtain on each screen. It skips the curtain at frame 4 (alpha 0) and when no
  pass is available. The stock pair's cache key holds the pose (upper bindings
  plus curtain frame) and the HUD clock, not the pass, so settled passes do not
  repaint. Reduced motion shows the settled pose without a curtain and does
  not stop the software timeline.

## Adaptations and open gaps

- **Epoch (adaptation).** Pass 0 is the eShop instance's first application
  tick after the coordinator's launch transition, not the native splash
  handoff. Native packs start preparing during the launch transition. If the
  pair is still loading after that transition, the passes it takes are consumed
  behind the pending frame. The previous presentation clock excluded load time,
  but it could neither gate input nor end the exit, so it was replaced.
- **Route end (adaptation).** When `0x2e4248` retires, native continues to the
  network step, which is excluded here. The browser instead returns HOME at
  s + 20 and restarts the welcome from pass 0. Pass 0 is the covered curtain,
  and the verifier shows it is pixel-identical to the covered end of the exit.
  A resumed title therefore replays the entrance.
- **B button.** Native B handling on the welcome was not traced. The browser
  keeps its existing B → HOME route, including during the exit.
- **VSync rate.** The two-VSync pass is timed at a nominal 60 Hz. The measured
  LCD rate is not established in this repository.
- **Constructor pass.** It is unresolved whether `in_00` and the curtain reveal
  also tick in pass 0, so native may be one pass ahead.
- **Input order.** The input-dispatch task's order relative to `0x2e4380` was
  not traced. The first accepted OK may therefore differ by one pass.
- **OK poses.** The generic button setup `0x2e9394` binds three stopped
  animators: `touchOff_00`, `touchOn_00` and `invalid_00`. The idle, disabled
  and pressed poses depend on how stopped bound animators are applied, which was
  not traced. The browser keeps `touchOff_00` frame 1 throughout.
- **Sounds.** None of these cues are delivered: `0x100002f` and `0x1000009`
  (via `0x28c184` with 60) at construction, `0x1000033` for `balloonIn`,
  `0x1000032` for `out_00`, and the OK decide SE `0x100000e`.
- **Stereo.** Only the mono (3D off) composition is traced.
- **HUD network/battery.** `0x36a7fc` is traced. The painter uses the Internet
  branch from the shared profile (`lau_connect0`, NetMode 0, NetAtn 3) and
  keeps the eShop colon static. See
  [welcome HUD audit](eshop-welcome-hud-source-audit.md).
- **Fidelity.** A source-rendered frame does not prove strict 1:1 native
  fidelity, and no native welcome capture exists.

## Verification

- **Unit tests.** `tests/eshop-welcome-lifecycle.test.mjs` covers these cases:
  - the 30 Hz pass mapping and the clip and curtain frames;
  - the exit arithmetic for early and late decides;
  - the pack requests;
  - OK inert before pass 12 for A, the button and touch;
  - a single decide, and the HOME effect with reset at s + 20;
  - the step bound and the B route;
  - owner-only ticking through the app host, with HOME suspension pausing the
    exit and the welcome restarting on resume;
  - pose-keyed repaint and reduced motion.
- **Source-render verifier.** `scripts/verify-eshop-welcome.mjs` loads the
  real packs. It checks the frame counts and loop flags of `in_00`,
  `balloonIn_00`, `wait_00`, `out_00`, `out_01` and both `inOut_00` clips, and
  confirms these results:
  - **Entrance poses.** `N_chara_00` y is −158 and then −112; `N_root_00` alpha
    is 0 and then 255; the balloon is hidden until pass 11; the eyes are closed
    at pass 110.
  - **Curtain alpha.** 255, 215, 128, 40 and 0 on both screens.
  - **Curtain pixels.** Passes 0–3 cover the lower LCD, and from pass 4 it is
    static.
  - **Settled frame.** The pass-68 pair is pixel-identical to the settled and
    reduced-motion pair.
  - **Idle loop.** `wait_00` has a 75-pass period.
  - **Exit poses.** For a decide at pass 20, `out_00` starts at pass 70,
    `out_00` frame 15 puts the character at y −158, and `out_01` shrinks the
    balloon.
  - **Covered end.** The covered exit end is pixel-identical to the covered
    pass 0 on both LCDs.

  It writes the entrance and exit pair PNGs, an upper contact sheet, an exit
  contact sheet, a 400×20 HUD crop, `verification.json` and a benchmark to
  SSD `reference/eshop-idle-source/render/`. It also checks that `info_U_00`
  `P_bg_01` covers the top 20 px, `N_info_00` is hidden, Internet NetAtn map 0
  is `HudNetAtnInt_00`, charging Bat frame 4 is `HudBat_01` + `HudBatLgt_00`,
  and frame 5 is `HudBat_01` + `HudBatPlg`.

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
