# Portfolio power and opening UI

The [2 October reveal correction](home-power-reveal-2026-10-02.md) gives all
21 SceneIn poses slots within the unchanged browser reveal interval, making
pose 20 eligible before phase exit. Reduced motion paints changed poses instead
of waiting for the usual one-second screen cadence. Scene scheduling tracks
painted and actually rendered boot poses separately; a pending final/reduced
pose bypasses the throttled render gate. This is not a phase-completion hold or
native timing claim. Existing source provenance and timing adaptations remain.

The current UI-only scope includes power-on, power-off and app opening. The
live screen painter now loads the already-converted HOME `common` and `sleep`
resources along with its usual chrome. Power options use `Slp_U_00` and
`Slp_D_00`, with the English `lau_press_pow*` and `lau_b_shutdown` messages and
their decoded styles. This replaces the generic white Power Options dialog.
The Power upper message's source-scaled spacer lines are handled by the bounded
[newline-spacing adapter](home-power-message-spacing-2026-10-02.md); other
messages retain the existing text path.

The central lower-screen Power Off button starts a separate `shutdown` phase.
Inputs remain gated during that phase; the native Decide clip is followed by a
common `CmnFadeNinLogo` SceneOut, then the screens and power indicator switch
off. Sleep `Slp_*_SceneOut` (61-frame `P_Mask_00` fade) is still unused. Power-on
starts the existing boot phase and reveals HOME through the common SceneIn
fade. App opening first darkens the live HOME pixels with the 21-pose
`CmnFadeNinLogo_*` SceneOut, then plays the Nintendo logo SceneOutA/B/C
(60/30/15) over its terminal black; native captures show exact black before
the first logo pixel ([logo order](home-launch-logo-order-2026-10-03.md)).
Missing launch resources still use the 20-frame SceneOut fallback. See
[native logo provenance](native-app-launch-logo.md). The existing physical
console opening is preserved.

Power options close running software; HOME/B returns to HOME. The central touch
target uses the source `Slp_D_00/B_Btn_01` rectangle at `(66,166)` with size
`188x36`, centralized in `stock-screen-layout.ts`. The lower footer is a
non-interactive HOME-key hint. Native direct touch leaves it unchanged; the
same held-touch method activates Power Off. Physical HOME/B routing remains
available, but its exact native input cadence is not accepted. The separate
stock app keyboard is unregistered. HOME folder renaming no longer opens a keyboard.

`system-transitions.ts` explicitly owns browser durations. Source animations
provide the poses, but cold-boot latency, shutdown scheduling and app-loading
timing have not been measured against hardware. Reduced motion shortens the
wait and suppresses power-menu movement. These distinctions remain relevant to
visual acceptance; this checkpoint is not full firmware equivalence.

## Verification

Focused transition/state tests and type checking belong with this worker slice.
`scripts/verify-native-system-ui.mjs` renders the power/boot/launch LCD pairs,
byte-compares HOME fade SceneIn/Out/A/B/C integer frames against the original
renderer, checks that launch frame 0 keeps the HOME underlay, and checks opaque
black endpoints. Supply an absolute SSD output directory and Canvas module path.
The coordinator owns live browser and Azahar comparison.

Artifacts for the parallel launch compositing pass are under
`reference/system-ui-launch-parallel/` on the designated firmware SSD. Full
combined app verification follows coordinator integration.

## Original app-launch logo integration

The optional `home.launch` pack contains native NintendoLogo_U/D layouts and
SceneOutA/B/C poses. HOME common `CmnFadeNinLogo_*` SceneOut raises the uniform
black pane to opaque over frames 0..20. `appLaunchPose` plays those 21 poses
alone (350ms at nominal 60Hz), then the 105 logo frames (1750ms) over SceneOut
frame 20: 2100ms in total, C14 from 2083.3ms. The common A/B/C wrappers are no
longer drawn, because SceneOutA would restart the fade under the logo. This
schedule is an explicit browser choice from the clip lengths and captured
order; the B clip is looping in the resource and its actual hardware hold
depends on software loading.
Reduced motion holds the settled B15 logo over SceneOut frame 20 for the existing 120ms
launch phase. Cold boot reveals HOME through the common SceneIn fade without the app-launch
logo. Its 3000 ms phase and final 350 ms fade mapping remain browser choices;
see the [cold-boot source audit](native-cold-boot-reveal-source-audit.md).

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

The real-resource verifier compares upper/lower SceneIn, SceneOut and
SceneOutA/B/C integer frames byte for byte with the original renderer, plus 2×
LCD scaling. Fractional edges, partial parent opacity and changed geometry
explicitly decline the fast path. Partial parent opacity was found to round
differently and is not optimized. The same verifier also writes the transition
LCD checkpoints, including launch frame 0 over a HOME-coloured underlay.
Earlier 84-frame CPU timings are historical; re-run numbers live with the
expanded clip set. Artifacts: `reference/system-ui-launch-parallel/` on the
designated SSD.

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
