# HOME pickup/drop settled substrate — bounded source gap

## Outcome

The settled Health child reorder agrees semantically in the native and browser
sequences: child 2 moves to child 1 and then returns to child 2. The selected
Health artwork core and the swapped blank-cell core are already within the
static pixel tier. No native held-pose reference exists, so this comparison
does not establish pickup motion, release timing or audio parity.

Two low-amplitude lower-screen residuals repeat byte-for-byte across all three
settled endpoint pairs. They are not caused by the reordered child. A bounded
read-only source check localizes them to the dynamic
`LncFolderCapture_00` composite/transport boundary, but the repository does not
yet establish that capture's intermediate target format, byte conversion or
exact PICA fragment precision. There is therefore **no source-backed runtime
change** in this slice. In particular, RGB565 quantization, a sampled shade
transform, an overlay rectangle or a fitted clip would be guesses.

This is a source gap, not a pass. The whole paired LCDs remain `fail`, and the
existing pointer-centred pickup, portfolio artwork binding and browser-owned
release/drop lifecycle remain adaptations or unproved behavior as documented
in [the pickup entry contract](home-pickup-entry-contract.md) and
[the pickup paint note](native-pickup-paint.md).

## Immutable comparison

The coordinator's comparison uses runtime
`28083c79933c6bafb2ecfc49a62c3078dfdb066e`, a delta threshold of 2, empty
masks, no image offset and no fit. The report is:

`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-pickup-visible-20261002/comparison/report.json`

Its SHA-256 is
`17bc027571296a42b63838c11241ce49501c160a1eb7cadfd88132eb2bdae3aa`.
The three native own-PNG/browser pairs are:

| Settled state | Native own-PNG SHA-256 | Browser lower SHA-256 |
| --- | --- | --- |
| Health child 2 before reorder | `eb78833a3bad3ea30b986934484ade853f67c11c0543dfcb482a49be447bc925` | `fa12fe5f0f8f807bdad3b333146dd7b8816b26e923d3c70832a6b85e7d83a065` |
| Health child 1 after left release | `4d9c67f1b692faea342d7ea6bbc36979dc7af84a179b1300e69c58ecf187aed7` | `edc8f39c617e7614dc2a74c3d58cedc54fab4c55776dc0460044be9b7490eb23` |
| Health child 2 after reverse release | `41b82524e69f6cd94185618fd3dc12e0cfea06abb198de58764f5d2c878750d0` | `7c39a76b96efc2ff81de1041cbd98b3c5d92d834efa8c94ceae9b95b3c8bdf94` |

Every row below has the same result in all three pairs:

| Raw lower-LCD region | Pixels above 2 / total | Maximum channel delta | Classification |
| --- | ---: | ---: | --- |
| Folder top blank, `(105,65,190,28)` | `0 / 5,320` | `0` or `1` | Static pixel tier |
| Folder/toolbar divider, `(18,37,284,4)` | `840 / 1,136` | `4` | Stable fail |
| Footer top line, `(22,210,276,1)` | `276 / 276` | `3` | Stable fail |
| Broad footer, `(0,200,320,40)` | `464 / 12,800` | `6` | Stable fail |

The selected artwork and blank-cell 48×48 cores also have zero pixels above 2
in every settled pair, with maximum channel delta 1. Cursor-corner and whole
LCD residuals remain active and are not treated as substrate geometry evidence.
Browser-only held frames are catalogued but excluded from native comparison.

The inspected comparison sheets are:

- paired LCDs, SHA-256
  `7cf4aa63fafaf28309c02517ce6273a077f87f3941ac5c9b7cae6aef31a2ecb3`;
- lower regions, SHA-256
  `0550d335c3c065442564b15756fe8175fc8927f1c6b33524c2f29ac2fc3936d0`;
- selected/blank/cursor at 4×, SHA-256
  `5a5a63ab89dff49834e0d7bfe64c2765cd934b8ee5b4c94e3af052c17e6f9e95`;
- desktop/mobile/reduced endpoints, SHA-256
  `79a15aadc432982bd33be60b1a5d36ce6d2332be743d85ca0ed06b81fc038721`.

These are settled pixel comparisons only. The ten-second/100-step input path
does not prove exact native cadence.

## Source localization

The pinned source remains EUR HOME title `0004003000009802`, version 24576,
content index 0 / content ID `00000082`. The HOME CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`,
decrypted `code.bin` is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`,
and `launcher_LZ.bin` is
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.
Conversion remains `ctr-native-web` 1.2.0 with CTRTool 1.3.0. The delivered
launcher pack SHA-256 is
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.

| Visible/source role | Manifest key and decrypted member | SHA-256 |
| --- | --- | --- |
| Complete lower base | `layouts.LncBase_D_01` → `launcher_LZ.bin/blyt/LncBase_D_01.bclyt` | `787e6b58e0455130ae1f7f4f35a5edf4472c8a21151a53bbce782e813fab5adf` |
| Folder capture composite | `layouts.LncFolderCapture_00` → `launcher_LZ.bin/blyt/LncFolderCapture_00.bclyt` | `da89e81a94b843f0423cd57c58244d8b28313ef30e137bb8d75c23f216281d86` |
| Settled capture fade | `animations.LncFolderCapture_00_Fade` → `launcher_LZ.bin/anim/LncFolderCapture_00_Fade.bclan` | `a340868b91e6bde04ac212cc1e6b03acdd25325290b59694b84c0137a01b8f60` |
| Capture backing pose | `animations.LncFolderCapture_00_PicUp` → `launcher_LZ.bin/anim/LncFolderCapture_00_PicUp.bclan` | `d35235569528d14632b302dc0c7bb03020db6307684ab98e05641b0d5ee3fd32` |
| Open folder panel and Back tab | `layouts.LncFolder_00` → `launcher_LZ.bin/blyt/LncFolder_00.bclyt` | `9581b9f24f79646159ee161e589fd62b92edd7b55dd5e0e2b2f1db6980fb6a24` |
| Settled folder pose | `animations.LncFolder_00_FadeIn` → `launcher_LZ.bin/anim/LncFolder_00_FadeIn.bclan` | `0cc21b182087829e94470dbd171a2c0af5d61118668eeb9a550b70e74cdecfda` |
| Footer layout | `layouts.LncBtmBtn_02` → `launcher_LZ.bin/blyt/LncBtmBtn_02.bclyt` | `1be988eda6f3d2374d8445d0773688fa1c6dd118590cb986d526c0dc4f326a44` |
| Settled footer pose | `animations.LncBtmBtn_02_SceneIn` → `launcher_LZ.bin/anim/LncBtmBtn_02_SceneIn.bclan` | `9b19c054cbb84c89a4b0c8669a2c05566f386dc7fd681410864065b8dee44a4e` |

The runtime redraws a fresh root base, plate and grid, takes canonical rows
34…239, then binds those pixels to sampler 0 of
`LncFolderCapture_00/P_Capture_00`. The decoded pane preserves source UV1,
gradient and TEV operations and uses settled Fade frame 8 / PicUp frame 0.
The folder panel is drawn later. This composition is documented in
[the folder assembly note](native-folder-assembly.md) and
[the selected-folder capture trace](native-folder-capture.md).

The causal-boundary control uses these existing root captures:

| Input | Path | SHA-256 |
| --- | --- | --- |
| Native own-PNG, six-row root / selected empty slot 33 | `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/native-close-clean-20261002/screenshots/_02.10.26_19.03.27.675.png` | `7e2afa74e9805837667131eea31a135cd938afa8491a055bf68a879855d9db69` |
| Browser lower, same Create Folder root control | `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-footer-text-20261002/controls-after/create-folder/lower.png` | `235eeb82a0beefb1419b610b1d3fb685d1ab222be271e8f3dc0f93e9540049cf` |
| Browser capture-set result | `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-footer-text-20261002/controls-after/result.json` | `6a1c94560fb20d51799bd59e409643fe67abc1b8fe61b64770c5d910a2af1b6a` |

The browser input declares commit `f031cca9`; there are no `src` or `public`
changes between that commit and the compared runtime:

```sh
git diff f031cca9..28083c79933c6bafb2ecfc49a62c3078dfdb066e -- src public
```

The reproducible calculator and its JSON output are beside the primary pickup
comparison:

- `comparison/root-control-causal-boundary.py`, SHA-256
  `d29000a5ee8cc2d0249bf5de5b62c11c20a37042de2dabd6b16a6eab662e381e`;
- `comparison/root-control-causal-boundary.json`, SHA-256
  `32d69d6f6f6d2a6f31bd3ce46e57f48af15e2b251790b0aa76454c4a7e295747`.

Both live under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-pickup-visible-20261002/`.
The exact command, run from its `comparison/` directory, is:

```sh
python3 root-control-causal-boundary.py
```

It validates all input hashes, crops native lower LCD `(40,240,320,240)` and
uses threshold 2 with empty masks, no fit and no offset. The result provides
the causal boundary:

- before folder composition, the same root divider rows are within threshold
  (`0 / 1,136` pixels above 2, maximum 1; 842 byte-exact pixels);
- the root footer top line is byte-exact (`276 / 276` pixels; maximum 0);
- after `LncFolderCapture_00` is introduced, the two residuals above repeat
  identically while the large folder-top blank remains exact.

The divider lies in the retained capture above the later folder panel, and the
footer edge is composited over the changed open-folder underlay. This rules out
a general `LncBase_D_01`, `LncBtmBtn_02`, root-toolbar or folder-panel geometry
defect. Exact blank geometry also argues against a broad crop, translation or
clip correction. Adding `pictureSampling: 'lcd'` cannot be a candidate here:
the current renderer deliberately bypasses that path for integer, unrotated,
1:1 picture projection, so the option would have no effect.

## Precise source gap and next evidence

The decoded layout and animation prove the visible transform and material
route, but they do not prove all of the dynamic capture transport. Existing
HOME evidence leaves these fields open:

- intermediate framebuffer-copy target format and channel precision;
- logical-to-allocation storage orientation and padding;
- byte conversion between the retained target and material sampler;
- exact native filtering sample positions and PICA TEV/blend rounding.

The keyboard retained-capture trace proves a 320×240-in-512×256 RGB565
descriptor only for the keyboard's own initializer and descriptor-copy path.
Its documented boundary explicitly leaves GPU pixels and caller content
unverified. Reusing that RGB565 result for HOME would cross subsystem and
call-site boundaries without evidence. Likewise, a final-frame shade fit would
hide the missing transport rule and would not be a decoded native resource.

The next valid step is either to trace the HOME capture descriptor/target state
from its actual call site or to obtain a trustworthy intermediate native
capture. An explicitly labelled fit remains permissible only if it applies a
measured transform to an identified decoded resource and passes the existing
root, folder-top, footer, mobile and reduced-motion regressions. This slice did
not identify such a transform.

## Evidence classification

- **Source-identified:** lower base, canonical capture crop, capture pane and
  settled clips, UV/material route, later folder panel and footer composition.
- **Delivered:** existing pinned HOME launcher pack; no new asset.
- **Implemented:** this source-gap note only; no runtime, presenter, renderer,
  painter, state, input or audio change.
- **Tested:** documentation relative links and `git diff --check`; no source
  tests or build were required for a documentation-only result.
- **Browser-inspected/native-compared:** coordinator-owned immutable settled
  pairs and sheets above; this worker did not operate either session.
- **Still open:** whole LCD parity, native held pose, pickup motion and cue
  timing, release animation/drop cue, cursor/banner epochs, capture target
  precision and all previously recorded portfolio adaptations.
