# Applet cover cadence

## Delivered change

Worker `2f0173c` integrated as `94696e5`; its visible recapture still ran slowly.
Reviewed follow-up `cf674cc` integrated as `cbbee26`. Both change only the
outgoing applet presentation controller and focused tests. No asset, shader,
title incoming phase or endpoint changed.

The outgoing cover now retains elapsed time between acknowledged samples.
Previously it advanced once per rendered pair, then the first candidate
discarded the time spent rendering by anchoring progress to the later receipt.
The final clock uses the accepted sample timestamp. Publication still requires
the exact pending pose, current owner/generation, eligible context and paired
receipt. Gaps above six updates hold and rebase. Terminal cover20 must be
acknowledged before incoming0; no remaining elapsed credit crosses that boundary.
Reduced motion still publishes separate cover20, incoming20 and handoff poses.

The existing [common-cover mapping](workstream-handoffs/applet-common-selectors-20261007.md)
identifies every wash, belt, icon and label through `manifest.home.common` and
the pinned HOME title `0004003000009802`, version24576, content0/00000082.
The unchanged native SceneOut tracks and assets retain their dump hashes and
`ctr-native-web`1.2.0 provenance. This correction changes scheduling only.

## Verification

Private artifacts are under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261008/top-row-cover-cadence/`.
All browser runs use muted visible production Chromium on the authorized Mac,
with actual pre/post-navigation window bounds recorded. Each run opens the
selected applet, returns through HOME and opens it again.

| Friends build | First changed to first cover20, first / repeat |
| --- | --- |
| Baseline `8abfd42` | 830.7 / 764.7 ms |
| First candidate `94696e5` | 649.6 / 560.5 ms |
| Final `cbbee26` | 321.0 / 332.7 ms |

These are browser capture intervals, not native activation epochs. Final
Friends cover coverage skips some integer poses when rendering is slower than
the source clock; first and terminal poses remain distinct acknowledged pairs.
Normal Friends captures contain 108/106 pairs, reduced 76/76, and Notifications
regression 107/99. Notifications cover intervals are 290.9/320.3 ms. All six
cycles finish without page errors. Independent review verifies all 572 pairs /
1,144 raw PNGs, their hashes, CRC/decode/dimensions, same-paint paired receipts,
owner/phase guards and separate terminal publication. The coordinator and
reviewer inspect all 13 final chronology/comparison sheets; the six console
views are also inspected.

Reports under `review/` pin every capture and crop:

| Report | SHA-256 |
| --- | --- |
| `final-friends-normal/checks.json` | `2f1b585e33aa9f40bd5ece281edf118d9b40264f353e14ca158133f5af437c85` |
| `final-friends-reduced/checks.json` | `4a6a47c137d5b71afb89e4e3223894aa3606ebd9613265229655d30d75942d1a` |
| `final-notifications-normal/checks.json` | `06f818488aebc6e99f58cc8d1033230cd611f373577df09c6faf88cb472aef3f` |

The frozen v1 checker incorrectly compared cover0 only to capture frame000.
Its failure is preserved in `review/final-checker-failure.md`. The explicit v2
checker hashes `ae4b6401e9b85b1cfb64a967bcdf409c434383206ce235f363d862b412b69769`.
Supplemental `final-latest-home.json` selects the chronologically latest HOME
pair, not the nearest image. Both LCDs match cover0 exactly in all four normal
cycles. Friends repeat has additional HOME samples001/002 before cover0#003;
the earlier samples differ because HOME was still moving. The exact internal
backing receipt is not serialized, so observed pixel equality does not prove
unobserved backing provenance.

Fixed first-cover20 comparisons use `scripts/native-compare/empty-mask.json`
with zero masked pixels and RGB delta2. Friends first/repeat selects012/016,
reduced001/001, against native `_07.10.26_16.52.12.016.png`
(`a241e1f97982cf0c78a64f128231434222fcce7c8ae330639fc8c497dcf8366b`).
Every Friends comparison retains 0 upper / 17 lower pixels above delta2.
Notifications selects010/012 against `_07.10.26_16.22.46.643.png`
(`7795490bd65837001d0e341f4eae00f55ba71e4b07abb53756079139acb2e2c7`),
with 0 upper / 0 lower above delta2. These are static cover diagnostics,
not whole-motion acceptance. The raw identities are in the reports.

The original native movie and fresh silent Mac recording use the same semantic
completion criterion: blank upper cover, complete lower title belt and no
recognizable outgoing HOME. Last unchanged to first visibly complete samples
span396.667ms and406.667ms respectively. These conservative sample bounds do
not prove an exact duration. Fresh movie SHA-256 is
`2ce21137edcf4b2a482c092c3719d7a05d40bed4d43f25b0cbf6e4bd573f21f3`.
Its later byte-stable plateau is not the semantic terminal. Both the initial
plateau audit and separate semantic qualification are preserved.

Fresh native own endpoint PNG hashes
`48bc0ca5515e953bada0a6939657a2c64355663c3895144709ff483879131278`.
It shows first-use help plus error002-0121 and is not substituted for the
existing raw common-cover comparison. Native Quit/Yes exits139 after the
recording completes; PID absence is verified. No profile fields were changed,
and volume0/Null1/Static2 remain. Movie audio-track count is zero.

Root49 focused tests, nonincremental typecheck and production build pass.
The full suite has2521 passes, one historical missing Camera PNG failure,
98 skips and one TODO. Worker91 focused and independent24 controller/title
checks are separate runs, not additive coverage. Final build
`YCtVTZ8Er4BwFF5joQ1TM` hashes
`e0af84c086310f2b37458ba682d16280fb7ce3067743158d1f616558830d1bf2`.

## Remaining differences

The host60Hz clock, six-update stall policy, input delivery, reduced motion,
portfolio HOME population and Friends own-card endpoint remain adaptations.
Title incoming scheduling is unchanged. Native source activation epochs,
exact input equivalence, remaining pixels and muted audio are unaccepted.
The observed timing improvement does not pass AN-01 or any whole scenario.
