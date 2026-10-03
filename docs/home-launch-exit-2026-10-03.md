# Launch Exit and Health Reveal

Runtime inspected: `60ecf08f`, evidence base `65ae2a0d`. This pass captures the
previously missing native logo exit, black interval and Health reveal. It
identifies a visible defect; it does not deliver a runtime correction yet.

## Captured Difference

Native first publishes Health's complete lower menu while the upper LCD is
nearly black, then reveals the upper title/background. Browser frame037
publishes both LCDs fully revealed immediately after its terminal black pair.
Native N112 upper/lower mean luma is6.09/220.18; browser B37 is220.38/220.18.
Native N102..111 are exactly black; N125 reaches the stable upper threshold.
This is a per-screen first-entry reveal defect, separate from launch receipts.
No guessed fade or new native artwork has been added.

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-launch-exit-20261003/`.
Native own400x480 PNGs are in sibling
`native-home-launch-exit-20261003/screenshots/home-launch-exit-20261003/`.
There are190 files:21 warmup plus169 continuous, from170 continuous requests.
Continuous span81.260s; maximum gap926ms. Parsed filename timestamps match
filesystem birthtime order; lexical sorting is invalid for variable fractions.
Warmup speed changed5% to55%, then returned to5% at observed moviecounter1241.
Launch onset1200 was missed. Exit/reveal is captured, but neither exact native
frame epochs nor hardware timing is proved by the slowed status counter.

`browser-desktop-v2` contains55 chronological400x240/320x240 pairs, errors[],
mute and byte-identical restored preferences. Actual Enter uses the A mapping;
folder19 versus native13 remains a placement/input-setup adaptation. Terminal
presentation345 at1765ms precedes app346 at1782ms. Raw B0 has the previous HOME
presentation receipt; B1 is the first confirmed presented launch image.
`cleanup.json` completes the frozen result's pending cleanup record. The first
browser attempt failed before app input because Chrome's intro had no window.

## Comparison

Coordinator opened the chronological native and browser sheets and final
`comparison/native-browser-stages.png`. Seven semantic stage pairs use direct
coordinates, no alignment search and empty masks. Epochs are unmatched; exact
black endpoints and lower-screen agreement do not establish scenario acceptance.

- Report SHA-256: `a13c5d5ff7256ee14e35bc393f92db5bc223637be7730fe207129d8e4e565293`.
- Stage sheet: `3571acd715210803e4bcd3167e577d98d12e0b132f70362bd00e417307ff08f0`.
- Native sheet: `d15a8abf70e11ee9407a91637787a86267fe39892e6736e59bed63cebea29695`.
- Collector: `60b091d5ec5cc4bdaa2f764779e46651cb1bbc1a22133981c28a92023eb16e5d`.

CTM SHA and firmware/executable identities are unchanged from the
[launch publication pass](home-launch-publication-2026-10-03.md); the new
`native/sha256-manifest.json` and `coordinator-session.json` record this clone.
Native PID99298 exited0. Source config remains
`d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`.
Static input2, Null output1 and volume0 preserve silence. No default-profile,
system-audio, firmware-source or private scenario-matrix changes.

## Next Owned Slice

Source chat `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` owns
`/Users/paramveer/.codex/worktrees/3ds-health-launch-reveal-20261003`, branch
`codex/health-launch-reveal-20261003`, base `65ae2a0d`. It must identify and use
the decoded native Health reveal, preserve paired readiness and lifecycle
guards, and return a tested coherent commit for coordinator integration and
visible recapture. Source gaps must remain explicit. Existing1750/120ms launch
clocks, reduced B15, fixture differences and all unrelated native residuals
remain adaptations or open defects. Exact input, motion, audio and whole1:1
remain unproved. This capture/documentation pass requires no code rebuild.
