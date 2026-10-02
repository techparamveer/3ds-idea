# HOME Settings two-row balloon removal comparison

Parent: `3c3f070808cfe35636a0e2afd59e6e494afbca6e`

Branch: `codex/home-balloon-compare-20261002`

## Outcome

Production commit `5de1f381` removes the incorrect lower title balloon from
the two-row Settings state while preserving the one-row Settings balloon
byte-for-byte.

This is established from the browser before-to-after delta, not by treating
the representative native/browser LCDs as matched. Both two-row browser
captures record rows `2`, selected slot `9`, and primary cursor center
(76,166). Before is production `229e864c`; after is `5de1f381`. In the lower
balloon body region, 15,851 of 15,872 pixels change beyond 2 RGB levels. Every
one of the 657 dark title/publisher signature pixels changes beyond 2. A local
translation search does not find the old balloon elsewhere: even its best body
candidate has RMSE 66.854481 and its best text candidate has RMSE 125.158878.
Visual inspection confirms that the after image exposes the upper icon row
where the balloon previously obscured it.

The paired one-row browser captures both record rows `1`, selected slot `9`,
and cursor center (76,161). Their complete 15,872-pixel balloon body, 8,512-pixel
text region and 420-pixel pointer region are byte-identical before and after.
The density gate therefore changes only the defective two-row presentation in
these captures.

## Native observations and comparison boundary

The fresh native two-row Settings capture is:

- `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/native-close-clean-20261002/screenshots/_02.10.26_10.45.37.119.png`
- 400×480 RGB, SHA-256
  `f3a46cb9f8b4a320048d28edf9b40e30f149af2f84742afb490b6723123a8727`
- upper/lower RGB hashes:
  `52cfa9c0214807143732980277790c5401125e0dae1fe470c72c9b8216c56165` /
  `bf3865dbf44f4eb9a661db13e4f3a7a3d95341ded21ec3ad0b48d9b1e7d5f550`.

It visibly has two icon rows, Settings selected at the native right-side
anchor, and no lower title balloon. The corresponding native one-row capture,
SHA-256 `5aec73cba4c73981f13378b142c2e5df3e63cb87de31e8d45c15187ec895b2cd`,
retains `System Settings` / `Nintendo` with its pointer at the right anchor.
Those two observations agree with the implemented density distinction.

They are not matched native/browser pairs. Native selects Settings at the
right-side anchor while browser selects it at the left. HOME population/order,
HUD state, wallpaper/banner epoch and input epoch also differ. Native is used
only to establish the representative presence/absence behavior; no native
pixel attribution or whole-scenario acceptance follows from it.

## Browser evidence identity

Two-row before:

- upper SHA-256: `291b4a085bec8da7d7d74e5b5dcb66c57a2c043610498762c8b562cb67b95252`
- lower SHA-256: `cd01eaab201778420d6ced84ef1d3a42f4b02cc409f4db67ac7302f96a328f09`
- capture metadata SHA-256:
  `6b7c1782e7783f752830f513282bdf05fdbebf9742ac08d181e11fe4e9c13c40`
- production commit: `229e864c6c187ec3c0aad45fbefdcc44f733595a`.

Two-row after:

- upper SHA-256: `56ecb2191dda218b548f6226b7b0ef0f77834c36329e2780409200a0ae98d3e9`
- lower SHA-256: `e79b2c77a239468b192d40712b28e648985e941ca4031ac25f63ef3f85af7b1b`
- capture metadata SHA-256:
  `4c4510794b0c197ffb83559d7b92b218513d43e39d1bdcb3c1f346ed26729a08`
- production commit: `5de1f381`.

Both metadata files retain `inputMatched=false` and `epochMatched=false`.

One-row preservation:

- before lower SHA-256:
  `7fb5d084ee3be003b3d134fefc6173eebf30ae20ac6a736a0d8e1af7e904b973`
- after lower SHA-256:
  `ee9c3b12564018e21b2cab7e664f59d63c5b5cfc029e8de1a555763e6e624d03`
- before/after capture metadata SHA-256:
  `6232d48e98cecbae772472e3602459a9a638b87a7ba7ba591cc8f77e2796cb4c` /
  `400367f14132dcd8bf19aa6365f03c240a58cf457fb8b08b2e93dcf0f7836239`.

## Regional diagnostic

The same lower-LCD balloon regions used for the Health baseline are reused:

| Region | Half-open coordinates | Before-to-after result |
| --- | --- | --- |
| Body | x24..279, y49..110 | 15,851/15,872 pixels >2; RMSE 66.854481; max 211 |
| Before dark text signature | selected in x40..263, y60..97 | 657/657 pixels >2; RMSE 128.551271; max 172 |
| Best nearby body fit | dx -8..8, dy -3..3 | still (0,0), RMSE 66.854481 |
| Best nearby text fit | dx -8..8, dy -3..3 | (-3,-3), RMSE 125.158878; not a retained glyph match |

Region hashes:

- before/after body RGB:
  `2be4fb40f66c928603cadcbbb0a4012bca72f9d402f01dd251dfce4299c9255c` /
  `e3f9575d39ca28404063061ebdf2aa205dce7a1a145a7cc21345dd0b019f27dd`
- before/after text-region RGB:
  `76578a1fcbac8b2c9f20cb12ba7c26df8a077f384d196abc44bd414a0251766b` /
  `c5c0572b33cf6b09c2e82c593ef92eda6816201a799dfca568c8acafda6bb7a1`.

## Empty-mask context

Browser before-to-after empty-mask counts are intentionally broad because
banner/wallpaper animation proceeds between captures:

| LCD | Pixels >2 | Total | RMSE | Maximum |
| --- | ---: | ---: | ---: | ---: |
| Upper | 57,025 | 96,000 | 19.607884 | 244 |
| Lower | 20,558 | 76,800 | 30.655145 | 211 |

Representative native versus browser after is still farther apart—60,595
upper and 25,793 lower pixels above 2—with RMSE 30.523389 / 48.888886.
The sheet visibly attributes these broad residuals to unmatched selection
anchors, icon population/order, HUD and banner epochs. They do not qualify the
bounded browser removal result and do not close a scenario.

## Reproducible artifacts

[`scripts/compare-home-settings-two-row.mjs`](../../scripts/compare-home-settings-two-row.mjs)
reuses the established balloon arithmetic, validates all input dimensions,
hashes the measured regions, checks before/after state metadata, produces the
empty-mask diagnostics and writes a five-column sheet: native, browser before,
browser after, 4× browser delta and 4× native/after context. Its focused test is
[`tests/compare-home-settings-two-row.test.mjs`](../../tests/compare-home-settings-two-row.test.mjs).

- report:
  `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-balloon-baseline/compare/settings-two-row/settings-two-row-removal.json`,
  SHA-256 `ac094a1e3e6dc67c63fc01b93ba4f4f9ccfe49163070d120c8b0023ffbbfa824`
- inspected sheet:
  `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-balloon-baseline/compare/settings-two-row/comparison-sheet.png`,
  SHA-256 `37891d7de13ff570e1d54d1fd573dedfef5b475c30b25f289095c1c817231ce7`
- browser delta SHA-256:
  `4c2517aab9b692228c884e2e5ac8dd2dbb34439cb267fab04f4ba2f87273bbda`
- native/after context diff SHA-256:
  `3190b09eadb061649f6d0c0968603d1e792a237ce87adbf653cf2426f86d9c63`.

Focused comparison test passes. The coordinator reports the integrated suite
at 1,770 pass / 0 fail / 23 skip / 1 TODO, with typecheck and production build
passing. This worker did not rerun that production suite or operate GUI/native
sessions. No runtime, matrix, scenario-status or 1:1-fidelity change is claimed
by this evidence commit.
