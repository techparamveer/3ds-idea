# HOME footer backing source audit — 2 October 2026

## Bounded defect

The folder-close diagnostic at integrated runtime `9371c576` restores the
root before the footer's source `SceneIn` animation becomes visible. The
native diagnostic shows the HOME lower base's horizontal striped background
in the uncovered lower-LCD rows 212…239. Browser motion frame 009 instead
shows the host theme's flat palette fill there because the live root renderer
clipped `LncBase_D_01` at row 212.

The inspected native-before/browser-after contact sheet is
`native-before-after-reentry-sheet.png`, SHA-256
`bdbcb22d73dc9a99fd8cdeb77fe26453b8e9f4c760d63a4cd86d33b8e767ba92`.
The browser frame is `browser-motion-after/motion-009/lower.png`, SHA-256
`44fd0c66eb8277bf4bfbd75c54fccd186bf94fd4c4629d9949ef16cfcc633cc4`,
captured at HOME update 811 with the folder close complete and the footer
`SceneIn` inferred at frame 0. These are trajectory diagnostics, not a matched
native own-PNG/browser acceptance pair.

A later clean native own-PNG sequence directly confirms that the stripes are
native LCD pixels rather than a desktop-compositor artifact. The 400×480
captures `_02.10.26_18.48.57.64.png`, `_02.10.26_18.48.58.698.png`, and
`_02.10.26_18.48.59.753.png` have SHA-256 values
`038c9a7e98fad9cda7538865e3ef64cb8f868d2783e645cd9c5d4378229d73df`,
`59f3f254347bacec49a8a49ca67ab9efb1a077677b35d6fc104287db6fc4b675`,
and `9c02b91fa2bfafa6e9836c622a954a380b90c8c3dcfa7aaa4c9352b1db65cc2b`.
They show the stripe band through the end of folder closing and subsequent
footer return. The capture used a deliberate 10% frame-limit diagnostic, so it
supports pixel ownership only; it is not timing evidence.

## Native resource mapping

The element-to-source route is:

- manifest key `home.launcher` → `packs/home/launcher.json`, SHA-256
  `f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`;
- EUR HOME title `0004003000009802` v24576, content index 0 / content ID
  `00000082`; HOME CIA SHA-256
  `2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
- `launcher_LZ.bin`, SHA-256
  `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`;
- `layouts.LncBase_D_01` →
  `launcher_LZ.bin/blyt/LncBase_D_01.bclyt`, SHA-256
  `787e6b58e0455130ae1f7f4f35a5edf4472c8a21151a53bbce782e813fab5adf`;
- `LncBase_D_01/P_BgBtm_00`, a source 320×32 picture pane at the bottom
  of the decoded 320×240 canvas, using material `P_BgBtm_00` and two authored
  UV sets;
- material sampler 0 → `launcher_LZ.bin/timg/BgLine.bclim` (L4 8×8), source
  SHA-256 `5c1ff31e996b2367dd8ed15973e4fa9e1863c2d08927eda513c0a97e00699836`,
  delivered PNG SHA-256
  `5d4ee2aa41034fec89997ba9630f984f35c4fdf740051b97351d557da7bf6bd4`;
- material sampler 1 → `launcher_LZ.bin/timg/BgLgt.bclim` (LA8 32×32), source
  SHA-256 `c0d63a4ee5205e77b89b18b334ffbd13df83a06912ac258119a46160791f983b`,
  delivered PNG SHA-256
  `c117e897bd3a52c44b40dcd585da63666e56d035966f3914465ff0dd0af6315d`;
- converter `ctr-native-web` 1.2.0 and extractor CTRTool 1.3.0.

The first UV set repeats four times vertically and the material samples
`BgLine` with repeat wrapping. The striped backing is therefore decoded native
layout output; it is not a hand-drawn pattern or a guessed theme color.

## Composition decision

The full base belongs beneath every live root footer state, not only the first
folder-return frame. `LncBase_D_01` declares a 320×240 canvas and includes its
own bottom pane. `LncBtmBtn_02` is a separate layout that the screen composer
already draws later. Clipping the base at 212 exposes the host palette not only
at `SceneIn` frame 0, but anywhere the later footer is absent, translated, or
partially transparent. Restricting the correction to folder return would hide
that broader composition defect.

The presenter now always clips `LncBase_D_01` to `[0,0,320,240]`; the special
capture-only full-height argument is removed because layout previews, folder
captures, root HOME, and open-folder HOME share the same complete source base.
Footer selection, clock/text sampling, animation timing, and its existing
`[0,210,320,30]` clip are unchanged. Focused tests pin the decoded bottom-pane
texture route, full-height root/folder clips, and live base-before-footer paint
order.

## Verification boundary

Worker checks passed:

- `git diff --check`;
- `node --test tests/home-density-controls.test.mjs tests/native-home-controls-paint.test.mjs`
  — 54/54;
- `npm run typecheck`.

This worker did not run the production browser, Azahar, audio, full suite/build,
or update the private scenario matrix. The coordinator must integrate and
recapture the same folder-close trajectory, then compare the first
root/footer-entry frames and settled HOME. Until that matched native
own-PNG/browser evidence exists, the source-backed composition correction is
not native acceptance and the whole HOME scenario remains fail.
