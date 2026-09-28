# Live folder and default banner integration

25 September update: `system-settings` now has a provisional, title-keyed
source-model primary through the same host clock, Frame and camera. Its
six-call gate and combined resource acknowledgement adapt the unimplemented
native title/presentation workers. Other application selections remain
unsupported. See [Settings activation](settings-home-banner-activation-gap.md).

The console now consumes the pure folder host/service/lifecycle through its
shared HOME update counter. Its native folder model no longer derives yaw or
clip phase from the renderer's elapsed time. Folder selection first requests
an instance, passes the source gate, and activates it only after current
resources are acknowledged. The host now also supports native default type7 and explicit clear type13.
Application-banner handoffs retain the explicit unsupported policy below.

## State and rendering ownership

`console-scene.ts` flushes the old MenuState clock and the host's retained inputs
before invoking a state reducer. It then observes new selection and gates at
that same boundary. Keyboard, physical/touch input, direct accessible launches,
rename edits, lid sleep and blur use this transaction. Runtime effect results
and acknowledgements call the optional `beforeMutation(now)` hook before
reading the state they change. This prevents a later event/readiness result
from being applied retroactively to earlier shared ticks.

Storage restore completes before host creation. Each scene allocates a fresh
host session; any future in-place System restore must allocate another. The
host allocates deterministic primary scopes within it and invalidates stale
tickets. Folder identities, active/pending labels and source motion remain in
the pure modules. The scene acknowledges successful model, camera and Frame status, plus a
prepared native label for folders. Default readiness requires all six actual
textures and explicit EUR skeletal/material clips; it never requests a label.
A caught loader promise is not readiness.

The screen renderer uses the active snapshot even while another folder or
default banner is requested. It does not paint the incoming folder while a request is pending
or the old instance is detached. A two-entry native label cache retains the
active and prepared label targets. Renames refresh only the matching active
identity after preparation, without resetting motion. Failure of an incoming label or renderer retains any active/outgoing host
snapshot. Once that instance is released, an explicitly unavailable pending
request uses the reconstructed fallback instead of waiting forever. Normal
resource loading stays pending without drawing the incoming fallback. Failed
requests revoke ready acknowledgements.

`firmware-banner.ts` samples `drawFrame`: actual visibility, scale, yaw and
independent skeletal/material frames. It preserves the inner authored bind
transform, uses BannerFolder playback at the requested frames and updates the
model at time0. No added opacity fade is used. Screens and diagnostic captures
never advance the service. Diagnostic captures report the sampled HOME count
and immutable banner view along with pixels.

## Explicit application policies and limits

The shared counter uses the existing provisional60Hz application cadence. HOME
power, phase, sleep, panel, dialog and preference eligibility gates it; these
are application policies, not a complete recovered native inhibition table.
Hidden browser tabs freeze/rebase the counter to avoid wall-time catch-up.
Reduced motion retains logical gate/activation updates but paints a stable
visible pose at scale1/yaw0/clip0. These are intentional accessibility and host
lifecycle adaptations.

All ordinary-folder resources preload before normal scene input. The host
therefore supplies no outstanding native worker and no native load inhibition;
it does not fabricate a measured worker delay. Source gate and later-pass
activation ordering still execute.

True vacant root/child slots now resolve to the native default primary. Folder,
default and explicit clear share one service scope, preserving outgoing motion
and immutable folder labels through hide/release/load. Adjacent vacancies reuse
the same active instance. Default uses its own 300-frame skeletal and60-frame
nonlooping material clocks, with the shared600-update yaw. The painter uses
`primary` and dispatches label-free default drawing through the same authored
Frame mask, native camera and alpha coverage transfer as folders.

Clear completion is supported in the pure host/service and has no primary or
resource ticket. The later counted-close integration now retains clear through
the actual restoration/readiness boundaries instead of returning immediately;
see [close integration](native-folder-close-integration.md). The ordinary
single-pass input/upper/lower/3D scheduler is still being connected through
[the phased host API](home-banner-ordered-pass.md).
Application selections still end the supported scope and report unsupported;
reentry creates a fresh scope. Native application loader states4/5 remain pending.
Background lifecycle is separate and still uses the earlier elapsed-time adapter;
its native epoch is not verified. These remain fidelity gaps.

Logical tick commits no longer force an additional LCD paint before the
existing render-quality cadence paints again. Input and phase changes still
paint immediately. Reduced-motion HOME paints only for visible state or
navigation changes; an unchanged settled pose does not repaint every tick.
Changing the reduced-motion preference repaints the new policy once.
A16-interval development trace improved from roughly
167–183ms per callback to a mixture of17–100ms after this duplicate was removed.
The browser reports ANGLE Metal on Apple M2. This short development trace is
not a production performance sign-off; slow rendering remains unresolved.

## Verification

The combined suite passed410tests including the independently checked music
engine; host/renderer/effect focused checks passed52. Type checking and the
production build passed with the final repaint correction and engine imported.
The two effect regressions cover acknowledgement and async capability-result
reads after the host mutation boundary. Renderer tests use actual models,
textures and camera with a recording GPU transport.

Real browser evidence in the SSD firmware artifact directory includes:

- `reference/browser-banner-readonly-capture.json`: requested times0 and50000ms
  yielded identical HOME count3219 and identical live banner state.
- `reference/browser-banner-replacement-records.json` and `-summary.json`: a
  real right input requested folder１ while retaining outgoing folder２, then
  activated folder１ as epoch2 with source scale0.899999976 before settling1.
  Browser frame sampling skipped intermediate native ticks; pure tests cover
  every gate/hide/activation step.
- `reference/browser-banner-sleep.json`: real Space/lid closure froze both the
  HOME count and complete banner view; Space reopened the device.
- `reference/browser-banner-reduced-motion.json`: a live preference change
  immediately changed the painted pose, which remained pixel-identical while
  the underlying shared count advanced3846→3863 over12 animation callbacks.
- `reference/browser-banner-shared-clock-top.png`, `browser-banner-raf-before.json`
  and `browser-banner-raf-after.json`: actual render and short cadence traces.

No browser error or framework overlay was reported in these checks. Native
Azahar animation epochs and all non-folder transitions still need matched
reference captures; this is not a whole-HOME fidelity claim.

## Default delivery and integration checks

The default model and six textures were independently regenerated from original
BannerDef_LZ.bin and registered as bannerDefault. Model payload equals the private
candidate except converter metadata; PNG bytes match exactly. Public model SHA256
is d0d771a36fe3cc054db94582bd6c7ebbec2d2c9eedbba9a09946c20e3488dfb6.
The shared runtime/renderer focused checks pass112 tests; the expanded renderer
checks independently pass65, using real model/texture delivery. Typecheck passes.
See native-default-banner-runtime.md for the executed original null-primary gate
and clear-to-default9-pass evidence. Browser/native comparison remains distinct
from those CPU contracts.

Live real-control checks are saved in reference/browser-native-owner-checks.json
and -summary.json. A root vacancy activated default epoch2; moving to a folder
activated folder epoch3; opening its empty child activated default epoch4.
Adjacent child vacancies retained request/activation4 while independent yaw and
skeletal clocks advanced. Material playback settled at frame60/status0. Sleep
froze HOME update7244 and wake retained the same instance. This establishes
actual host wiring. These were early captures: subsequent default-material and
counted-close validation notes record later corrections. They do not establish
current whole-HOME parity.
