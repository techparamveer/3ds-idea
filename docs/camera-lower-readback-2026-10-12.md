# Camera first-Resume pixel stability

## Change and result

Candidate `add6d447426d3be0a0180732c9eab5d76b563446` retains the generic
text-ink context requests from experimental `f43f640` and requests
`willReadFrequently:true` on the persistent stock lower context's first
acquisition. Upper and outer contexts, dimensions, lifetime, geometry,
sampling, assets, readback count and animation timing are unchanged.
The combined runtime change is three context requests in two files.

The fixed Camera first-Resume comparison now matches both LCDs exactly in
PNG bytes and decoded RGBA. Repeated Resume also matches exactly. The
predecessor differed at 225 lower pixels; the earlier integrated diagnostic
build differed at 252 upper and 623 lower pixels. This is browser closure,
not a native pixel or timing comparison. It does not establish a browser
backend cause. The reviewed bundle is integrated as
`7ff67b3b16a906563fd2c9088989467c4ee22807`. Runtime, public assets, tests and
build configs match the tested candidate. Clean integrated checks/build pass
with the known full-test failure below; human system.ts stays unstaged and unchanged.

## Production evidence

Private root:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/toprow-current-20261010/camera-lower-readback-v1/`.

Frozen build `MQkTKs-QA_SY68NcJ4PM1`, manifest `2786ef6e`, contains 2,840
hashed files. Root verifies them unchanged before and after the muted MacBook
run. Policy `f063b7c5` fixes six normal GUI windows and their comparisons
before capture. HOME, Manual, Close, Resume, repeated HOME and repeated Resume
save 227, 335, 338, 354, 308 and 392 pairs. Every stop follows visible readiness;
every export completes. Only the new tab and owned server are closed.

Fixed first baseline is `live-lcd-84b9773d-1d50-44da-af80-4170a6171859-0001`;
terminal Resume is `live-lcd-c56d1a11-ecf8-4bd9-91a6-bf2450d87b3b-0354`.
Fixed repeated baseline is `live-lcd-e3b9a3d2-4002-4cb4-a6a5-81fb5f7079c3-0001`;
terminal Resume is `live-lcd-abc1b640-e025-4e7c-a595-b27d3c2389c2-0392`.
Both comparisons use all pixels, with no mask, fit or endpoint reselection.

Closed audit `3491bd06`, manifest `b5a8cc84`, verifies 1,954 triples and
3,908 PNGs with no malformed or fully black LCDs. First Resume is baseline-exact
through 195..354; repeated Resume through 169..392. The nine compared text-draw
fingerprints agree, but fingerprints do not prove intermediate byte equality.
Source lower draw contexts report readback enabled; source upper and outer
contexts do not. These are distinct observations, not contradictory records.

Root inspects all 17 compact sheets and 86 LCD crops, attestation `6822ec96`.
Independent bounded review `fc6d91b2`, manifest `dc978be6`, recomputes the four
fixed endpoints and verifies all sheet crops. It approves the browser-closure
claim only, without rerunning the full corpus or approving native fidelity.

## Checks and remaining work

Worker checks pass 70 focused tests; independent source checks pass 81.
Full tests have 2,756 passes, one unchanged missing Camera date-group PNG
failure, 102 skips and one TODO. Standard and nonincremental typechecks and
production build pass. Source/freeze review is `46bfc5f9`. This is not a fully
passing test suite or evidence for a later integrated build.

Separate clean integration verification at 7ff67b3 repeats 70 focused passes,
2,756 full passes with the same one failure / 102 skips / one TODO, both passing
typechecks and a passing production build. All 2,617 scoped source/asset/test/config
files match candidate bytes and both Git commits with LFS-aware verification.
The new build is `OAnM8XeVOY2XnwhG0ctrc`, frozen under
`integrated-verification-v1/manifest.json`, SHA-256
`aa293c9ff25d4df33e732adae6b2f054dac96ae9e608664735713a3c1b6f9406`.
It contains 2,840 files / 154,336,563 bytes, including all 223 .next files.
It has not been served, browser-inspected or native-compared. Old builds stay frozen.

The context changes affect shared native text, including HOME/common firmware,
and stock lower rendering. Combined source review `5f740019` finds no code
issue and approves the tested bundle, conditional on the targeted lower guards.
Broader browser raster/performance behavior remains unverified.

Two historical native lower-screen guards have closed recordings under
`historical-guards-v1`, ledger `7de74d1d`. Settings Other page 1 saves 173 pairs;
unscrolled Health General saves 128. Both fixed sequence-1 lower screens have
zero pixels exceeding RGB delta 2, maximum delta 2, with empty masks and no fit.
Both lower PNGs also exactly match their historical browser-lower PNG hashes.
The full pairs fail: Settings upper has 1,857 pixels over threshold, maximum
delta 200; Health upper has 11,960, maximum delta 42. Root opens all four
native/browser/diff sheets. Settings shows a different clock/date; Health's
upper triangles have a different animated pose. No phase alignment is claimed.
Settings also has residual regions below the status strip. These observations
do not explain every upper difference, and neither full pair passes.
The historical PNGs and fixed comparison identities are recorded in private
`historical-regression-references.md` and `historical-guards-audit-v1/`.
Closed guard audit `65d6b9d7`, manifest `f533dbfc`, validates all 301 triples and
602 PNGs with zero errors, warnings or fully black LCDs. Every later lower PNG
and RGBA buffer matches its fixed baseline. Root inspection is `2b049060`.
The first single-shot attempt failed because the exporter required fixed
clock parameters. Policy v2 `7bf8a793` preceded all successful exports and
selected live-recording sequence 1, without forcing a clock or pose.
The broader stock regression checklist `6367bb6e` is not yet completed and does
not exhaust shared HOME text. The reviewer treats that as follow-up coverage,
not a new integration gate absent an observed regression. The two lower guards
meet the targeted condition; whole native comparisons still fail.

No firmware asset or audio changes are made. Existing read-only Camera,
fixture-photo/count and compositor adaptations remain. All four whole
animation flows remain fail/unproven. Native moving pixels, matched input,
cadence and muted audio remain open. The previous rejected experiment is
preserved in [its own record](camera-text-readback-2026-10-12.md).
