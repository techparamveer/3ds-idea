# Resume expansion before departure

Source-only correction based on captured rapid Resume from Camera selection back
to suspended Health. Base `979977f84e085be339a6ebb2012be4fc08cd4ec5` includes the
accepted-backing readiness fix. That fix remains intact. This note supersedes
only the frozen intermediate upper assumption in the earlier Resume handoffs
and [scale design](home-suspended-scale-2026-10-14.md).

## Evidence boundary

Private root `P` is
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015`.
The closed candidate sessions `3415914d-1231-4d8f-8ead-2fe93cd3b43e` and
`e982fd42-9426-45d1-8374-45f205bd7369` retained compact Health and outgoing Camera
through footer 0..14. Native-own samples 25-26 grow; 27-32 retain expanded Health
while the footer leaves. These inputs have unmatched epochs. They do not prove
an exact delay, a live branch identity or matched moving parity.

The pinned source report is `P/rapid-native-pose-triage/report.md`, SHA-256
`bba4945f52c80cc47d2fc399691dcc375b54c83559075d40cb034e5b82809f23`.
Its `source-contract.json` SHA-256 is
`e36aa5fec99f45be6e9c5298b15626939797c9d416d10bc1e80c7bf27f963e82`.
That report identifies EUR HOME `0004003000009802`, v24576, content index 0 /
`00000082`, `exefs/code.bin`, virtual base `0x100000`, SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

- Local request `0x1d8b00` enters mode 8 at `0x1d8b84` without a scale test.
  The already-selected initializer requests footer exit at `0x2ab9c8`.
- Admitted upper body `0x286e74` still calls banner service at `0x286f30`,
  then scale at `0x286f3c`. Existing banner inhibition remains authoritative.
- Mode 8 active handler `0x2a2228` can request expansion at `0x2a225c`.
  It requires absent footer at `0x2a2268` and expanded upper at
  `0x2a227c..0x2a2288` before main lower/upper SceneOut.
- The separate predicate on lower `+0x3aa8`, bytes `+0x91 != 0` and
  `+0x90 == 4`, and its input writer remain unproved. This patch does not
  claim complete native mode-8 recovery or identify the live HOME category.

No assets changed. Existing `home.launcher` mappings remain authoritative:
`romfs/launcher_LZ.bin/anim/LncBase_U_00_ScaleUpDown.bclan`, SHA-256
`e1669ce6c081b61200d24d99cd4f61fd24b8c4967fef9b4a99728c29ee10f8d8`,
converter `ctr-native-web 1.2.0`, last frame 15; footer
`LncBtmBtn_02_SceneOut` SHA-256
`df95bfcc74135a116fe14b39604cdd1300197e48b2c864989d3b40d35f13cf1d`;
upper `LncBase_U_00_SceneOut` SHA-256
`ba54b2de5825ab966a6bfd1e480d84c4479510688b1e36a20336493afdb174e9`.
The source report preserves the other exact paths, disassembly and prior traces.

## Implementation

The same System scale owner and epoch survive foreground Resume in a `resume`
variant. The screen compositor admits upper work only while the accepted source
identity remains valid and footer presentation is pending. The existing scene
clock passes that admission to System and the real banner manager. These passes
carry no HOME input, lower work or sounds. Nested runtime/action ticks leave
this screen-owned admission alone; they cannot rebase the clock after its pass.
Departure and inhibited phases do not spend upper updates.

An accepted source with unfinished scale or a drawn outgoing banner keeps using
the existing upper compositor during the footer. The source's retained app pair,
metadata and sleep pose remain its backing. New upper pixels are sampled before
the foreground application overlay and copied over it. The accepted lower HOME
underlay is unchanged. Already-expanded, banner-free sources retain their
original upper bytes and the existing footer0..14 then departure0 sequence.

Each Resume pose freezes its actual `upperScaleFrame` at paint. Only the paired
receipt can accept that upper snapshot. Footer 14 waits until that same accepted
pose has upper scale 15; a later logical frame cannot relabel earlier pixels.
The existing receipt descriptor carries this field through the recorder.
Owner, origin, scale epoch, resource/capture generation, destination readiness,
hidden/context-loss, failed-render publication and cancellation guards remain.
There is no scale-15 HOME admission gate, new timer or receipt-driven scale clock.

## Verification and limits

The real System/compositor test was red before runtime edits:
`node --test --test-name-pattern='Resume footer continues the admitted' tests/home-suspended-scale-live.test.mjs`.
It failed because footer pixels had no newly drawn scale pose, expected frame 2.
`P/resume-scale-worker/red.log` retains the result. The extracted actual scene
test also exposed nested `tickSystem` rebasing; its red result is retained in
`nested-tick-red.log`. Both tests pass after the correction.

Focused tests cover Health and Camera, both Resume routes, delayed publication,
actual scene/banner retirement, suspended host rebasing, accepted expanded
departure, ordinary expanded byte preservation, invalidation and immutable
recorded scale diagnostics. Canvas/GPU and asynchronous asset delivery are test
boundaries; System, native sessions, decoded poses, compositor, banner manager
and extracted scene clock functions are real. Logs are in `P/resume-scale-worker`.

This worker passed 150 focused tests, a final five-regression rerun, typecheck,
relative-link existence and `git diff --check`. It ran no production build or
native / browser recapture. Root owns review, integration, build and capture.
All four whole flows remain fail/unproven. Native raster, exact moving input,
audio and the third controller predicate remain unverified. Existing portfolio,
initial-return, helper-admission, scheduler, receipt cadence and compositor
adaptations remain; this source-only change establishes no whole-flow pass.
