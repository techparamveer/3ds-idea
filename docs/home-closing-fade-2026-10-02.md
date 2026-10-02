# Closing Dialog Exit - 2 October 2026

Runtime checkpoint `229e864c` in coordinator worktree
`/Users/paramveer/.codex/worktrees/3ds-home-fidelity-20261001`, branch
`codex/home-fidelity-20261001`. No whole-scenario or strict 1:1 pass.

## Source and Delivery

The decrypted EUR HOME title `0004003000009802`, version24576, content0/00000082
selects `Dlg_A_D_00` with donor `Dlg_A_D_02_FadeOut00`; the lower mask selects
`DlgMask_D_00_FadeOut00`. Both clips span local0..20. The dialog scales1..1.05
while alpha falls255..0; mask alpha130 reaches0 by15. These are decoded source
curves, not hand-authored graphics or guessed opacity. Full CIA-internal paths,
hashes, converter identities and bounded ARM call sites are in the
[source handoff](workstream-handoffs/home-closing-fade-owner.md).

Two dedicated worker chats/trees supplied source `e285cb59` -> `374ac94b` and
fit `1daac05c` -> `66992054`. A separate clock subagent supplied `92ab4123` ->
`1d52d671`. Coordinator wiring is `3530bec2`; review corrections `ce35a0fe` ->
`229e864c` freeze close advancement while native presentation is unavailable,
allow B/HOME recovery, and request endpoint publication after sleep/visibility
resumption. Missing selected resources fail explicitly and retain the owner.

Close now retains its owner through AppQuit20, exit0..20 and a separate terminal
publication barrier. Switch keeps its existing route. Reduced motion paints
source endpoints without bypassing ownership. Pure reducers, shared input,
existing HOME clock and paired LCD composition remain authoritative.

## Evidence Boundaries

Private artifact root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-closing-fade/`.

- Tested: full1765 pass,0fail,23skip,1TODO; typecheck and production build pass.
  No shader/material changes. Logs `test-final.log`, `typecheck-final.log`,
  `build-final.log`. Initial concurrent build/typecheck hit generated Next route
  types; the sequential post-build typecheck passed without a source workaround.
- Native capture:81 tracked own-PNGs in `native/sequence.json`; initial HOME at
  100%, subsequent sequence at5%. A capture gap missed the actual exit. A second
  attempt lost AX access during close and recovered after retirement; later HOME
  PNGs are not exit evidence. This run adds no native exit intermediate.
- Preserved normal-speed intermediate `_02.10.26_08.20.51.091.png`, SHA256
  `4dda7f4eb031869bbe771415c7c2636805aeb32fff4052315a268b5aa1438e3c`, remains
  the only usable exit intermediate. The fit report verified125 native hashes;
  top-four-row mask region is already byte-identical to unmasked HOME. Its
  text/surface projections are composited pixels, not literal pane alpha.
  [Fit limits](workstream-handoffs/home-closing-fade-fit.md).
- Browser-inspected: seven production routes,97 motion pairs plus two endpoints,
  99 total. Health, Work, switch, reduced motion, lid pause, constrained and
  mobile routes report no page errors. Both close terminal endpoints are
  acknowledged by actual WebGL rendering; switch has no added exit phase.
  All seven sheets, desktop/mobile screenshots and before/after native sheets
  were opened. Browser replay used the verified Sidecar window and mute.
- Native-compared diagnostic: `comparisons/report.json`, SHA256
  `5ca9e9eed394d58a23e5fd908f54e6dbd11ba20f71683d14517db72b5bed5579`, tracks
  named PNG hashes and an empty mask. Before `health-close-10` was settled
  AppQuit20 at `1fbfd6be`; after `health-close-10` is exit17 at `229e864c`.
  Lower pixels above2 decrease74948 ->58638; mean RGB51.984 ->18.735. Strict
  top-four-row mask probe improves1280 ->0. After pose was selected by minimum
  error across sampled exit poses, not an independently matched native epoch.
  Population, selected position, title panel, HUD and phase differ. Full pair
  remains fail; no exact timing or input claim. Earlier before metadata was
  corrected to the actual old3021 build, preserving source-HEAD-at-capture.

## Remaining Adaptations

Source selection is proven; the host start epoch, cadence, native APT wait and
retirement ordering are not. Mapping each clip sample to an eligible HOME update
and forcing browser publication are explicit host adaptations. The prior upper
fixed-edge panel fit remains an adaptation. Portfolio content, HOME population,
HUD epochs and earlier banner/retained-composition residuals remain non-native
or unverified. Audio is muted, not timing-verified. No private matrix update.

Native primary PID9621 was stopped with scoped SIGTERM after UI close left the
process running; absence was checked, not a clean exit0. HOME B66/touch mapping
and100% speed restored while stopped; static input2/Null output1/volume0 remain.
Secondary profile unused. Sidecar geometry changed externally; a stale-coordinate
window move briefly targeted the Dell and was corrected before subsequent input.
Do not describe this run as perfectly Sidecar-only. Spotify, system audio and
microphone settings were not changed. No new DeveloperStorage artifacts.
