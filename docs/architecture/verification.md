# Verification and evidence architecture

No single layer proves the complete experience. Report each claim at the
strongest layer actually reached and keep adaptations and gaps visible.

| Layer | Typical evidence | Establishes | Does not establish |
| --- | --- | --- | --- |
| Unit/invariant | `npm test`, focused Node/Python tests | Reducer, format, lifecycle and model invariants | Browser integration or visual fidelity |
| Static/build | `npm run typecheck`, `npm run build` | Contracts and production bundling | Correct pixels, timing or cleanup |
| GPU/shader | `npm run check:shader`, GPU readback | WGSL validity and bounded generated output | Hardware material resemblance |
| Delivery audit | `scripts/firmware/audit.py`, independent compare | Hashes, closure, exclusions and reproducibility | Visible correctness |
| Real-resource render | `verify-stock-*.mjs`, `verify-native-system-ui.mjs` | Selected public resources render | Live behavior or native match |
| Browser scenario | Operated homepage plus capture/log | Integrated controls and visible state | Native equivalence beyond that scenario |
| Executed source fixture | Hash-pinned original code with recorded inputs/stubs | The exercised branch, ordering or arithmetic | A real title owner, visible frame or native/browser match unless actually linked |
| Matched native comparison | Native Azahar capture/waveform paired with a named browser or source render | Explicitly aligned region/state/timing fact for that pair | Other entry states, whole-title motion or strict 1:1 acceptance |

The firmware dump is the sole source for native visuals and audio. Delivery
claims require a manifest identity linked to dump title/region/resource for
every visible native element and cue. Do not promote hand/CSS graphics,
community fonts or guessed sounds as native. A native resource can be
source-identified, delivered and renderable while still unused or wrong in the
live scene.

Documentation-only work needs reference/link and diff checks, not a rebuild.
Code, asset, shader, configuration and conversion changes require the relevant
layers. Run the full suite when integrated changes cross subsystems.

## Browser and native scenarios

Exercise load/retry, intro, lid, resize/rotation; keyboard, model, accessible and
touch controls; HOME folders/density/pickup; launch, suspend/resume/switch/close;
power/boot/sleep; persistence and corrupt/unavailable storage; native pack
delay/failure/retry; reduced motion, mobile framing and baked fallback. State
exactly which app screens and transitions were operated. Empty Sound cannot
prove playback, and visible source artwork cannot prove native timing/state.

Use the isolated original-3DS EUR 10.7.0-32E Azahar profile, white theme and
English locale. Keep the coordinator's reference session exclusive. Record the
initial state, exact inputs, clock/date differences, capture resolution,
timestamps and hashes. Label phase fitting or executed fixtures explicitly. A native-to-source-render
comparison must say so; it is not a native-to-live-browser comparison. Record
synthetic owners, callbacks and service results beside a replay claim. A native
account/setup screen cannot validate a different welcome screen.

## Evidence and integration

Write new evidence beneath
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`.
Scripts accept absolute artifact paths. Raw firmware and executables stay private.
Each checkpoint identifies commit, scenario, commands/results, browser inspection,
native comparison, artifact paths and remaining differences. The
[progress matrix](../progress-2026-09-24.md) is the cross-system evidence index.
The [feature map](../feature-map.md) follows it with owners and next actions.

`captureScreensAt` forces an explicit presentation sample without advancing
host state. It is available in development and in a production build served on
loopback with `?lcdCapture=1`; see [browser LCD capture](../browser-lcd-capture.md).
It exports the 400×240 upper source canvas and 320×240 lower canvas as PNGs,
before the upper source is stretched to the 800×240 display texture.
`captureNativeBanner` remains development-only. A sampled pose does not prove
that live input reached it with native timing.

When inspecting a new production build on localhost, restart the running
`next start` process before reloading the browser tab. A process left running
across a rebuild served the preceding client bundle during the Notes
announcement check; restarting it exposed the new code. Record the build
commit actually loaded, not only the checkout HEAD.

Before edits or integration, inspect status, branch, worktrees and ancestry.
The current UI integration checkout is `/Users/paramveer/.codex/worktrees/3ds-ui-continuation`
on `codex/health-ui-scratch`; the original checkout uses a different Git object
database. The 24 September worktree table is historical. Follow the
[implementation process](implementation-process.md) for ownership, sequential
integration and current evidence handoff; preserve earlier branches/worktrees.
