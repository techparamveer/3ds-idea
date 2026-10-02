# HOME Power text-raster comparison

Base: `97c954dbc159e8cfa8ebf290ae97130dddb0f984`

Branch: `codex/home-power-raster-compare-20261002`

Feature: L-01. This worker only measures the remaining settled Power text
raster. It does not change runtime code or assets, drive native/browser UI,
edit the private matrix, or claim scenario acceptance.

## Source and prior evidence

The source contract and exact element mapping remain the
[prior settled comparison](home-power-menu-compare.md#native-element-and-source-contract).
The upper main message's decoded 20-percent spacer controls and implementation
boundary are in the
[message-spacing record](../home-power-message-spacing-2026-10-02.md#source-identity).
The coordinator's integrated runtime and input result is the
[Power checkpoint](../home-power-menu-2026-10-02.md).

The pinned source is EUR 10.7.0-32E English HOME Menu
`0004003000009802` v24576, content index 0 / ID `00000082`, converted by
`ctr-native-web` 1.2.0 with CTRTool 1.3.0. The upper `Slp_U_00` member is
`4b2d4f32afdb368996a9d9f6e5947a3b0155bfad802d4c9e9b9696b5a1344027`;
the menu MSBT is
`1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350`;
the RI style table is
`224aec428f67f35e0a23b3e7de464b2b4fe1d18dd1cf07fa9b0b53d5ad3db555`;
and the shared font source is
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`.
No new source identity or inferred field is introduced here.

## Stable baseline and native repeat

The coordinator captured fresh native HOME-origin and app-origin Power screens.
Each is byte-for-byte identical to its earlier native reference, so these
settled repeats expose no native pixel variance:

| Capture | SHA-256 |
| --- | --- |
| Earlier native `_02.10.26_11.05.45.816.png` | `a585889277da13c28f9b184c279c9775997859a7dbbdd64a946016dc0dfd4a3e` |
| Fresh native `_02.10.26_11.30.18.191.png` | `a585889277da13c28f9b184c279c9775997859a7dbbdd64a946016dc0dfd4a3e` |
| Earlier app native `_02.10.26_11.11.07.761.png` | `238fb53e0d74c29ac914235e7b12016803ff5383a8f7e10ac9cd64d898cd7ad0` |
| Fresh app native `_02.10.26_11.32.39.199.png` | `238fb53e0d74c29ac914235e7b12016803ff5383a8f7e10ac9cd64d898cd7ad0` |

Each entire 400x480 PNG pair matches, not merely the cropped LCD pixels. This
supports using the fresh captures as post-source static comparators. It does
not establish matched entry cadence. A short native B probe did not establish
a HOME return or a native black-frame transition; the coordinator recovered
Power, then verified shutdown and direct Health entry before the fresh app
capture.

The coordinator recorded both a 12,000 ms repeat diagnostic and a canonical
120,000 ms settled presentation sample at runtime `82d26a8b`. Both sets are
byte-identical to the previous integrated capture. The settled sample clamps
the full source clip independently of host-route elapsed time and is the
before baseline for this slice:

| Route/input | Upper SHA-256 | Lower SHA-256 | Capture JSON SHA-256 |
| --- | --- | --- | --- |
| HOME-origin settled browser | `735ffe942e43b7b8f641a99b9ef483f4254cf8fa61b9776a10c7f46a4acb134a` | `c19085b7739ceb7605cc1e97b9660017daf0333c736c5dc60fda3148fd28c023` | `47e5d1ae1cae9399c00409945f116b215d6c6af0df16ec269fa78b4698b86324` |
| App-origin settled browser | `735ffe942e43b7b8f641a99b9ef483f4254cf8fa61b9776a10c7f46a4acb134a` | `90e4243f64914d5b044f8ef9fcdc7c34cedcdbdb58c664454cf78ee66ce6736b` | `45bb3a2f23f09ade425d077f058da568b8865e8c5693df0431072425a5ed6c70` |
| App-origin native `_02.10.26_11.32.39.199.png` | whole-file `238fb53e0d74c29ac914235e7b12016803ff5383a8f7e10ac9cd64d898cd7ad0` | same file | n/a |

The 12,000 ms diagnostic capture JSON hashes are
`a1d3d406f031b58741a81d777e53f32dd463f5a613c71174a3c4b67e6c98a7d0`
and `5ae5d7de618c1e9337f15b78b9060189adda8848a1be5d34f19ca2bd02f412a4`;
their raw LCD hashes are the same as the settled pair. Browser and native used
the same nominal 500 ms hold, but the browser records still set
`inputMatched: false` and `epochMatched: false`; this is not a HID or event-epoch
match.

The byte-identical inputs make the existing empty-mask reports authoritative
for this repeated baseline without duplicating their contact sheets: HOME
`8bb9954f1ecaf48ab4714eff9d40419374ba3f75d9624175eec96b45a8c97ac3`
and app
`90250144955d42ae63a32c933fc508939e2389aadde83d7156097e4ea1bf62e3`.
Each reports 4,334/96,000 upper pixels and 668/76,800 lower pixels above
2/255, with empty masks. Both whole scenarios remain fail.

## Bounded raster diagnostic

[`compare-home-power-menu.mjs`](../../scripts/compare-home-power-menu.mjs)
now separates zero-offset ink coverage from fractional sampling:

- Upper ink is `min(R,G,B) > 100`; lower dark-label ink is
  `max(R,G,B) < 130`. Counts are reported as shared, native-only,
  browser-only, or below both ink thresholds. These are diagnostic thresholds,
  not masks.
- The existing integer RGB and binary-mask translation searches remain
  unchanged. Every integrated text block still selects `(0,0)`.
- A bounded candidate-sampling search evaluates offsets from -0.5 through +0.5
  pixels in 1/16-pixel steps with bilinear interpolation. It scores only a
  one-pixel dilation of the zero-offset ink-mask union. Interpolation may reduce
  edge error without identifying a true source coordinate, so this result does
  not authorize a renderer change.

The repeated HOME and app diagnostics are identical for all four measured text
regions. Their reports are under private internal
`power-raster-20261002/compare-before/{home,app}/power-regions.json`, SHA-256
`53348b2e097d81b7fca2af0eff6eb127165be29e2cd66b839b2bfac06270d751`
and `a818f85f37677a77befd4c95d7f48d8bfa4525621f31b1671593ec9def500fe0`.

| Region | Native/browser ink pixels | Native-only / browser-only | High-delta shared ink / below-threshold | Best candidate sample | Support RMSE zero -> best |
| --- | ---: | ---: | ---: | ---: | ---: |
| Upper first block | 1,307 / 1,320 | 163 / 176 | 969 / 512 | `(+0.375,0)` | 38.835747 -> 24.126141 (-37.88%) |
| Upper second block | 556 / 560 | 75 / 79 | 407 / 184 | `(+0.375,0)` | 36.216509 -> 22.198159 (-38.71%) |
| Upper third block | 1,369 / 1,375 | 166 / 172 | 1,014 / 414 | `(+0.375,0)` | 36.817481 -> 22.116805 (-39.93%) |
| Lower Power Off label | 328 / 303 | 33 / 8 | 195 / 433 | `(0,0)` | 22.298938 -> 22.298938 (0%) |

The upper category counts account for all 4,331 high-delta list pixels:
2,390 are shared selected ink, 404 native-only ink, 427 browser-only ink, and
1,110 are below both hard ink thresholds (including anti-aliased edge
coverage). The lower categories likewise account for all 668 label pixels:
195 shared ink, 33 native-only, 7 browser-only and 433 below threshold.

This distinguishes the captured hypotheses narrowly:

- A whole-pixel coordinate correction is not supported: each binary mask and
  integer RGB fit remains at zero after the source spacing fix.
- Coverage is demonstrably different on both LCDs because every region has
  one-sided ink and high deltas within shared ink.
- Only the upper main-message blocks share a consistent fractional candidate
  sampling signature. Sampling the browser at `x + 0.375` reduces support RMSE
  by 37.9-39.9%; the lower label gains nothing from any tested fractional
  offset. The already matching upper heading/divider/footer and lower geometry
  rule out treating this as a global LCD offset.

The `+0.375` result is a fit to this captured pair, not proof of native LCD
sampling, pane resampling, or the direction of a runtime correction. The source
worker owns that determination. Exact glyph coverage, unsupported RI style
words, input cadence, motion and audio remain open.

## Post-source recapture

The source worker's bounded final-LCD sampler `e1836ae2` was integrated as
runtime `459d623f`. It allowlists upper `T_Main_00` with its reduced spacer
lines and lower `T_BtnB_01` / `T_BtnF_01`; it does not opt in the exact
`Software closed.` pane or general text paths. The coordinator captured both
routes at the same explicit 120,000 ms settled presentation sample as the
baseline.

| Route/input | Upper SHA-256 | Lower SHA-256 | Capture JSON SHA-256 |
| --- | --- | --- | --- |
| HOME-origin after | `62519c5edb666b5368dbb51ed7ceb13b12162a42233b644315e48790c465456f` | `d24251c858fd8a637dce868fa1a39e12ff691fba3c43fe535e8ab30598dc0488` | `e38414647a52f75798904aee1c92155c4f2f87b1618fb4d784fe953874ac08b5` |
| App-origin after | `62519c5edb666b5368dbb51ed7ceb13b12162a42233b644315e48790c465456f` | `fb54121829e4dc45bf46a4be5ad41a020326cd9edf970d55f523e57781aa1dd1` | `f3174b962600de6d408f2f1ab22e7a1c7ea0ce60fe4f4b6b60e92c5ba5cd3f4f` |

The after upper LCD is byte-identical across origins. Each capture record names
`459d623f`, `elapsedMs: 120000`, `settledPresentationSample: true`, and still
records `inputMatched: false` / `epochMatched: false`.

### Empty-mask result

Both routes have identical after metrics per LCD:

| LCD | Before pixels >2 / mean / max | After pixels >2 / mean / max | Result |
| --- | --- | --- | --- |
| Upper | 4,334 / 1.748302 / 211 | 4,329 / 1.749889 / 211 | Five fewer high pixels, but mean error regresses by 0.001587; still fail. |
| Lower | 668 / 0.174926 / 85 | 0 / 0.006411 / 2 | Static empty-mask pixel tier passes. |

The empty mask remains SHA-256
`dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
HOME/app after reports are respectively
`add9c6406c9d7f0b2d2499d4293cb7896d4d4a2fbff7843cd991743f86634878`
and `acb3069b86eab66a2a56eed3f195b82903c47cd1d383fda02055d0cd35a65dde`.
They remain `unexplained-differences` because the upper LCD fails.

The upper list owns 4,326 high pixels after, versus 4,331 before. Its mean RGB
error changes from 5.304089 to 5.309017 and its maximum remains 211. The other
three upper pixels remain the isolated footer residual; heading, quiet
background and divider retain zero high pixels. This is not a material upper
improvement and does not support accepting the upper opt-in.

The complete lower result is stronger: the Power Off artwork and label now
have zero pixels above threshold and maximum delta 2. Label mean error falls
from 4.899926 to 0.085193. App-origin `Software closed.` remains exactly
12,000/12,000 RGB pixels equal; background, divider and footer also retain zero
high pixels. No lower regression is visible in the named regions.

Direct browser before/after comparison changes only the allowlisted text
regions above threshold. Upper changes five pixels, all at `y=64`,
`x=170..172` and `x=235..236` (mean whole-LCD delta 0.007378, maximum 81).
Lower changes 666 pixels inside the button label (mean 0.171380, maximum 86).
The upper heading/footer and lower `Software closed.`/footer are byte-identical
before/after.

### Raster classification after integration

HOME/app regional reports are
`ac0ea183f379d5745482247507e9b0a173809850467941956a1ed555acdc9419`
and `7e4ca080f6af480eeaba3ef3330db723f0dfe0a95a0c87f81e531702d60e0cb0`.
They preserve the same bounded method as the before reports.

| Region | Native/browser ink pixels | Native-only / browser-only | High-delta shared ink / below-threshold | Best candidate sample | Support RMSE zero -> best |
| --- | ---: | ---: | ---: | ---: | ---: |
| Upper first block | 1,307 / 1,317 | 166 / 176 | 966 / 511 | `(+0.375,0)` | 38.910314 -> 24.234888 (-37.72%) |
| Upper second block | 556 / 560 | 75 / 79 | 408 / 181 | `(+0.375,0)` | 36.215627 -> 22.195849 (-38.71%) |
| Upper third block | 1,369 / 1,375 | 166 / 172 | 1,013 / 413 | `(+0.375,0)` | 36.824206 -> 22.111589 (-39.95%) |
| Lower Power Off label | 328 / 330 | 0 / 2 | 0 / 0 | `(0,0)` | 0.508659 -> 0.508659 (0%) |

The upper `+0.375` fit remains independently selected for every block, with
essentially the same 37.7-40.0% diagnostic reduction as before. First-block
coverage IoU slightly regresses from 0.771409 to 0.769386; second and third
remain 0.757480 and 0.780662. The upper opt-in therefore leaves the captured
fractional-coverage signature unresolved.

The lower label changes from 328/303 native/browser selected pixels and IoU
0.877976 to 328/330 and IoU 0.993939. All 328 native-selected pixels are now
shared; the two additional browser-selected pixels are within the 2/255
threshold. Its fractional fit remains `(0,0)`. This supports the lower
final-LCD path for this static pair without generalizing it to other panes.

### Inspected sheets and acceptance boundary

The HOME upper/lower contact sheets are SHA-256
`f9cb9cb1d5c8d467e78c0832ecbbc9c7230802cd2a884f139cf1c1a39d9e9b46`
and `3cfdaeb0cc1921e5d00b782f9bf4f78315abb6a8434512c8ee388dc7ed252f5c`.
The app upper is the same; its lower is
`e0941fa9d315cfde69a844a36fca054fa78fb1f16a248cd556dce18605fea692`.
All four were opened and visually inspected under private internal
`power-raster-20261002/compare-after/{home,app}/`.

The coordinator separately reports full tests at 1,778 pass / 0 fail / 23 skip
/ 1 TODO, plus typecheck and build pass. Production checks retained inert
footer touch, physical HOME return and off/reboot without errors while muted.
Those checks do not supply matched native HID, event epoch, motion, shutdown
timing, backlight ordering or audio. The lower static pixel tier passes; both
whole scenarios and the upper pixel tier remain fail.

## Handoff

The integrated candidate is supported for the lower Power Off label by an
empty-mask 668 -> 0 result with no `Software closed.` regression. It does not
resolve the upper main-message raster: the count improves only 4,334 -> 4,329,
mean error slightly regresses, and the three-block fractional signature is
unchanged. No coordinate offset or broader raster rule is proposed from this
comparison. The source owner should retain the lower evidence and reconsider
or separately justify the upper opt-in before treating this slice as complete.
