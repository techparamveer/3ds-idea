# Live ordinary folder banner integration

The console now consumes the pure folder host/service/lifecycle through its
shared HOME update counter. Its native folder model no longer derives yaw or
clip phase from the renderer's elapsed time. Folder selection first requests
an instance, passes the source gate, and activates it only after current
resources are acknowledged. This is the ordinary folder slice; non-folder
handoffs still use the explicit unsupported policy below.

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
host allocates deterministic folder scopes within it and invalidates stale
tickets. Folder identities, active/pending labels and source motion remain in
the pure modules. The scene acknowledges only successful model/camera status
and a prepared native label; a caught loader promise is not readiness.

The screen renderer uses the active snapshot even while another folder is
requested. It does not paint the incoming folder while a request is pending
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

At app/blank selections, including a selected child in an opened folder, the
first host abandons its folder-only scope and reports unsupported. Reentry
starts a fresh scope. It does not guess a native target type or non-folder
hidden acknowledgement. The source [vacancy/unavailable mapping](native-banner-targets.md) is now
proven; its default-banner resources and full application loader stages still
need integration. Background lifecycle remains
separate and still uses the earlier elapsed-time adapter; its native epoch is
not verified by this integration. These are remaining fidelity gaps.

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
