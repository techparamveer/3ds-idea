# Preserved worker head triage — 25 September 2026

Base: UI integration `7ded538`. These ten named worktrees have older branch
heads, but **none contributes a new patch** to this base. `git cherry 7ded538
<head>` marks all 12 branch-only commits `-`; stable `git patch-id` matches
each one to the integrated commit shown below. A `-` means patch equivalence,
not that the branch commit itself is an ancestor. Keep the old worktrees intact;
do not cherry-pick these heads again.

| Preserved head | Patch-equivalent integrated commit(s) | What was integrated; evidence limit |
| --- | --- | --- |
| `camera-live-paging` `bf389ab` | `7159c38` | Original Camera renderer setup replay reaches the 64-record loop and readiness reset. [Generation audit](camera-scene-generation-source-audit.md): the real SceneBrowse replacement and live strip pixels remain open. |
| `camera-scene-replay` `f2abf76` | `0be49fd` | Extends that bounded replay through buffer binding. It still stops before complete control setup and final photo publication; no live paging change. |
| `eshop-native-compare` `e90c9da` | `2ae9b3c` | [Direct-launch record](native-eshop-direct-launch-2026-09-24.md) confirms the isolated native route settles on NNID information. It is not a matched native eShop welcome comparison. |
| `health-native-compare` `dea237f` | `44bd137` | [Health audit](native-health-settled-audit-2026-09-25.md) compares one settled source-rendered lower entry LCD to a real native crop (0.0249/255 RGB MAE). Article and moving upper LCD remain unverified. |
| `settings-banner-controller` `19ea85d` | `4fd5e4d`, `6c25686` | Hash-pinned controller-clock and initial-pose source replays. The [activation record](settings-home-banner-activation-gap.md) does not prove the first visible native pose or browser pixels. The later provisional runtime path is separate. |
| `settings-lower-residual` `36d0f84` | `12425da` | [Residual audit](settings-main-lower-native-comparison.md) localizes one settled source-render/native lower-screen error to text. It changes no UI and is not a live browser match. |
| `sound-bird-pose` `6b2ca42` | `1ba75b1` | Integrates a live settled bird-position adjustment and focused comparison. [Bird source note](sound-entry-bird-source.md) leaves idle animation ownership and timing open. |
| `type1-worker-completion` `8d6fd85` | `d72948c`, `25e5869` | Bounded HOME type-1 completion and Camera decode/retarget source replays. They do not establish a visible title banner or native/browser match; see [common delivery](stock-common-banner-delivery.md). |
| `stock-2d-banner` `2bc03af` | `cd6cb34` | [Selected-slot audit](stock-2d-banner-boundary.md) covers source artwork; the full common-model path is a separate later audit. This head publishes no live banner. |
| `settings-home-banner-visible` `c348ad5` | `b0be643` | Source and test audit of the earlier unsupported Settings gate. The later `f57ae44` provisional model path changed that gate, but production-browser inspection and matched native pixels were still blocked at `7ded538`; see [progress](progress-2026-09-24.md). |

This is ancestry and content triage, not a fresh test of those implementations.
The integrated progress record controls current acceptance claims. Historical
source fixtures, source renders, native captures and live browser checks remain
different evidence tiers. No runtime, asset or old worktree was changed here.
