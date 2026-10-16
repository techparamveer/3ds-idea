# HOME upper pause HUD handoff - 8 October 2026

## Captured defect and scope

Base commit is `3149a4d751f5ba1223e3ee55a76fb0a52d0873eb`, branch
`codex/home-pause-upper-20261008`. The worker owns only `home-entry-motion.ts`,
`screens.ts`, the focused live painter test and this handoff.

The existing silent Health-to-HOME captures show a settled upper HOME HUD at
browser pause 0. The two successful native movies instead show outgoing Health
shrink and darken before the HUD and suspended card become visible. The review
records native samples without either at first 11.253333 s / repeat 11.605 s,
then both visible at first 11.350000 s / repeat 11.685000 s. These are sparse,
compressed movie observations of ordering, not native caller epochs or exact
duration targets.

Prior evidence root is
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/continuation-20261008/home-suspension-sidecar/`.
The reports are `supporting/review.md` and `supporting/final-review/review.md`.
The latter records browser `browser-final-normal/001-top.png` as the first
premature HUD pose at source `1c58f50`. Its first/repeat ledgers have SHA-256
`274a7946cfae8fdd550ce15ad48bcfb4c9e9ba2556a6ef0472f3e6e18aa06998` and
`8900f23da70f39decf336a2415a92abb6e250abdff696cf9ff9846087d3dce27`.
The original movies remain unchanged:

- `health-home-first-attempt2.mov`: `1e5bbe39704ebd81fe7b556e93887685c993160fc57d2cc3b8d800a84b9e22b7`.
- `health-home-repeat.mov`: `40e2bd749c305b4c8233559b27a88b244fc0dd083fb8e1cf375e43bd2a5a368d`.

## Delivered behavior

The upper HUD now selects decoded `HudMenu_00_SceneIn` at twice the accepted
pause pose, clamped to its source endpoint 40. Its shared `N_Scene_00` parent
keeps the HUD transparent through pause 10. Pause 11..20 samples the authored
fade and scale entrance. The existing 0..20 pause clock, lower transition and
suspended card schedule do not change.

| Host pause pose | Decoded HUD frame | Parent alpha | Parent X/Y scale |
| --- | --- | --- | --- |
| 0 | 0 | 0 | 1.100000024 |
| 10 | 20 | 0 | 1.100000024 |
| 11 | 22 | 28 | 1.097200036 |
| 14 | 28 | 126 | 1.064800024 |
| 19 | 38 | 250 | 1.002799988 |
| 20 | 40 | 255 | 1 |

These values come from the decoded source tracks through `poseNativeLayout`.
The track has 41 normalized frames and source range `[-20,20]`. Alpha has
Hermite keys at normalized 20 and 40, with values 0 and 255 and slopes 12.75
and 0. Both scale tracks use the same key frames, values 1.1 and 1, and zero
slopes. The HUD children share that parent; no graphics, alpha curve or scale
curve is reconstructed.

The 2:1 source-to-host mapping is an explicit host alignment adaptation. It
preserves the authored invisible hold within the existing pause lifecycle.
The movies' whole duration was not used to stretch the host clock. Native HUD
caller epoch and cadence remain unknown.

Dispatch requires an eligible suspended application and matching current
capture owner and generation. The existing frozen candidate, pair receipt,
rebase, resource replacement and disposal rules remain authoritative. A HUD
draw failure rejects the native pair instead of drawing the reconstructed
status fallback. Dialog and close paths retain their settled HUD. Ordinary
HOME and boot keep their existing HUD selection. Reduced motion selects
decoded frame 40 through the same publication receipt; it is an accessibility
adaptation.

## Native resource identity

The visible status strip maps to manifest `home.hud`, file
`packs/home/hud.json`, layout `HudMenu_00` and animation
`HudMenu_00_SceneIn`. Its retained source is HOME EUR title
`0004003000009802`, version 24576, product `CTR-N-HMMP`, content index 0,
CIA-internal content `00000082`.

| Resource | Dump path or delivered resource | SHA-256 |
| --- | --- | --- |
| HUD archive | `romfs/hud_LZ.bin` | `9b71bc33490ca291eb1d31ba75dad85a8a9cacf1e0141d80d5b37e5c1ad1bc27` |
| HUD layout | `romfs/hud_LZ.bin/blyt/HudMenu_00.bclyt` | `c27b927db06ec234601e3fc1bfa3f55f1c9570353ac8016c5ad9812ebaab28de` |
| HUD entry animation | `romfs/hud_LZ.bin/anim/HudMenu_00_SceneIn.bclan` | `dd44a8b153374128fa7737e1663aafe52fb2d8c45f0bc9f8526e8b48b0c0c7f2` |
| Delivered pack | `packs/home/hud.json` | `76df2ed42d3bbe09bef599bc242ac2946b811a3c5ee362a8776483a257b4c775` |

Converter is `ctr-native-web` 1.2.0; its retained extractor contract is
CTRTool 1.3.0. The existing manifest title identity is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`,
and its content identity is
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
The earlier [source handoff](../home-power-on-staging-2026-10-03.md#sources-and-limits)
distinguishes that manifest title identity from the encrypted CIA SHA-256
`011d0276fb947315ef06f385cdb444f5e194d23573caf0e3efbeb2c82673654e`.
This worker verified the delivered HUD pack hash and read its member metadata;
it did not re-extract or re-hash the private CIA. Fonts, textures, messages,
status selectors and audio retain their existing mappings.

## Verification and limits

The focused test runs the actual `createScreens` suspension dispatch and
`createFirmwareHome.hud`, then poses the source layout. It covers the hidden
start, source entrance and endpoint; frozen unpublished candidates; large
update gaps; retry and revocation; owner and capture-generation replacement;
same-owner repeat; reduced-motion publication; compact presentation;
dialog/close; firmware replacement; disposal; explicit native HUD failure;
and the ordinary settled HUD. The Canvas and renderer are test adapters, so
this verifies composition calls and decoded poses, not rendered pixel output.

- Six focused files passed 47 tests: `home-pause-window-entry-live`,
  `home-entry-motion`, `home-pause-lower`, `home-pause-window-entry`,
  `home-entry-presentation` and `home-hud-sample`.
- `tsc --noEmit --incremental false` passed.
- Source assets and dependencies were read through temporary symlinks to the
  coordinator checkout, removed after the checks.
- No worker build, server, browser, Azahar, audio comparison, new capture pair,
  mask or pixel diff was produced. Integrated checks and matched recapture
  belong to the coordinator.

The suspended card still runs its existing `Appear` frames 0..10 over host
pause 0..10. It therefore begins before this HUD entrance. Native movies show
both by the same inspected sample, but do not identify their exact relative
epochs. Card alignment remains a separate residual for visible recapture.
Existing lower fade/footer alignment, retained-frame epochs, device-status
profile and calendar adapters, input timing, pixels and native audio remain
unaccepted. No new non-native artwork is introduced. The host mapping and
reduced endpoint described above remain adaptations. Whole-scenario 1:1 is
unproven; this handoff is source-identified, implemented and tested, with
browser inspection and native comparison still pending.
