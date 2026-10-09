# HOME lower release verification, 9 October 2026

Runtime `44a060c` integrates the reviewed lower-release correction; `77de274`
corrects the collector's definition of a complete pause endpoint. The
[source handoff](workstream-handoffs/home-pause-release-20261009.md) identifies
the pinned firmware instructions and unchanged decoded assets.

The lower fade now publishes frame 40 without the footer on two distinct
receipts, then releases the retained lower image. Host updates 14 and 15 hold
that endpoint; update 16 starts footer 0; update 22 completes the footer.
Upper motion still ends at 20. Reduced motion selects the complete endpoint.
Native layout passes mapped to browser receipts, the existing fitted cadence,
and footer start on release remain adaptations. This does not establish 1:1.

## Verification

Independent review found no actionable issue. Runtime tests pass 138 checks;
adjacent collector/input checks pass 53. Integrated full tests pass 2531 with
one historical missing Camera PNG failure, 98 skipped and one TODO. Production
build and post-build nonincremental typecheck pass. No assets or shaders changed.
Frozen build `yk57NvCXTwN2gcENe1Po2` has BUILD_ID SHA-256
`b39a1bb86dedc5bda6c2ee8532b56bc135ddcb55a63eb36c20bfbbb68d4b45c7`.

All browser windows were muted and verified on iPad Sidecar at
`1830,420,1102x700`, inside display 4 bounds `1800,367,1164x802`.
Codex remained on the Dell. Three first/repeat runs captured 326 paired
observations and 652 raw LCD PNGs:

| Run | First / repeat pairs | Pause 0 to complete, ms |
| --- | --- | --- |
| Health normal | 70 / 79 | 1378.1 / 893.1 |
| Health reduced | 7 / 6 | Direct complete endpoint |
| Camera compact | 81 / 83 | 816.3 / 777.7 |

All four normal cycles contain both distinct lower terminal receipts before
footer 0. The first Health cycle is slower and repeats upper poses 11, 13 and
18. Preserve this timing residual; do not treat the faster repeat as a replacement.
The reduced run's actual pre-navigation placement was checked before input,
but its post-navigation observation follows the first HOME ledger entry by
100 ms. The unchanged post-navigation bounds do not prove continuous placement.
The collector reports no page errors; it does not collect all console/network
failures. A first compact command was rejected before launch because it combined
incompatible hold and compact options; the corrected invocation is the capture above.

Independent audit validates every pair and raw PNG hash/dimension, and inspects
all 25 chronological/boundary sheets and six console images. No missing LCD,
upper pose reversal, lower-app reappearance after release or failed endpoint
was observed. Footer pose 2 remains off-screen; pose 4 introduces the first
visible strip. The private `ipad-review.md` SHA-256 is
`c3bd6463c70780ff5c442f02ea15916049d1bba5ebef9d9d26228a73390eca76`;
`ipad-review.json` is
`9eb4ec175ab92d046121050a92bd44fdd221a20cdfaf813bddbc3f08991b635c`.

## Native evidence

Two new silent, exact-window Azahar recordings were captured on the iPad.
The isolated render window was `2460,480,400x512`; its main window was
`1830,415,1100x700`. Volume 0, Null output 1, Static input 2 and normal 100%
speed were preserved. A temporary Shift HOME binding allowed a requested
500 ms held gesture. These host requests are not measured native input epochs.
The original B/default binding was restored after verified GUI exit 0.

Artifact root:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/home-pause-release/`.

| Native artifact | SHA-256 |
| --- | --- |
| `native-health-home-first.mov` | `2b8a69c1187b6e141ec6c421003deadf4923635dbafbfa63e58bb9efa9c05800` |
| `native-health-home-repeat.mov` | `4e16d39ac9655c9404b4f4d88542884dd530580ae81cf1b4b38d547f6404b9da` |
| `native-health-first-own.png` | `3d4de884bc2067873a74c128e7c6591ae67d3ad31767bf8f984d4b6f1212fb7c` |
| `native-health-repeat-own.png` | `1e964aa1a1674da26a257f188f6b981f66a145b5f3c9d5ca4d7b2fd6fd19bd84` |

Independent native review verifies 109 inventory hashes and opens 80 decoded
frames, six movie sheets and both static comparison sheets. Both movies have
zero audio tracks. Their largest sorted finite presentation-time gap is
63.333 ms; these samples do not identify native update epochs.

| Visible event | First movie, seconds | Repeat movie, seconds |
| --- | --- | --- |
| Lower Health clears | `(2.836667, 2.900000]` | `(2.900000, 2.946667]` |
| First footer sliver | `(2.995000, 3.041667]` | `(3.041667, 3.090000]` |
| Footer settled by | `3.248333` | `3.248333` |

These bounds support clear-before-footer ordering, not an exact native/browser
schedule. The first chronological complete browser observation, number 28,
still differs from the native own PNG at 11,350 upper and 37,726 lower pixels
above RGB delta 2. The mask is empty. Live HUD values and portfolio grid
population/selection differ; they do not explain all residuals. Twenty pixels
in lower rows 216 through 239 remain unexplained, with maximum delta 69.
No mask, source curve or acceptance threshold changed.

The private `native-review.md` SHA-256 is
`4598af9af212629da14ad3c5aba6084ec5b5561f2b2e76367738de03d55d9741`.
Its static `native-terminal-comparison/report.json` is
`42a6170f55a8781b329f61a9753c65e598f94c9186d93b93743cbe9854b5fdde`;
`native-inventory.json` is
`9ec38fb78cba5fc97724830e4f4847761d7e57401e1596d70921ea306e2feae9`.

An earlier B-key attempt did not suspend Health and is retained separately as
failed input evidence. It is not a native transition baseline. The production
server and all owned test windows were closed after capture. Audio acceptance,
exact native/browser epochs and whole-flow timing/pixels remain open.

The separate bounded Manual source probe reproduced 106 upper / 9 lower
pixels above delta 2 without finding a justified correction. Its private
`manual-endpoint/handoff.md` records the unresolved scrollbar owner/count.
No Manual pixels or comparison thresholds changed. All four whole animation
flows remain fail; continue the goal with the captured timing residuals.
