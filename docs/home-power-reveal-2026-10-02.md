# Power reveal and parallel close audit

Runtime: `72f73270`, `e96d25b6`, `2c992dd7`; tested tree `6066c315`.
This is partial L-01 delivery, not native scenario acceptance.

## Delivered

The power worker's `10b97058` was integrated as `72f73270`. The old reveal
mapper first selected source pose 20 at the same deadline that leaves boot.
All 21 poses now have a pre-deadline slot within the existing adapted timing.
Coordinator captures also showed reduced motion jumping from black to HOME:
the ordinary one-second paint cadence skipped its 120 ms reveal. Changed boot
poses now request a paint in reduced motion; pose 20 requests one in all modes.
Painted and actually rendered pose identities are separate. A state-driven
offscreen paint cannot falsely acknowledge GPU publication and close a throttled
render gate. A read-only helper reviewed this boundary and its regression test.

The [worker handoff](workstream-handoffs/home-power-reveal.md) records the exact
element -> manifest -> decrypted member mapping, hashes and converter versions:
HOME `0004003000009802` v24576, content 0 / `00000082`, `manifest.home.common`,
`romfs/common_LZ.bin`, paired `CmnFadeNinLogo_U/D_00` SceneIn resources.
No new native graphic, font, audio or startup logo was invented or published.

## Browser evidence

Internal artifact root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/close-power-native/`.
`summary-final.json` SHA-256:
`3f7633d4c7856395e4e222a384e1631d7b8403be6990a9dc88f2ee61e06d4233`.
It hashes scripts, logs, configs, captures and sheets. Earlier `before` and
`after` folders remain distinct; `final` is the reviewed runtime above.

Four actual production-browser routes perform Power -> Cancel -> Power -> Off
-> On -> HOME. Normal, reduced, constrained and mobile runs contain respectively
9, 9, 6 and 7 raw paired-LCD samples. Actual post-render diagnostics observe
source pose 20 in all four runs, at 2994.8, 299.8, 2995.4 and 2985.8 ms.
All four contact sheets were opened. The reduced-motion sheet now shows a fade,
where the baseline had only black and HOME. This is sampled behavior, not a
guarantee across stalls; raw PNG readback adds timing overhead.

Seven close regressions also complete: Health direct close, Work confirmed
close, Work -> About switch, reduced motion, mid-close lid pause/resume,
constrained and mobile. Their 98 motion pairs plus two settled captures retain
the terminal GPU publication in every route. All seven sheets were inspected.
The abrupt first close backing and stationary window/footer remain visible.
No browser page errors occurred. Desktop 1150x693 and mobile 390x740 images were
inspected, with nonblank RGB standard deviation above 56. Browser window
7054/PID 29000 was verified at 1876,440,1036x703 on Sidecar, CDP 9320; all audio
was muted. These app-handler inputs are not matched native input evidence.

Full checks: 1725 passed, 0 failed, 23 skipped, 1 TODO; typecheck and production
build passed. No shader/material code changed in this slice.

## Native and close gap

The second dedicated worker delivered source-only audit `7e95180a`, integrated
as `6066c315`. [Its handoff](workstream-handoffs/home-close-mask.md) explains
the captured AppQuit mask conflict: an adapted ClampToBorder mask binding is
rendered as ClampToEdge, and authored AppQuit UVs reach its transparent edge.
The original live texture descriptor during close remains unproven. No guessed
rebinding, mask substitution or runtime visual fix was made. A same-session
first-presented close frame or original ARM descriptor trace is the next gate;
do not repeat another unbounded source-only pass on this feature.

The primary isolated Azahar copy was attempted, not both copies this time.
Pinned executable SHA-256:
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`.
Main 7034 and modal 7035 were listed on Sidecar, but accessibility returned
`ax_window_unresolved` and screenshot observation failed. A process sample
shows `QDialog::exec`; the dialog contents were not observed, and no blind
input was sent. No native title launch, own PNG or new native diff was obtained.
SIGTERM did not stop PID 27172; scoped SIGKILL exited 137, then absence was
verified. Config before/after is byte-identical: Static input 2, Null output 1,
volume 0, all explicit non-default. No Spotify/system-audio setting changed.

Normal boot 3000/350 ms, reduced 300/120 ms, cold-entry/backlight/indicator timing,
source clip caller/completion ordering and exact native motion remain adapted
or unresolved. There is no terminal hold across host stalls. Close binding,
window/footer departure and existing HOME HUD/banner/layout residuals remain.
Portfolio content stays an adaptation. Audio is deliberately unverified under
the mute request. No matrix update, matched native pair, comparison mask or
whole-scenario pass was produced by this slice.

Both user-owned worker chats used separate worktrees and GPT-5.6 Sol/high,
then became idle after delivery. The coordinator alone used GUI. See the
[workstream registry](feature-map/workstreams.md); no service-tier change is
claimed, and earlier worktrees/profiles are preserved.
