# Portfolio power and opening UI

The current UI-only scope includes power-on, power-off and app opening. The
live screen painter now loads the already-converted HOME `common` and `sleep`
resources along with its usual chrome. Power options use `Slp_U_00` and
`Slp_D_00`, with the English `lau_press_pow*` and `lau_b_shutdown` messages and
their decoded styles. This replaces the generic white Power Options dialog.

The central lower-screen Power Off button starts a separate `shutdown` phase.
Inputs remain gated during that phase; the native Decide clip is followed by a
common black fade, then the screens and power indicator switch off. Power-on
starts the existing boot phase and reveals HOME through the common SceneIn
fade. App opening uses the common SceneOut fade instead of the generic title
card when native resources are ready, followed by the original two-screen
Nintendo logo layer extracted from Sound's ExeFS. See
[native logo provenance](native-app-launch-logo.md). The existing physical
console opening is preserved.

Power options close running software; HOME/B returns to HOME. The central touch
target matches the source button's displayed rectangle; the lower footer
returns to HOME. The separate stock app keyboard is unregistered. HOME folder renaming no longer opens a keyboard.

`system-transitions.ts` explicitly owns browser durations. Source animations
provide the poses, but cold-boot latency, shutdown scheduling and app-loading
timing have not been measured against hardware. Reduced motion shortens the
wait and suppresses power-menu movement. These distinctions remain relevant to
visual acceptance; this checkpoint is not full firmware equivalence.

## Verification

-25 menu, portfolio lifecycle and shared stock-target tests pass.
-Type checking passes.
-`scripts/verify-native-system-ui.mjs` renders16 upper/lower native-resource
  checkpoints, checks opaque black endpoints and reports no renderer diagnostics.
  Supply an absolute SSD output directory and Canvas module path.
-The actual in-app browser was reloaded at `http://localhost:3000/`. The native
  power screen was visually inspected on the console model. A/Enter reached
  off, the Power control restarted boot, boot reached HOME, and Open Work reached
  the existing portfolio content. Frame timing was not captured by those checks.

Artifacts are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/system-ui/`;
state-test output is `reference/system-ui-state-tests.log`. Full combined app
verification follows the gallery/music and stock-screen integration.

## Original app-launch logo integration

The optional `home.launch` pack contains native NintendoLogo_U/D layouts and
SceneOutA/B/C poses. The browser adapter plays a20-frame HOME fade followed by
60/30/15 source frames at nominal60Hz, with a2100ms total phase. This schedule is
an explicit browser choice; the B clip is looping in the resource and its actual
hardware hold depends on software loading. Reduced motion holds a settled logo
for the existing120ms launch phase. Cold boot still opens HOME directly.

The source logo was visually inspected in24 native-resolution transition renders
under `reference/system-ui-logo`, with no renderer diagnostics and verified
black endpoints. It replaces the earlier missing logo layer.38 focused state and
transition tests pass. Live animation cadence still needs a matched reference
recording; these checks do not establish hardware timing.

The timed CPU reference pass records roughly200–244ms for representative logo
frames and a1405ms first power-menu paint on this host. These are software-canvas
measurements, not browser frame-rate numbers, but show a remaining transition
rendering cost. Static stock screens cache completed images; animated logo
rasterization still needs a performance pass before smooth-motion acceptance.
Timings are stored with each checkpoint in `reference/system-ui-logo-timed`.


## Uniform common fade fast path

`native-system-fade.ts` evaluates the original common layout pose and material
once for its uniform full-screen pane. It uses the resulting quantized colour in
a Canvas fill. The regular renderer remains responsible for textures, extra
panes, altered geometry, fractional edges, and inherited partial opacity. Source
animation interpolation and frame scheduling are unchanged.

The real-resource verifier compares all 84 upper/lower SceneIn/SceneOut integer
frames byte for byte with the original renderer, plus 2× LCD scaling. Fractional
edges, partial parent opacity and changed geometry explicitly decline the fast
path. Partial parent opacity was found to round differently and is not optimized.
The same verifier also passes 24 complete transition LCD checkpoints. Recorded
aggregate CPU time for the 84 comparison frames was 226ms for the original path
and 5.4ms for the uniform fill on this host; this is not a browser FPS claim and
does not resolve the separate logo/material rasterization costs.
Artifacts: `reference/system-ui-fast-fade/` on the designated SSD.

### Live accessibility correction, 2026-09-24

During browser verification the visible Close software? confirmation left the
live announcement on HOME. Scene announcements now prioritize sleep and
software-close/switch dialogs, and describe power options, powered-off state,
boot, shutdown and launch in words instead of internal phase identifiers.
This changes the hidden accessibility text only, preserving original LCD text.

After type checking and a production build, the reloaded browser was verified:
Work opened, HOME suspended it, opening Settings announced “Close software?
A to close and open the selected software. B to cancel.” B cancelled; P
announced the power controls; B returned to HOME. Build logs are in
reference/browser-announcement-{typecheck,build}.log under the firmware SSD
artifact root. Earlier in this same live pass, the Power Off touchscreen
control produced black LCDs and P completed boot back to HOME.
