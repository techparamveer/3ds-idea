# Manual Close transition

Worker branch `codex/manual-close-transition-20261011`, base `57a92d3`.
This bounded change addresses the captured application-Manual Contents Close
defect. It is not a fidelity acceptance record.

## Captured defect

The private `toprow-current-20261010/manual-browser-current-v1` audit captures
session `f0932de1`: sequence140/receipt1669 shows Manual Contents, then
sequence141/receipt1670 shows uncovered Camera HOME after footer release.
The coordinator opened `close-boundary-raw-paired-1x.png`, sequences137..144.
Native `manual-continuous-v1/audit-sol-high-v1/report.md`, SHA256
`67bbc3989a7d283e67f903b9dfc72137b1d9b375c608dc7d73ace046080ca79f`,
preserves HOME Menu outgoing/opaque/incoming coverage and a saved Camera HOME
terminal. GUI5% and own-PNG capture requests do not establish native cadence.

## Delivery

[The shared close-effect handler](../src/os/app-host.ts) retains only active,
unsuspended, caller-null system-applet Manual application Contents. Footer,
semantic Close, root Back, physical X and keyboard X use that same request.
Repeated input cannot change the retained outgoing Contents. Caller-owned
helpers retain their existing immediate result/return path. Document Back
returns to Contents; document Close is outside this fitted Contents route.
The explicit unready-screen escape still removes Manual before returning HOME.

[The Manual identity adapter](../src/os/manual-footer-close.ts) extends the
existing receipt-gated applet close controller with the Manual title, screen,
request, application, runtime sequence, owner and generation. Prepared pair and
renderer/HOME resource identity are checked at publication. Only an accepted
outgoing20 pair can invoke completion once. Incoming20 still needs a separate
handoff publication before banner readiness. Resource replacement during an
already accepted HOME return revokes the old ticket but retains recovery.
Visibility, sleep, lid/context/render guards and reduced motion do not waive
the terminal receipts. Same-paint `manualClose` diagnostics label adaptation.

## Native resources and adaptations

No public assets, fonts or sounds are added or changed. Native graphics remain
from the pinned EUR10.7.0-32E dump and existing manifest keys:

- Manual `0004003000009b02`, version5120, content0, manifest
  `packs/manual/layout-BtnCloseLng00.json`, SHA256
  `411498d0c53f548152186b043878befd3bb0b7433eae19e826ce025d788bc5c7`.
  Decoded source container SHA256
  `e4c80059c6b28b031a023623e76e98599deebb363208aed3ffb8cee049143c6e`.
  `layout/BtnCloseLng00.arc/anim/BtnCloseLng00_Decide.bclan`, source SHA256
  `901424e341042a399695d295b0052de535159f64ac55603a4acd5da9a1259edf`.
  Layout source `layout/BtnCloseLng00.arc/blyt/BtnCloseLng00.bclyt`, SHA256
  `ec7b015a3b7d2891785674df063c6365dbaf7883fbcc1e2e71695590ee6183b4`.
  Existing delivery converter `ctr-native-web1.4.0`, CTRTool1.3.0, hashes in
  the manifest's `titles[0004003000009b02].uiSelection.sourceConverter`.
- HOME `0004003000009802`, version24576, existing `packs/home/common.json`,
  SHA256 `eb472b6a6c60668cdbdb88314fd010bc97b354c472adc47a9fc78629d1eb9b82`.
  Existing CmnFade upper/lower SceneOut/SceneIn and lower Aplt6 select the
  HOME icon, with sourced `lau_title_menu` message through the existing common
  cover renderer. Resource paths/source hashes remain in that pack and the
  existing firmware manifest. No new extraction or conversion was performed.

The original Decide group `G_Btn_01` selects only `Bounding_00`, a sibling of
the painted button. [The validated private binding adapter](../src/os/manual-footer-close-assets.ts)
clones only the layout group to select `BtnCloseLng01` and descendants; tracks,
textures and original source pack are unchanged. This binding, source Decide4/5
feedback selection, common-cover dispatch and accepted-pair60Hz scheduling are
explicit host adaptations, not recovered native dispatch or duration. No
reconstructed white button, guessed cue or unrelated banner/grid changes.

### Production renderer correction

The first integrated candidate `fbffd8e` failed in production immediately after
the Contents footer release: saved Close sequence11/receipt1372 is Contents;
sequence12/receipt1373 is Website display unavailable with
`Native screen composition failed: manual/main`. No Close pose was saved.
The initial raster/marker tests and code review did not catch this regression.

The decoded-loader/renderer regression now reproduces the precise cause:
the added `manual-footer-feedback` pack alias had no corresponding loaded
texture map, so the real draw returned false while ordinary Contents succeeded.
The fitted group remains a private cloned layout, but now uses the existing
`drawLayout` API under the original loaded `manual-footer-close` alias.
No renderer API, original pack, texture map, assets, receipt gate or timing
policy changes. Real PNG decoding, real bitmap fonts and the actual Contents
painter exercise both feedback poses across first/repeat loads and disposal.
Missing selected texture bytes and
missing decoded textures still fail closed. The test Canvas is byte transport,
not a native geometry or browser acceptance oracle. Prior build/captures stay
frozen; the corrected candidate was then recaptured as documented below. Corrected
checks and red/green regression logs live privately under
`manual-close-renderer-fix-v1`.

## Verification and remaining work

The real Camera Manual footer-release regression failed before implementation
because its owner became null immediately. Initial focused checks passed135 tests,
including lifecycle/retry/resource replacement, first/repeat, physical and
keyboard input, document Back, caller return, reduced motion, stale identities,
render guards and exact terminal handoff. Actual decoded button raster pixels
change at Decide4/5 while original resources stay unchanged. Marker compositor
fixtures are supporting checks, not native raster or browser acceptance.
Nonincremental typecheck, production build and `git diff --check` pass.
Full-suite results and preserved earlier harness failures are recorded
separately under private `manual-close-implementation-v1`; a missing private
Camera fixture is not changed or treated as a pass.

Correction `bdfbccd` is integrated and pushed as `dbe6355`, after independent
source review `80f6fd12`. Focused206 and independent12 tests pass, as do
typecheck/build. Full suite2739 pass, one unchanged missing private Camera PNG
failure,102 skip and1 TODO. The actual loader/renderer regression fails before
the correction and passes afterward. The coordinator's unrelated human
`system.ts` edit remains untouched and unstaged, so production uses the clean
worker checkout with identical committed source/public/tests trees.

### Corrected production evidence

Private root C is
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/toprow-current-20261010`.
Frozen build `eGGUJaaaGjH_h_YXiHEwH`, manifest `53ffed6c`, contains2830 files
and154199430 bytes. Coordinator and reviewer verify every file unchanged.
Under `C/manual-browser-fixed-v2`, policy `548ae739` precedes first entry384,
Close371, reopen404 and repeated Close392:1551 pairs, not1541. The earlier
1541 total was an arithmetic typo; no window or original was lost or added.
All four windows were stopped after visible ready destinations and fully saved.

Audit report `4e143a50` and independent production review `79295bd3` close the
captured missing-transition and renderer-error regressions for selected-Camera
Manual. Both Close runs retain feedback, outgoing cover0..20, incoming HOME0..20
and a separate handoff before returning banner growth. First/repeat outgoing20
are sequences160/158; HOME in0 follows at161/159. Banner first appears in saved
sequence185 and grows at186 in each run. These are browser observations, not
native animation epochs. Entry/reopen reach Contents. Root and reviewer open
all eight focused paired-LCD sheets and both comparison sheets.

Predeclared opaque policy `db8e8367` pins native Close12 against the first saved
out20 in each browser Close, without pose search. Native SHA256
`688cfefcdd1271b15c9d5de0d0cfe9689277d11b93772b1381870e0ba7bd9b1a`;
pin manifest `cc9daf1d`; metrics `335f0066`. Both comparisons have zero pixels
above delta2 on either LCD, maxima1 upper/2 lower, with empty masks. There is
no scaling, shifting or color fitting. This proves only the sampled static
opaque cover's delta2 match. It does not prove the moving frames or durations.

The full report/hash chain is retained in `C/manual-browser-fixed-v2/audit-sol-high-v1`:

| Artifact | SHA256 |
| --- | --- |
| report.md | `4e143a50f63354ef53a0efe4fad3802ca12f2179de22bcea8ed8e10a1045e106` |
| final-manifest.json | `b668bad7e8951409d48e1aa08d8f621f910efd8ddadc124a285bd6972f82b1ca` |
| SHA256SUMS | `c6c604934c8eab6ce705e9ca444e56e2cc188d6cb4075fd3196cebada6e79cb8` |
| Independent review at C/manual-close-production-review-v1/report.md | `79295bd378e6e6211d06e64a842086703d6ae9d60286acdf59b90a5ff9ef47be` |

### Shared regression coverage

`C/manual-shared-close-regression-v1` records first/repeat opening and Close for
Notes and Notifications on the same frozen build. All eight user-stopped
windows save3588 pairs. The audit verifies all10764 originals unchanged and
7176 independent CRC/full-RGBA decodes. Each Close includes feedback0/1,
out0..20, in0..20 and handoff. Both app-to-HOME switches stay covered; ready
opening and selected HOME endpoints are present in all four cycles. Root and
reviewer open all20 compact raw1x sheets. Audit report SHA256
`c3a34eaff3dd14f65c981c7efd693115ad24ab78997451ffb8dc7a1a8a27f8bc`;
independent review `5a590f7b0a5745f6d51a3884a00b05f76a44663ffa0c8ab83eeb4fa5640daed5`.
The sealed audit's phrase "trusted pointer events" is clarified by the review:
24 serialized events plus coordinator-attested CuaREPL dispatch, not an exported
isTrusted field. Runtime instance retirement is also not exported. No new
numeric native comparison or first-banner-onset claim follows from this run.

`C/manual-suspended-camera-v1` records Camera launch600, physical HOME298,
Manual entry235, Contents Close262 and touch Resume183:1578 pairs. Launch
reached the frame limit across compaction, but its raw sequences107..600 contain
Welcome page1/5. The other windows were stopped after visible ready endpoints.
All4734 originals remain unchanged and3156 CRC/full-RGBA decodes pass. Manual
owner manual:2 is consistent across entry and Close. Close returns to suspended
Camera with Close/Manual/Resume controls; Resume sequences45..183 show the same
Welcome pixels as launch. Root opens all six focused raw1x sheets.
Audit report SHA256
`7fb98256d4020be3663a87f2d3c49b46cfbe60ef697bca360510fe7f2a8f30a0`.

Resume sequences43/44 are fully black on both LCDs. Camera instance identity,
generation and runtime.application are not serialized; Resume diagnostics are
null on this route. The matching terminal does not prove that no instance was
recreated. These black pairs remain an open motion question requiring native
reference comparison, not a passed animation or a demonstrated new regression
from this Manual fix. No recovery error is visible in the inspected sheets.
Every temporary3033 server/tab is closed; the old3032 preview is unchanged.

Native source-frame selection, normal-speed ordering, input duration, motion
timing and whole-flow pixel fidelity remain unproven. Native slowed sampling
with requested2s touches is not equivalent to browser500ms touches. Existing
authored recovery and portfolio adaptations remain, as do the fitted group,
feedback selection and scheduling above. All whole flows remain fail/unproven;
audio stays muted/unverified. Only the coordinator operated the MacBook GUI.
