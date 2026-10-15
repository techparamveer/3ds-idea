# Applet alpha retention

Reviewed runtime `b83b7683aaba2f50ce9a7724e1a7e370deac19bd` replaces one cached
full-LCD canvas per alpha with one synchronous scratch canvas per size in the
existing 8 MiB LRU. It preserves original RGB and exact alpha bytes. Readback
precedes scratch admission so eviction cannot invalidate the source. No clock,
pose, asset, HUD policy, input or publication guard changed. See the
[implementation handoff](workstream-handoffs/applet-alpha-retention-20261015.md).

## Checks

The actual Notifications composition test reproduces 19 stock picture rasters
after incoming stress versus one control. Candidate produces one versus one.
All 42 title source poses match the original raster path exactly. The optional
Canvas test stubs font ink; it is not complete-LCD/native evidence. Independent
review e64b0eb0 found no issues and tested seven cache limits.

Focused 104 checks, nonincremental typecheck and production build pass. Full
checks report 2,992 passes, 103 skips, one TODO and the unchanged missing Camera
PNG failure. Dependency/LFS setup failures are retained in the handoff.
Build is `g-qLVPFQLrJnvHrbuaS0e`; capture HEAD is
`1ea60b619e1d9ee205a19522a036c28354aa3311`, distinct from source and audit HEAD.

## Browser comparison

Private root is
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/applet-alpha-retention`.
Pre-input policy and identity pin source/build, selectors, baseline and checker.
One fresh muted MacBook Guest recorded first Friends and Notifications openings
through ordinary touch. All 259 Friends pairs saved with a user stop. All 600
Notifications pairs saved after frame-limit during context compaction. Preserve
that protocol deviation; there was no retry. Both ready destinations were
visibly observed. Guest/server closed, original New tab preserved, and both
source/build manifests plus the separate human edit rehash unchanged.

Audit `capture-audit/run-1/report.json`, SHA-256
`11d5d1dddd93c6ecd0c251e860a81abf63b54a1810d46541cac7f31ddbd9b66a`,
validates all 859 triples, receipt/input chronology, and 1,718 complete PNG
decodes with CRC/native-dimension checks. Audit rehash covers 2,649 candidate
and selected-baseline originals. Seal SHA-256 is
`ca195942413c824e8e58fa281f28eaec64c28eab37eef60b5953a7808aa23224`.
Root opened all nine native-pixel sheets and rehashed all 2,577 candidate
originals plus 18 sealed derivatives; root-inspection.json records this scope.

Fixed first outgoing20 and first shared incoming values use whole LCDs and
empty masks. All 26 Friends LCD comparisons are byte/pixel exact. Notifications
has 13 of 22 exact, including every lower LCD and outgoing20. Nine upper
incoming comparisons differ in 2,708 pixels, 2,616 above delta2, maximum244,
within the clock/battery strip x344 y3 width51 height13. The sheets show clocks
22:01 and22:29; these differences remain unmasked. No phase or pixel fitting.

First title draws still cost 37.4/26.9 ms. Later nonterminal title medians are
5.3/6.6 ms, whole paints 7.6/10.05 ms, and encoding 10.1/7.55 ms. These are
single-run recorded CPU intervals, not native cadence. Notifications has no
incoming HUD recomposition in this run, so it does not demonstrate removal
of the previous live spike. Cold first-draw work remains open. Six/seven
incoming source values are absent and the all-pose assertions remain red.

## Native scope and remaining work

No native graphic, cue or provenance mapping changed. Existing portfolio
populations, native first-use versus browser own-card destinations, and earlier
documented fitted adaptations remain separate from native fidelity. All four
whole animation flows and muted audio remain fail/unproven.

The subsequent isolated native-opening movie reaches Friends first-use help
then error002-0121. Root does not dismiss it or change network/account settings.
Normal Close and Notifications inputs were not issued. The silent 90.21-second
movie and two own-PNG anchors are preserved under sibling applet-native-opening.
Azahar exited0 and its temporary screenshot path was restored; recorder scope
and motion audit are separate pending work. Do not count that run as a matched
Friends destination or as Notifications evidence.
