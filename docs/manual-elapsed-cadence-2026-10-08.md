# Manual elapsed cadence

Runtime `a264973ef6916495ea479cadeae518771351b49f` integrates reviewed worker
`60882108dda9b614b96ff591e5e9f8c1a7fe7b6e`. AN-02 remains **fail**: the
following evidence corrects a visible slowdown, not whole-scenario 1:1.

## Source And Implementation

The unchanged [Manual entry mapping](workstream-handoffs/animation-manual-entry-20261007.md#source-mapping)
identifies the decoded HOME cover and Manual resources, title/version, content,
CIA paths, SHA-256 and converter. No graphics, sounds or source curves changed.
The controller discarded time spent between sampling a pose and receiving its
paired render acknowledgement. A delayed-paint test reproduced outgoing frame3
instead of4 at45Hz. Both phases now advance from the last accepted sample,
with the existing1..6 update bound. Pending poses remain immutable until their
receipt; out20 must be acknowledged before separate in0. No elapsed credit
crosses that boundary. The nominal60Hz clock/stall policy remains an adaptation.

## Production Verification

Private root: `/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261008/manual-elapsed/`.
Baseline `a057600` is preserved. Final build `3NgqKRCLsiGmL2lSX7i0Y` has
BUILD_ID SHA-256 `e07f34a8fabaeee43ea76d200c7cb4b10e3b031e6bdf0efbc8ad7a3851c9aa2b`.
Visible muted Chromium used actual Mac bounds50,350,1102x700,1100x620 viewport,
touch activation and two3500ms cycles. Fresh token gates record actual pre/post
navigation geometry. No default profile or system audio was changed.

| Capture | First/repeat pairs | Out0 to20 | In0 to20 |
| --- | --- | --- | --- |
| Baseline Camera normal | 93/96 | 663.0/573.8ms | 464.7/493.1ms |
| `final-camera-normal` | 82/86 | 340.6/358.9ms | 266.5/285.2ms |
| `final-camera-reduced-verified` | 76/78 | Endpoint adaptation | Endpoint adaptation |
| `final-settings-normal` | 85/90 | See receipt audit | See receipt audit |

All497 accepted pairs/994 raw LCD PNGs pass independent hash/decode/inventory
and paired-receipt checks. All16 chronology/comparison sheets and6 console
views are inspected. First reduced attempt76/76 is preserved separately:
post-navigation inventory happened after browser close. Copied expected
geometry was explicitly retracted; the fresh retry supplies actual evidence.
The checker changed only the retry filename/gate mapping, not acceptance rules.

Final audit lives in sibling `top-row-cover-cadence/review/manual-elapsed-final-review.md`,
SHA-256 `3b2eec1d4f191150b55cea5fd8d00edebc119e8334a6fb80f7b50a2de20b3d02`.
Fixed first-ready Camera comparison remains106upper/9lower pixels overRGBdelta2,
empty mask, native anchor `187ad2e67e97fbe12f4d041e0679a8ff2ade2e8282065cc81264a8f80b8bea1f`.
The latest observed HOME pair equals out0; internal backing receipt identity is
unexposed. Settings repeat retains a91.6ms out19-to20 observation gap across
receipts650/651. That unexplained gap remains open.

Root35 focused tests, nonincremental typecheck and build pass. Full suite has
2525passes, one historical missing CameraPNG fixture failure,98skips,oneTODO.
All finite collectors finished and their owned browser windows were absent.

## Native Comparison

Fresh silent100% isolated Azahar movie `manual-native-mac.mov` has SHA-256
`7dde6527297759f6365bfbac079788688cfe8be906add0eacc2467faf803f9de`.
The native-owned400x480 readyPNG exactly reproduces the fixed anchor above.
Frozen0.1s sampling shows outgoing fade/belt, complete cover, then incoming
Contents reveal and belt removal. Boundary intervals constrain outgoing to
approximately203..415ms and incoming222..397ms; they are not native epochs.
`native-review/native-audit.md` SHA-256
`09dabfa785697e66c65dbfdfa41f9bfe3cb417eeaf68a7b98b13e5e3d2e23a3d`
records847decoded samples, zero audio tracks and compression/timestamp limits.
The chronology sheet was opened. GUI Quit/Yes ended native session98599 with139;
PID28839 was absent. The abnormal exit is retained, not reported as clean.

Native input epochs, exact cadence and pixel residuals remain unresolved.
Reduced motion, portfolio caller content and retained Manual layout adaptations
remain labelled differences; muted audio acceptance is unverified.
