# Applet incoming cadence

## Delivered correction

Reviewed worker7eb8d59 integrates as c73f9fb and removes repeated incoming
poses when sampling and the preceding receipt share an update bucket. Its
visible recapture still advances only one source pose per paint. Reviewed
worker5b95e8d integrates as a057600 and retains ordinary elapsed rendering
time between accepted samples, matching the corrected outgoing clock.

The controller advances by one to six sampled updates only after the exact
pending pair is acknowledged. Longer gaps hold and rebase. Resource, owner,
generation, context and readiness guards remain. Outgoing20, incoming0,
incoming20 and destination handoff keep separate receipts; elapsed credit
never crosses producer boundaries. Reduced motion keeps the same endpoint
publication requirements. No asset, shader, native track or endpoint changed.

The [incoming source mapping](workstream-handoffs/applet-incoming-motion-20261007.md)
identifies Friends EUR0004003000009f02/v6144/content0/00000017 and
Notifications EUR000400300000a002/v4097/content0/00000012, their CIA-internal
archives, manifest keys, source/delivery hashes and converter provenance.
Native SceneIn frames20..40 still fade the cover255..0 and move the lower
belt from x0 to-80. This slice changes scheduling, not those source values.

## Verification

Private root:

`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261008/top-row-cover-cadence/`.

All captures use muted visible production Chromium on the authorized Mac,
actual pre/post bounds50,350,1102x700,1100x620 viewport, two ordinary opening
cycles and a3500ms window. Each run has fresh gates and no page errors.

| Incoming0 to first incoming20 | cbbee26 baseline | c73f9fb intermediate | a057600 final |
| --- | --- | --- | --- |
| Friends first/repeat | 670.1/781.8ms | 540.1/558.0ms | 299.3/315.7ms |
| Notifications first/repeat | 937.8/1039.2ms | 508.0/642.6ms | 312.9/329.1ms |

These are observed browser intervals, not native activation epochs. Each
final normal cycle observes13 ordered incoming poses, including0 and20,
without repeated interior poses. Some integer poses are skipped at the actual
paint rate. Friends first terminal20 repeats11.6ms; Notifications repeat
terminal20 repeats12.9ms before a distinct handoff. Notifications repeat
outgoing19 to20 includes a116.9ms observation gap; it is retained as a timing
residual, not removed from the report or attributed to native motion.

Intermediate runs contain510 pairs/1020 raw PNGs and six console captures.
Final elapsed-friends-normal90/90, elapsed-friends-reduced78/76 and
elapsed-notifications-normal86/91 total511 pairs/1022 raw PNGs. Independent
audits verify hashes, CRC, full decode, dimensions, receipt pairing, owners,
chronology, inventory and latest observed HOME retention. The coordinator
opens all23 final chronology/comparison sheets and all six console captures.
The reviewer independently inspects the evidence. No whole scenario passes.

| Final report under review/ | SHA-256 |
| --- | --- |
| elapsed-friends-normal/checks.json | ac256dae2c7fda8871f314e9f431e46d3f473eb2980d2b7658598e4016bd0d35 |
| elapsed-friends-reduced/checks.json | 4c4c94f5b70a2143eb5bbcccc63077ab3a4674f35d97af4a111d0ee900513f3e |
| elapsed-notifications-normal/checks.json | 9c90259892533e47341f783b503e55727e3a29ab443c51aedc25b8864d2420ca |

The frozen elapsed config hashes
f820b06a581461236fd979816d25f7b2df4f03a8bcf02f8b7a317691866a45be.
The final independent review, review/incoming-elapsed-review.md, hashes
e405490339d0802229e4ba3c5f05ff2c8a123e744a7b4b3887300af9187f470b.
Fixed first-cover20 comparisons retain the [cover checkpoint](applet-cover-cadence-2026-10-08.md)
native anchors, empty mask and RGBdelta2. Friends remains0 upper/17 lower
pixels over threshold; Notifications remains0/0. The raw selectors, pair
hashes and masks are pinned in each report. These are static diagnostics.

Root26 focused checks, nonincremental typecheck and production build pass.
Full tests report2523 passes, the historical missing Camera PNG failure,
98 skips and one TODO. Build tz-VVdH8FHbDTvN5h7tPR hashes
e5135aec79dbd1522482c6d754d88a597076717144494271f2efc9f0d01539bd.

## Native comparison and limits

Existing silent Friends movies show the same fade direction and lower-belt
movement. The fresh movie's sample008 already contains a faint centred title;
sample009 is the first full body, not the first visible incoming mark.
The190ms full-body-to-clear interval is not an exact native duration.
The original labels and additive qualification remain separate under
incoming-triage/reviewer-label-qualification.md, SHA
5affe57ba252bd5f3d9d7200355ae6fadc0b8ef6aac843727a665f9f70702b82.
Native first-use help and browser own-card endpoints differ intentionally.
No Notifications native movie establishes title-specific incoming cadence.

Outgoing-only Notes120/121, Browser79/80 and Miiverse79/84 regression runs
at c73f9fb total563 pairs/1126 raw PNGs. Their six sheets and six console
captures are inspected; integrity, order and handoff checks pass. Their
policy has no predeclared native anchor, so native comparison remains missing.
Report other-top-row-review/report.md hashes
1c6a1bb8203c09d250299e464c9dd57aa40d6755072cd8a647cc58d8280db7ed.

The failed hidden-window Notes attempt remains excluded with its six pairs.
The intermediate audit's filename failure remains recorded; the post-navigation
alias is a byte-identical copy, not reconstructed evidence. Native input and
activation alignment, host60Hz/stall policy, reduced motion, portfolio content,
remaining native pixels and muted audio stay unaccepted. AN-01 through AN-04
remain fail. The subsequent bounded Notes audit identifies49 consecutive
unchanged cover pairs before its body snaps in. drawLayout caches distinct
pre-posed native layouts under the same key, suppressing existing ApltBoot
SceneIn pixels. Correct this renderer cache separately from Manual elapsed
timing; do not add a generic Notes incoming phase or invent new source poses.
The verdict under notes-next-verdict/verdict.md hashes
5a3703e39d10a30f1eca03fbce0e3c033e2d1deb55891d3c34ff081256a8b106.
