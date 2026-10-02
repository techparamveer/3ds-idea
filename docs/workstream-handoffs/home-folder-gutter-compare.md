# HOME open-folder gutter comparison

Date: 2 October 2026

Branch: `codex/home-folder-gutter-compare-20261002`

Base: `c1caf7cf6029950ed0e5ad7fe87bdea024a20e03`

## Bounded result

The colorful root-icon strip previously visible along the browser's left edge
while a folder was open is a root-grid viewport confounder, not a demonstrated
folder clipping or visibility defect. At the unchanged production runtime
`5b82c896`, an actual left-arrow input aligned the browser root viewport with
native and the icon strip disappeared without a renderer, layout or asset
change.

The fixed lower-LCD gutter is `x0/y64/10x146`. In the unmatched-root-viewport
run, all 1,460 pixels exceed RGB delta 2, maximum 189. In the matched-root-zero
run, 816 pixels exceed delta 2, maximum 4. The remaining pixels are a visually
uniform backing-shade residual; they are not root icons and are not attributed
to a causal layer by this comparison.

No source correction is supported by this slice. In particular, it would be
wrong to add guessed clipping from the initial pixel count. Full-LCD residuals,
the small fixed-gutter shade residual, exact transition/input timing and audio
remain open, so the whole scenario remains `fail`.

## Scope and method

This is comparison-only work. It changes no runtime, assets, shared progress
or feature-map documents, and no private scenario matrix. The worker did not
operate Azahar or the shared production browser.

Native own-PNGs use upper `(0,0,400,240)` and lower `(40,240,320,240)`
packing. Browser captures are raw 400x240 upper and 320x240 lower LCDs. Every
report retains full upper and lower controls and uses RGB threshold 2, empty
masks and no translation, crop, geometry, colour or phase fitting.

The fixed gutter was declared from the visible open-folder body geometry:
`x0..9/y64..209`. It excludes the toolbar/header above and footer below. A
larger `x0/y32/32x188` crop is retained only as visual context. The four native
open-folder gutter crops are byte-identical across occupied, vacant, reopened
and repeat states; the corresponding browser crops are likewise
byte-identical within each viewport condition.

All private evidence is under
`home-folder-gutter-20261002/comparison/`. Every version is immutable and is
written to its own directory.

## v1 prior-runtime baseline

The prior open-folder-footer v4 production captures were frozen as the first
gutter diagnostic. Runtime `5b82c896`, result SHA-256
`60ceb361d6554538b2e2926ec859c1dd03544cdc6aa92784f6db5de8412ac5e1`,
reported exit 0 and no errors. The native empty/occupied/vacant/repeat own-PNG
SHA-256 values are, respectively:

- `e025547e016a48f78d59b709a99c2603eccf72bc927a8b7d576eef7bfa8c7597`;
- `682af5c25f6d80f2c29df83747fa616361bad4cceb4b57a59a21b0ee50696063`;
- `a087ddcb3c9fb4ce56299078de1bf5719d68be1fa3c9e2b71251d3de8029b406`;
- `b3968463de5900fd791c662628d0a5446c2ee9b57d7d1377d8f874d549805f3c`.

All four pairs have the same gutter result: 1,460/1,460 pixels over delta 2,
maximum 189, MAE 28.223516, RMSE 40.816353 and absolute-RGB-difference
SHA-256
`1e292c633366e1870d257321b032e74ad5023728bca9d7fa9393890b90ef0138`.
Visual inspection shows bare native backing versus a browser root-icon strip.
That observation describes the pixels only; v1 does not prove a causal layer.

Private identities:

- analyzer SHA-256
  `11c1e243b4aa7a7abda82dde5aa2075993cb5ea5d04d73c3be733ad00d7fb42c`;
- manifest SHA-256
  `fb5d5d64df4bf76e3f7d7bcd77725c735634c212306b5a72a20f4ed6cac41a7b`;
- report SHA-256
  `72b43dcc070ef1619559737361d9d6cda0a0b7b742e1f73d732f4ddaba24350b`;
- inspected lower, context and gutter sheet SHA-256 values
  `ecd131da0f8f6a876271f047a3fe74cbe9347a6b12da3d69284799b6db062885`,
  `83bd3a5cb8dd19ffa2023e8906b2a2e70169075d55c73b840219514bc4565469`
  and
  `1de26975b234f3fb70a8631959cf51cc8ebb94b45d00c78d40415bb41db8434e`.

## v2 fresh native repeatability

The coordinator captured a fresh private-isolated native sequence from PID
47187 / window 11091 with original hardware, EUR region, Static 2, Null 1 and
volume 0. The foreground inputs were 50ms one-step taps. Quit Yes was sent;
the coordinator verified exit 0 and no remaining native window.

This cold boot restored the populated folder and selected child 2. That is the
capture-specific observation; the earlier statement that native folder
contents do not persist across cold boot is not universal.

Fresh native own-PNG identities are:

| State | Own-PNG | SHA-256 |
| --- | --- | --- |
| occupied restored | `_02.10.26_18.13.47.281.png` | `5dce33081e08115db3b139d0204740d0638bd0cc3bba94fca21206eb7c47118e` |
| vacant child 0 | `_02.10.26_18.14.20.746.png` | `2f8733aee94b79fafd7e0be418e77e7be5eb6e6fdf4d414971294de7dfe15059` |
| root after header Back | `_02.10.26_18.14.32.956.png` | `22b8f2e6167bdf4c6f597f6d22b54bf7101a90fd9b17e4dab78186b89d6fdc34` |
| reopened vacant | `_02.10.26_18.14.46.303.png` | `490e572c0f33137cfb713a949829805df3ac336a48eadde183752bc2c2f0e1ec` |
| occupied repeat | `_02.10.26_18.14.57.413.png` | `e780b1b1de8dd13f41f07f34453b87c5e47e28ebcea4f062eea0fbdf7605b3e0` |

Each fresh open-folder gutter is byte-identical to the prior corresponding
native gutter: zero pixels over delta 2, maximum zero. The four fresh
open-folder gutters are also mutually byte-identical. Full LCDs differ due to
selection poses, time and upper epochs and remain unmasked controls. The fresh
root gutter differs from the open-folder gutter at all 1,460 pixels, maximum
97; this is deliberately classified as a cross-state diagnostic, not an
acceptance pair.

Private v2 identities:

- analyzer SHA-256
  `56f5a8e9993fdf821559b25c6dd9271e245088499aee85ee2bb4e08228c70c41`;
- manifest SHA-256
  `5ed4fb3b1c7a7fae5a3cb3aab6f52ca9ae2804f1aaa7c836b792244bdc2fc190`;
- report SHA-256
  `c46d6d32fc9a7a506e38271e398813492e58528fb65358212b41fbe1d78913cf`;
- inspected lower and gutter sheet SHA-256 values
  `84e099fdaf74689c1855e9bc4fb39b9b3bb5bcbbddb946da004aacf39b6001ef`
  and
  `7b5de898d4b9d8b4c1c7b1e39d728ac7d99e6de641d77f17b82fb0e59dabecfd`.

## v3 fresh browser diagnostic and viewport gate

The coordinator's first fresh browser run contains exactly 11 named raw LCD
pairs at runtime `5b82c896`. Result SHA-256
`c82b322ffb5284ff2e355da9525b4251b0e9f3eccb7872a7372a3a4bd273ecf0`
reports exit 0 and no errors. The five primary states are occupied initial,
vacant child, root after header Back, reopened vacant and occupied repeat.
Mobile and reload captures are retained as controls; `footer-launch` is
browser-only because this run has no fresh native launch-result capture.

The four primary open-folder pairs repeat the v1 gutter result exactly:
1,460/1,460 pixels over delta 2, maximum 189, MAE 28.223516, RMSE 40.816353
and the same difference SHA-256. Desktop/mobile and occupied/vacant browser
gutter bytes are identical.

The root control reveals the confounder: the browser first-column center is
raw x6 while native is raw x34, a 28px horizontal viewport difference.
Browser folder 6 at slot 19 and native Folder 1 at slot 13 both happen to
appear at raw x90, masking that offset if only the selected folder center is
checked. The v3 open-folder result is therefore not a correction baseline and
does not support guessed clipping.

Private v3 identities:

- analyzer SHA-256
  `e8881c990a16b4018cad0770d5c5fdb5f536af7659f36c937a9ce705d1722359`;
- manifest SHA-256
  `7a8d4653f72128d99b61f4297ed179fca2aa288c11b3ba050d795c2c7ad68f18`;
- report SHA-256
  `94568b27df9bf76e7a821b54e95b73e082bf6ce6a2cd28316658263b356b5a1e`;
- inspected primary-lower, open-folder-context and open-folder-gutter sheet
  SHA-256 values
  `36ffb3e5a965a7ffd8a441a6b6e3c34ccc8a1ff4bdbc9152ee54dcbfc42615a1`,
  `cfb4e80c5b524bb508812224d7cd5574bcfa62619768f6b5cf3f6589bffb7de7`
  and
  `695686e33420b5ae9e2d417ba5c9f68e02b4a41d7b96616cc9c6a41a01038a40`.

## v4 matched-root-zero diagnosis

The coordinator then used actual input at the same runtime: a 50ms touch at
lower raw `10,137` selected the left-arrow path and returned browser root
scroll to zero. Browser first-column center became raw x34, matching native;
folder 6 moved to raw `118,82` and was opened there. The run again contains
exactly 11 named raw LCD pairs. Result SHA-256
`ea7667062de626c17d4bad2c04e9b32e94a4fe4c4b99241034348a08a62a1df4`
reports exit 0 and no errors.

The four matched-viewport open-folder states are identical within the fixed
gutter. Each compares to native as:

| Region | Pixels >2 | Maximum | MAE | RMSE | Difference SHA-256 |
| --- | ---: | ---: | ---: | ---: | --- |
| gutter `x0/y64/10x146` | 816 | 4 | 1.536758 | 1.893934 | `1c396fe913a659da9627466c75c284aa09ec4ff76dd85395f303da5ee0e13d5f` |

The native/browser root-after-Back gutter has zero pixels over delta 2 and
maximum 1. The open-folder gutter's remaining maximum-4 residual is the bare
backing shade visible in the context sheet; no root icons remain.

The same-runtime no-code control compares v3 unmatched viewport to v4 matched
viewport. For every occupied/vacant/reopened/repeat state, all 1,460 gutter
pixels change, maximum 186, MAE 28.245205, RMSE 40.667254, with difference
SHA-256
`1c9b8285ad744f63f7b8ce38142d996d0eddfb3b59e30c5265f05219027c153b`.
This establishes that root viewport/population explains the colorful strip;
it does not establish the source of the remaining shade residual.

Full LCDs still differ. For the four open-folder primary states, upper pixels
over delta 2 are 22,152 / 39,224 / 60,096 / 57,779 and lower pixels over delta
2 are 6,540 / 8,037 / 7,819 / 6,908. Folder identities, root population,
selection epochs and upper animation epochs remain non-global matches.

Private v4 identities:

- analyzer SHA-256
  `9f0a87fc68ac034cf01fad40b8e95225b9e85851bb55c78fc187f48dac373ddc`;
- manifest SHA-256
  `0326b0c34f6a6023d879fba59c225856a150dd4798ba4ed2cd5657db71bb907b`;
- report SHA-256
  `e92c2bf931095e292eee9bd393b2db6592ddba50505e321dd4bb8aaa280497ed`;
- inspected primary-lower, open-folder-context, open-folder-gutter and no-code
  gutter sheet SHA-256 values
  `cd54beca78676e44fbb49b7b2b24bf93ed2ef176f0cd8591aadd28172d3cc512`,
  `d0809a476e285f255e38aaa3f3f69ad2110ee52c1d452fe73a0cb9d4483dc219`,
  `b2877486a1164298e39df600ca9075d7d7a712a0d4394388a2e442db228bc3e5`
  and
  `1fb115121af6c8f38b47c7296e0f102c50a4ef33ad45de77e270c020e608f2ee`.

## Evidence boundaries and handoff

- **Source-identified / delivered / implemented:** none in this comparison
  slice. No source or asset change is recommended from the gutter diagnostic.
- **Tested:** all four reports validate pinned input hashes, source dimensions,
  named-state inventories, runtime commits, result metadata, empty masks and
  null fits. Both fresh browser runs report exit 0 and no errors.
- **Browser-inspected:** the coordinator visually inspected the fresh and
  root-zero captures; this worker opened the original-resolution lower,
  context, gutter and no-code sheets.
- **Native-compared:** static full LCD and fixed-ROI comparisons are recorded
  against coordinator-owned fresh own-PNGs. They are not exact motion/audio
  acceptance and do not make the full scenarios pass.

The bounded next action is no code change. Preserve the v3 confounded capture
as a diagnostic, use v4 as the matched-root-viewport result, and do not reopen
the broader footer palette investigation in this workstream. If the remaining
maximum-4 backing shade is pursued later, it needs its own source-grounded
slice and a matched capture contract rather than a guessed folder-layer fix.
