# App Launch Publication

Runtime `27a85a4a` integrates reviewed worker `03de6c52`; test-only follow-up
`60ecf08f` updates the existing LCD capture reset assertions. This is a bounded
presentation robustness correction, not native launch timing or whole 1:1.

## Defect and Delivery

The production baseline, with an explicit 2100ms main-thread stall after its
first launch paint, jumped from A0 directly to the app phase without a launch
terminal receipt. Its first app loading pair was already black, identical to
the corrected terminal pair: this is not a demonstrated pixel improvement.
The normal baseline already painted the black C14 endpoint. An initial C15 hypothesis was rejected:
the existing 60/30/15 schedule uses A0..59, B0..29 and C0..14.

Launch now requires a successful paired native terminal paint and an awake,
visible outer render before a later callback can enter the app. Identity covers
the launch timestamp, app, active application owner and WebGL context generation.
Hidden, sleeping, closed-lid and lost-context states cannot publish a receipt.
The normal pose clamps at C14; reduced motion retains the existing B15 adaptation.
The browser's 1750ms normal and 120ms reduced clocks are unchanged adaptations.

Failed/partial launch overlays use paired recovery. Destination native-screen
loading/error remains authoritative after successful overlay painting, preserving
B/HOME recovery. The optional absent-logo common-fade fallback is unchanged;
an unsupported selected resource remains an explicit failure. No assets, shader,
native sounds, firmware files or private scenario-matrix entries changed.

## Source Binding

Converter `ctr-native-web` 1.2.0 / CTRTool 1.3.0. HOME title
`0004003000009802` v24576, content index0 / `00000082`; common archive SHA-256
`543fbf31b7ca5c44580075c0632f2d99d6e88843cd85f801fb9ada1da5ec2af8`.
Manifest `home.common` selects `packs/home/common.json`. Internal paths below
are relative to HOME RomFS; the pack's resourceSources maps every member.

| Element / member | CIA-internal path | SHA-256 |
| --- | --- | --- |
| Upper fade `CmnFadeNinLogo_U_00` | `common_LZ.bin/blyt/CmnFadeNinLogo_U_00.bclyt` | `4fa249b4622c382f56cee46d431c73922dc1dfce3985219eb81d27fa02a216e4` |
| Lower fade `CmnFadeNinLogo_D_00` | `common_LZ.bin/blyt/CmnFadeNinLogo_D_00.bclyt` | `85066557c7a3e7605d01d853673ca4ea4f64abdc7a455c4aaaf2d34d63ad2d6b` |
| Paired SceneOutC | `common_LZ.bin/anim/CmnFadeNinLogo_{U,D}_00_SceneOutC.bclan` | `bb9882ed566fe60074b2adb3cc5ca48e696ac037bab60d7ea13c0f6b461785fe` |

Manifest `home.launch` selects `packs/launch/logo.json`, sourced from Sound
`0004001000022500` v3088, content index0 / `0000000b`, `ExeFS/logo.bin` SHA-256
`2a98c49d919e254e15dc213cab47a800ed63b248dcd43119e8fb82d9e62ae51c`.
Its complete member/texture provenance and source interpretation remain in
[the launch-logo record](native-app-launch-logo.md). Existing source graphics
are reused; decoded poses do not establish native scheduling.

## Verification

Full suite: 1973 pass, 0 fail, 23 skip, 1 TODO. Production build and sequential
typecheck pass. Independent exact-worker-commit review has no remaining findings.
The initial full run exposed two stale regex assertions in one LCD capture test;
the test-only follow-up fixes them and the full suite was rerun successfully.

Private artifact root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-launch-motion-20261003/`.
Logs: `tests-integration-first.log`, `tests-integration-final.log`, `build.log`,
`typecheck.log`. Final collector `browser-launch-v5.mjs` SHA-256
`881f0c74183601b229b3b739b32d67b2391795320bec3e286841ba45b812b1ca`.

Accepted before runs at `15630913`: `before-v5-desktop` 61 raw pairs,
`before-v5-stall` 19 and `before-v5-reduced-stall` 19. Capture and separate cleanup
records complete with errors[], mute and restored layout/folder arrays.
The corrected normal/stall runs at `60ecf08f` have 60/21 pairs. Normal C14 is
preserved; the corrected stall has A0 at0.7ms and C14 at2132.9ms before the app.
These host elapsed times are diagnostics, not native time measurements.
After mobile/reduced/reduced-stall have59/20/19 pairs, complete cleanup and no
page errors. Reduced-stall is unchanged because adapted B15 was already
presented. The coordinator independently checked all nine accepted run records,
355 raw pairs at400x240/320x240, mute, chronological receipts and restored
layout/folder arrays. Desktop/narrow/reduced viewports and paired endpoints were
opened. No physical-device mobile or native timing equivalence is claimed.

`after-context` has77 of those pairs. Actual WebGL loss occurred at9416.3ms,
restoration at11525.3ms with a live context, terminal launch presentation frame689
at12604.7ms (paint elapsed2143.9ms), then first app frame690 at12689.9ms.
Lost-context paints are not presentation evidence. The actual extension-based
fault is a browser-only robustness test, not a native input counterpart.
Collector `browser-launch-context.mjs` SHA-256
`1c22cd7e8fcc81b2247137055ac2f97d276e376b819d41398e236b906ca2bc1a`.

`power-regression-v2` adds four actual-keyboard Power/Cancel/Off/restart pairs,
errors[] and mute. The first power-regression attempt used a wrong root HOME
readiness predicate before any input/capture and is excluded. Existing Health
HOME/Close footer and folder Back are exercised by every accepted cleanup.

V1-v3 failed fixture setup before capture and are excluded. V4's 59 captured
pairs are diagnostic only: cleanup used folder Back instead of software Close.
The first v5 recovery also stopped at a root close dialog. Coordinator confirmed
through actual Enter and restored folder density2/Back before accepted reruns.
Final cleanup uses the proven selected-Health software-Close footer.

The silent isolated native replay uses original/EUR/English, Static input2,
Null output1, volume0 and a diagnostic 5% speed. Its own PNGs are in sibling
`native-home-launch-motion-20261003/screenshots/home-launch-motion-20261003/`.
Prelaunch Health, Nintendo logo and Health main were observed. The gap between
`_03.10.26_08.56.26.864.png` and `_03.10.26_08.56.45.081.png` misses the logo exit,
black endpoint and first reveal. Do not infer them from the captured endpoints.
Exact isolated PID66870 exited0 and is absent; default Azahar/system audio and
Spotify were not changed.
Dedicated browser PID60222 also exited0 and is absent. The rebuilt local
production preview remains on port3021 and returns HTTP200.

## Comparison Audit

The coordinator independently recomputes740 metrics and verifies961 SHA-256
records. Of48 individual whole-LCD diagnostics,38 fail and10 lower LCDs meet
delta2; all24 paired comparisons fail. These are unmatched-input/epoch semantic
diagnostics, not timing-aligned acceptance. Six reduced-logo lower comparisons
are exact, and four initial Health-main lower comparisons have maximum delta2.
No upper LCD comparison meets delta2. Normal terminal and the stalled
before-first-app/after-terminal pairs are exact black controls, not an improvement.

The initial report incorrectly labelled all48 LCD diagnostics failures and its
sequence sheet used filesystem frame order. Both reporting defects are retained
under `comparison/prior-report-excluded-01-scrambled-sequence-and-cross-count/`;
neither changes capture data or runtime. Final sheets require chronological
frame order and distinct individual-LCD versus paired-scenario counts.
The corrected endpoint and chronological sequence sheets were opened, and all
961 records/740 metrics were independently reverified after regeneration.

Final `R/comparison/` identities:

- `report.json`: `0c5b8ae237750258fa88d16a73013beae3f79f958ab9d7f304e2a272448cc1ab`
- `sheet.png`: `e3cdd21b6656c78eeed863b757f1b3108d5e4f4f82dd06b8ac913d3f5cc07ab1`
- `manifest.json`: `c757311ea0c27c825d3b71e9fd6c9369ceec9f6adb64c3d6b67b1f4310663016`

`R/coordinator-verify.mjs` independently hashes every record and recomputes
RGB metrics with Sharp, separately from the comparator's Python/Pillow code.

Native folder13 versus browser folder19 and native A versus browser Open touch
are explicit fixture/input differences. Chronological source-pose comparisons
must use empty whole-LCD masks, delta2 and no epoch fitting. Exact launch onset,
native cadence, full pixels, input/cues/audio and per-title scheduling remain
open. This is the bounded source/robustness slice; the next launch slice must
target a captured native visual difference, not another source-only audit.
Reduced motion, browser host durations and other documented portfolio
adaptations remain non-native. Whole-scenario acceptance is not upgraded.
