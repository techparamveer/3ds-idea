# HOME Banner Restart

3 October 2026, runtime `e069925c`, worker `4d411790`, base `3543dcc9`.
This follows [HUD/footer entry staging](home-entry-staging-2026-10-03.md).

## Captured Defect

Private R is
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-entry-banner-20261003`.
The first quick fixture exposed variable pre-Off banner state. The definitive
`before-settled-desktop` fixture waits for the actual Camera primary to become
visible at scale1 before Power/Off/On. Its first HOME paint incorrectly retains
the same scope1/request1/activation1 settled primary as before shutdown.
The first quick fixture remains diagnostic, not the comparison baseline.

The frozen native sequence is sibling
`native-folder-switch-20261002/screenshots/home-entry-staging-20261003`.
Native own400x480 PNG54 (`_03.10.26_04.23.46.034.png`) has partial footer and no
banner, SHA `8b58d687025e998db8c558c46c20315c95f3bc9782994f8c7401c3f6ede28ca5`.
PNG57 (`_03.10.26_04.23.49.262.png`) has first banner and settled footer,
SHA `17d3ecc01a01d0e05a1eb1b31fc4f1782a7985bfe5211786a52287955e69a1db`.
These are earlier isolated title-init captures, not a fresh native replay or
identical inputs to browser warm restart. Filename time is not a native clock.

## Implementation And Sources

`resetHomeBannerPrimary` clears service, pending/active primary and readiness
while retaining selection, global clock, wallpaper and monotonic scope. Scene
observes each awake Off-to-boot boundary once; the next host boundary creates
a fresh scope and rejects old tickets. Existing loading gate, visibility/yaw
controller and asset preparation are reused. Power cancellation, sleep/wake,
ordinary close and initial boot do not acquire this restart reset. No duration,
asset, reducer, model, audio or other app design changes.
The reset boundary is a capture-supported adaptation; its native caller and
relative footer/banner epoch remain untraced.

Unchanged Camera title `0004001000022400` v4097 content0/`0000001a`:

- Banner common -> `models.cameraBannerCommon` -> `exefs/banner.bin`, SHA
  `e4808dcf84e490c73200ee5f9cb2ba72d096c93d6ccdf08d88d733988fd66280`.
  Decoded CGFX SHA `068d2d09cddc0f9c23f9b3e126f7a4942ce52957910102a831298e14fa1b361d`;
  converter `ctr-cgfx-web`1.4.2; published model SHA
  `67e9b9c4b6ae63043297589cdf6a2d0272ee7a94368a20c04bae36b9e39d466d`.
- Banner EUR -> `models.cameraBannerEur` -> same source path/SHA;
  decoded CGFX SHA `21f8723b955b36b9575d0a92b942889bd978f868163c9b75063528f561105ccb`;
  converter `ctr-cgfx-web`1.4.1; published model SHA
  `ceaf5c44c59874ea5f46fd3cbc38f9ad40dfa620495b3352812c45454149ffb9`.

Existing [Camera activation](camera-home-banner-activation.md),
[native lifecycle](native-banner-lifecycle.md) and preceding HUD/footer evidence
retain their source contracts. HOME code SHA is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

## Checks And Comparison

Full suite:1926 pass,0 fail,23 skip,1 TODO (1950 total); build/typecheck pass.
Logs: `R/npm-test.log`, `R/build.log`, `R/typecheck.log`. Independent review
clears the exact worker commit; focused46 tests pass. No shader change.
Production desktop/mobile/reduced retain27/28/3 actual raw LCD pairs, errors[]
and mute. All first HOME frames have no primary. First captured new scope2
activation occurs at relative HOME update7/8/7; desktop enters at scale0.8.
Coordinator inspected actual raw LCDs, desktop/mobile viewports and comparison
sheet. Reduced motion has no captured positive delta<=5 sample; none is invented.
Thirteen restart controls preserve identity through cancel/sleep and advance
scope1 ->2 ->3 on real restarts. Eight Work/About/Health close/switch controls
also complete without errors. These are functional, not native timing proofs.

The plan freezes first HOME delta0, first chronological positive delta<=5 and
first new active identity tuple `(generation, requestEpoch, activationEpoch)`.
No pixel/phase fitting. Empty masks, threshold2, regions banner[40,48,368,205),
footer[0,212,320,240), HUD[0,0,400,24). Native54 delta0 banner residual improves
19321 ->2447 desktop /2587 mobile; footer remains2522. At native57 versus first
new activation, footer still differs8591/8594 pixels. **Normal browser banner
starts while footer is entering; native footer is already settled.** Reduced
footer endpoint reaches max2, but remains an accessibility adaptation.
All whole comparisons and native relative ordering remain fail.

`R/home-entry-banner-comparison.json` SHA
`c830f0d8c8bb3132533c8fcc58aaf2604e9ee13bca8d35bac1fb9d36e3c43454`;
inspected `.png` SHA
`f6559e4767c0cd3d7bf1574016963d1e000704aabdd8d0d0c19678185de6f63d`;
`R/home-entry-banner-comparison-manifest.json` SHA
`613d286f079170e97f50eee40440064a4a8b64a6b6938ddf7a3f2efefb8dd243`.
The 91-record bundle retains named pairs, input metadata, source identities,
tools, checks and empty masks; observation bundle separately verifies33 records.

Native input/cadence/epoch/audio and whole pixels remain unproven. Remaining
non-native differences include reset/sampling policy, reduced endpoints,
portfolio title population/content and existing status/placement adaptations.
Next target is footer-completion versus banner-activation timing, not another
stale-primary reset or unrelated screen redesign. Private matrix unchanged.

Final browser is ready/muted with native canvas and no framework overlay.
Owned Chrome59244 exits cleanly; its CUA session ends. Native37352 stays absent,
and config SHA `d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`
is unchanged. Preview3021 stays HTTP200. No system audio/default-profile change
or DeveloperStorage artifact write.
