# Experimental applet background raster

The scoped candidate is committed and reviewed in
[closed PR #8](https://github.com/techparamveer/3ds-idea/pull/8), stacked on
[draft PR #7](https://github.com/techparamveer/3ds-idea/pull/7). It is not
integrated or adopted. All four whole animation flows remain fail/unproven.

## Outcome, 16 October

After the user instructed continuation, root started A1 on the frozen baseline,
verified site-only mute in a fresh MacBook Guest, visibly selected Friend List,
and recorded one requested 500 ms touchscreen Open. All 253 raw paired frames
were saved. During recording, Chrome's Energy Saver indicator disappeared and
the next power readback confirmed AC attached. The exact switch epoch is unknown.
Root stopped the declared campaign without retry rather than treating changed
power conditions as a consistent performance control. No Notifications, B1,
B2 or A2 recording followed. No candidate production run occurred.

Audit `1980935a28e78dfe5e6dae6326312cc89fe4b1aa45bf7a4e4f0338297e3a049f`
validates all 253 receipt triples and 506 native-size PNGs, with unchanged
originals and no publication/input/PNG integrity errors. Its seven errors are
the missing planned recordings/comparison sets and ten missing source values
in each of the cover and incoming phases. It correctly exits 1 as incomplete.
No pixel comparison or timing promotion follows. The result is inconclusive,
not evidence that the candidate is faster or slower. PR #8 is closed unmerged;
its source, build and worktree are preserved. No replacement tuning campaign.

Private output is `applet-generic-production/A1`; the audit is
`applet-generic-production/audit-interrupted-a1`. Final saved capture is
`live-lcd-2daa08d4-a261-4946-aa03-b26e64ca2927-0253/browser/capture.json`, SHA-256
`ae628e8d3b4dd15241205571f109b6aee68688c4adc6bd0e22d7d8ee45bdb12e`.
Observed hold is 505.6 ms. First title work is 33.4 ms, later nonterminal median
7 ms, and first input-to-ready receipt is 1485.6 ms. These are recorder-perturbed
browser observations under changing power, not native cadence or a speedup.

Guest window5536 and server session77096 are closed; port3047 is free. Both
source/build inventories rehash unchanged. AC power subsequently reports
charging. Continue evidence-backed visual defects in the four original flows.

## Source and checks

The candidate worktree is
`/Users/paramveer/.codex/worktrees/applet-generic-background-20261015/3ds-idea`
on `codex/applet-generic-background-20261015`. Source commit `a3094c2` selects
the existing generic alpha-1 raster only for the validated Friends and
Notifications title backgrounds. Test correction `5e1dec9` and check handoff
`74db674` follow. Other pictures retain the compiled default. Cache identity,
8 MiB limit, alpha scratch, disposal, resource failures, clocks, poses, input,
HUD updates and publication guards are unchanged. No native asset changed.

Source review `cf22e0da` found no source bug. Follow-up `077fb86e` closes its
P3 test gap: visible frame 0 now proves actual background composition and
cache reuse when the request returns to the default raster path.

- Focused checks: 51 pass, 0 fail, 1 optional skip; real Canvas 9/9;
  compiled/kernel checks 15/15. All 42 source poses preserve exact raster
  bytes. Font ink is stubbed, so this is not a full-LCD native comparison.
- Full suite: 2,993 pass, 1 known missing historical Camera PNG failure,
  103 skip and 1 todo. Initial unhydrated local LFS model failures are retained
  separately. No test was weakened to conceal the missing fixture.
- Nonincremental typecheck and production build pass. Build ID is
  `qrqJDhOcclmu2RuyNXUMi`. No shader/material change required a shader check.

Private evidence is under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/`.
The candidate `source-checks/SHA256SUMS` hash is
`e0a58ecb69b15e6462ead61749db34bab237b42296d238b8907cfa1dde131eda`;
root verified all eight listed files. The full worker handoff is in PR #8.

## Production gate

The [private probe](applet-cold-browser-probe-2026-10-15.md) favored generic
first draws but not later or aggregate cost. It justifies a production
experiment, not a performance claim. The declared order is baseline A1,
candidate B1, candidate B2, baseline A2, with first Friends and then first
Notifications in a fresh muted Guest each time. Compare first chronological
cover20 and shared incoming values on both full native-size LCDs, empty masks.
Reject regression or an inconclusive result. Do not rescue it with prewarming,
fitted delays or more tuning runs.

Before the user-directed run above, preflight found the
MacBook at 13% battery with about 11 minutes estimated remaining and Chrome
Energy Saver on. Root asked the user to connect power and held GUI capture.
The later battery reading was 12%. Do not confuse this power condition with
the account stop rule, which remains 10% weekly usage left.

Both builds are frozen. Baseline is runtime `b83b768`, build
`g-qLVPFQLrJnvHrbuaS0e`; candidate is source `5e1dec9`, build above.
Private `applet-generic-production/baseline-before-v2.json` tracks 2,425 files,
SHA-256 `4b68cd0f8db210516207ed456a4a1e2a1eec61b9b48d1b4a67e07ad6df69039b`.
`candidate-before.json` tracks 2,417 files, SHA-256
`d015dcecb587c49af908ea644bddb3a50dc237acf684ef82dccf9f5f0dbdd468`.
Different build inventories are not evidence of a rendering difference.
Rehash both before inputs. The capture policy is `d2ee0916`.

Root reviewed the private audit tools before capture and corrected a selector
that discarded valid pairs unless all four runs contained that frame. The tool
now compares each candidate/baseline intersection, separates requested from
observed hold duration, rejects orphan LCDs and leaves capture power conditions
unknown until attested. Syntax and 14 in-memory checks pass. The incomplete
A1 audit above is the sole real run. Tool SHA-256 is
`dc34614535ea7bfaaddec0eaa887bed8f266e19ca85220bf177bce5338cec119`.
The original revision is preserved. Sample sheets are not full visual coverage;
inspect pair-only and remaining unsheeted comparisons before any promotion.
Root alone operates the production browser and Azahar.

## Remaining limits

No production performance, browser-inspection or new native-comparison result
exists for this candidate. Original native motion, cadence, sampled-pose gaps
and documented fixture/font/compositor adaptations remain open. No non-native
visual or audio element was added. Keep every 3DS session muted, leave unrelated
audio alone, and keep audio acceptance unverified.
