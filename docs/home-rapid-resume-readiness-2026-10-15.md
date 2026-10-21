# Rapid Resume publication barrier

## Integrated capture checkpoint

Runtime `7650caaeca1aaf5be56868407d9d25c8e439a28a`, followed by scene assertion
`979977f84e085be339a6ebb2012be4fc08cd4ec5`, is pushed to draft PR 7. The clean
candidate is `rapid-resume-verified-20261015/3ds-idea`, branch
`codex/rapid-resume-verified-20261015`, build `5gnRkIxt5z2uQM-gzoSBy`.
Source and build are frozen after capture. The worker's original source commit
is `201ea32225d73ea0846d8a0825b543e6e1348067`.

Independent Astra extra-high review reports no actionable findings and 79
passing focused checks. Report SHA-256 is
`6d2d985118bc7c6b7872c459e60fcdf6106c07a2cd979d41163d3632d15fd6fa`,
under private `continuation-20261015/rapid-independent-review/`. Final integrated
full checks report 2,861 passes, one unchanged missing historical Camera PNG
failure, 102 skips and one TODO. Typecheck and build pass. The unchanged missing
fixture belongs to `tests/camera-date-group.test.mjs:44`; it was not substituted
or waived. Logs are `rapid-integrated-{full-tests-final,typecheck,build}.log`
under the same private continuation root. No shader or asset changes occurred.

Four ordinary-input muted MacBook windows save 872 valid raw LCD pairs. Root
opened all 13 sheets. Audit report SHA-256 is
`1921c6e4625d3469982af3561676d98e4ab9208db3877081975893ab6d98bbea`;
manifest is `d02e7ba41dafae13c7dc0eac216a855aef855116c3ef6db6fe9943acdd81c2f3`.
Both are under `continuation-20261015/rapid-candidate-audit-astra/`.
The original 2,616 files remain unchanged in
`continuation-20261015/rapid-browser-candidate/reference/scenario-matrix/v1/captures/`.

| Saved session | Input and result |
| --- | --- |
| `3415914d` | Left 38.9 ms then H 96.0 ms, down events 83.2 ms apart. Footer sequences 3-17, departure 18-58, Health from 59. |
| `e982fd42` | Left 35.9 ms then H 94.4 ms, down events 77.9 ms apart. Same saved stage boundaries. |
| `a254c6e3` | Short tile touch 52.5 ms selects Health and shows growth. Its 213-pair cap precedes Resume; no Resume claim for this window. |
| `bc9c0bbc` | Separate released footer touch 143.3 ms. Footer 5-19, departure 20-60, Health from 61. |

All completed windows retain footer source frames 0-14 and departure 0-40 in
order. No saved pair has both LCDs opaque with every RGB channel at most 1.
The previous failed session had two such pairs and no Resume descriptor. The
new rapid runs demonstrate retained output, but their actual H holds differ
from the old 35.4 ms hold. They are not exact input replays. The recordings do
not prove that the deferred branch executed; the source regression covers it.

## Remaining captured differences

The following freeze is the older readiness candidate's result. The later
[Resume expansion checkpoint](home-resume-expansion-2026-10-15.md) repairs
the captured late-footer freeze and preserves the publication barrier. Earlier
growth and native matched-motion acceptance remain open.

Both rapid footer stages freeze compact Health plus outgoing Camera. At
departure frame 0, Camera disappears but Health remains compact. Fresh native
ordinals 25-26 grow and 27-32 retain an expanded panel. The source trace narrows
the next repair: mode 8 requests footer exit, continues upper work and waits
for expanded scale plus footer absence before SceneOut. It does not justify a
scale-15 input-admission gate. This is a separate visible ordering defect.

The bounded source report is private `rapid-native-pose-triage/report.md`,
SHA-256 `bba4945f52c80cc47d2fc399691dcc375b54c83559075d40cb034e5b82809f23`;
its `source-contract.json` is
`e36aa5fec99f45be6e9c5298b15626939797c9d416d10bc1e80c7bf27f963e82`.
It rechecks HOME code hash
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Request `0x40` enters mode 8 without a scale test; update `0x2a2228` separately
requires expanded scale and footer absence before SceneOut. This is bounded
static control-flow evidence, not a new native replay or timing proof.

The fixed first uncovered lower Health endpoints in both rapid runs and the
ordinary run are RGBA-identical, PNG SHA-256
`cc5a9564b13c08b1fe512a94ff995fb061f969aa667b7b17264ebd0a687a1720`.
Against both previous ordinary endpoints, 27,690 of 76,800 pixels exceed RGB
delta 2, maximum delta 8. The difference persists throughout the settled tails.
Its cause is not established. No mask, phase search or color correction was
applied. Native ordinal 23 versus candidate ordinary differs at 1,764 pixels,
maximum delta 5. Exact browser regression and native pixel acceptance remain
withheld. The fixed policy, comparisons and visualizations are in the audit.

Tests, source identification, browser inspection and native comparison are
separate evidence. The source resource remains HOME title 0004003000009802
v24576, content 0 / 00000082, manifest
`home.launcher/animations.LncBase_U_00_ScaleUpDown`, CIA-internal path
`romfs/launcher_LZ.bin/anim/LncBase_U_00_ScaleUpDown.bclan`, SHA-256
`e1669ce6c081b61200d24d99cd4f61fd24b8c4967fef9b4a99728c29ee10f8d8`,
converter ctr-native-web 1.2.0. This checkpoint adds no native assets.

Portfolio population/content, initial-return/helper admission, nominal browser
scheduling and retained Resume compositor/timing remain adaptations. Native
moving pixels, input epochs, cadence and muted audio remain unverified. All
four whole flows stay fail/unproven. Test browser/server, native app and owned
Cua lease are closed. The unrelated human edit remains untouched.

## Lower endpoint control

A later control uses the same frozen build, muted Helium process/profile and
origin, with no source or settings change. It saves 614 valid pairs in three
windows: document A before HOME, A after ordinary footer Resume, then document
B before HOME after address-bar navigation. All 555 eligible settled lower
frames are PNG/RGBA-identical, lower PNG
`ef91a3124c557894953e3e0a01a62b33463cbea97f8dbca55b0c2b7cab7dc8a9`.
Ordinary Resume therefore preserves the lower endpoint within document A.

That image is a third across-run result. Against the prior candidate it differs
at 17,044 pixels above delta 2, maximum 8; against the earlier build it differs
at 26,202, maximum 8. The residual is present before HOME and does not require
a source revision or Resume. Its cause is still unestablished, and these two
documents do not reproduce simple per-document variation. No mask or threshold
change clears the across-run/native residual.

Private `continuation-20261015/lower-control-audit/report.md` SHA-256 is
`7b27db743323748477d2ea6a5a6c75a1f2b87d20efe6a722c0eb586e8eace50b`;
manifest is `0d6cda49922a27dca171a1f0c73b53bb9b964786ee5f58c6772993d044c4a9cd`.
All 1,842 original files are unchanged; root opened all seven sheets. Pre-input
policy is `lower-control-policy.md`, and raw files are in `lower-control-browser`.
The source/files/decoding triage is `rapid-lower-residual-triage/report.md`,
SHA-256 `abd32856e7b2f4284bea1ff2450f62714a67b7278800d96202b300ae7b301e1a`.
Browser tab and server are closed. This is bounded browser endpoint evidence,
not native animation, timing or audio acceptance.

## Original worker change

The captured Camera -> Left -> HOME sequence resumed Health before the selected
HOME pair had been published. The generic loading-recovery path called HOME
directly, so Resume had no accepted backing while the stock session reloaded.
Both LCDs were black. The source backing guards themselves were correct.

Evidence is closed session `fe0a6993-01c7-41e1-97ab-837feab3ea2d`, final capture
`live-lcd-270d09e9-6efd-47ff-a254-f96ab7166c33-0122`, under private
`continuation-20261015/browser-candidate/reference/scenario-matrix/v1/captures/`.
Actual DOM holds were Left 40.7 ms and HOME 35.4 ms, with 88.4 ms between their
down events. Sequences 3-4 contain the reported near-black app pair; no Resume
descriptor appears. The coordinator inspected the paired sheet. This worker
read the closed receipt sequence and reproduced the compositor failure.

The existing native-screen input gate now retains an early HOME request when
supported suspended Health or Camera lacks accepted backing. Screens identifies
the request by owner, capture/resource generations, HOME origin and scale epoch.
A painted candidate cannot release it. After the scene's existing valid paired
publication accepts that same source, the gate consumes the request once through
the ordinary HOME command path. The physical release remains quarantined.

Changed ownership, origin, generation, epoch, failure or invalid publication
cancels the request. Blur, hidden/sleeping suspension, context loss and renderer
failure explicitly cancel it. The existing settled-input and backing-publication
checks remain. No delay, synthetic capture, source-guard bypass, native asset,
audio cue, reducer state system or pickup behavior was added.

## Verification

Base: `bdf146ddaa82957ff81f41bbc6012684a2b5f124`. Assigned branch:
`codex/rapid-resume-readiness-20261015`. The frozen production checkout and build
`1d53IIkwjAYI_0DIBqwab` were not changed. Coordinator-owned STATUS remains unstaged.

- The focused regression failed before the runtime fix on the actual compositor
  output: both LCDs contained only `#000`, phase was `app`, status was `loading`.
- 43 focused System/compositor/input/Resume tests pass. The new cases cover
  Health and Camera, release before/after acceptance, one-shot consumption, and
  cancellation across origin, resource, sequence, visibility, sleep and failure.
- 62 scene/publication/recorder checks pass. Extracted production `renderFrame`
  verifies receipt recording precedes deferred dispatch and invalid renders
  cancel the request. Existing scene fixtures supply the new screen query.
- `npm run typecheck -- --incremental false` and `git diff --check` pass.
  No full suite or production build was run by this worker.

Private worker artifacts are under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/rapid-resume-worker/`.
The coordinator owns review, integrated checks/build, ordinary-input recapture
and native comparison. Fresh native audit `c29dc735` has no saved near-black
sample, but moving epochs remain unmatched. This patch has no new browser or
native acceptance evidence. All four whole flows remain fail/unproven.

The deferred input is an explicit browser publication adaptation. Existing
portfolio content, capture-fitted geometry and lifecycle/cadence adaptations
remain; native pixels, timing and muted audio remain unverified.
