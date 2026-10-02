# HOME Close Motion - 2 October 2026

Status: implemented and browser-inspected; native motion **blocked**, whole
settled diagnostics **fail**. L-06/L-07/H-12 remain partial, not 1:1.

## Delivery and Ownership

Two separate user-owned chats delivered from new internal worktrees based on
`cd6400fb`, using GPT-5.6 Sol/high. Service tier is not exposed or verified.
Workers operated no GUI; only the coordinator used Sidecar and Azahar.

| Worktree / branch suffix | Worker commit | Coordinator integration |
| --- | --- | --- |
| `3ds-home-close-presentation-20261002` / `home-close-presentation-20261002` | `ec0da207` | `990e9fe0` |
| `3ds-home-close-runtime-20261002` / `home-close-runtime-20261002` | `d165c95a` | `5cd0daef` |

Branches have the `codex/` prefix; paths are under
`/Users/paramveer/.codex/worktrees/`. Earlier controller `43b18bf0` integrated
as `cd6400fb`. Coordinator `8f497cdd` wires paired playback/publication and
`f8334ec2` fixes retirement-input quarantine, sleeping capture validation and
terminal GPU publication. Worktrees are preserved and workers are idle.

System keeps the suspended owner through AppQuit0..20, stops the entire outer
clock batch at terminal, then closes exactly once on a later eligible update.
Switch target is frozen at confirmation. Existing HOME transition allocator is
the single ID authority; runtime owner and System generation guard mutation.
The paired compositor separately pins actual suspended-capture generation.
One dynamic texture binding serves all frames; raster cache also keys playback.
Ordinary input is rejected using the transition present before scene-clock
advancement. Power/mute/volume and lifecycle/release operations remain allowed.

Terminal and retirement pairs force LCD paint and synchronous WebGL render
when awake/visible. `data-screen-presented` records only completed renderer
calls. Sleep pauses the controller and suppresses presentation validation while
retaining its capture pin. Reduced motion samples endpoint20 but keeps logical
20+1 lifetime. It currently may redundantly render identical endpoint frames.
Terminal publication immediately across hide/sleep inhibition is not proven;
the replay covers a mid-close lid pause, not every boundary race.

## Source Identity

Visible close backing -> `models.homeBackground` -> HOME
`0004003000009802` v24576, content0 / `00000082`,
`romfs/3D/BannerBG_LZ.bin`. Compressed SHA-256
`27d58c2113d2c2d46e3bcc36bb2ae56c35e19d9823488287b6759df998108711`;
decoded CGFX `092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595`;
delivered model JSON
`45b3c6a470f681a10443f90fc73aff016b97a077b977b62649465524dffd3615`;
converter `ctr-cgfx-web` 1.1.0. No new conversion/assets/audio.

Playback is SceneIn20 skeletal plus AppPause20 then AppQuit0..20 material,
in that order. Source Constant4 alpha moves0->1; capture scale steps0.87->1.
AppQuit also changes mask UV scale to3/6 and translation to-0.6911/0.1666.
The inspected first close frame consequently has an abrupt dark backing rather
than the settled captured image. Its native mask-binding/epoch contract remains
unverified; do not label this visual residual native-correct. Window/footer
stay settled until owner retirement. AppRestart/SceneOut remain unmapped.
The [controller handoff](workstream-handoffs/home-transition-motion.md) is the
source audit; its original not-integrated status is superseded here.

## Evidence

Private root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/close-motion-native/`.
`summary.json` SHA-256
`9870b4d5d62e357d16e0ab887d084d4b37677381cd37d707f92655876de42e9a`
tracks93 raw pairs, inputs, reports/masks, source inheritance, native attempts,
configs/logs, checks and screenshots. Browser runtime commit `f8334ec2`.

- **Tested:** full1721 pass,0 fail,23 skip,1 TODO; typecheck, production build,
  shader validation and diff-check pass. Read-only review found no remaining
  code-safety blocker, with the bounded reduced-motion overhead noted above.
- **Browser-inspected:** Health direct close, Work confirmed close, Work->About
  switch, reduced close, mid-close lid pause/resume, constrained30fps close,
  mobile close. Every route captured source frame20 and actual WebGL publication,
  then owner retirement; no page errors. Seven motion sheets opened, plus
  desktop1150x693/mobile390x740 screenshots. RGB standard deviations exceed56;
  source console/screens remain visible without overlapping page UI.
- **Native-compared:** retained Health before/after references only. Empty-mask
  pixels>2 are10260/33902 and55126/27533 upper/lower. Four contact sheets opened;
  HUD, population/density/input and animation phases differ. Both pairs fail.
  These measurements are not a matched before/after improvement claim.

Coordinator retried both independent muted Azahar copies on Sidecar at
1810,397 and2460,397. They were used sequentially this pass; the previous pass
used them simultaneously. Pinned executable SHA
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`.
Primary saved own400x480 idle PNG `_02.10.26_06.53.47.189.png`, but held touch/A
did not launch Health. Secondary repeated the failure. No fresh closing frames,
matched input or audio timing. Both ignored Quit/SIGTERM; scoped SIGKILL yielded
exit137 and verified absence. Temporary HOME/mapped-touch bindings were restored,
with an initial premature primary restore disclosed in `native-attempt.json`.
Static input2, Null output1, volume0 retained; no system/Spotify/mic changes.

The first browser script timed out against about:blank because agent-browser's
connection did not match the dedicated CDP target. The final replay explicitly
navigated actual CDP9320 after Sidecar window readback. No evidence is attributed
to the ambiguous earlier browser connection. Final replay and native sessions
are stopped after inspection; intentional preview remains on3021.

## Remaining Work

Native close input/epoch/mask binding, window/footer/upper banner departure,
restart/scene-out predicates and native audio timing remain open. Source clips
are delivered, but host scheduling and inherited capture binding/padding/sampler
fits are adaptations. Existing HUD/font/MSBT provenance residuals, title fits,
Settings fits/local previews, portfolio content/frozen HUD duplication and
offline boundaries remain non-native. No historical matrix change.

Next visible priorities: resolve the captured close-mask/window departure gap,
power-on, then physical/touch/button interaction, preserving existing designs.
