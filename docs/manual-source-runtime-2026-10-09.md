# Manual source and runtime checkpoint

## Partial-row delivery

Reviewed runtime `486232b` includes cutoff `67c5156` and the selected native
picture/material/texture/Wait-program gate. Browser Manual now submits the
partially clipped third page using its authored visible bound, not its centre
or transparent shadow. Source/cached-clone/posed validation and rejection
tests preserve readiness. Fonts, clipping, mounts, input and clocks are unchanged.

Source mapping is Manual `0004003000009b02`, v5120, content0/0000000a,
manifest `packs/manual/layout-BtnHeadLineTxt.json`, pack SHA
`9c0c0fb055d3b15311c0f0210bf3a89314c64edfab54a7596adc3878e1a3ca7a`.
The CIA member is `layout/BtnHeadLineTxt.arc`, SHA
`8c06c951ba9740058c438b69cc52c4b4bf9e2f53102b73dc8b34aad40845a1f6`.
Complete BCLYT/BCLAN/texture and existing converter identities live in private
`manual-partial-row-cutoff-20261009/followup-source-audit.json`, SHA
`811e25621abeb5f27023e270f6f071b81b5234662748998d0c64092ce18f0b59`.

Clean equivalent verification `d327ff3` passes82 explicit-source tests,
nonincremental pre/post typechecks, build and4 installed-Canvas tests with no
focused skips. Full tests have2589 passes,100 skips, one TODO and the unchanged
missing historical Camera PNG failure. Build `8NboEHDcxjRZgLL2ZnvcV` has BUILD_ID
SHA `56ee3c3ed44c60a719f0f2e4acf7b8621dca51c8455a56d5a8095a2993724f37`.

Frozen muted Sidecar first/repeat runs produce Browser92/94, Camera95/98 and
Settings91/92 pairs. `O/partial-row-all-audit/report.json` checks all562 pairs
and1124 PNGs. Both cycles give Camera60upper/9lower, Settings60/57 and
Browser60/3026 with empty masks and RGB delta2. The Browser lower improvement
from3492 does not resolve its consecutive-page spacing defect. Native pixels
begin nearY195; the browser's painted row remains about10px lower. A source
trace now proves44px relative control spacing; its correction is pending.

Independent source and production reviews are recorded under
`O/reviewer-partial-row-source-review/`, `reviewer-partial-row-production-audit/`
and `reviewer-partial-row-control-audit/`. The OS snapshots prove fitted window
context only: Camera/Settings have black startup LCDs, and Browser's late
content request failed after closure. They are not Manual content proof.
Build binding is coordinator-attested; mute launch metadata is not audio proof.
Selected in20 is still loading, with identical ready pixels one receipt later.
Missing per-cycle poses, native epochs/input and muted audio remain open.
All collectors exited0; server91625 exited130 and port3025 was empty.

The sections below retain the preceding scrollbar/renderer checkpoint.

Reviewed runtime `cbc07d7cbcc616b0deedf3d08f75619864f2f3fe` includes the
source-derived Contents scrollbar and implicit-text preparation optimization.
All four whole animation flows remain fail/unproven. Moving, pickup, hover and
drop remain excluded. This checkpoint supersedes current runtime/capture facts
in the [previous cover record](manual-cover-raster-reuse-2026-10-09.md), not its
preserved failures or clipped-viewport qualification.

Private evidence root, abbreviated O below:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/opus-completion`.

## Source and implementation

Worker `de847e79` integrates as `2a983ed`. Manual's original executable counts
Contents, category controls and page controls. It computes float32
`217.5 - 9.375 * count`, clamps to30..180, truncates to integer, then enforces
the separate32 minimum. The derived native indicator is39px for Camera's19
controls,32px for Settings'39, and67px for Browser's16. Its EndPic width is
height minus8, with the original texture-matrix writer. Existing mounts, source
Wait tracks, list placement, ownership, readiness and clocks stay unchanged.
The helper validates the selected source and its cached derived clone.

The source audit lives outside O at
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/manual-contents-scroll-source-20261009/source-audit.json`,
SHA `e23dcbe78d3fcb0155c6b03769e9f5dc3fef321f6c4c8e5aa1bad4e3660fd28e`.
Its adjacent handoff records all source/converter identities. Manual title is
`0004003000009b02`, version5120, content0/id0000000a. Original NCCH SHA is
`c493384988edd28b723b69b77f8406eaca4cf54e55446f4f5977a40e0d70c92a`.
`ExeFS/.code` at NCCH offset0x2e00 hashes
`6845e51675c92959641494eff1f68d2aadfd78096777bebe6eff0e246489a5a8`;
decompressed code hashes
`cf4658f9f618a41f8d32ff7aed40d0ea565da78a2ace349cb93698ff5f7df5d8`.
Recovery used existing CTRTool1.2.0 and Capstone5.0.7.

The visible indicator maps through manifest key
`packs/manual/layout-ScrollIndicator.json`, delivered SHA
`6d22776a9057851605ae3500363d90c4ac0d124030002d758ae7334b6249d8f6`,
to `layout/ScrollIndicator.arc`, source SHA
`158be4271728ea787981b92c127156ccf9410d8960f4cff99c96543bf1ac3847`.
Existing manifest conversion is ctr-native-web1.2.0 with the Manual additive
selection at1.4.0, both recording CTRTool1.3.0. No reconversion or public asset
change occurred. The source audit includes BCLYT, BCLAN, BCLIM and PNG hashes.

Worker `b032684` integrates as `cbc07d7`. The renderer prepares implicit native
text registers once per raster rather than once per ink pixel. Explicit FLYT,
TEV, alpha comparison and unsupported paths retain the generic implementation.
No helper, source asset, cache lifetime, animation clock or publication changes.
Installed CPU Canvas checks preserve1,148 text rasters,31,416,736 source RGBA
bytes and13,824,000 destination bytes exactly. Evidence is
`O/manual-destination-raster/README.md` and `summary.json`, SHA
`d9cbb099eed310c32d1c76d3c665337d0635bbc2a7da03c4c165fadb4d3349fd`.
Warm-JS fresh-owner medians improve Settings47.915 to41.196ms and Camera45.430
to35.214ms. Cold Settings remains about169ms. These offline values do not prove
browser speed, native cadence or removal of the first-render stall.

Both commits passed independent different-model source review before integration.
Implementation workers use GPT-6.1 Sol extra-high; the reviewer uses GPT-5.6 Sol
high. Fast is unavailable as a tool setting. No coordinator-model change is claimed.

## Production checks

Clean verification `90fa55183338a50054e5659bee9b4e6a481c83ec` has an empty
committed `src/tests/scripts/public` diff against runtime `cbc07d7`. It excludes
the unrelated uncommitted user `system.ts` edit, which remains untouched.
Build ID is `ZcsdhoitTnRFv01co-biA`; BUILD_ID SHA is
`32650d559544e13fc143009cf5c7e59ef23c9473fee8442e858fd7f27b686ad7`.

Nonincremental pre/post-build typechecks and production build pass. Full tests
have2580 passes,100 skips, one TODO and one unchanged missing historical Camera
PNG failure at `tests/camera-date-group.test.mjs:44`. No shim, skip or dependency
version change was added. Explicit pinned-source checks pass73 tests and the
installed-Canvas run passes4, both without skips. Logs are `O/combined-manual-*`
and `O/combined-canvas-tests.log`.

## Fitted browser recapture

All eight ordinary3500ms first/repeat runs used a frozen production build and
muted dedicated browsers. Viewport1100x560 fits each actual1102x700 window at
1950,420 inside Sidecar display4 at1920,367,1164x802. Codex stayed on Dell.
Coordinating Cua readbacks and screenshots attest placement; the raw-LCD
collector does not discover display or build identity. No system/Spotify audio
changed. All collectors exited0; server38486 exited130 and port3025 was empty.
No owned native/browser/server remained after capture.

| Flow | First pairs | Repeat pairs |
| --- | ---: | ---: |
| Camera Manual |93|98|
| Settings Manual |95|96|
| Browser Manual |98|99|
| Notes |99|106|
| Friends |86|91|
| Notifications |89|91|
| Browser |99|101|
| Miiverse |99|102|

`O/combined-all-audit/report.json` verifies1542 paired receipts and3084 exact PNG
hashes, dimensions, decoding, inventory, monotonically increasing receipt/paint
publication and matching valid same-paint LCDs. Runs record muted audio and no
logged errors. Selector `O/audit-combined-manual.mjs`, SHA
`cac7938857aec69cba2a36c7a0c0cb8c2c4ea19565b3423722b4a8ac7d339550`,
was frozen before capture. It selects first chronological poses, not closest
pixels. Generator visualInspection remains false; actual inspections are separate.

Independent review inspected six Manual sheets, six console captures and twelve
native/browser contact sheets. Camera/Settings/Browser consoles are stable
first/repeat. No additional visible Manual transition/console regression appeared.
Independent top-row review also verifies963 pairs/1926 PNGs and inspects ten
chronological sheets, ten consoles and five OS screenshots. No new visible
transition/endpoint defect appears. The OS screenshots are blank post-navigation
views and support window context only, not rendered-app content. Notes readiness
follows its asynchronous screen load; the other four ready receipts follow handoff
by one publication with identical pixels. Notes/Browser clock-only first/repeat
differences remain recorded. Durable verdicts are
`O/reviewer-combined-manual-audit/handoff.md`, SHA
`d3e3d4ce462c169111b2f303916e57b4a674f7a673f24784e9368a785e3397c1`,
and `O/reviewer-combined-toprow-audit/handoff.md`, SHA
`7cb0bab3121e29b29b8cf737ee23f5a7fd99624a241265a7ba6b78b6e6124a6a`.

## Native endpoints and remaining defects

Fixed empty-mask RGB-delta2 endpoint diagnostics are identical across cycles:

| Manual | Upper differing pixels | Lower differing pixels |
| --- | ---: | ---: |
| Camera |60|9|
| Settings |60|57|
| Browser |60|3492|

These select the first published `manualEntry in/20`, still labelled loading.
The next ready-marked receipt and all later receipts have identical hashes.
They are ready-equivalent static diagnostics, not readiness-timing evidence.
The indicator correction removes the targeted46 Camera upper pixels,106 to60.
The remaining60 upper pixels are icon boundary strips. Reconciliation with the
closed `manual-upper-edges-source-20261008` audit confirms the same original
32x32 pane atY3.5 and unchanged UV/filter/mask/TEV. The captured GPU's edge-tie
ownership remains unsupported; no fitted tie reversal was added. Browser's missing partial
third row contributes3340 lower pixels at x19,y195,width282,height17. A bounded
helper-only authored-bound cutoff fix is underway, not yet integrated or recaptured.
Settings and Camera lower glyph-edge residuals remain unexplained.

Fresh isolated Settings/Browser own400x480 PNGs match first/repeat exactly:
Settings SHA `2efb7fa73192641b7448735f407cfaeebf7b79445ee1b92bf256f39c1566799b`;
Browser SHA `6fba7f711c44a62139559d8e3371fa8ca097f39fe7dc775f5f985c3252cc1697`.
Camera's earlier fresh endpoint is
`187ad2e67e97fbe12f4d041e0679a8ff2ade2e8282065cc81264a8f80b8bea1f`.
Native Quit/Yes ended session29099 with exit0. Final config SHA
`fcea6b3df319de43c420d1626efcbc4bec497bee847a8520a18a39d5f27ebfad`
retains volume0, Null output, Static input,100% speed and separate windows.

Independent `O/native-manual-followup-audit/report.json`, SHA
`20d2340b35a76e47f93bd70790a58da3c86114445e13d6e6f1c74bdf91d4b035`,
verifies all60 originals and independently re-decodes all48 saved movie samples
to equal RGBA. All four movies have zero audio tracks and two invalid PTS each.
Sorted valid-PTS maximum gaps are Settings116.667/66.667ms and
Browser166.667/83.333ms. The installed ffprobe failed on a missing dylib;
AVFoundation performed the independent check without repairing global tools.
All four diagrams and distinct own PNGs were inspected. They support
HOME-to-cover-to-Contents ordering, not exact motion or epochs.

Browser source-pose gaps remain: Camera misses out18 across both cycles;
Settings misses out11..13 across both. Browser Manual's two cycles jointly
cover all42 poses but neither alone does. Top-row persistent gaps are Friends
incoming1,6,12,16,19, Notifications incoming4,10,13,15,18 and Browser cover9.
Notes and Miiverse jointly cover their required source poses across cycles;
combined coverage is not per-cycle motion verification. Native requested200ms held touch and
browser ordinary click are not matched measured inputs. Lossy movie gaps,
unmatched epochs and muted audio prevent animation acceptance.

Existing adaptations remain portfolio contents/population, seeded folder fixture,
nominal60Hz host scheduling, reduced-motion endpoints and documented captured
Manual mounts/list placement. No new visual/audio substitutes were added. The
folder and HOME-suspension defects in the [completion checkpoint](animation-completion-checkpoint-2026-10-09.md)
remain open; this Manual/top-row capture does not recertify those flows.
