# Applet cold-draw browser probe

This standalone probe follows the [alpha-retention repair](applet-alpha-retention-2026-10-15.md)
and [native opening comparison](applet-native-opening-2026-10-15.md). It changes
no production source, asset, clock or build. Runtime remains b83b768 and build
g-qLVPFQLrJnvHrbuaS0e. All four whole flows remain fail/unproven.

Private artifacts are under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261015/applet-cold-browser-probe/`.
The manifest identity is
`282488e40496aa96249ec7bcf850b3c533ede6fc27e66b57c414b9c7f68847f2`.
The preparation checksum list has SHA-256
`514551e4ba79d7913bec45f0a2a6ade6ac521bf85b9cf0cac4fb3f14eb4667b6`.
Root reran the offline check and verified every preparation checksum before
starting the loopback-only server.

## Method

The probe transpiles six frozen runtime modules. It uses the real title-entry
renderer, decoded native textures, shared bitmap font and saved opaque ready
backings from Friends pair 259 and Notifications pair 600. It verifies all asset
bytes before enabling Run. The candidate bypasses the compiled raster loop only
for P_Bg_U_00 and P_Bg_D_00. The belt and other panes retain the original path.

Root ran the predeclared compiled/generic/generic/compiled order for each app,
once per fresh document, without a Run retry. Each run draws source frames 0
through 20 exactly once and saves separate draw, readback, hash and PNG-encoding
timings. Backing restoration precedes the timed draw. Eight immutable receipts
have unique page IDs and matching manifest identities. All 21 upper, lower and
paired RGBA hashes per app agree across modes and both repetitions. No mask is
used. The encoded PNG bytes are not saved; this probe stores RGBA identities.

Chrome for Testing 153.0.8010.12, V8 15.3.76.4, ran on the built-in MacBook.
Root verified site-only mute through the Unmute Site menu on inert /health
before loading the first probe. Root inspected final paired LCD output for
both apps. A rejected navigation before slot 3 required a state refresh; no
render action had occurred on that attempted page. The owned Guest window and
server closed after slot 8. Unrelated windows and system audio were untouched.

## Results and limits

All values below are milliseconds. Later values are each run's median over
frames 1 through 20, not whole-production-frame timing.

| App and mode | First draw, trials 1 / 2 | Later median, trials 1 / 2 |
| --- | --- | --- |
| Friends compiled | 75.4 / 102.8 | 3.45 / 4.35 |
| Friends generic background | 63.8 / 57.9 | 4.20 / 6.65 |
| Notifications compiled | 95.5 / 90.3 | 3.80 / 4.00 |
| Notifications generic background | 75.7 / 76.5 | 4.90 / 5.00 |

The generic candidate has lower first-draw samples and higher later medians.
This is a small, uncontrolled sample with two runs per app/mode. System load
was not recorded before the run, and tabs share a browser process. These are
page-cold contexts, not independent cold processes. Standalone transpilation
also differs from the production Next.js bundle. No production speedup or
cadence improvement is established, and the later timing tradeoff remains open.

Earlier Node measurements used an in-memory Canvas transport emulator. They
cannot exclude real browser Canvas cost. This browser experiment supports
review of one scoped candidate, followed by production verification; it does
not justify a broad raster rewrite, prewarming, guessed delay or clock change.
Independent review found that the probe omits production's PICA texture-sample
normalization. A bounded source check compares all 160 actually visible picture
rasters across the 42 poses, totaling 32,727,040 RGBA bytes, without differences.
One forced hidden P_Home_00 raster differs, but that pane is invisible throughout
these poses. Future probes must apply the production normalization regardless.
This omission limits the method but does not invalidate the selected visible
comparisons. Review supports only one scoped production candidate experiment.
Report `review/review.md` has SHA-256
`272dad8a922d7f82dd99876b67f186d85edb4b753f379409e3261b75149b6d76`.
All-21 draw sums are higher in generic mode in every trial, so sustained cost
is an explicit rejection gate, not a dismissed noise term. Native timing,
missing sampled poses, existing fixture/font/compositor differences and muted
audio acceptance remain open.
