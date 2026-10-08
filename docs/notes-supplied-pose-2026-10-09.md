# Notes supplied-pose correction

Reviewed worker `79bcecaeffbae944aae4be6b023f6ad91ef701d3` is integrated as
`855c079b8f6eb0d03cf84c1107a2aea21c20160c`. The captured defect was a frozen
Game Notes opening cover: both first and repeat openings held the same pair
for 49 observations, then snapped to the settled screen.

## Changed behavior

`NativeLayoutRenderer.drawLayout` now uses the caller's supplied pose on every
draw, including in-place changes and instantiated child parts. Previously its
constant cache key reused the first supplied pose. This path bypasses only
pose-cache reads and writes; requested bindings, text and overrides still apply.
Ordinary `draw` keeps its bounded 16-entry pose cache. Raster caching, disposal,
resource ownership and paired publication are unchanged.

Notes keeps its existing scene-9/10 controllers, clips, clock and draw flags.
No generic incoming controller, fitted duration or replacement asset was added.
See the [intro source contract](native-notes-intro-publication.md) and
[lower composition contract](native-notes-lower-intro-validation.md).

## Source identity

All source and delivery bytes are unchanged. The pinned EUR 10.7.0-32E Game
Notes title is `0004003000009c02`, version 4096, content index 0, ID `00000007`.
CIA SHA-256 is `56612d00563671a255056ba50cf25bf36c1bf3164f9721cc9abb0051444ac07c`;
selected NCCH is `329911cd7402f01aaff57bca71f6f5b67c57b4cae885c695cc93cd8f3b542292`.

| Visible element and manifest key | CIA-internal archive | Source / delivery SHA-256 |
| --- | --- | --- |
| Upper fade, `packs/game-notes/memo-ApltBoot_U_00-arc-l.json` | `romfs/memo/ApltBoot_U_00.arc.l` | `b5ce29b07a28ae27bd813c860bae25a5825a06d26aafdc727ee31c4129469e18` / `d9b2d8b88c2b1c907e22fac31d5079710012bda0a68c2ad7f6bcc36797ba0bc3` |
| Lower fade and title belt, `packs/game-notes/memo-ApltBoot_D_00-arc-l.json` | `romfs/memo/ApltBoot_D_00.arc.l` | `284c4d476528edbf732599f2066a8af8f573854042b469f1e112d3e19459d4e6` / `e8721549694aec66c51afe72e27fd0f08b408d1f7c10e7ba10134454f370a167` |

The upper archive's `anim/ApltBoot_U_00_SceneIn.bclan` hashes
`d5e5dad524a7d074362ddc5de840dd64be715c021229c0fb8b0d1aa93d54d805`.
The lower archive's `anim/ApltBoot_D_00_SceneIn.bclan` hashes
`f6fb9ecc5f19a6865edc4a49c5d6fe35ce2436ec4d3f901367abb8f2e7c3ef44`.
Both retain 21 local frames from source range 20..40, original groups and
texture records. `lau_title_memo` supplies the original lower title.

The manifest's global converter remains `ctr-native-web` 1.2.0; the Notes
additive `uiSelection.sourceConverter` records 1.3.2. Both record CTRTool 1.3.0.
This correction performs no conversion. Exact layout and texture mappings are
retained in the packs and in private `review/notes-provenance-contract.md`,
SHA-256 `785c4755db9c435dc77173fec37b4bf8f92b7bdab1105be3301a9cc0bd4239c7`.

## Production evidence

Private root `R` is
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261008/top-row-cover-cadence/`.
Frozen runtime 855c079 has build `46bi83ixNZ_oaNNymvh6z`, BUILD_ID SHA-256
`05695f3cf77ca0fb7d8d7004e30a32aa1bcd3b294027120591b193370c86c135`.

| Capture under `R/notes-pose-final/` | First / repeat pairs | Independent checks SHA-256 |
| --- | ---: | --- |
| `notes-normal` | 93 / 97 | `d15fddd7586003cd10fbd97e0a9983fdc2a5c00ed8cdba8faf6640d6eb95f588` |
| `notes-reduced` | 76 / 77 | `4a714c69c02a1545e740c5f38795c64688b7be7a7523f818b3ca6ce152647604` |

The independent audit checked all 343 pairs and 686 raw PNGs, dimensions,
hashes, owners, ordered inputs, monotonic receipts and same-paint publication.
Coordinator and reviewer opened all ten chronological sheets and four console
views. Actual pre/post-navigation Mac bounds are recorded at 50,350,1102x700,
with viewport 1100x620 and muted audio. Both owned browsers closed afterward.

Both normal cycles now change on the first observed pair after handoff. The
upper no-software text and lower grid appear beneath the fading cover, and the
Game Notes belt moves left and clears. First changed pair to settled suffix is
448.0 / 442.9 ms. Handoff to settled is 472.7 / 464.9 ms. The only interior
duplicate pairs last 5.7 / 5.5 ms; the former 49-pair opaque hold is absent.
A first-cycle common-cover terminal publication gap of 83.2 ms remains.
Reduced motion uses endpoints and is an accessibility adaptation.

The audit is `R/review/notes-normal-reduced-review.md`, SHA-256
`0436f802ced86d4fb93a87dc42f32cff1dbe35fb2da81292cc31736765650544`.
Its checker dependency-path failure is preserved; v2 changes only the Sharp
import, not its assertions, selectors or masks.

## Native evidence and limits

The fresh silent Azahar movie is in sibling `manual-elapsed/notes-native-mac.mov`,
SHA-256 `e55344c3a028b948b7b615922f1cc356357e5c093b3a2ddc883917f02b920217`.
The fixed 100 ms sampling grid shows the same reveal/belt ordering and gives
a broad 293..507 ms semantic progression bound, not a native input epoch or
exact duration. The native audit hashes
`3feac53a6978f20dff59dd189c3658f9e6977c4b4a27475318f70d525ffa7054`.
The isolated process was muted at 100% and exited 139 after GUI Quit/Yes;
the completed movie and PNG remain valid files, and its windows were absent.

The Azahar-owned `notes-native-ready-own.png`, SHA-256
`583fa03ef919216bad0d9e30521a6911a3427b87ed669282b8de5d593a5bfe52`, is the
Notes software endpoint. The earlier report incorrectly called it HOME.
Additive `R/review/notes-native-own-png-correction.md`, SHA-256
`4f4551fd22bacf415e97c3134146fa4f4a773139118b7970ee8e94c697727765`, retracts
that description. No static anchor or mask was declared for this motion slice;
there is no retroactive endpoint acceptance.

## Checks and remaining work

Root 78 focused tests, production build and sequential nonincremental typecheck
pass. An earlier typecheck overlapped Next generated-type recreation and failed;
its log is retained. Full tests report 2526 passes, 98 skips, one TODO and the
existing missing historical Camera PNG failure, not a clean full-suite pass.
No shaders or materials changed.

## Shared renderer regression

The same frozen build was restarted with the documented private HNI fixture
environment, without rebuilding or editing served files. Fresh visible muted
captures `notes-pose-final/camera-dialog-v3`, `camera-gallery-v3` and
`sound-empty-v3` each contain eight live paired observations. All 24 pairs,
48 raw PNGs, six separate diagnostic PNGs and three consoles pass independent
integrity/receipt checks. Coordinator and reviewer opened all three chronology
sheets and all six pinned native comparison sheets.

The collector preserves two exact `/favicon.ico` 404 warnings per run. Its
v3 policy classifies only that exact same-origin URL and Chromium error text;
unknown errors, failed requests, HTTP errors and native failures still block.
No response was intercepted. The failed v1/v2 runs remain preserved. The v1
file changed after launch, so its executed hash and later on-disk hash are
qualified in `notes-pose-final/camera-dialog-404-triage.md`. The accepted v3
collector was frozen at SHA-256
`de547f8e1d97ecf207a3e41a3e73b1bf58d3c6f1a77fcf79a9a0c455c390d261`.

Camera gallery exercises the supplied base, date-row and browse-menu layouts
in one lower-screen paint. All available published diagnostic browser hashes
match exactly. Existing RGB-delta2 native residuals are unchanged:

| Diagnostic state | Upper / lower changed pixels | Mask |
| --- | ---: | --- |
| Camera Welcome page 3 | 1849 / 2479 | Existing unobscured-feed mask |
| Camera HNI gallery | 33522 / 7491 | Empty |
| Sound SD-absent main | 6222 / 7216 | Empty |

The named Camera header/Settings regions and Sound background regions remain
at zero. These are preserved static baselines, not whole-scenario passes.
Camera page 3 has no published upper browser hash, so that LCD has no exact
before/after identity claim. The comparator record and complete input/mask/
report hashes are in `R/notes-pose-final/shared-regression-comparisons.md`,
SHA-256 `7e2e630f15b5449776029332307c02070e39ede5e5be3205e1d19ca40eee7ef7`.

Gallery live pair 000 shows a black photo and unloaded thumbnails despite a
valid ready receipt. Pair 001 at 14.2 ms and all subsequent sampled pairs
match the settled diagnostic. Preserve this readiness/image-loading residual;
the capture does not prove its cause or that the cache change introduced it.
Sound live upper differs only at the clock from the fixed-date diagnostic;
all live lowers match. Diagnostic samples are not live receipts.

Independent shared review is `R/review/notes-shared-renderer-review.md`, SHA-256
`26deff8661f89192e8c9c3b513d6dc0a5cbb7bf327dfba17bd1a907fccee0505`.
Raw audit SHA-256 is
`409a9063e014b76cf308585d8a7ef13e2466678d1e3f14d088e7a00d911e18df`.

## Remaining limits

Exact Notes source-step/ticket/scene flags are not exposed in the production
receipt ledger. Static native residuals, native input epochs and audio remain
unverified. Non-native behavior still includes the host scheduling policy,
reduced motion, reference status/time profile and portfolio content. No new
native graphic, font or sound substitute was introduced. All four whole
animation scenarios remain **fail**.
