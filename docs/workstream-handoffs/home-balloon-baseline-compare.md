# HOME Health balloon baseline comparison handoff

Base: `34d7772629bd81237a0404461450c59235bcecf7`

Branch: `codex/home-balloon-compare-20261002`

## Finding

The apparent native/browser balloon offset is fully explained by the selected
tile anchor in the supplied captures. It is not evidence for an additional
global or per-title offset.

In the older browser capture Health is selected at the right one-row column,
x 244, while native Health is selected at the left column, x 76. The current
source-anchor contract clamps the 256 px balloon body's center to x 152..168
while the tail follows the tile center. It therefore predicts:

- body and text: x 152 -> 168, a +16 px translation;
- tail: x 76 -> 244, a +168 px translation;
- no vertical translation.

Independent image searches recover exactly those translations. The body and
dark text best fit at (+16, 0), the tail at (+168, 0), the title ink bounds move
from x 43..259 to 59..275, and the publisher bounds move from x 119..182 to
135..198. Widths and y bounds are unchanged.

The fresh production capture then reselects Health at x 76 through ordinary
one-row navigation, without state injection or reordering. Against the fresh
native x 76 baseline, body, title, publisher and tail all best fit at (0, 0).
This same-anchor result independently confirms that the earlier displacement
was anchor adjustment, not intrinsic balloon geometry.

Do **not** add an arbitrary balloon offset from the different-anchor pair.

## Inputs and identity

Fresh normal-speed native baseline:

- combined 400×480 PNG:
  `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/native-close-clean-20261002/screenshots/_02.10.26_10.19.03.15.png`
- file SHA-256: `00565b2d5c4b63b096c46b3fc618e3025b4f50ea3b9cd7e3cb743c7125dbad87`
- lower 320×240 RGB SHA-256: `22e80b4995cd5c4762f42a94a58918b5217ef1ac9572b13b3f1591cf425c97f4`
- Health cursor anchor detected at x 76; one-row y is 161.

Historical native baseline used by the initial diagnostic:

- file SHA-256: `6eff1af8a765730b9942c5c4ba98ebd96890efce272d489cd1d89eb68441591c`
- lower RGB SHA-256: `63df306feb2de6446083f0a8f52547f088a9f077b0646bf08a68975312a4d5ca`
- the body, text and tail regions are byte-identical to the fresh native
  baseline. The full lower screen differs by 0.763586 RGB levels RMS from
  unrelated animation/background phase.

Older different-anchor browser lower:

- `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-closing-fade/after/captures/health-after/lower.png`
- file SHA-256: `50cddf176a460cf306b6efacf706fd62bf45eba3b0a7f12b5eb3639adbcebfd1`
- lower RGB SHA-256: `22da52a70e19e6ad518d30b173ca72de82afdb680d5ecb323b8001a00c664093`
- Health cursor anchor detected at x 244.

Fresh same-anchor browser pair:

- upper file SHA-256: `d3d806ba3e96db7d356fd49148b095545a837fe667f06a04faf916d744e10409`
- lower file SHA-256: `70b536480e66eb664b842b628797c007384301ec476d3b9a89e824b3c09182a1`
- capture metadata SHA-256: `728a0c2d6fae5e0f33325a75450128a1d0187bdd6f7eb7882d281b9b7bd84431`
- production commit recorded by capture: `229e864c6c187ec3c0aad45fbefdcc44f733595a`
- capture records one row, selected slot 8 and cursor center (76,161).
- `inputMatched=false`, `epochMatched=false` remain explicit.

## Regional balloon diagnostic

The analyzer uses 8-bit RGB lower-LCD pixels. Combined native PNGs are cropped
at x 40, y 240, width 320, height 240. Half-open regions are:

| Region | Native coordinates | Purpose |
| --- | --- | --- |
| Balloon body | x 24..279, y 49..110 | complete rounded body, text and soft edge |
| Dark text comparison | x 40..263, y 60..97 | title/publisher ink selected at luminance <170 in either endpoint |
| Tail | x 66..85, y 105..125 | pointer/body overlap, ending before selected cursor pixels begin at y126 |
| Selected tile | x 40..111, y 122..204 | anchor detection/context only; excluded from balloon fitting |

Different-anchor native x76 -> browser x244:

| Component | Translation | Pixels >2 | RMSE | Maximum channel delta |
| --- | --- | ---: | ---: | ---: |
| Body | (+16, 0) | 3 / 15,872 | 0.591082 | 3 |
| Text | (+16, 0) | 0 / 1,006 | 0.622901 | 2 |
| Tail | (+168, 0) | 0 / 420 | 0.461192 | 2 |

Same-anchor native x76 -> browser x76:

| Component | Translation | Pixels >2 | RMSE | Maximum channel delta |
| --- | --- | ---: | ---: | ---: |
| Body | (0, 0) | 3 / 15,872 | 0.591082 | 3 |
| Text | (0, 0) | 0 / 1,006 | 0.622901 | 2 |
| Tail | (0, 0) | 0 / 420 | 0.461192 | 2 |

For both comparisons the three body pixels above threshold are exactly x24,
y108..110, at the left soft edge; each differs by only 3 in red/green and 2 in
blue. They are a composited fringe/rounding residual, not a shifted boundary.
The text and tail have no pixels above 2. There is no actionable balloon
geometry residual in this pair.

The delivered layout agrees with the regional interpretation. HOME title
`0004003000009802` maps `LncBlln_00` to
`launcher_LZ.bin/blyt/LncBlln_00.bclyt`, SHA-256
`d9e3b2a45efe241ee8f9f9482ddb8ad0d9eb5cff4583517143e26552e1543f27`.
Its text pane is 248×56, body halves are 136×64 each, pointer artwork is
16×21 and the pointer shadow is 16×26. The comparison tail ends with the
21-pixel pointer artwork and deliberately excludes the shadow's final pixels
where it composites over the differently sampled selected cursor. The only
three body outliers lie on the source shadow/fringe, not on text or a displaced
edge. The launcher pack source SHA-256 is
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.

Independent source worker commit `5c554650` confirms that the current
`nativeFolderBalloonPosition` path preserves the original float32 anchor
routine and produces the observed composed body centres -8/+8 for the left
and right selection cases. `N_Base_00`/`N_LR_00`, `T_Blln_00` dimensions,
centering, font metrics, spacing and alpha remain source-authored; the runtime
override supplies only the verified SMDH text. That source result and this
same-anchor pixel result independently reach the same conclusion.

Same-anchor regional hashes:

- native body RGB: `da1977a66435c26b84a20835bb900396e347a93a1cb5f4ef0f1d56776700d9ff`
- browser body RGB: `50f9d5b141a7211b9c7292b2706dcbf33c04fc8ec12d761d1df75032b4790e73`
- native tail RGB: `4bc0f4be30956844b0a0dd5350b3e7fcba37ca90baf2798fb2988366e2a106e5`
- browser tail RGB: `fbadcc8415b365ade759d45390fcf04c40ca7c76c01510d61ee897a4d66dfff0`

## Empty-mask two-LCD diagnostic

The named report compares the fresh native baseline with the fresh same-anchor
browser capture using an empty mask. It remains a diagnostic, not acceptance:

| LCD | Pixels >2 | Total pixels | RMSE | Maximum channel delta |
| --- | ---: | ---: | ---: | ---: |
| Upper 400×240 | 40,815 | 96,000 | 15.702737 | 220 |
| Lower 320×240 | 15,902 | 76,800 | 19.470998 | 246 |

The opened sheet shows the reason the whole LCDs still fail. Upper differences
include HUD state (`Internet` versus `Disabled`), Health banner position/yaw and
animation epoch, and time/status sampling. Lower differences are dominated by
different HOME icon population/order, cursor raster/phase and toolbar/edge
content. The balloon itself is not the owner of those residuals. The capture's
input and epoch flags are false, so these counts must not be promoted to a
matched scenario comparison.

Artifacts under the internal overflow root:

- report:
  `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-balloon-baseline/compare/home-balloon-comparison.json`,
  SHA-256 `34b8821f9ad8072c1c67b54b32ee1405607aba5ec50d93d9585091e214535274`
- side-by-side native / browser / 4× absolute-difference sheet:
  `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-balloon-baseline/compare/comparison-sheet.png`,
  SHA-256 `77b14cbaafe5330a5f65ac25892123789c7cee4d90838941822fb1c5163cfaf8`
- upper diff SHA-256: `08ecdc44c943474a7b118685b2f754f837454524202ae6b805de9a6cb1e25282`
- lower diff SHA-256: `18c35c470ab8cdcb2f3f6d6c69f62d3678ec9fa0972cb51d78a018638789f71f`

## Reproduction and boundary

[`scripts/compare-home-balloon.mjs`](../../scripts/compare-home-balloon.mjs)
verifies dimensions, hashes all input/canonical regions, detects selected
one-row anchors, searches body/text/tail translations independently, produces
empty-mask metrics and writes the comparison images. Pure arithmetic and
geometry coverage is in
[`tests/compare-home-balloon.test.mjs`](../../tests/compare-home-balloon.test.mjs).

- focused tests: 5/5 pass;
- native/browser inputs and the generated sheet were inspected at original
  resolution;
- no runtime, asset, matrix, GUI session or production build was changed;
- no scenario status changes, native timing claim or strict 1:1 claim.

This pixel diagnostic supports retaining the source-audited clamp/tail
anchoring and gives no basis for a corrective offset.
