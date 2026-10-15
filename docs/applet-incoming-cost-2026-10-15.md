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
assertion remains red. Original PNG integrity and regression comparisons are
being audited separately; timings alone do not verify them.

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
All 2,417 candidate source/build files, 149,124,389 bytes, rehash unchanged.
The separate human edit is preserved.

There is no new Azahar comparison in this diagnostic slice. Previously labelled
host composition, font and selected-only return adaptations remain. This
change introduces no native graphics or audio asset. All four whole flows
remain fail/unproven, and audio remains muted and unaccepted.
