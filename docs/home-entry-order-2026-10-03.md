# HOME Entry Ordering

3 October 2026, coordinator base `49da0a93`. The [restart correction](home-entry-banner-2026-10-03.md)
removes stale primary retention, but its first new banner appears while the
footer is still entering. This slice targets that captured sequence defect.

## Native Repeatability

Private R:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-entry-order-20261003`.
Fresh native own400x480 PNGs are in sibling
`native-folder-switch-20261002/screenshots/home-entry-order-20261003`.
The verified isolated executable and profile produced73 PNGs at5% speed, muted.
Direct HOME title initialization is not physical Power or the browser warm
Camera/HOME/Off/On input history. Screenshot spacing is not a native clock.

Chronological frames60/62/63/67 show partial footer, nearly entered footer with
no banner, first banner with settled footer/no HUD, then HUD entry. Coordinator
opened the raw62/63 images and selected-stage sheet. Frame62 SHA
`bae18c2184903397f4793ca9dd4c237b1aaacead269217f16d13d88dbd4135ad`;
frame63 SHA `b09e64243b26b0a082e26bd22cb807c177cddf69c9c46b9aa395d03b70cadfe5`.
The82-record native inventory independently verifies, SHA
`253fac50f08b287cebee97723f89ff7e9ae6c4bfdd9b65afc10d20ce0e2494d0`.
This is a repeatability control. The predeclared comparison target remains
the earlier native57, not a replacement chosen for a closer pixel match.

## Source And Implementation

No delivered graphics, audio or models changed. Footer -> `home.launcher` ->
HOME `0004003000009802` v24576 content0/`00000082`,
`launcher_LZ.bin/anim/LncBtmBtn_02_SceneIn.bclan`, SHA
`9b19c054cbb84c89a4b0c8669a2c05566f386dc7fd681410864065b8dee44a4e`,
`ctr-native-web`1.2.0 / CTRTool1.3.0. Source terminal is normalized frame14.
Unchanged HUD mapping is in [entry staging](home-entry-staging-2026-10-03.md#source-mapping);
Camera common/EUR mappings, source hashes and converter versions remain in
[restart provenance](home-entry-banner-2026-10-03.md#implementation-and-sources).

Worker `0f80b1b1` integrates as `660c3cb3`. Existing screen-owned entry state
holds source footer14 until a successful live paired draw creates a candidate
and a visible, awake, context-live scene render presents it. Diagnostic paints
invalidate candidates, not the entry owner. Failed/hidden/sleep/context-lost,
replaced/disposed or stale paints cannot produce the receipt. No second timer,
new duration, global clock reset or source controller changes.

The initial implementation held `loadInhibited`, freezing the existing five
gate passes too. Actual `after-desktop/mobile` first activation at22 showed
settled footer but faint HUD already entering: a recorded regression, not a
successful native order comparison. Worker `fb73764f` integrates as `5bd0f99a`:
hold the existing `nativeWorkerReady` release boundary instead, allowing those
five passes during footer entry. Release and activation still require their
existing separate passes. A null `getHomeFooter` (held pickup) cannot count the
presenter's handled-but-not-drawn result as a visible terminal; release can
redraw14. Cancel and other input preemption retain existing settled behavior.
Native caller/epoch is still untraced: this dependency is a capture-supported
adaptation, not a native timing proof.

## Verification

Final `5bd0f99a`: full1932 tests pass, zero fail,23skip/oneTODO (1956 total),
production build and serialized typecheck pass. `R/npm-test.log`, `build.log`
and `typecheck.log` preserve results; initial-runtime logs have `-initial`
suffixes. Independent exact-worker review passes140 focused tests with no
blocking finding. No shader/material change.

Final production desktop/mobile/reduced retain28/27/3 raw LCD pairs, errors[]
and mute. Normal first activation at relative update17 shows settled footer
and absent HUD. Coordinator opened the actual desktop pair and both full
viewports. Reduced uses event-driven source endpoints, not native motion.
Thirteen restart/cancel/sleep checks and8 Work/About/Health close/switch checks
complete without errors. A700ms first-HOME stall retains28 pairs and rebases
the shared clock at0; first captured activation remains17.

Context recovery is a separate remaining failure. The original8-pair control
captures only HOME0..15 before leaving its70-update window. A separate extended
61-pair control preserves the jump13 ->75: frame008 at75 has settled HUD and
footer but no banner; frame009 at78 is the first active primary. Coordinator
opened the actual75 pair. Functional recovery completes, errors[] and mute,
but the **HUD-before-banner recovery order remains fail**. This is now visible
evidence for the next slice, not an inferred synthetic-clock-only risk.
Do not claim the normal dependency fixes every interrupted entry.

Frozen comparison plan SHA
`edd37e98bcf46ab0f664ea88fbe8bbf6fe42b2a8607bdd7c4ab1cc5c57039181`
selects the first differing active identity tuple chronologically, fixed native57,
empty masks, delta2 and no registration/phase fitting. Footer region
[0,212,320,240) improves8591/8594 ->0 pixels above2, maximum2, desktop/mobile.
HUD absence is visually inspected only: its fixed-native diagnostic still has
408 pixels above2/max11. Whole pairs remain25021 pixels above2 on both normal
routes, and41385 reduced. Banner pose, wallpaper and title population remain
different; no whole pass follows from the footer tier.

`R/home-entry-order-comparison.json` SHA
`44e19c28bcbcb6b40da6d54809092803494410c3ef986d801de7c5cc6639393c`;
inspected `.png` SHA
`1e27e6522d40092fde4e5b73a6de5d5840cbc5aa3f6054c91387fc1d70c1c9a2`;
`R/home-entry-order-comparison-manifest.json` SHA
`da9275256f2aa276b939745ba6a0c709d1939b655c817c6080537a29803ccc12`.
All588 records independently verify using Python.org3.14. The immutable bundle
includes initial/final pairs, controls, provenance, masks, logs and input record.

Final browser check confirms ready/muted, no native failure, native canvas and
no framework overlay. Dedicated Chrome79304/launcher90616 exits0 and its CUA
session ends. Native75766 exits0, original config SHA
`d2118bc611142e0febb95415bb45487fe83b36c407b6cdad869a01697e92e698`
is restored. Preview3021 remains HTTP200. No system audio/default profile,
private matrix, firmware/model or other app design changes. All native caller,
epoch/cadence, whole pixels, input/audio and intentional population/content/
status/placement differences remain unaccepted. Strict1:1 is unproven.
