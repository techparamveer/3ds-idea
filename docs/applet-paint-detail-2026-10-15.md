# Applet incoming paint detail

## Result

AN-01 remains fail/unproven. This diagnostic identifies CPU work in two
recorded first openings. It changes no animation clock, pose, resource, input,
draw order or cache policy. It is not a native comparison or smoothness claim.

Source `4626dc8eef5b2a1b6db271e9274df803e98e7cbc` is independently reviewed
without findings. Root accepted clean handoff `613a2e7`, merged coordinator
documentation as `dbd4cfe`, then captured at `b803b8e`. Source, public assets,
tests and build inputs match the reviewed source. Build ID is
`3O1VJY2p2mFLyJ__sHpJn`. No rebuild followed the documentation merge.

## Measurements

The existing opt-in receipt now records title validation, each LCD draw and
retained cache deltas. Notifications additionally records cached versus
recomposed screen pairs and every changed key component. Disabled diagnostics
add no time/cache reads or reason construction. Current measurements clear
on skipped, failed and inactive paths. Nested records are immutable.
See the [source handoff](workstream-handoffs/applet-paint-detail-20261015.md).

Root followed the predeclared two-opening policy in one fresh muted Chromium
153 Guest on the sole built-in MacBook. Normal touchscreen focus and a
requested 500 ms Open hold preceded each ready endpoint. All 221 Friends and
308 Notifications pairs saved; both stopped by user input without cap/retry.
The owned Guest/server are closed. Both frozen source/builds and the human
edit rehash unchanged.

Times below are milliseconds within the same recorded paint, rounded to one
decimal. Encoding is separate and can affect subsequent scheduling.

| First incoming0 | Friends seq35 / receipt543 | Notifications seq35 / receipt1504 |
| --- | ---: | ---: |
| Whole paint | 38.2 | 32.7 |
| Title incoming | 35.9 | 29.9 |
| Title validation | 0.0 | 0.2 |
| Upper draw | 17.2 | 15.6 |
| Lower draw | 18.5 | 14.1 |
| Title remainder | 0.2 | 0.0 |
| Encoding | 8.2 | 5.5 |

Each first title draw retains one upper entry / 384,000 bytes and four lower
entries / 468,736 bytes. These are net retained-cache changes, not allocation
volume or proof that cache population consumed every measured millisecond.
Later alpha variants add entries and eventually evict others. Negative deltas
remain valid and are not clamped away.

Friends has 15 incoming samples. After excluding first use and terminal20,
13 samples have median whole paint 8.1 ms, title 5.9 ms and encoding 9.3 ms.
Terminal20 has whole paint 2.6 ms and title 0.2 ms. Missing source values are
1, 2, 4, 9, 14 and 16.

Notifications has 13 incoming samples. Its 11 nonterminal samples after first
use have median whole paint 10.3 ms, title 6.2 ms and encoding 9.8 ms.
Terminal20 has whole paint 4.3 ms and title 0.4 ms. Missing source values are
1, 2, 4, 7, 10, 14, 16 and 19. The all-pose assertion therefore remains red.

Notifications seq46 / receipt1515 / incoming18 has whole paint 88.5 ms,
overlay 76.8 ms and stock recomposition 75.6 ms. Its only changed component is
`notificationsHud`. This directly locates this run's spike in the existing
recomposition branch. It does not identify the expense of individual draw
calls or rule out host stalls. Across 276 successful stock observations,
261 are cached and 15 recomposed. The first cold composition is 100 ms beneath
the outgoing cover; later HUD changes outside incoming cost 8.5 to 13.2 ms.

## Evidence identities

Private root:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/applet-paint-detail/`.

- Friends final: `browser/reference/scenario-matrix/v1/captures/live-lcd-003c5684-1398-40d6-8e3b-f5c31dc5470a-0221/browser/capture.json`,
  SHA-256 `3592b658b404186bee2abf68a73ca963f4da3d73308461174838a99a7738c1c9`.
- Notifications final: `browser/reference/scenario-matrix/v1/captures/live-lcd-06449bae-309d-4e23-b132-4a584d74b552-0308/browser/capture.json`,
  SHA-256 `0860376a03c73adb8048ced5fb0a7b9bdca990e3a6baf1d342037a083cd9a087`.
- `pre-input-identity.json` pins the candidate manifest, policy, analyzer and
  source review before inputs. `after-check.json` verifies both builds and the
  preserved human edit. `session-closure.md` records GUI and server closure.
- `analysis/measured-all-pose-check.json` preserves the stopped-ledger timing
  results and failed all-pose check. The analyzer checks final receipt binding,
  chronology, nested intervals and reasons, not image integrity.

The fixed image audit is closed. Its selectors are each first outgoing20
opaque cover and first chronological occurrence of every shared incoming
source value against the frozen [raster baseline](applet-incoming-raster-2026-10-15.md).
Masks are empty. Do not fit phases, translate pixels or erase clock/battery
differences. The closed Friends header control remains separate evidence.

Authoritative `capture-audit/run-3/report.json` has SHA-256
`40ddc71e8c54f2f11d6c0d2be0247615af024a84146472a91c936d0e7197617f`.
It distinguishes capture HEAD b803b8e from audit checkout 3683d96. Earlier
runs are preserved. All 529 triples have valid receipt binding, chronology,
publication and hashes, with no orphan files. All 1,058 PNGs pass chunk CRC,
complete decode, native dimensions and opaque RGBA checks.

Of 23 logical pairs / 46 LCD comparisons, 38 are byte- and pixel-exact.
All Friends comparisons and every lower LCD are exact. Notifications upper
incoming values 3, 6, 8, 9, 11, 12, 15 and 20 differ in 1,926 pixels total.
Seven have 217 pixels within x329 y3 width34 height13. Value15 has 407 pixels
within x329 y3 width66 height13. The sheets show baseline clock 21:12 and
candidate 22:01; value15 also spans the battery. These differences remain
unmasked. No source selection or pixel alignment was fitted.

All 124 source placements in the sheets are exact. Root inspected all four
sheets in nine native-size pages, then verified run-3 sheets are hash-identical
to the inspected run-1 images. `root-inspection/closed.json` records unchanged
hashes for all 1,587 originals and 28 sealed derivatives. The audit seal is
`05652979a897659d743ce7353399db156496baf7b4aee84bcafa1b9d05c12298`;
the complete PNG check is
`7dc3d58ef359250cef338765e8f0f1eff730bce0ff1c17f3a488d3e875494108`.

## Checks and remaining work

Focused checks pass 50; nonincremental typecheck and production build pass.
The hydrated full suite has 2,990 passes, the unchanged missing historical
Camera PNG failure, 102 skips and one TODO. The first setup/source-contract
failures remain in their original log. Nine private analyzer tests pass.
Independent source review is `3a8070f2bddd4d8b406ec0da5f3f9fe8aa3d1647a27130d9d8d52c20c1346cd3`.

Native source/asset identities are unchanged from the raster baseline. No
native visual or audio was added or reconstructed. Existing portfolio data,
source-binding and scheduling adaptations remain labelled in the earlier
records. Audio stays muted and unaccepted. All four whole flows remain
fail/unproven, including exact moving pixels, timing, input and native cues.

Next reduce the measured title-draw and
Notifications recomposition work without changing source poses or clocks.
The diagnostic identifies the branch; it does not authorize a guessed delay,
larger cache limit or skipped native HUD update.
