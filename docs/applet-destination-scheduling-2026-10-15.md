# Applet destination scheduling, 15 October 2026

Runtime `dcb6fb3` moves the five HOME top-row apps' first destination composition
behind an accepted opaque outgoing cover. The production recapture supports
that bounded scheduling correction. It does not establish smoother cadence or
native 1:1. All four whole animation flows remain fail/unproven.

## Identity and implementation

Root owns `/Users/paramveer/.codex/worktrees/applet-opening-cadence-20261015/3ds-idea`,
branch `codex/applet-opening-cadence-20261015`. Source commits are `5844aab` and
`dcb6fb3`; captured HEAD is `cdffbbe9a49079e0090f111ff8cd3f3986e57d74` and build
is `KlvHppEeEH9Xi0W9-2Eux`. The source/check/capture checkpoint through `c7c09ef`
is pushed to draft PR7. The preceding runtime `d4c7276` and its production build
remain frozen in the separate top-row checkout.

The [source handoff](workstream-handoffs/applet-opening-cadence-20261015.md)
records the defect and tests. Manual's existing scheduling guard now also
applies to Notes, Friends, Notifications, Browser and Miiverse. Acquisition
continues during cover motion. The current complete identity must have an
accepted opaque frame 20 before destination composition; the first cold draw stays
covered, with reveal eligible only on a subsequent prepared-pair paint.
Pending/revoked terminals do not qualify. Failure recovery, owner/generation
guards, incoming recovery and prepared-pair resource waits remain intact.

No animation clock, source pose, native curve, raster or delivered asset changed.
Native resource identities and provenance remain those in the
[previous top-row record](toprow-remaining-return-2026-10-15.md) and source
handoff. This is an explicit browser scheduling adaptation, not recovered
native caller order or reduced raster work.

## Checks

Ten new composition-order tests fail at `85e9fcc` and pass after the fix.
Final focused checks pass 208 tests. Independent source review of exact
`dcb6fb3` has no actionable findings and passes 199 focused tests. These use
existing Canvas/native-draw fixtures and do not establish pixels.
Full checks report 2,982 passes, one known missing historical Camera PNG
failure, 102 skips and one TODO. Build and nonincremental typecheck pass.
The initial failed LFS-pointer setup and verified local hydration remain in
the handoff. No shader/material change requires a new shader check.

Source review SHA-256:
`3a0c917523fb5721b9a106136040e2c8cbc3baaebc4c7e714fee1797cdb596dd`.
Final check manifest SHA-256:
`f4b7ddf1640fa8aee229e46678031a017f39d930f2987bf71595de929bcbedac`.

## Captured result

Private root:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/applet-opening-cadence/`.
`candidate-policy.md` predates input; `capture-closure.md` identifies every
window and final directory. `candidate-audit/run-1/report.json` contains exact
selectors, receipts, source values, gaps, costs and whole-LCD comparisons.

Root used muted Chromium 153 Guest on the MacBook built-in display and ordinary
touchscreen selection/Open controls. Actual stationary holds range from 441.9
to 525.6 ms for requested 500 ms holds. All 2,521 pairs saved before another input.
The first Friends window capped at 600 during context recovery after its ready
endpoint was observed. No retry replaced it; the remaining stops were manual.

| Opening | Pairs | Maximum overlay before frame 20, ms | Peak overlay at later frame 20, ms | Missing cover/incoming values |
| --- | ---: | ---: | ---: | --- |
| Friends first | 600 | 0 | 113.1 | 8 / 11 |
| Friends repeat | 207 | 0.1 | 119.0 | 6 / 11 |
| Browser first | 251 | 0.2 | 99.3 | 7 / 3 |
| Browser repeat | 147 | 0.1 | 93.8 | 5 / 2 |
| Miiverse first | 248 | 0.1 | 69.5 | 6 / 2 |
| Miiverse repeat | 171 | 0.1 | 27.0 | 6 / 4 |
| Notes first | 261 | 0.1 | 54.3 | 9 / not applicable |
| Notifications first | 299 | 0.1 | 148.8 | 10 / 15 |
| Browser Manual first | 337 | 0.1 | 84.3 | 3 / 0 |

The six comparable first/repeat Friends, Browser and Miiverse openings support
relocation from the moving cover to an accepted opaque cover. Notes,
Notifications and Manual have no comparable baseline windows in this audit.
All nine windows place the peak after a prior cover-frame-20 receipt and beneath
another frame 20; the first reveal or handoff follows afterward. Root separately
checked Friends repeat: the first frame 20 is sequence 27/receipt 4794, the
119 ms draw is sequence 28/receipt 4795, another frame 20 follows, then incoming
frame 0 appears at sequence 30.
The receipts do not expose individual native draw calls or asset-readiness
timestamps. The source guard and this measured overlay association support
the scheduling conclusion together.

All six fixed first-cover-frame-20 pairs match the earlier browser PNG bytes and
decoded RGBA exactly on both LCDs. All 24 later frame-20 pairs across the nine
candidate windows also match their own first frame 20 exactly. Masks are empty; no alignment, phase
search, recolouring or tolerance change was used. Root opened all nine boundary
sheets and the six-anchor baseline/candidate sheet. The audit verifies 168
native-size LCD placements; the comparison sheet adds 24 placements.

All 7,563 candidate originals, 1,876,826,465 bytes, and 4,932 baseline originals,
1,302,302,280 bytes, rehash unchanged. Saved sequence and render-return receipt
numbers are contiguous; recorder repeats and invalid counts are zero.
Report SHA-256:
`4fed891feb47ac8b7de6f71b1a126c0bab4215b9b4a496baa0d2e146c136c6d0`.
Run manifest SHA-256:
`92d5df21a62eae29fe5e91a8325990f371c47162c8602c26493520f1bea03e66`.

Independent capture review recomputes the selectors, stage metrics, missing
values, six fixed and 24 held comparisons, and all 192 native-size placements.
It also rehashes all originals and both frozen source/build sets, with no
actionable finding. The auditor exposes receipt gaps/repeats/invalid counts but
does not add every such field to its error list. The reviewer independently
asserted zero for those fields in this run; a future audit must do the same.
Review: `review/capture-review/review.md`, SHA-256
`b0483e13954640530c9e1a1ff62ec5b03e6afcab5a36a51f4d3f5e3df8df581d`.

Final document review found one overclaim in GOAL's description of the measured
draw; root adopted the reviewer's bounded replacement. No other factual issue
was found. Review: `review/final-docs-review/review.md`, SHA-256
`b91edb3e2165bd6effdc0a31282628a1cfabf38d111a0ddd46b945301f28bbcf`.

## Limits and next action

The comparable six openings have 71 missing source values, versus 44 in the
baseline. All nine have 108. Synchronous PNG encoding costs more in this run;
the runs are not a controlled performance benchmark. No overall cadence
improvement or source regression is inferred from those counts alone.
Friends incoming median paint remains 20/20.4 ms and Notifications is 34.8 ms.
The hidden first draw is relocated, not made cheaper. Render-return receipts
do not prove compositor acceptance. Notes has no separate boot-readiness trace;
its handoff still shows the boot cover. Manual has no explicit handoff
descriptor, so only descriptor-clear after incoming frame 20 is reported.

Root reopened four historical native Friends opening sheets for broad order.
They are lossy downscaled movie crops, not new raw native LCD comparisons.
No Azahar session accompanied this candidate. Native input epochs, moving
pixels, cadence and direct-footer equivalence remain open; audio was muted.
Existing selected-only return, simultaneous neighbour restoration, local
offline app behavior and portfolio Work content remain labelled adaptations.
The [scope](portfolio-ui-scope.md) and earlier evidence retain their differences.

Next isolate sustained Friends/Notifications incoming paint work and recorder
overhead before changing animation timing or collecting another broad run.
Preserve this build and both capture sets. Do not repeat the cold-composition
fix, phase-fit a native endpoint or promote the opaque regression match into
whole-flow acceptance. Any further source change needs a bounded hypothesis,
tests, independent review and a new visible comparison.

Root closed the owned Guest and server; the original New tab remains and port 3043
has no listener. All 2,425 candidate source/build files, 159,547,430 bytes, and
the separate human system.ts edit rehash unchanged. Weekly usage is 59% used,
41% remaining. Stop and pause at 10% remaining, without external notification.
