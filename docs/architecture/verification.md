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
| Native comparison | Azahar capture, waveform or executed source fixture | Explicitly aligned region/state/timing fact | Whole-firmware or strict 1:1 acceptance |

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
timestamps and hashes. Label phase fitting or executed fixtures explicitly.

## Evidence and integration

Write new evidence beneath
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`.
Scripts accept absolute artifact paths. Raw firmware and executables stay private.
Each checkpoint identifies commit, scenario, commands/results, browser inspection,
native comparison, artifact paths and remaining differences. The
[progress matrix](../progress-2026-09-24.md) is the cross-system evidence index.
The [feature map](../feature-map.md) follows it with owners and next actions.

Development-only `captureScreensAt` and `captureNativeBanner` force explicit
presentation samples without advancing host state and are absent in production.
They prove a render pose, not that live input reached it with native timing.

Before edits or integration, inspect status, branch, worktrees and ancestry.
Never modify another worker's checkout. Integrate coherent commits sequentially
and run combined checks afterward. Preserve `uifix`, `codex/home-menu-assets`
and `codex/3ds-os`; integration is `codex/firmware-os-10-7`. The current
worker worktrees are listed in the [feature map](../feature-map.md#worktrees-on-24-september-2026).
