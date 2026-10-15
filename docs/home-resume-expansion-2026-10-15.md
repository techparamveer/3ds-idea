# Resume expansion before departure

Source-backed correction based on captured rapid Resume from Camera selection back
to suspended Health. Base `979977f84e085be339a6ebb2012be4fc08cd4ec5` includes the
accepted-backing readiness fix. That fix remains intact. This note supersedes
only the frozen intermediate upper assumption in the earlier Resume handoffs
and [scale design](home-suspended-scale-2026-10-14.md).

## Integrated capture checkpoint

Worker `70d1911f57a16e404604d498fd28a623975a05db` is integrated as
`d40d8e1494e09450de27204d322539e7641e9f33`. Test-only commit
`06bec2ae5d6f2d2bf27e2e39a305e674dbfc06a9` gives the non-Resume folder scene mock
its `homeResumeUpperActive: () => false` query. Both are pushed to draft PR 7.
The frozen candidate is
`/Users/paramveer/.codex/worktrees/resume-expansion-verified-20261015/3ds-idea`,
branch `codex/resume-expansion-verified-20261015`, build `u777TCZvyAq0o5fDm5U3g`.
This checkpoint supersedes the original worker-only verification boundary below.

Two independent Astra extra-high reviews found no actionable issues. Spec
review passed 110 focused tests and two private probes; Standards review
passed 127 focused tests, a private paint probe and nine integrated folder
tests. The full integrated rerun reports 2,866 passes, one unchanged missing
historical Camera PNG failure, 102 skips and one TODO. Typecheck and production
build pass. The missing fixture is required by `tests/camera-date-group.test.mjs:44`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-3d-badge-sdmc-recapture-20261005/browser/lower.png`.
It was not replaced or waived. The initial integrated run had eight additional
folder mock failures; the explicit fixture correction removes those eight.

Under private root `P` defined below, the review report/manifest SHA-256 pairs are:

- `expansion-spec-review/report.md`:
  `fa404ee289adb88dc2359ff016c726ad0c8c159e1f3c8fe142dca5f6665466c3`;
  manifest `b770db143f997365cf5e33feb523d54bb7eded42bcd018ef280181fb3fed42e0`.
- `expansion-standards-review/report.md`:
  `f10a9647a1e953d396a0062d81a40aea5d54db64e882450f713da06a82bfc40e`;
  manifest `707bfbf04c7fbc347d6eaba22a31963934a99475056e6b1cd838b6a07ae88750`.

Application logs are `expansion-integrated-full-tests-rerun.log`,
`expansion-integrated-typecheck.log` and `expansion-integrated-build.log`.
No asset or shader changes accompany this slice; shader checks were not rerun.

## Browser and fixed native comparisons

The coordinator alone drove ordinary keyboard/touch inputs in muted Helium
on the built-in MacBook display. Six sessions saved 1,678 raw pairs and 5,034
original files. The auditor rehashed every original with zero structural
errors; root opened all 25 chronological and fixed-comparison sheets. All
346 placed source crops are RGBA-exact to their originals. Pre-input selectors
are in `P/expansion-candidate-policy.md`; execution details are in
`P/expansion-capture-attestation.md`. The raw root is
`P/expansion-browser-candidate/reference/scenario-matrix/v1/captures/`.

| Session prefix, in actual order | Pairs | Saved footer / departure / first app sequences |
| --- | ---: | --- |
| Health rapid `40f631a9` | 220 | 2-16 / 17-57 / 58 |
| Health repeated rapid `e9869e96` | 220 | 3-17 / 18-58 / 59 |
| Health ordinary footer `be6856f6` | 220 | 4-18 / 19-59 / 60 |
| Camera before HOME `c91ece27` | 315 | No Resume before capture cap |
| Camera ordinary HOME Resume `e66b8924` | 349 | 1-15 / 16-56 / 57 |
| Camera rapid `5b9e264a` | 354 | 3-17 / 18-58 / 59 |

Camera uses a new document. Generic sheets sort document-relative clocks;
the table and audit supplement preserve actual cross-document order. The
Camera-before cap is not continuous with either later Resume recording.
Actual rapid direction/H holds are 45.9/110.6 ms, 47.9/108.6 ms and 49.1/121.3 ms.
Their down events are 91.9, 94.1 and 99.3 ms apart. Ordinary Health touch holds
170.6 ms. These are not exact replays of earlier browser inputs or native epochs.

Rapid Health's first saved footer scales are 14 then 15, and 11 then 13 then
15. Camera's are 12 then 15. Actual upper pixels enlarge and outgoing banners
are absent by the first saved footer. These are late published poses, not
proof of the precise input-admission pose or every earlier scale step. Each
completed Resume saves footer source frames 0-14 then departure 0-40; every
departure is expanded at scale 15. None of the saved pairs has both opaque
LCDs with every RGB channel at most 1. Ordinary expanded footers retain their
upper bytes across all 15 samples. These are saved publication results, not
independent physical scan-out or native cadence acceptance.

Fixed Camera pre-HOME, ordinary and rapid app endpoints are PNG/RGBA-exact on
both LCDs. All 783 eligible Camera pairs retain stable endpoints. The five-photo
gallery and counts are the existing read-only portfolio fixture, not native
Camera fidelity. No cameraFixture query or SDMC override was used.

All 486 settled Health lower frames share PNG SHA-256
`1fce3ad4e9100fc4e6144a102b5a7ba832f6ed86b06ccfe692c79ff0e5d9ed06`.
The three new fixed endpoints match each other. Ordinary Health against the
prior candidate differs at 26,742 pixels above RGB delta 2, maximum 7; against
the lower control, 25,956/max8; against the old baseline, 14,638/max8; against
native ordinal 23, 1,776/max6. All comparisons use the complete 76,800 lower
pixels, no mask, nearest-frame search, translation or color correction. The
native crop is x40,y240,320x240 from `_15.10.26_12.26.19.209.png`.
The cause of the diffuse lower residual remains unestablished. The earlier
[614-pair control](home-rapid-resume-readiness-2026-10-15.md#lower-endpoint-control)
already reproduced an across-run difference before HOME, without a source
revision. It does not establish why the result differs.

The sealed audit is `P/expansion-candidate-audit-astra/report.md`, SHA-256
`683d1dedded358d2a370fdc48691ae6b014db9e363ad8c0b63a0a7248d33de98`.
Its manifest is `e84f62fa86ec99aeddc719f733b3533156bd756db6a2eaeffab759d4b8bcd2b9`;
original manifest is `e11ebbb30ce78a781c4108ec540711ec42648a6bbe790e059abbd0c37ebb6a02`.
The fixed native order sheet reuses ordinals 25/26/27/32/33. No new native
capture occurred in this candidate segment. Those sparse own PNGs show growth,
expanded cover and later Health, but not continuous departure or matched input
epochs. Native moving pixels and timing therefore remain unverified.

The bounded late-footer freeze is repaired, tested and browser-inspected.
All four whole flows remain fail/unproven. Next capture earlier growth and
matched native departure; keep Health lower regression acceptance withheld.
Portfolio content, initial-return/helper admission, scheduler, receipt cadence,
retained compositor and Camera fixture adaptations remain explicit. The third
native controller predicate, native raster/input timing and muted audio are
unverified. Test tab/server and the earlier native session are closed. Prior
sources/builds/captures and the unrelated human edit remain unchanged.

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
