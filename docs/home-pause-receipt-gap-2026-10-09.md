# HOME pause receipt gaps, 9 October 2026

Runtime `d5c1c5a` integrates independently reviewed worker `33c1199`. The
previous first Health capture repeats upper poses 11, 13 and 18 when the HOME
update counter advances by seven. The elapsed-clock ceiling intended for
folder entry also rejected these valid pause receipts. Pause now advances one
step after an eligible new receipt regardless of that counter gap. Folder
entry retains its bounded elapsed policy. Pending-pair, owner, generation,
readiness and rebase guards are unchanged. No graphics or animation curves changed.

The worker reproduced all three captured gaps in the live painter before the
fix. Its source check uses pinned EUR HOME code.bin SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Instructions at `0x269454..0x269470` apply the current frame for status 1/2;
`0x269478` branches to advance at `0x1bbd94`. The reviewer independently checked
these instructions. Mapping native layout passes to browser receipts remains
an adaptation, not recovered native scheduling.

## Supporting checks

The implementation worker and independent reviewer both used GPT-6.1 Sol
extra-high in separate assignments. Review found no actionable code issue.
Root focused tests pass 142 checks. Full tests have 2548 passes, 98 skips and
one TODO. The sole failure is the unchanged missing historical Camera PNG
fixture in `camera-date-group.test.mjs`. Build and both nonincremental
typechecks pass. No assets, shaders or dependency files changed.

Frozen BUILD_ID `dDoE3y1lefoZkGvt9Ok5a` hashes
`17077783818e2b8994408d420db4ee063ebece4ae8630ff2efc19eff1e2d6125`.
Runtime files remained frozen while served. The production server stopped
after capture, all collectors exited 0 and owned browser windows are absent.

## Browser recapture

All dedicated test browsers were muted. Actual OS window bounds before and
after navigation were `1830,420,1102x700`, inside iPad Sidecar display 4 at
`1800,367,1164x802`. Codex stayed on the Dell. Baseline post-navigation metadata
is timed after both HOME requests, despite its unsupported before-setup stage
description. Preserve that file; it does not prove post-navigation placement
before input or continuous placement. Corrected Health's post-navigation check
precedes inputs; Camera's follows setup but precedes HOME. The Camera pre-navigation time
uses the original continue-file modification time as an upper bound; its
post-navigation time is a subsequent clock read. Neither is a UI capture epoch.

| Run | Runtime | First / repeat pairs | Pause 0 to complete, ms |
| --- | --- | --- | --- |
| Health baseline, physical HOME | `10d9aba` | 80 / 79 | 814.0 / 823.9 |
| Health corrected, physical HOME | `d5c1c5a` | 80 / 80 | 812.6 / 799.0 |
| Camera corrected, compact | `d5c1c5a` | 82 / 85 | 696.3 / 701.3 |

Both Health runs request a 500 ms physical HOME hold; actual DOM durations are
recorded separately and are not native hold measurements. Fresh baseline
does not reproduce the original seven-update stalls. These new host durations
therefore do not establish a causal speedup. The earlier 1378.1/893.1 ms Health
capture remains evidence; exact failing-before regressions establish the fix.
The corrected normal flows retain both lower fade40/no-footer receipts before
release/footer0. Independent audit verifies all 486 pairs and 972 raw PNGs:
hashes, PNG structure/CRCs, full decode, LCD dimensions, increasing same-paint
receipts, input records and complete file inventory. All 30 chronological and
boundary sheets, six final console views and three placement screenshots were
opened. Camera repeat poses 1 and 8 repeat on distinct receipts at the same
HOME update, not the former seven-update stall. No new temporal defect was found.
Root also opened two corrected boundary sheets and both first console views.

Private `independent-audit/report.json` hashes
`c22f432ccb0bbb7cbe6cabdf26467a9f5da620f9c5dabdabbbafbb666d58423c`.
`independent-review.md` and `independent-inspection.json` record the complete
inspection and the baseline placement qualification. Original captures remain
unchanged. These are browser checks, not new native acceptance or a pixel mask.

Private artifacts:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261009/home-suspend-gap/`.

## Native folder evidence and remaining scope

Native startup recovery established Health in folder 28, selected child 2.
Subsequent ordinary folder entry and Back recordings are preserved under
`continuation-20261009/folder-hover-recovery/`. Both ordinary movies have zero
audio tracks. The first has a 750 ms finite presentation-time gap and cannot
support precise motion timing. Repeat maximum gap is 33.333 ms. Native own
400x480 PNGs are preserved. An intervening empty-child selection probe means
the first own PNG is not an immediate first-entry endpoint. No matched populated
browser comparison or native source epoch follows from these recordings.

Azahar exited through actual Quit/Yes. Its final isolated config SHA-256 is
`44e50a52dd69d2e4eb5d1a07e699370b56ac149febde0b6c8ec300acac7002b6`.
Volume 0, Null output 1, Static input 2 and normal 100% speed were verified.
GUI geometry was saved; no stale config restore occurred. No default-profile,
system or unrelated-app audio setting changed. The render window moved off
Sidecar during quit, after scenario inputs and recordings had ended.

The latest human scope excludes icon-moving animations. The stopped hover fix
remains unmerged in `codex/folder-hover-source-20261009`; do not resume it.
Top-row opening, Manual opening, ordinary folder entry and HOME suspension
remain the goal. The bounded footer check identifies all 20 residual pixels as
left-edge coverage of Resume's R and s. The original layout, message, style and
A4 font are correctly bound. The retained firmware trace does not prove the
final projected coverage operation, so no epsilon, snapping rule, fitted
coverage mode or source-asset change was introduced. Private handoff
`home-pause-release/footer-source-gap-handoff-20261009.md` hashes
`cdde3628e941141bd60e67fd0c1cbd4bf00e8c3b118f44bc19383f2809067b5c`.
Further settled screenshots cannot resolve that transform/raster source-gap.
Native timing and pixels remain unaccepted. Audio acceptance remains unverified
while muted. All four whole animation flows remain fail.

A separate bounded top-row handoff audit found no proved clock bug in the
155.0/125.9 ms Browser and 104.1/9.3 ms Miiverse cover-to-incoming gaps. The
last held-cover paints follow 50 ms rAF intervals but finish after costly
destination preparation. Captures omit fresh sample time and prepared-pair
availability, so they do not establish discarded eligible progress. Existing
live readiness tests and all 85 applet checks pass, as does nonincremental
typecheck. No animation timing or readiness gate changed. The private
`web-common-incoming/applet-handoff-gap/handoff.md` preserves the bounded
findings. Do not repeat that source-only probe without new live evidence.
