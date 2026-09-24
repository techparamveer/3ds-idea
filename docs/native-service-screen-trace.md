# Nintendo Zone and eShop screen trace — 24 September

This trace checks the service gaps listed in
[stock screen presentation](stock-screen-presentation.md) against the published
source layouts under `public/os/firmware/10.7.0-32E/packs/`. Pane coordinates
are CLYT values: the origin is at the screen centre and +y points up.

## Viewport placement

| Screen | Source evidence | Result |
| --- | --- | --- |
| Lower HTML | `bottommenu_l/B_HtmlArea`: bounding pane, origin 0 (top-left), translation (−160, 120), size 320 × 211 | The web area starts at screen (0, 0). The offline and no-content bitmaps are painted there unscaled. |
| Lower footer | `N_main_UI` (−3, −78) + `N_Btn_return` (−105, −42), origin 7 (bottom-centre), 108 × 28 | Occupies y 212–239. Back spans x −2…106, matching the `0,212,106,28` touch target. |
| Upper HUD | `Hud_00/N_Base_00` origin 0 at y 148 (screen −28). `Hud_00_Bar_Appear` frame 15 settles y at 120. `WHITE_00` is 400 × 20; `P_Base_00` is 400 × 28 | At frame 15 the bar spans y 0–19. The base extends 8 px over the page below it. |
| Upper page | `U_top` canvas 400 × 220; `info_top` MPO frame 400 × 220 | Both are drawn at y 20, directly beneath the 20 px bar. |

The source bounding pane is 211 rows tall, but both HTML bitmaps are 212 rows.
Their final row, y 211, is adjacent to the 212 px footer. The executable
determines whether the browser view uses the pane height or a fixed 212 rows.
The painter therefore does not clip that row. Only the top-left placement is
source-proven.

## HUD status icons, corrected

The service previously bound only `Hud_00_Bar_Appear`. `P_Bat_00` and
`P_NetAtn_00` therefore kept their material defaults. Map 0 selected
`HudBat_00` for battery, with a single red segment, and `HudNetAtnInt_00` for
signal. The source status clips bind by group, and each target has map 0:

| Clip / group | Frames → texture (clip texture list) |
| --- | --- |
| `Hud_00_Battery` / `Grp_Bat` → `P_Bat_00` | 0–6 → `HudBat_00`…`HudBat_06` (step) |
| `Hud_00_Signal` / `Grp_NetAtn` → `P_NetAtn_00` | 0–3 → `HudNetAtnInt_00`…`03`, 4 → `HudNetAtnOn_00`, 5 → `HudNetAtnOff_00` |

At native size, the delivered textures show one red segment in `HudBat_00` and
increasing blue fill through `HudBat_03`, which is fully blue. `HudBat_04`–`06`
are the orange/plug variants. `Hud_00_Charge_anim` alternates `HudBat_04` and
`05`. `HudNetAtnOff_00` is the crossed antenna box. The service now binds
`Hud_00_Battery` at frame 3 and `Hud_00_Signal` at frame 5
(`zoneHudBindings` in `src/os/stock-native-services.ts`).

- Frame 3 shows a full battery that is not charging. The physical model's power
  LED is solid blue, which the manual assigns to sufficient charge
  ([power indicator](source-power-indicator-validation.md)). The previous red
  low-battery icon contradicted that LED.
- HOME reports wireless as `Disabled`
  ([presentation validation](firmware-presentation-validation.md)).
  `HudNetAtnOff_00` is the matching Zone icon. The previous signal-bars icon
  implied a live connection.

No pack, texture or converter change was needed: both clips and all 14 of their
textures are already in `layout-nwcx.json`. The loader fetches only textures
referenced by requested clips, so the request now names both.
`scripts/verify-native-services.mjs` poses `Hud_00` with the exported bindings.
It asserts that map 0 resolves to `HudBat_03.bclim` and
`HudNetAtnOff_00.bclim`, and that the bar top is at y 0.

The source defines only these icon states. Choosing full battery and wireless
off is a documented portfolio device state, not a live hardware reading.

## `P_Bat_00` projection diagnostic

The renderer reports `Unverified 3D pane projection: Hud_00/P_Bat_00` because the
pane's rotation is [360, 0, 360]. It rotates by −360° and scales y by
cos 360° = 1, with zero depth. No bound clip animates that rotation, so the
flattened output equals the source transform. This is not a visual gap. The
verifier checks whole-turn rotation and zero depth and records it under
`identityProjection`. The shared renderer diagnostic is left unchanged.

## Remaining dependencies

- **`U_top` 3D banner.** 38 panes have depth, from z −580 to +85.36.
  `BG_grid` is a 800 × 300 ground plane rotated −80° about X. The 800-frame
  `U_top_Loop_anim` includes 37 `translation.z` tracks. The design therefore
  requires a perspective projection. The canvas renderer discards z and
  approximates X rotation as a cos(θ) y-scale. As a result, the objects share
  one orthographic baseline at y −150, below the 220 px canvas, and the grid
  collapses to a ~52 px strip. Correcting this requires the Nintendo Zone
  executable's projection and camera values (fovy, near/far, eye distance) or
  a matched Azahar capture, plus a projective warp for rotated pictures in the
  shared renderer. No perspective values were guessed.
- **HUD clock.** `T_TimeL_00`, `T_TimeC_00` and `T_TimeR_00` use the delivered
  title font `Hud.bcfnt`, which includes 0–9 and `:`. `Hud_00_time_Blinking` is
  a 119-frame loop whose colon is visible on frames 0–59. Stock frames are
  cached by `[owner, view, revision]`, so a value painted here would freeze at
  launch. The clock stays blank until the presentation owner adds a
  clock-driven repaint key. `stock-screen-presentation.ts` is outside this
  task's scope.
- **HUD title.** Source `T_Title_00` is empty. The runtime source of the
  service's `Nintendo Zone` text is unverified.
- **Footer mode.** Hiding Menu and Save leaves x 106–320 of the footer strip
  on the white fill. The executable's offline footer mode is untraced.

## eShop welcome

The trace found no new settled-frame mismatch. `welcome_U_00_in_00` has 11
frames and is bound at frame 10. `welcome_U_00_balloonIn_00` has 59 frames and
is bound at frame 58. Their shared face and mouth tracks settle to the same
values. `BG_U_00_inOut_00` and `BG_D_00_inOut_00` hold `N_root_00` alpha at 255
on frame 0, so the unbound backgrounds already show the entered state.
`welcome_U_00_wait_00` is an idle loop; source timing remains a reference
dependency.

## Verification status

This session could read the repository and published packs, but code execution
and the SSD artifact root required approvals that were unavailable. The
following have **not yet run**: the render verifier, the new env-gated test
`tests/native-services-render.test.mjs`, typecheck, build, and native-resolution
before/after renders. Run them with:

```sh
node scripts/verify-native-services.mjs \
  --artifact-dir <SSD>/reference/claude-services/after \
  --asset-root "$PWD/public/os/firmware/10.7.0-32E" \
  --canvas-module "$PWD/node_modules/@napi-rs/canvas/index.js"
NATIVE_SERVICES_ARTIFACT_DIR=<SSD>/reference/claude-services \
  NATIVE_CANVAS_MODULE="$PWD/node_modules/@napi-rs/canvas/index.js" \
  node --test tests/native-services-render.test.mjs
```

Inspect the `nintendo-zone-*-top.png` HUD at x 0–24 and 368–400 against the
previous `reference/service-ui` pair before accepting the change.
