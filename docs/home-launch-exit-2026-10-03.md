# Launch Exit and Health Reveal

Baseline runtime `60ecf08f`, evidence commit `b5f47c1f`. Runtime `fbb194fa`
integrates worker `864156e3`; readiness follow-up `c6c567d7` integrates
`7c139ce9`. This pass captures the previously missing native logo exit, black
interval and Health reveal, then visibly corrects the upper-only reveal.

## Captured Difference

Native first publishes Health's complete lower menu while the upper LCD is
nearly black, then reveals the upper title/background. Browser frame037
publishes both LCDs fully revealed immediately after its terminal black pair.
Native N112 upper/lower mean luma is6.09/220.18; browser B37 is220.38/220.18.
Native N102..111 are exactly black; N125 reaches the stable upper threshold.
This is a per-screen first-entry reveal defect, separate from launch receipts.
The correction uses the decoded Health fade, not guessed artwork or CSS.

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

## Delivered Source

Source chat `01a0f9a5-b3a9-79c1-b6d1-beeb544fcf13` owns
`/Users/paramveer/.codex/worktrees/3ds-health-launch-reveal-20261003`, branch
`codex/health-launch-reveal-20261003`, base `65ae2a0d`. Both coherent source
commits are integrated. Independent exact-commit review has no remaining finding.

Health upper reveal maps through manifest
`titles[0004001000022300].packs` to `packs/health-and-safety/common.json`,
SHA-256 `d65ffb1c6e37c2b4414a957ba5b642007c36429418c3224706c402c7c26c0627`.
Title EUR `0004001000022300` v3077, content index0 / `00000008`, content SHA
`6c135f500a77070633a0308182b75aa0a672d5403c3535ce4bcbba29fe5f2492`.
Converter `ctr-native-web`1.3.1 / CTRTool1.3.0; full converter script identities
remain in the title's `uiSelection.sourceConverter` record.

| Element | CIA-internal RomFS member | SHA-256 |
| --- | --- | --- |
| Upper black overlay | `common_LZ.bin/blyt/CmnFade_U_00.bclyt` | `9e08884a935bdb425e9b2448e19b55774dc77483a3678d33b436648bae2944c9` |
| Upper SceneIn alpha | `common_LZ.bin/anim/CmnFade_U_00_SceneIn.bclan` | `2eb8644587e537d3d615acdce431d439d85f0dc76c95a2e571b9cb9d54079155` |

The native21-frame clip fades black alpha255 to0 at frames0..20. Lower Health
composition stays unchanged. A Health-owner receipt holds frame0 until the
first successful complete paired draw; later frames use that origin within
the existing foreground clock. Loading and failed draws cannot consume entry.
Same-owner HOME/applet teardown retains progress; replacement owners reset it;
final disposal clears it. TopLoop and global launch clocks are unchanged.

## Integrated Verification

Full1978pass/0fail/23skip/1TODO, production build and sequential typecheck pass.
Logs: `tests-final.log`, `build-final.log`, `typecheck-final.log`. Worker sparse
model failures/external-node_modules build restriction are not integration
failures. No shader or material changed.

Final `after-desktop`56, `after-readiness-fix`76, `after-mobile`54 and
`after-reduced`19 contain205 raw pairs. All complete with page errors[], mute
and separate successful cleanup. Coordinator opened desktop/narrow viewports
and normal/late reveal LCDs. Desktop first app is upper-black/lower-complete,
then upper fades. The delayed common-pack run holds the response until app
entry plus750ms: first observed ready pair55 is partially dark, not exact
black, and subsequent pairs brighten. Before readiness fix pair54 is already
fully bright. This is a visible correction, not exact native epoch proof.
Mobile/reduced use the earlier footer-Open collector and are supporting
regressions, not matched native A-input runs. Reduced motion skips the fade.

The original delayed collector incorrectly required a C14 receipt at1750ms.
Its before run is preserved with failure status; the posthoc audit proves C14
at1744ms, receipt373 before app374. Source C14 begins at1733.333ms. Versioned
v2 collectors retain the receipt check with the correct source threshold.
Normal collector SHA `c55be153308c0aea40f55a08c4af005ef04edbd0b2c44ac00a519d00d9570459`;
late collector SHA `eba93e8961d81ae68519473e37bdac0546444e8b862859e067b3da258c63df96`.
The network hold is an explicit browser-only fault adaptation.

Independent `review/final-live-runs-audit.json`, SHA-256
`556f448b931de205a1e4e861eac3e5da2ece840a369cb474cab86620e7a9147d`,
verifies all205 final pairs, native dimensions, mute, empty page-error arrays,
successful cleanup, byte-identical preferences and unchanged lower pixels.
The actual delayed-response hold was755.9ms, with18 loading observations.

Final `after-comparison/report.json` SHA-256
`6f94a83a8be84b71b2f3060ba8badd4defd8663202b1ef52bf5f3699a0382ad0`;
manifest `0b0184703f6eb461cb73dcb3e0d22524259bd9c51603d1aff56d460c9bfb655e`;
inspected reveal sheet `671bb2c3f317c19525baacf7c92c4bc22e69e4fbea20ae8355bad6d5ffb20b42`.
Coordinator reran the read-only verifier:773 hashes,374 chronological browser
LCD statistics and14 anchor statistics pass. An initial stale generator hash
was caught and repaired before freezing this final bundle. The normal upper
sequence is black, fading, then bright; native starts its observed reveal
slightly above black. No epoch search, shifts or masks were introduced.

Exact native reveal dispatch remains untraced; first successful paired draw is
the adapted origin. Reduced frame20, existing1750/120ms launch clocks/reduced
B15, folder19vs13 and unrelated native pixel/input/motion/audio residuals remain
open. Whole1:1 and the private matrix are unchanged. Browser process stderr
also emitted framebuffer-clear warnings around navigation despite valid raw
captures and page errors[]; no broader clean-GPU claim is made.
