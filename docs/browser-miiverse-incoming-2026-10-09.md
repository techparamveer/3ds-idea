# Browser and Miiverse incoming animation

Runtime `5c5c5bb7be7ac9cbb696dfc6a3bb5b2e5c378438` integrates independently
reviewed worker `c209c2c`. Browser and Miiverse now reveal their destination
under the delivered HOME common SceneIn instead of jumping from the opaque
title cover to the finished app. Native asset bytes are unchanged.

## Source and runtime

The [worker handoff](workstream-handoffs/web-common-incoming-20261009.md)
records the complete element-to-source mapping and SHA-256 identities.
The source is EUR HOME `0004003000009802`, v24576, content0/`00000082`,
`romfs/common_LZ.bin`, converted by `ctr-native-web` 1.2.0 with CTRTool 1.3.0.
The unchanged common pack hashes
`eb472b6a6c60668cdbdb88314fd010bc97b354c472adc47a9fc78629d1eb9b82`.
Its upper/lower SceneIn clips have local poses 0..20, original range 20..40.
The lower belt shifts left and fades; Browser retains its Web label and
Miiverse retains the original authored wordmark.

`appletEntryIncomingKind` distinguishes common incoming from the existing
Friends/Notifications title-owned incoming. Notes keeps its separate title
reveal. Browser/Miiverse require a valid outgoing20 receipt, common incoming,
an incoming20 receipt, then a distinct exact-pair handoff. The existing owner,
generation, replacement, failure and visibility guards remain. Reduced motion
uses separately acknowledged endpoints. The bounded 60 Hz accepted-sample clock
remains a host adaptation, not a recovered native dispatch epoch.

## Integrated verification

Production BUILD_ID `J4CuxfwNRkursGDBuwF_y` hashes
`9d89782d0f39b5d9d82d4e1426078e12bce02a156221b5b062a580e0aa6fbf41`.
Build and subsequent nonincremental typecheck pass. The full suite reports
2529 passes, one historical missing Camera PNG failure, 98 skips and one TODO.
Independent focused review passes all 85 applet tests with no actionable finding.

All seven muted production runs used the iPad Sidecar. Actual pre/post window
bounds were (1940,400), 1102x700, wholly inside Sidecar (1920,367), 1164x802.
Each current-Space check passed. Viewport was 1100x620. The collector used
ordinary toolbar selection and lower Open touch, first/repeated opens and
3500 ms observation windows. Each owned browser closed after capture.

| Scenario | First/repeat pairs | Incoming0-to20, first/repeat |
| --- | --- | --- |
| Browser normal | 82/88 | 346.8/337.8ms |
| Browser reduced | 71/72 | Endpoint-only adaptation |
| Miiverse normal | 84/91 | 340.7/353.0ms |
| Miiverse reduced | 72/72 | Endpoint-only adaptation |
| Notes normal | 90/95 | Separate title reveal, no common incoming |
| Friends normal | 80/83 | 307.2/303.7ms |
| Notifications normal | 80/83 | 304.6/323.4ms |

Independent checks validate all 1143 pairs and 2286 raw PNGs, their hashes,
dimensions, decode, chronological same-paint receipts, exact file inventory,
touch inputs and display records. The audit generates 36 chronological sheets
and retains 14 console views. These counts include settled samples and are not
native frame counts. Empty collector errors means no JavaScript `pageerror`
events; the collector does not collect every console or network failure.

All 36 sheets and 14 console views were independently inspected. The root also
opened the Browser/Miiverse/Notes first-cycle incoming sheets and representative
native frames. No new unexplained pixel discontinuity was found. For both
common-incoming titles, incoming20, handoff and ready are pixel-identical;
Notes retains its separately progressing reveal.

## Native comparison and limits

The previously recorded silent Azahar movies show intermediate leftward belt
clearing in both titles. Uniform 100 ms requests produce 151 samples per movie;
actual decoded presentation times are retained. Conservative incoming duration
envelopes are Browser 92-400 ms and Miiverse 198-388 ms. Both include 333.333 ms
for 20 intervals at 60 Hz, but cannot prove the native scheduling rate or exact phase.
Browser's near-clear sample remains ambiguous rather than forcing an epoch.

Native Browser reaches an update-required dialog and Miiverse reaches error
022-5362. Local endpoints are intentional portfolio adaptations. Their different
pixels must not be counted as native equality. No new native pixel mask or
whole-flow pixel acceptance follows from the movie comparison.

Browser cover20-to-incoming0 remains 155.0/125.9 ms; Miiverse 104.1/9.3 ms.
The longest consecutive observation gap among these seven runs is 164.9 ms
before Friends incoming. Sampling skips some intermediate source poses.
These gaps, exact native input epochs, full pixel residuals and muted audio
remain open. All four whole animation scenarios remain fail.

Private artifacts are under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261008/top-row-cover-cadence/web-common-incoming/`.
`ipad-capture-policy.md` predates capture; `ipad-audit/all-seven/summary.json`
indexes raw checks and sheets and hashes
`739ab6994e1bbe67f52f9b07d0a10e79feb21d5ba4bb24ab1b2ac52a1672b8f2`.
`ipad-audit/final-review.md` records the complete visual review and limitations.
`native-incoming-audit-20261009.md` hashes
`f0d5c333a3752ca458d75da0d3235a96128b9b2dfd126e9583825804efd34507`.
The independent code review in the sibling `review/` directory hashes
`8788a22b6313f27604922870ae6845ab6a02dc40a862106030b1ca8eb7be4079`.
