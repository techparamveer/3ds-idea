# Health article touch, SlideBar and continuous scrolling

This continues the [live-scroll audit](health-live-scroll-source-audit.md) from
`d1313d0`. It resolves that audit's two remaining input gates with executable
evidence: **G_Touch drag, release and inertia**, and **SlideBar thumb drag and
groove press**, including settle behaviour and owner cancellation. With those
established, the live article now **scrolls continuously**: pagination is
removed, and touch and keys drive a browser model that reproduces the replayed
frames exactly. Browser inspection and native Azahar comparison remain
coordinator work. Strict 1:1 fidelity is not claimed.

## Replay and pinned inputs

[replay_health_touch_scroll.py](../scripts/replay_health_touch_scroll.py) runs
with `unicorn==2.1.4` and reuses the `Machine` of the live-scroll replay. It
checks three input hashes:

| Input | SHA-256 |
| --- | --- |
| Private Health `code.bin` (EUR `0004001000022300`, v3077) | `74c813cc1f00a67c06ad85e10723b1440949b2d448e2e1f5532d2a61fb57600c` |
| Converted `health-and-safety/safehealth.json` | `68df4cb47eb3f07728f81213b19ee821dce7d7c8bf407bade57e8151dc4efb6f` |
| Converted `health-and-safety/slidebar.json` | `00e2ce3b1842c271db2100fe5fb8ac5cf0e3ce73683fef05967032e027040eb0` |

It takes absolute `--code`, `--safehealth`, `--slidebar`, `--output` and
`--traces` paths. The private report is
`reference/health-touch-scroll/replay.json` under the firmware artifact root,
SHA-256 `64288688a7f09df03b3aea824bb1ef168a952f952e363b506c69ecc695e955c8`.
The traces go to [health-scroll-traces.json](../tests/fixtures/health-scroll-traces.json),
SHA-256 `84da353f9953f92796f09f8a72c5219789bb0c0f494e6ae58d9750066c0def1c`.
They hold only inputs and derived pane/thumb positions, never firmware bytes.
Two runs produce identical bytes.

Each frame executes, in the schedule order the live-scroll audit pinned:

1. the original HID sampler `0x13a5d0`;
2. the control manager `0x1015d4` (Down, Up, G_Touch, SlideBar);
3. the scene update `0x157c88`.

The hit tests execute group lookup `0x112630`, test `0x128378`, matrix inverse
`0x110c08` and pane rectangle `0x158ef0`. They run against panes that carry the
converted `SafeText_D_00` and `SlideBar` translations, sizes and origins. The
startup sound-id table writer (`0x100aec…0x100b10`, reached from `0x1009e8` at
`0x1007e4`) also executes.

The fixtures are limited to the following:

| Fixture | Why |
| --- | --- |
| HID readers `0x10b1c8` (no pad update) and `0x10b0e0` (raw touch x/y/pressed); key bits written to the pad block | Hardware service calls |
| Pane objects from the converted layouts; global matrices recomputed from translations after each frame | Both layouts have no rotation or scale; the native layout calculation is not run |
| Group objects in converted member order | Native group construction is not run |
| SlideBar wrapper fields set by constructor `0x1334f8` (`+0x60 = 1`, instruction `0x133558`) | The wrapper build is not run |
| A recording `SlideBar_Select` animation (direction `+0x28`, play `+0x10`) | Records calls; its step is replayed separately |
| Allocation/free and sound dispatch `0x12f4f8` | Services |

## G_Touch: drag, release, inertia and catch

The descriptor at `0x1576a8` holds five values: drag threshold 0, release
velocity scale 1.0, inertia decay float32(0.95), stop speed 4.5 and snap
distance 4.275. Its flags are: require-free-owner 0, X axis off, Y axis on.
The control is states 0–3 of vtable `0x16c638`. State 4 (scroll-to target) is
never entered by Health.

- **Sampler:** the layout point is `(x−160, 120−y)`. A move of less than 1.5 px
  from the filtered point creeps 10 % toward the raw point; larger moves are
  taken raw. The result is truncated to integers.
- **Press:** a press edge inside `B_Touch` (294×180 at `[-12,0]`; screen x 1–295,
  y 30–210, inclusive) enters state 1. There is no event and no ownership yet.
- **Drag:** threshold 0 means the next held update takes ownership and enters
  state 2 with zero delta. After that, each update's delta is `point − last`.
  The controller applies Y 1:1 in the same update, so there is no latency beyond
  the sampler.
- **Release:** the release update applies the last delta again (×1.0) and enters
  state 3. Each later update multiplies the velocity by 0.95. Inertia stops when
  the next velocity squared would be below 20.25. The replayed release of a
  10 px/update drag moves 10, then 9.5 … 4.63 over 15 updates, then stops; the
  total coast is 111.97 px.
- **Catch:** a press edge inside `B_Touch` during inertia stops it in the same
  update and resumes dragging. A press outside does not stop it.
- **Settle:** there is none. The controller flags are `+0x1c=0, +0x1d=1,
  +0x1e=1`, so every touch/thumb update returns the controller to state 0.
  States 7, 8 and 9 are never selected, and the article rests at fractional
  offsets (171.97 px in the drag replay).
- **Ownership:** it is kept through inertia and cleared by the first idle update
  after the stop.

## SlideBar: geometry, thumb and groove

The scrollbar (`0x155664`, vtable `0x16c714`) is built from descriptor
`G_Slide`, `B_Groove_00`, `B_Slide_00`, `N_Slide_00`, `SBBtn*`, travel 150,
4.0 per row, rows and viewport 8.

Controller setup `0x12894c` stretches the bar to `N_SlideBar_00`'s 152 px:
`SBBaseWndw` and `B_Groove_00` become 16×176, and `SBBaseLine_00` becomes 8×152.
The thumb is `max(SBBtn height, 150 − (rows−8)×4)`, which is 22 for every
article, so `B_Slide_00` is 24×22. `0x15508c` then sets the travel to
176 − 22 = 154.

When the article exceeds the 8-row viewport, setup shows `N_Slide_00`
(scrollbar `SetVisible` `0x15504c`) and `SBBaseLine_00`. With 8 or fewer rows
both stay hidden (replayed).

The thumb Y is `77 − 154 × ratio`, where ratio = offset / extent, and the
inverse path is `0x1555a4` → `0x1532b8`.

- **Hit order:** `G_Slide` members are tested in order `B_Slide_00`, then
  `B_Groove_00`. The scrollbar update is skipped while another control owns.
- **Thumb drag:** a press on the thumb stores `grab = y − thumbY` and plays
  `SlideBar_Select` forward. Each held update sets
  `thumbY = clamp(y − grab, −77, 77)` and the controller maps it to the article.
  The drag continues off the bar. Release plays the animation in reverse and
  sends no controller event.
- **Groove press:** the flag at `+0x24` is always 1 in Health, so the thumb steps
  8 px per update toward the stylus Y. On arrival it becomes a thumb drag (with
  `SlideBar_Select` forward) if the stylus is still on the bar. A release before
  arrival keeps stepping to the last target, then idles without the animation.
- **`SlideBar_Select`:** it is a one-shot with end frame 1 and step 1.0
  (`0x12522c`, literal `0x1252ec`). The per-update wrapper pass `0x10190c` →
  `0x155ff0`/`0x1530e4` applies the current frame and then advances. The pressed
  colours therefore appear one update after the press and clear one update after
  release. Frame 0 equals the source thumb materials.

## Keys, overlap and cancellation

- **Keys:** the manager order is Down, Up, Touch, Scrollbar. Controls that do not
  own skip their update while any control owns (`0x128278`), and when several
  controls request in one update the last request wins.
- **Key idle handler:** `0x1546d8` returns before its digital path on a stylus
  press edge. A key pressed in the same update as any stylus press is ignored,
  and holding it afterwards does not start it. A key pressed while the stylus is
  merely held fires on its press update.
- **Held key and stylus:** an owning key pauses while the stylus is held. After
  the stylus is lifted, touch inertia overrides the key each update until it
  stops; then the key resumes at 4 px/update. A key that owns blocks a thumb or
  groove press.
- **Teardown:** teardown `0x1575a8` during inertia or a thumb drag empties the
  registry. No further events or busy state follow.

## Sounds (identified, not published)

The startup table gives two sound ids:

- `0x1000013` is the boundary sound. It plays once per contact with the top or
  bottom and is re-armed only after an update with no scroll request.
- `0x1000012` is the row-change tick (`0x128e0c` → `0x153b0c`). It is rate
  limited by the updates since the previous tick; in the drag replay it fires on
  updates 5, 9, 14 and 21 from the press.

Its interval-dependent pitch and volume are not traced. Health's `safe.bcsar` is
not converted, so the article is silent. This is recorded as open audio work,
not as a native claim.

## Browser implementation

- [stock-health-article.ts](../src/os/stock-health-article.ts) lays out each
  normalised article with the Health processor rules. It uses:
  - base scale 0.6 (15/25, 18/30);
  - size runs that save the current scale and multiply it by float32(n × 0.01);
    control 15 restores the saved scale;
  - colour runs, where opaque black restores the previous colour;
  - a pen that advances `advance × scale`, with x = pen + left × scale;
  - a baseline that advances `30 × scaleY + 3` per newline, with the glyph top at
    baseline − 25 × scaleY.

  Compared against the replayed native glyph records, all 16,813 glyphs of the
  three articles match exactly (code, position, size and colour; private
  `glyph-comparison.json`). The parser metrics give rows 95/334/208, extents
  1827/6846/4200 and warning icons at (−71, 102 − height).
- [stock-health-scroll.ts](../src/os/stock-health-scroll.ts) is the pure,
  JSON-state model of the sampler, G_Touch, SlideBar, keys, manager ownership,
  controller and `SlideBar_Select`. It runs one update per LCD VBlank
  (268111856/4481136 ≈ 59.831 Hz). For all 29 trace scenarios it reproduces the
  replayed pane Y, thumb Y and animation calls frame for frame. The scenarios
  cover drags, flicks, jitter, taps, catches, both boundaries, hit edges, thumb
  and groove variants, the key/stylus overlaps above, and articles 1 and 3.
- [stock-apps.ts](../src/os/stock-apps.ts) routes the Health document's touch,
  `button` down/up, `command` and `tick` events into the model and exposes only
  `{paneY, thumbY, selectFrame}`. Previous/Next and the page counter are gone.
  Back (button, command or the full-width `B_Btn_00` bar) closes the article and
  discards the model, matching teardown.
- [stock-native-health.ts](../src/os/stock-native-health.ts) draws, in source
  order:
  1. `SafeText_D_00` with `N_TextArea` translated by `paneY`;
  2. the unclipped glyphs attached at `TextArea_00` (the text panes stay empty),
     so they fall between the text panes and the warning icons;
  3. the `SlideBar` layout (pack now loaded) attached at `N_SlideBar_00`, with the
     controller sizes, visibility, thumb Y and `SlideBar_Select` frame;
  4. `BtmBtn_White` with its source centred Back text.

  Glyph coverage uses the native `rasterNativeAlphaGlyph` path and the
  `TextArea_00` material.

## Adaptations

- A browser pointer maps to an integer lower-LCD pixel (floor, clamped) as the
  HID sample.
- A press and lift between two VBlanks is sampled as held for one update.
- One tick advances at most 12 updates, and a longer gap is dropped.
- A discrete `command` Up/Down (accessible controls) holds the key for one
  update. Host key repeats are ignored because the native key has its own
  delay 0 and interval 1.
- A pointer cancel or lifecycle suspension is treated as lifting the stylus and
  releasing the keys, so inertia continues when ticks resume. Native HOME
  suspension was not replayed.
- The Back bar activates on release only when the press began on it
  (`BtmBtn_White` is not replayed).
- The boundary and row-tick sounds are silent.

## Verification

- The replay passes and is byte-deterministic. Python compilation and
  `git diff --check` pass.
- `npm test` gives 1,283 passes, 21 skips and 0 failures. `npm run typecheck`
  and `npm run build` pass.
- Source renders: `scripts/verify-stock-screens.mjs` wrote 57 screen pairs and
  a contact sheet with no renderer diagnostics. It includes seven Health article
  specimens driven through the model: 3D top/interior/end, General thumb
  pressed/released, and Usage second warning/end. It asserts:
  - scrolling changes no pixel of the title (rows 0–27) or Back bar (212–239);
  - pressed and released differ only inside the 22 px thumb;
  - the parser rows and extents match the delivered messages.

Artifacts are preserved under
`/Users/paramveer/.codex/artifacts/health-touch-scroll/` because the SanDisk-hosted artifact volume is full.
The renders were visually inspected. Text alignment, warning placement, colour
runs, thumb position and the pressed thumb colours look as the source layouts
predict.

The coordinator inspected the `localhost:3000` preview after merging the source pose and browser click-edge fix: seven short Down presses visibly moved the article, a drag scrolled its text, a thumb drag moved the scrollbar, and the browser logged no warnings or errors. A quick physical press/release is latched for one update so the browser cannot miss it between VBlanks.

Not claimed: native Azahar frames,
wall-clock timing under load, HOME suspension behaviour, the Back control's
native state machine, or audio.

## Next

The coordinator should:

1. Complete browser inspection of all three articles at top, interior and end,
   plus held-key timing, release/inertia and groove press.
2. Capture the same scenarios natively in Azahar and compare them.
3. Convert `safe.bcsar` cues `0x1000012`/`0x1000013` through the audio pipeline,
   then trace the row tick's pitch and volume before playing them.
