# HOME balloon density - 2 October 2026

## Delivered

Coordinator branch `codex/home-fidelity-20261001`, runtime `5de1f381`:
Settings title balloons now require both current and target density indices
to be zero. The previous explicit two-row exception is removed. One-row
text, anchoring and retained DisAppear behavior are unchanged. This follows
HOME predicate `0x2eb804` and fresh native two-row/one-row observations.
No asset, font, sound or native graphic was recreated.

Separate Sol5.6/high worker trees supplied source audit `5c554650` (integrated
`e0b31b17`), comparison `3c3f0708` (integrated `008fb964`) and runtime/test
correction `f90c0c2f` (integrated `5de1f381`). The coordinator alone drove the
isolated native executable and production browser on the verified Sidecar.

## Source identity

- HOME `0004003000009802` v24576, decrypted executable SHA-256
  `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
- Balloon body/text/tail: manifest `home.launcher` ->
  `packs/home/launcher.json` -> `launcher_LZ.bin/blyt/LncBlln_00.bclyt`,
  layout SHA-256
  `d9e3b2a45efe241ee8f9f9482ddb8ad0d9eb5cff4583517143e26552e1543f27`.
  Container SHA-256
  `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`;
  converter `ctr-native-web` 1.2.0 / CTRTool 1.3.0. This existing manifest
  source entry omits content index; that provenance field remains explicit
  and unresolved here, not inferred.
- Settings label/publisher: manifest `titles.0004001000022000`, v9220,
  content index0/content ID `0000003d`, `ExeFS/icon`, SHA-256
  `40a78f71c6560dcdae1e69d6186702379f128df97d95ac34bc080eb5558615f1`.
  Conversion `smdh-notes-english-description` v1 and
  `smdh-english-publisher` v1; source strings `System Settings` / `Nintendo`.
- Full [anchor audit](home-health-balloon-source-audit-2026-10-02.md) and
  [visibility/lifetime contract](native-folder-balloon.md) remain authoritative.

## Tested and inspected

Integrated runtime suite: 1770 pass; final suite including comparison delivery
`bce9dc83`: 1771 pass, 0 fail, 23 skipped, 1 TODO. Typecheck and
production build pass at runtime `5de1f381`; subsequent changes are comparison
scripts/tests/docs only. No shader/material change. Worker sparse-checkout
fixture failures do not occur in the coordinator tree.

Internal artifact root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-balloon-baseline/`.

Production raw paired LCDs are under `browser/before/` and `browser/after/`,
each with `settings-two-row` and `settings-one-row` plus capture metadata and
actual input history. Before runtime is `229e864c`, after is `5de1f381`.
Real density touches and keyboard navigation select Settings; no app-state
injection. Both after LCD pairs and desktop/mobile scene screenshots were
opened. Two-row now exposes the previously obscured icon row; one-row retains
the balloon. No page errors. Both sessions stayed muted.

## Native comparison

Fresh native own 400x480 PNGs under the adjacent
`native-close-clean-20261002/screenshots/` directory:

- `_02.10.26_10.19.03.15.png`: one-row Health, left selection.
- `_02.10.26_10.45.37.119.png`: two-row Settings, no title balloon.
- `_02.10.26_10.49.28.609.png`: one-row Settings, title balloon retained.

[Health comparison and hashes](workstream-handoffs/home-balloon-baseline-compare.md)
resolve the apparent offset: native left versus browser right predicts the
observed body/text +16 px and tail +168 px. Reselecting browser Health at the
native left anchor yields zero translation. Text and tail have zero pixels
above delta2; three body shadow-fringe pixels reach delta3. No artificial
offset was added. Empty-mask whole LCDs still fail: upper40815/lower15902
pixels above2, with unmatched HUD, banner epoch, population and cursor phase.

Settings observations establish the visible density discrepancy and its
removal, not matched full-scenario fidelity. Native/browser selected anchors,
population, input cadence and animation epochs differ. Static pairs do not
prove transition timing or cues. Private scenario matrix unchanged.

[Settings comparison and hashes](workstream-handoffs/home-settings-two-row-balloon-compare.md)
measure 15851/15872 changed body pixels and all657 old text-signature pixels
above delta2 in the two-row before/after pair. The one-row body, text region
and pointer are byte-identical before/after. Empty-mask native/after remains
fail: upper60595/lower25793 pixels above2. The five-column comparison sheet
was opened. Report SHA-256
`ac094a1e3e6dc67c63fc01b93ba4f4f9ccfe49163070d120c8b0023ffbbfa824`;
sheet SHA-256
`37891d7de13ff570e1d54d1fd573dedfef5b475c30b25f289095c1c817231ce7`.

## Remaining and cleanup

Portfolio-first population/order, disabled online status and portfolio/local
content remain labelled adaptations. Native HUD state, raster fringe,
cursor/banner epochs, exact motion/input/audio and earlier closing/boot
adaptations remain unresolved; no whole scenario or 1:1 pass is claimed.

Native PID97443 exited; temporary touch mapping restored to true, speed100,
static input2, Null output1, volume0 verified. No system/Spotify/mic changes.
Temporary3022 and test Chrome closed. Intentional muted preview3021 refreshed
to the corrected production build and verified ready/HTTP200. User3033 and
original checkout untouched. No push, merge, deploy or firmware publication.
