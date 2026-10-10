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

## Verification and remaining work

The real Camera Manual footer-release regression failed before implementation
because its owner became null immediately. Focused checks now pass135 tests,
including lifecycle/retry/resource replacement, first/repeat, physical and
keyboard input, document Back, caller return, reduced motion, stale identities,
render guards and exact terminal handoff. Actual decoded button raster pixels
change at Decide4/5 while original resources stay unchanged. Marker compositor
fixtures are supporting checks, not native raster or browser acceptance.
Nonincremental typecheck, production build and `git diff --check` pass.
Full-suite results and preserved earlier harness failures are recorded
separately under private `manual-close-implementation-v1`; a missing private
Camera fixture is not changed or treated as a pass.

Coordinator integration and muted entry/Close/reopen/repeated-Close recapture
remain required under `manual-browser-fixed-v1/policy.md`. Native source-frame
selection, normal-speed ordering, input duration, motion timing and whole-flow
pixel fidelity remain unproven. Existing authored recovery and portfolio
adaptations remain; this change does not certify them. All whole flows remain
fail/unproven and audio remains muted/unverified. No worker GUI or server run.
