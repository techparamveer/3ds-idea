# Applet incoming paint cost

## Change and checks

Diagnostic `ce402ace24b41b33654270f5310c9025a52eb907` adds optional pre-overlay
and title-incoming intervals to the existing measured-paint receipt. Disabled
mode adds no clock reads. It does not change animation clocks, source poses,
resources, draw order, input, publication guards or recording behavior.

The independent source review has no actionable findings and reproduces the
new test's failure on the base. Focused checks pass 88 tests. Full checks have
2,983 passes, the unchanged missing historical Camera PNG failure, 102 skips
and one TODO. Nonincremental typecheck and production build pass. The exact
build is `xzX--oY_BchQrfOIYENUa`; capture HEAD is `5e51e22`.

## Live measurement

Root used a muted Chromium 153 Guest on the built-in MacBook. First Friends
and Notifications openings used normal toolbar selection and a requested
500 ms Open hold. All 253 and 209 raw paired LCD frames saved. Both windows
stopped by user input after their ready endpoint, without a retry or cap.
The owned Guest/server are closed; the original New tab remains.

| Incoming receipt interval | Friends median ms | Notifications median ms |
| --- | ---: | ---: |
| Whole paint | 20.5 | 25.3 |
| Pre-overlay | 1.4 | 2.5 |
| Stock overlay | 0.4 | 0.6 |
| Title incoming drawing | 17.8 | 21.8 |
| Unassigned remainder | 0.4 | 0.7 |
| Pair encoding, outside paint | 9.3 | 9.8 |

These intervals come from the same receipts, with no overlapping remainder.
They identify title-owned incoming drawing as the dominant measured paint
interval. Medians are not additive. Encoding can perturb scheduling; this
run does not establish unrecorded cadence or native timing. Recorded coverage
misses 10 Friends and 12 Notifications source values. The explicit all-pose
assertion remains red. Timings alone do not verify image integrity or equality.

## Saved-image audit

The sealed audit verifies all 462 pairs and 1,386 original files, 288,426,176
bytes, including metadata, embedded PNG data and receipt chronology. Root also
checks every chunk CRC and fully decodes all 924 PNGs at native dimensions with
opaque RGBA output. All originals and 24 sealed derivatives rehash unchanged.
The measured stationary Open holds are 513.3 ms and 508.1 ms.

The first opaque pair and each first shared incoming source value produce
13 logical comparisons, 26 whole LCDs, with empty masks and no alignment or
nearest search. Both opaque pairs are exact on both LCDs. All eight shared
Friends incoming values are exact on both LCDs. Notifications incoming0 is
exact; incoming13 and incoming20 each differ by 152 upper pixels in
`x344 y3 width19 height13`, maximum deltas 163 and 205. Their lower LCDs are
exact. Thus 24 of 26 LCDs are exact, not all 26.

Root opened both boundary sheets and both complete comparison sheets. The
Notifications residual occupies the clock digits, visibly 20:19 versus 20:56.
It remains reported under the declared empty mask. The audit verifies all 84
native-size placements. This is browser regression evidence, not native parity.

## Next bounded change

The existing opaque-alpha reuse guard accepts only the two title-background
panes. A source feasibility check compares 84 cases across both titles, LCDs
and integer source frames 0 through 20. All 29,030,400 RGBA bytes are identical;
16 malformed controls reject. This does not establish Canvas output or speed.
The next candidate opts these backgrounds into that existing path, without
relaxing validation, changing assets or changing cache bounds/disposal.
Independent review and live regression recapture precede any delivery claim.

## Evidence and limits

Private root:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/applet-incoming-cost/`.
The declared policy is `capture-policy.md`; immutable input identities and
intervals are in `measured-timings.json`; actual GUI closure is in
`session-closure.md`. The source review is
`review/source-review-ce402ac.md`, SHA-256
`bee62cc6eb4408da8089eff51a7c03dd4074078470d27e024ea8208653f1925d`.
The source mapping and exact feasibility method are in `alpha-feasibility/`.
The authoritative capture audit is `capture-audit/run-3/report.json`, SHA-256
`2bd93577b49c1bf9423ce38f7adfe7a8b466d5bfc3e0023384477c632e6312be`;
its seal is `926e8cbd7633b672078f7b19b1d46fdef668c1341a531998937e3dc3b1d711f4`.
The first two audit runs are checker-development artifacts, not evidence.
Root's complete CRC/decode check is `root-png-verification.json`, SHA-256
`e57eabee62dc5f973a64f16d83b3fb4398d0e2c067987e2cabe77f70648aa58e`.
All 2,417 candidate source/build files, 149,124,389 bytes, rehash unchanged.
The separate human edit is preserved.

There is no new Azahar comparison in this diagnostic slice. Previously labelled
host composition, font and selected-only return adaptations remain. This
change introduces no native graphics or audio asset. All four whole flows
remain fail/unproven, and audio remains muted and unaccepted.
