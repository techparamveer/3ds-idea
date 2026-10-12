# Manual Contents held Close

Worker `codex/manual-close-held-20261012`, base
`456fdc867a45585e2ac6c4d0803e63706a735cc4`. This is an implementation handoff,
not native acceptance. No public assets or shared lifecycle code changed.

## Captured defect

Private evidence root:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion/toprow-current-20261010/manual-held-close-20261012-v1`.

The browser audit's first Close sequences 127..137 and repeat 271..281 retain
byte-identical idle footer pixels during the recorded holds. Lighter feedback
appears only after release, followed by white Decide feedback. Root inspected
`browser-audit-astra-v1/close-footer-hold-release-1x.png` and its repeat sheet.
The browser report SHA256 is
`e11e71a6ed1e8b4ae6fd493be0532dcf46ecefc56acfb742c72b07b7307e1bd7`.

Native first Close movie samples 313..345 and repeat 381..411 show lighter
held-looking Close before white. Native report SHA256
`c6b2e6bcab8db587318e3aae141f3627cc9d27491707520d71c5d9a4e898d2af`.
These are decoded lossy movie observations, not native input epochs or exact
raw LCD comparisons. The requested hold and host brackets do not prove timing.

## Implementation and source

The pure Manual reducer records one transient `manualClosePress` field for
application Contents. Shared `stockScreenActionAt` geometry identifies Close.
The existing system latch owns pointer identity; cancellation, lifecycle and
movement away clear or disarm the contact without requesting Close. A release
without a contact remains supported by the existing one-shot tap helper; the
public phased pipeline still rejects orphan releases. Semantic X/Close/Back,
document navigation, caller completion and unready escape retain their routes.

The painter requests and validates `BtnCloseLng00_Select`, then samples its
final frame 1 while pressed. Its source button and text translations and material
tracks are unchanged. The existing group-binding adaptation binds
`G_Btn_01` to the painted `BtnCloseLng01` subtree rather than `Bounding_00`.
The original loaded alias, textures and source pack stay intact. Released
Decide 4/5 takes priority; the existing cover, owner/readiness, accepted paired
publication, recovery, reduced-motion and disposal machinery is unchanged.

Source mapping: Manual EUR `0004003000009b02`, version 5120, content 0;
manifest `packs/manual/layout-BtnCloseLng00.json`, SHA256
`411498d0c53f548152186b043878befd3bb0b7433eae19e826ce025d788bc5c7`;
container SHA256
`e4c80059c6b28b031a023623e76e98599deebb363208aed3ffb8cee049143c6e`.
Held button maps to `layout/BtnCloseLng00.arc/anim/BtnCloseLng00_Select.bclan`,
SHA256 `6f2c11ed9412c874f12cba5f3232ce2690f1756a592acf58c5533ba571af0d21`.
The existing title-level converter is `ctr-native-web1.4.0`, CTRTool 1.3.0;
full identities remain in the firmware manifest. Layout, text and released
feedback provenance is unchanged from [the Close record](../manual-close-transition-2026-10-11.md).
No extraction, firmware rewrite or generated native graphic was needed.

Immediate selection of frame 1 and the group binding remain labelled host
adaptations, not recovered native input dispatch or cadence. Existing Manual
body/layout and cover timing adaptations remain. Audio stays muted/unverified.

## Checks and next gate

Private logs are in `implementation-astra-v1` under the evidence root.
The 15-file focused run passed 118, failed 0, skipped 4 existing optional pinned
source tests. It covers the public latch/reducer, held source pose and actual
picture raster, real PNG/font loader and renderer, missing Select/texture
failure, and existing Manual entry/Close lifecycle regressions. Both standard
and nonincremental TypeScript checks passed. Dependencies were copied into
this checkout and matched the frozen donor's 14,826-entry SHA256 inventory
`650941cc613e8b9d20a8a43c3591e73defb0f2af0f1f5e1b9ab4e878bcafdda2`.

At coordinator instruction, full tests/build are deferred to the combined
reviewed Manual candidate. There is no new BUILD_ID or production acceptance.
The historical missing Camera PNG full-suite failure must remain explicit.
Root alone will recapture first/repeat Manual entry and Close. No GUI, server,
profile, original capture or frozen donor was changed by this worker.
