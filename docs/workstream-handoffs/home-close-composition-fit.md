# HOME close composition fit handoff

Base: `4f44e500666fc399fe03e91ecc5d60f625cb680a`

Branch: `codex/home-close-fit-20261002`

## Outcome

The captured upper application surface and suspended-software chrome use the
same sampled departure envelope: both first exceed their pre-transition noise
in capture-list index 4, remain at fixed bounds while losing contrast, and are
at the settled noise floor by index 16. They do **not**, however, fit one exact
precomposed opacity. The chrome region's independently fitted endpoint
projection falls below the exposed application surface by as much as 0.205358
at index 9. The
settled endpoint fraction noise is at most 0.008954 for the exposed application
and 0.001899 for the chrome, so this gap is not endpoint jitter.

That distinction supersedes the earlier unqualified statement that the panel
and application “fade together.” They are together in sampled onset, departure
span and completion, but the chrome fades materially faster and the PNGs
reject one shared linear endpoint blend. The correctly isolated exposed app is
itself extremely close to a linear endpoint blend: its worst transition RMSE
is only 0.550401 RGB levels. The chrome's worst RMSE is 26.191942.
Layer order, intrinsic translucent chrome, nonlinear colour blending or a
separate authored attenuation curve could each produce the residual. Capture
pixels alone do not identify which mechanism is native.

The lower dialog and upper departure first exceed their respective noise in
the same captured index, 4. At that sample the upper composition retains
0.989412 of its early-to-settled endpoint projection, while the lower LCD is
already at 0.039064 of its settled projection and the lower text-region change
is 11.722032 RGB levels RMS against a 2.851770 pre-transition bound. Therefore
the lower presentation is already visible while the upper is almost fully
retained. Capture cadence does not establish which begins first between indices
3 and 4. No filename interval, 5%-speed scaling or `AppQuit` frame mapping is
claimed.

## Reproducible inputs and method

The deterministic fitter is
[`scripts/fit-home-close-composition.mjs`](../../scripts/fit-home-close-composition.mjs),
with pure arithmetic/geometry coverage in
[`tests/fit-home-close-composition.test.mjs`](../../tests/fit-home-close-composition.test.mjs).
It requires absolute paths, verifies every PNG against `sequence.json`, and
writes its report only to the private internal-overflow tree.

Input sequence:

- manifest: `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-close-departure/native/sequence.json`
- manifest SHA-256: `7580d050f639ca238c5897be767d0632ad3e6fc9278fa820f1c3511e67a6a391`
- original own-PNG directory: `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/native-close-clean-20261002/screenshots/`
- early endpoint, list index 3: `_02.10.26_07.59.12.264.png`, SHA-256 `d00aa2e925945c3ab3519b37eabcea08dc90d52c610834eaff19ece531ac48e5`
- settled endpoint, list index 17: `_02.10.26_07.59.20.339.png`, SHA-256 `738101a0840ab8f8fdbdd07ab82a30dd86aa0ce3dc6ec79f7e02651182d45358`
- report: `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-upper-close/fit/home-close-composition-fit.json`, SHA-256 `7a5780ebe1aa055589076b11c435cdcbe4aaff5e7ba5ee6709178b69262b4e87`

For each region and capture, the fitter projects 8-bit RGB pixels onto the
line between the selected early and settled endpoints by least squares. Upper
fractions report retained early composition, where 1 is early and 0 is
settled. Lower fractions report settled-dialog appearance, where 0 is early
and 1 is settled. Fractions remain raw in the report; only residual prediction
is clipped to 0..1. This is a measured scalar summary, not a claim that a
linear crossfade is the native compositor.

The half-open combined-PNG regions are:

| Region | Included pixels | Exclusion | Count |
| --- | --- | --- | ---: |
| Exposed upper application | x 24..375, y 52..209 | whole panel x 52..347, y 52..183 | 16,544 |
| Upper chrome | x 52..347, y 52..71 and 164..183 | none | 11,840 |
| Upper panel centre | x 52..347, y 72..163 | none | 27,232 |
| Upper composition | x 24..375, y 52..209 | none | 55,616 |
| Lower dialog box | x 61..338, y 290..479 | none | 52,820 |
| Lower text probe | x 105..294, y 375..419 | none | 8,550 |
| Lower full LCD | x 40..359, y 240..479 | none | 76,800 |

The upper range stops before the independently changing upper-screen footer at
y 217. The panel itself begins at y 52: its title bar is y 52..71, centre is
y 72..163 and footer is y 164..183. The exposed-application mask removes that
whole panel rectangle, so its estimate is not contaminated by any panel pixel.

## Measured capture-order progression

These checkpoints are list indices, not native frames or durations:

| Index | Capture SHA-256 | App retained | Chrome retained | Upper retained | Lower settled | App - chrome |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 3 | `d00aa2e925945c3ab3519b37eabcea08dc90d52c610834eaff19ece531ac48e5` | 1.000000 | 1.000000 | 1.000000 | 0.000000 | 0.000000 |
| 4 | `30128a780108b08e086a1ca4cb033ce6f25a7af278fc486041dd74fb3df56527` | 0.991873 | 0.988466 | 0.989412 | 0.039064 | 0.003407 |
| 5 | `08544c6a2044d2ec10142e865dd90a7b5ce95be8b55f74bce562616e93522eac` | 0.972304 | 0.952150 | 0.960034 | 0.080745 | 0.020154 |
| 7 | `d9b31610d4ee1e326d31bf1f1294307ee108db20041901f6361a6bad7d68c788` | 0.784445 | 0.655037 | 0.709352 | 0.292680 | 0.129408 |
| 9 | `6cc96e346f9616ea26339e5ac42d916e1c25a57798f144d0b800f0da98a999f1` | 0.576483 | 0.371125 | 0.452227 | 0.483395 | 0.205358 |
| 11 | `398efa21a676ff833faf0ec7c239fadeb5d0cfd7a5226b42ff2d66826ea87858` | 0.282516 | 0.175547 | 0.218152 | 0.746491 | 0.106969 |
| 13 | `c15c8c23eacda597beda19405e4507ffc2d356419878715e9d9f904b9bf36495` | 0.105810 | 0.065995 | 0.081885 | 0.907404 | 0.039815 |
| 16 | `b69fc2ffebdc16b78f08090c068ff532a04e61fb416b673e7c7bb0280aa10d09` | 0.000136 | 0.000081 | 0.000173 | 1.000000 | 0.000055 |
| 17 | `738101a0840ab8f8fdbdd07ab82a30dd86aa0ce3dc6ec79f7e02651182d45358` | 0.000000 | 0.000000 | 0.000000 | 1.000000 | 0.000000 |

Across indices 0..3, retained-fraction ranges are exactly 1 for exposed
application, 0.999993..1.000056 for chrome and
0.999998..1.000009 for the combined upper region. Across indices 17..36,
the corresponding settled ranges are -0.008954..0, -0.001899..0 and
-0.004168..0. The lower text projection's pre-transition range is
-0.000401..0.006020. The larger 0..0.034721 lower-full range is selection
animation under the future dialog and is why onset detection uses the tighter
text probe rather than the whole lower LCD.

For comparison, define application departure progress
`p = 1 - appRetained`. The corrected endpoint projections are sorted by `p`
and monotonic. RMSE is the per-capture miss against that region's own endpoint
projection in 8-bit RGB levels; it is a model-error bound, not a statistical
confidence interval.

| `p` | App retained | Chrome-region projection | App RMSE | Chrome RMSE |
| ---: | ---: | ---: | ---: | ---: |
| 0.000000 | 1.000000 | 1.000000 | 0.000000 | 0.000000 |
| 0.008127 | 0.991873 | 0.988466 | 0.217722 | 1.674768 |
| 0.027696 | 0.972304 | 0.952150 | 0.286903 | 5.946806 |
| 0.105664 | 0.894336 | 0.831099 | 0.293155 | 17.195836 |
| 0.215555 | 0.784445 | 0.655037 | 0.304120 | 25.205131 |
| 0.282371 | 0.717629 | 0.553509 | 0.321333 | 26.191942 |
| 0.423517 | 0.576483 | 0.371125 | 0.349096 | 22.616427 |
| 0.576337 | 0.423663 | 0.263396 | 0.394635 | 16.734013 |
| 0.717484 | 0.282516 | 0.175547 | 0.443816 | 11.151058 |
| 0.842865 | 0.157135 | 0.097695 | 0.490184 | 6.221673 |
| 0.894190 | 0.105810 | 0.065995 | 0.512745 | 4.195627 |
| 0.972158 | 0.027842 | 0.017379 | 0.550401 | 1.156265 |
| 0.991727 | 0.008273 | 0.005108 | 0.529160 | 0.410881 |
| 0.999864 | 0.000136 | 0.000081 | 0.443400 | 0.243585 |
| 1.000000 | 0.000000 | 0.000000 | 0.000000 | 0.000000 |

The “chrome-region projection” is **not** literal `N_Wndw_00` alpha. Those
header/footer pixels are the composited panel over an application that is also
fading. Applying that fraction directly to the pane would double-count the
changing underlay and is not supported.

The direct pane-opacity proxy is instead local fixed-edge contrast: subtract
the settled wallpaper gradient at x=51.5 and x=347.5, normalize each side to
its early strength, then average the two sides. This measures the remaining
panel boundary itself. Half-range is the left/right disagreement:

| `p` | App retained | Normalized panel-edge contrast | Half-range | Edge remains dominant |
| ---: | ---: | ---: | ---: | :---: |
| 0.000000 | 1.000000 | 1.000000 | 0.000000 | yes |
| 0.008127 | 0.991873 | 0.976865 | 0.000080 | yes |
| 0.027696 | 0.972304 | 0.912558 | 0.000698 | yes |
| 0.105664 | 0.894336 | 0.727084 | 0.001306 | yes |
| 0.215555 | 0.784445 | 0.450634 | 0.003423 | yes |
| 0.282371 | 0.717629 | 0.288948 | 0.005549 | yes |
| 0.423517 | 0.576483 | 0.040146 | 0.009221 | no |
| 0.576337 | 0.423663 | 0.014450 | 0.007222 | no |
| 0.717484 | 0.282516 | 0.008906 | 0.005500 | no |
| 0.842865 | 0.157135 | 0.005587 | 0.002174 | no |
| 0.894190 | 0.105810 | 0.004241 | 0.002671 | no |
| 0.972158 | 0.027842 | 0.001991 | 0.001174 | no |
| 0.991727 | 0.008273 | 0.001096 | 0.000309 | no |
| 0.999864 | 0.000136 | 0.001009 | 0.000221 | no |
| 1.000000 | 0.000000 | 0.000000 | 0.000000 | no |

No nonmonotonic capture point blocks interpolation. The expected edge is still
the dominant local gradient through `p=0.282371`; afterward it is below other
local gradients and the normalized values are a near-zero noise tail rather
than reliable detailed curve shape. A bounded pane-opacity adaptation can use
the measured points through that threshold, interpolate to zero by the next
sample, and clamp the tail to zero. Endpoint jitter and left/right half-range
are the available empirical uncertainty bounds. Adjacent PNGs are not
independent trials, so tighter probabilistic error bars would be invented.

## Fixed-edge and residual evidence

After subtracting the settled-background horizontal gradient and averaging
rows 104..163, the dominant left and right chrome boundaries remain exactly
x=51.5 and x=347.5 for every measurable capture from index 3 through index 8.
The left/right edge strengths fall from 40.839593/40.658307 at index 3 to
11.573910/11.973803 at index 8 without moving. At index 9 the chrome edge is
weaker than unrelated local gradients, so later peak coordinates are not edge
locations. This confirms a fixed-bounds loss of contrast and contradicts the
scale-coupled `LncBase_U_00_SceneOut` candidate.

Direct endpoint interpolation is not pixel-exact. Over transition indices
4..16, worst residuals are:

| Region | Maximum MAE | Maximum RMSE | Maximum absolute channel residual |
| --- | ---: | ---: | ---: |
| Exposed application | 0.329013 at index 14 | 0.550401 at index 14 | 4.213491 at index 14 |
| Chrome | 14.915246 at index 8 | 26.191942 at index 8 | 106.944755 at index 8 |
| Combined upper | 14.786748 at index 9 | 20.677512 at index 8 | 108.753676 at index 8 |
| Lower full LCD | 41.617909 at index 8 | 48.322568 at index 8 | 217.971614 at index 12 |

Those residuals show that the isolated app surface is consistent with a direct
linear endpoint fade to sub-level error, while the composited chrome region is
not. Its endpoint projection must not be reused as pane alpha. The lower
presentation is likewise a layered mask/window/text composition, not a direct
early-to-settled image blend.

## Normal-speed endpoint check

Fresh 100%-speed own-PNGs independently confirm the endpoint states without
adding intermediate timing evidence:

- suspended Health: `_02.10.26_08.20.33.756.png`, SHA-256 `9bc7c8bf1f2279300c46d5881778a97c57e2461ef33c50de9d43e2d6ed69088d`
- empty upper wallpaper plus retained lower closing presentation:
  `_02.10.26_08.20.50.671.png`, SHA-256 `a33cdb74b96f8456ba430be27e840977d8c6de71707bd5d3cdc47506eeb74afa`

The normal suspended upper differs from the 5%-sequence early endpoint by
0.442920 RGB levels RMS over the combined upper region. The normal settled
upper differs from the selected 5%-sequence settled wallpaper by 4.224591 RMS,
consistent with a different wallpaper phase; its lower LCD is byte-identical
to the selected settled lower endpoint. These are endpoint confirmations only.

## Actionable composition recommendation

If a visible correction must proceed before the native composition owner is
traced, label it an **adaptation** and use a fixed-bounds, multi-layer close
composition:

1. Keep the upper application rectangle and suspended chrome at their settled
   x/y geometry; do not scale or translate either layer.
2. Drive the app surface by one normalized close-progress envelope. Drive a
   separate fixed-geometry `N_Wndw_00` opacity from the normalized panel-edge
   contrast curve, not from the chrome-region endpoint projection. Interpolate
   the reliable samples through `p=0.282371`, reach zero by `p=0.423517`, then
   clamp zero. If the coordinator uses the existing sourced AppQuit scalar as
   `p`, that clock association is itself an explicit capture-fit adaptation,
   not native timing evidence. This narrow override does not prove or recreate
   the native layer order, application fade or wallpaper blend.
3. Advance the sourced lower mask/window presentation concurrently. At the
   first sampled upper change the lower composition is already observable;
   there is no evidenced upper-only lead-in.
4. Do not derive duration from filenames or multiply by the temporary 5%
   emulator setting. Do not bind these capture indices automatically to
   `BannerBG_AppQuit` or any existing host frame clock.

This recommendation is a captured-pixel fit, not native source proof. The
source owner still needs to identify the upper composition owner, blend order,
curve and activation epoch. Coordinator integration then requires matched
native/browser captures at named updates and fresh paired-LCD diffs. No matrix
entry, browser inspection, audio result or strict 1:1 claim changes here.

## Verification run

`node --test tests/fit-home-close-composition.test.mjs` passes 5/5, including
an exact panel/header/body/footer region guard. The fitter
verified all 37 manifest hashes and emitted the report above. This worker ran
no production build, typecheck, browser, Azahar, audio session or shared
capture loop. Documentation link checks and `git diff --check` remain required
before commit.
