# Opening receipt audit, 15 October 2026

The six saved Friends, Browser and Miiverse first/repeated openings contain
44 missing source values across eight cover/incoming stage records. They
occur in 35 jumps between consecutive saved sequences and consecutive
`receipt.frame` values. All 1,644 pairs have contiguous receipt numbers;
`recording.repeats` and `recording.invalid` are zero in every session.

The coordinator separately traced the scene counter to one increment after
each successful `renderer.render`, immediately before recorder observation.
Together these facts locate the missing poses between consecutive successful
render returns. They do not establish compositor presentation or the cause
of the elapsed intervals. No recorder export gap explains these 44 values.

## Ownership and identity

Worker checkout is
`/Users/paramveer/.codex/worktrees/applet-opening-cadence-20261015/3ds-idea`,
branch `codex/applet-opening-cadence-20261015`, clean base
`670804cba2b2b2376a541a186207dc576e0b241a`. Root's current STATUS owns the GUI,
source inspection and any subsequent experiment. This pass changed no
runtime, test, build, firmware, profile or original capture. The account check
reported 54% weekly used, 46% remaining. No notification was sent.

Captured runtime is `d4c72760f2c43b5a5231dde6b39b91bcbb32799c`; build is
`Tc7ZG3LaSUpILEb72xG1X`. The capture identity and earlier pixel audit remain in
the [top-row record](../toprow-remaining-return-2026-10-15.md).

Private derivative directory:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/applet-opening-cadence/`.
It contains `audit.mjs` and `report.json`. The full report preserves all
opening rows, exact timestamps, each skipped interval and every stage metric.

Input directory:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/toprow-remaining-candidate/`.
The auditor uses `browser-audit/selectors.json`, `session-discovery.json`,
`chronology.json`, `analysis-summary.json`, `report.md`, `manifest.json` and
`original-manifest.json`. Each session's final `capture.json` supplies its
complete `recording.sequence`; all corresponding individual capture JSON and
upper/lower PNG files are independently rehashed. The JSON records are also
checked against their recorded receipt and paint data.

All 4,932 referenced original files, 1,302,302,280 bytes, match the sealed
SHA-256, byte length and mtime before and after this audit. No image was decoded
or compared. The original manifest SHA-256 is
`36d191f80411a7ec81033e81066e28382617e9263c3e6a3ebab0b909ee45b9aa`;
the existing seal is
`7212df77d08a7744f60db474f95c3c853b9abe0e411179b29dd384aff088ec3b`.

Auditor SHA-256:
`2d59bad6843ffc4f925357a58278e59d34090b880ca93618b2ea3454602ee05e`.
Report SHA-256:
`1075fedc53ae1ba22b8c24920ce1b53fdafa51b9752284891af65038fc73e3b0`.

## Reproduction and result

```sh
node /Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/applet-opening-cadence/audit.mjs --input /Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/toprow-remaining-candidate --assert-complete
```

The command exits 1 for the existing source-pose gaps and prints their exact
patterns. Integrity errors exit 2. Without `--assert-complete`, a structurally
valid audit exits 0 while retaining the gaps in its report. Neither exit 0
nor complete saved pose coverage means native acceptance. `--out` accepts a
new report path inside the derivative directory and refuses existing files.

The executed command returned 1, with zero integrity errors, 44 missing values,
eight affected stages, 35 pose jumps and zero saved-sequence or receipt-number
gaps. A second complete run produced byte-identical `report-replay.json`.
All recordings stopped without an error, failure or remaining export.
Browser first-open stopped at its 600-pair cap after its opening; the other
five stopped by user action. These are six separate sessions.

| Session | Pairs | Receipt gap median/max ms | Capture gap median/max ms | Missing cover values | Missing incoming values |
| --- | ---: | --- | --- | --- | --- |
| Friends first | 298 | 49.9 / 137.9 | 49.9 / 138.1 | 2,3,4,11 | 1,2,4,7,9,12,14,16,19 |
| Friends repeat | 209 | 49.9 / 137.2 | 49.9 / 137.3 | 2,3,9,12,15 | 1,3,5,8,10,12,14,16,18 |
| Browser first | 600 | 49.9 / 83.2 | 49.9 / 83.2 | 1,4,9,11,18,19 | none |
| Browser repeat | 142 | 49.4 / 116.2 | 49.4 / 116.2 | 2,8,11 | none |
| Miiverse first | 253 | 49.8 / 84.2 | 49.8 / 84.2 | 2,9,15,16,17,18 | none |
| Miiverse repeat | 142 | 49.5 / 53.1 | 49.5 / 53.2 | 15,16 | none |

Session statistics include pre-input and settled app receipts. They are not
opening-stage frame rates. `capturedAt - receipt.at` is 0 to 0.4 ms over all
six sessions. This is measured delay before encoding, not total recorder cost.
Repeated source poses remain saved: Friends first cover18, Friends repeat
cover13 and cover16, and Browser repeat cover17. Zero `recording.repeats`
therefore does not mean every source pose was unique.

## Timing measurements

Each cell below is median / nearest-rank p95 / maximum, in milliseconds.
For stages with fewer than 20 samples, nearest-rank p95 equals the maximum.
Paint duration is `paint.at - paint.timing.startedAt`. Stock overlay time is
`paint.timing.overlayMs`, a subset of paint time. Encoding is the separately
recorded pair `overheadMs`; it excludes validation, deduplication and export.

| Session and stage | Samples | Paint duration | Stock overlay | Pair encoding |
| --- | ---: | --- | --- | --- |
| Friends first cover | 18 | 7.85 / 122.8 / 122.8 | 0.1 / 112.9 / 112.9 | 6.2 / 9.5 / 9.5 |
| Friends first incoming | 12 | 18.3 / 32.7 / 32.7 | 0.3 / 0.5 / 0.5 | 6.85 / 7.3 / 7.3 |
| Friends repeat cover | 18 | 7.8 / 122 / 122 | 0.05 / 114.2 / 114.2 | 7.55 / 9.4 / 9.4 |
| Friends repeat incoming | 12 | 19.75 / 25.8 / 25.8 | 0.5 / 0.7 / 0.7 | 6.75 / 9.1 / 9.1 |
| Browser first cover | 15 | 8 / 75.7 / 75.7 | 0 / 68.2 / 68.2 | 7.3 / 10.7 / 10.7 |
| Browser first incoming | 21 | 6.9 / 8.5 / 8.5 | 0.1 / 0.2 / 0.3 | 5.6 / 8.9 / 11.4 |
| Browser repeat cover | 19 | 7.7 / 105.8 / 105.8 | 0 / 97.4 / 97.4 | 6.8 / 11.4 / 11.4 |
| Browser repeat incoming | 21 | 7.4 / 8.1 / 9.4 | 0.1 / 0.2 / 0.7 | 5.4 / 7.8 / 8.3 |
| Miiverse first cover | 15 | 8.2 / 71.9 / 71.9 | 0 / 63.6 / 63.6 | 7.4 / 10.8 / 10.8 |
| Miiverse first incoming | 21 | 8.2 / 10.1 / 10.2 | 0 / 0.1 / 0.2 | 5.3 / 8.6 / 9.9 |
| Miiverse repeat cover | 19 | 7.3 / 35.3 / 35.3 | 0 / 27.9 / 27.9 | 6.8 / 9.2 / 9.2 |
| Miiverse repeat incoming | 21 | 8.1 / 9.1 / 9.6 | 0 / 0.1 / 0.2 | 5.6 / 8.5 / 9.5 |

Friends incoming has 12 samples in each run and 9 missing values in each.
Its same-stage receipt gaps have medians 28.3 and 30.9 ms. Browser and Miiverse
incoming each have 21 samples, no missing values and median receipt gaps from
16.45 to 16.55 ms. These are measured browser differences under recording.

The largest pose jump is Miiverse first cover14 to cover19, sequences 26 to 27,
receipt frames 9113 to 9114. Its receipt gap is only 17.6 ms, while the exported
`phaseElapsedMs` increases 83.3 ms. The preceding sequence 25 to 26 takes 84.2 ms;
sequence 26 paint takes 71.9 ms, including 63.6 ms stock overlay. Its encoding
takes 8.1 ms. Sequence 27 paint takes 8.1 ms and its encoding takes 7.4 ms.

Friends repeat sequences 29 to 30 advance cover14 to cover16 over 137.2 ms between
receipts. Sequence 30 paint takes 122 ms, including 114.2 ms stock overlay;
previous encoding takes 6.3 ms. The exported phase elapsed value advances only
16.6 ms there, then 133.4 ms at sequence 31, which repeats cover16 and arrives
17 ms later. Thus receipt intervals and phase elapsed increments cannot be
treated as interchangeable clocks or paired to the same jump by assumption.

## Limits and next evidence

The evidence distinguishes missing saved receipt numbers from jumps in the
painted transition descriptor. It records a stock-overlay spike in every
cover and higher sustained Friends incoming paint duration than the other
incoming stages. It does not identify the function responsible for that time,
separate scheduler delay from unrecorded work, measure all recorder overhead,
or provide a no-recorder control. `phaseElapsedMs` is software phase state,
not an opening-stage-local clock. The report preserves its raw values.

No timer or sampling change is justified by this audit alone. Root's next
bounded experiment can profile the actual paint path and separate the stock
overlay spike from sustained Friends incoming work. No second broad capture
or source-only pass is needed to rediscover these gaps.

This pass is metadata-tested and hash-verified. It is not a new browser
inspection, native comparison, pixel audit, motion acceptance or audio check.
The selected-only incoming/handoff behavior remains a fitted adaptation;
simultaneous neighbour restoration still differs from partial native loading.
Work and portfolio neighbours remain portfolio content. Existing native pixel,
input, cadence and muted-audio gaps remain open. All four whole flows remain
fail/unproven.

## Isolated composition candidate

After the audit, root authorized a bounded candidate on this worker branch.
The visible capture had destination stock-overlay work during the outgoing
cover. Source inspection confirms the graphics overlay composed the applet
before the painter restored the retained HOME pair and drew that cover.
This source fact establishes hidden composition independently of assigning a
cause to the measured gaps.

The candidate reuses Manual's accepted-cover scheduling boundary. Applet
destination composition requires the complete current identity and an accepted
cover20 without outgoing rebase. Pending or revoked cover20 cannot authorize
it. Retained incoming and handed-off owners, including the accessibility
shortcut, keep permission to compose their destination. The outgoing terminal
stays active while its first destination pair is cold. Incoming missing-pair
scheduling is unchanged. A prepared destination waiting only for title incoming
resources remains inactive, avoiding needless repaint while that resource loads.

The bounded native-destination flag covers Manual and the five existing applet
IDs. Resource acquisition continues. Explicit load failures still draw paired
recovery, and a loaded asset cannot masquerade as a published pair. The first
cold draw stays under cover20 because applet sampling already precedes the
overlay and reads the prepared pair at paint start. No clock, timer, frame
step, incoming raster, native asset, input routing or readiness guard was changed.

Failing-before command at `85e9fcc`, with only the new tests applied:

```sh
node --test --test-name-pattern='actual graphics defer destination|first cold destination' tests/applet-entry-live.test.mjs tests/stock-screen-preparation.test.mjs
```

All ten tests failed for early destination drawing. The actual graphics path
made five Notes, eight Friends, eleven Notifications and one Browser/Miiverse
native draw calls while composition was deferred. Each screens-painter case
also drew both destination LCDs at cover0. The same command passes all ten
after the correction. Logs are `candidate-red.log` and `candidate-green.log`
in the private derivative directory.

The expanded focused suite covers all five applets, current identity,
revoked/pending terminals, late assets, cold composition crossing host ticks,
incoming9 and incoming20 recovery, paired-copy failure, retry, disposal, Notes
boot gating, reduced motion, accessibility and the existing Manual behavior.
The real graphics tests use the real portfolio overlay, stock presentation
and native session. They retain the existing fake Canvas and selected native
draw callbacks; they are composition-order tests, not pixel acceptance.
The live screens tests use the real screens painter with the existing graphics
fixture. Its explicit cold-publication mode withholds current-owner pairs
until composition; the other historical cases retain their warm fixture.

Worker dependencies were copied with APFS clone semantics into independent
`node_modules`, and all three public LFS GLBs were hydrated from the local
cache. The initial full run found 37 additional failures from unhydrated model
reference pointers, one cold-terminal scheduling assertion and the known missing
historical Camera PNG. That failed attempt is preserved in
`candidate-full-tests.log` (3,038 tests: 2,896 pass, 39 fail, 102 skip, one todo).
The 38 model GLBs required by those tests were then materialized from the same
local cache and verified against their tracked LFS OIDs. No files were downloaded,
no source model was edited, and no tests were skipped to hide a failure. Exact
paths, sizes and verified OIDs are in `candidate-model-lfs-hydration.json` and
`candidate-public-lfs-hydration.json`. Root's dependencies and frozen build were
not modified.

The first source commit is `5844aab12b55ec8da4076dd5dc1c5fed1c6473f6`.
Review narrowed the terminal repaint addition to missing destination pairs in
`dcb6fb3b5c3bb79f6a9b98cc6eb8e8daa4b050fd`. The extended title test first failed
with an already-prepared pair waiting for incoming resources (11 pass, one fail
in `candidate-cold-pair-narrow-red.log`), then passed after that narrowing.
The exact final source passes all 208 focused tests with no skips:

```sh
node --test tests/applet-entry-*.test.mjs tests/applet-title-entry-presentation.test.mjs tests/stock-screen-preparation.test.mjs tests/manual-entry-*.test.mjs
```

The log is `candidate-cold-pair-focused.log`. `npm run build` passes at the final
source with build ID `KlvHppEeEH9Xi0W9-2Eux` (`candidate-final-build.log`).
The post-build `npm run typecheck -- --incremental false` also passes
(`candidate-final-postbuild-typecheck.log`). Final `npm test` exits 1 with
3,086 tests: 2,982 pass, one fail, 102 skip and one todo. Its only failure is
the unchanged `tests/camera-date-group.test.mjs:44` historical PNG dependency:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-3d-badge-sdmc-recapture-20261005/browser/lower.png`.
The final log is `candidate-final-full-tests.log`, SHA-256
`8a3a2e3f19504b2386ec6be23976a2565aec7603cef98d7db66b74e451efc059`.
`candidate-final-checks.json` records the source/build identity, command exits,
counts, log hashes and hydration-manifest hashes. No shader/material change
was made. Handoff relative links and `git diff --check` pass.

This remains a browser scheduling adaptation. It relocates cold work behind
an accepted opaque cover; it does not reduce that work or establish native
duration. No server or GUI was started. Root's independent review and live
recapture must precede runtime integration. All four whole flows remain
fail/unproven.

On delivery of this final handoff, the worker relinquishes this checkout's
source, tests, build and worktree ownership to root. The build is no longer
available for worker mutation. Any subsequent worker assignment is private
capture analysis only, without source/build/server/GUI access. The previous
root runtime `d4c7276` and build `Tc7ZG3LaSUpILEb72xG1X` remain untouched.
