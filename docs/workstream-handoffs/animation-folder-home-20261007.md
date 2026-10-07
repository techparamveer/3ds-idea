# Folder Entry and HOME Pause Delivery

## Scope and Result

Worker B, AN-03/AN-04, base `81f09bfa88c11a2065a22ce5e532846229616c0a`,
branch `codex/animation-folder-home-20261007`. This is one bounded source-backed
correction, not native animation acceptance. Both scenarios remain **fail**
pending coordinator integration and matched chronological recapture.

Before this change, the live folder painter always selected FadeIn16/Fade8 and
mounted child content without its animated native parent. Suspended HOME always
selected SceneIn20/AppPause20. The source entry clips therefore could not appear
in either live path, regardless of their correct settled source assets.

The delivery binds folder FadeIn0..16 and capture Fade0..8 to one presentation
sample and mounts both occupied and blank children through their decoded parent
paths. HOME suspension binds AppPause0..20 to the complete captured application
owner/generation. Existing folder-close samples take precedence; the existing
SceneIn20, AppPause20, AppQuit stack and override order remain unchanged.
No assets, native graphics, sounds, reducers or application state were added.

## Baseline Evidence

Coordinator-owned artifact root:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/baseline/`.
These are actual-input browser observations, not forced animation poses. Each
contains 70 chronological raw LCD pairs, no page errors, and
`nativeCompared:false`. The test browser was muted.

| Scenario | Input and state | Capture JSON SHA-256 |
| --- | --- | --- |
| `folder-entry/capture.json` | Seven Right presses, Create Folder touch210,226, Enter. Before HOME selected14/two rows; after folder/one row. | `c58f595ceb4069559d96d6b5856f9f7b38ccd4715351fcfd4f945fb50677cf4b` |
| `pause/capture.json` | Right x4, Enter Health, h. Before app Health; after HOME with retained Health, selected8/two rows. | `1fdd8534f118e850a06fe3debb02d256291fff3721caa57f2c0aaa2bf9d5a4c0` |

The first recorded folder pair is `000-top.png` / `000-bottom.png`, 46.8ms
after the capture epoch; the first recorded HOME pause pair is
`001-top.png` / `001-bottom.png`, 110.8ms after that capture epoch. Neither is
proof of the native first changed frame. The earlier `baseline/folder` run only
created a folder and is not folder-entry evidence.

## Source Mapping

All native resources below come from EUR HOME title `0004003000009802`
v24576, product `CTR-N-HMMP`, content index0 / `00000082`, pinned to
EUR10.7.0-32E. CIA SHA-256:
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`.
Decrypted content SHA-256:
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.

Folder visible element -> `manifest.home.launcher` ->
`packs/home/launcher.json`, delivered SHA-256
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
Its CIA-internal resource is `romfs/launcher_LZ.bin`, SHA-256
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.
The pack's `resourceSources` records these original internal archive entries:

| Element | Entry inside launcher_LZ.bin | SHA-256 |
| --- | --- | --- |
| Folder chrome and both animated child parent paths | `blyt/LncFolder_00.bclyt` | `9581b9f24f79646159ee161e589fd62b92edd7b55dd5e0e2b2f1db6980fb6a24` |
| Folder scale/alpha entry | `anim/LncFolder_00_FadeIn.bclan`, nonlooping17 frames, interval0..16 | `0cc21b182087829e94470dbd171a2c0af5d61118668eeb9a550b70e74cdecfda` |
| Retained root capture geometry/material | `blyt/LncFolderCapture_00.bclyt` | `da89e81a94b843f0423cd57c58244d8b28313ef30e137bb8d75c23f216281d86` |
| Retained root fade entry | `anim/LncFolderCapture_00_Fade.bclan`, nonlooping9 frames, interval0..8 | `a340868b91e6bde04ac212cc1e6b03acdd25325290b59694b84c0137a01b8f60` |
| Existing held-folder multiply, unchanged | `anim/LncFolderCapture_00_PicUp.bclan` | `d35235569528d14632b302dc0c7bb03020db6307684ab98e05641b0d5ee3fd32` |

Converter: `ctr-native-web`1.2.0; extractor CTRTool1.3.0. Script/extractor
hashes and all unchanged texture provenance remain in
`public/os/firmware/10.7.0-32E/manifest.json` and the launcher pack.

Pause curved capture surface, scale and tint -> `manifest.models.homeBackground`
-> `models/home-background/model.json`, delivered SHA-256
`45b3c6a470f681a10443f90fc73aff016b97a077b977b62649465524dffd3615`.
CIA-internal resource `romfs/3D/BannerBG_LZ.bin`, compressed SHA-256
`27d58c2113d2c2d46e3bcc36bb2ae56c35e19d9823488287b6759df998108711`,
decoded CGFX SHA-256
`092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595`.
Authored `BannerBG_AppPause` is a nonlooping20-frame material animation;
texture scale keys are0:1,1:1.002,2:1,5:.98,10:.93,15:.89,19:.87.
Tint tracks and interpolation are evaluated by the existing source model
renderer, not recreated in this helper.

Model converter `ctr-cgfx-web`1.1.0, SPICA revision
`bd29a7828595d7839cda2ac61c76bb63f9071250`; wrapper SHA-256
`6377be3d3670b6ed7c9bf6a947d0f3bd7c02a5970788d4f5f27446b8fa14fe1f`,
exporter SHA-256
`946ff91fae009fd667a66cf528e40e6b52ba2a76e04d7d1fe73da9c383ef258e`.
Existing mask, padding, capture sampler and texture identities are retained;
see [suspended background source record](../home-suspended-background-2026-10-02.md).

## Source Calls and Limits

Retained decrypted `code.bin` identity:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Read-only disassembly used:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/runtime/reference/folder-navigation/native-code.asm`.
Original raw `assets/extracted/home` files are absent in this checkout; no new
ARM execution or original dump conversion was performed.

Folder entry at `0x2a33b8..0x2a34dc` makes capture+ac4/folder+ac0 visible.
The normal branch at `0x2a349c` selects forward mode0 on capture controller+e34
through vtable+28, then starts through+10; `0x2a34bc..0x2a34dc` does the same
for folder controller+e30. Construction at `0x2b2b7c..0x2b2b80` binds the
folder resource; `0x2b2c04..0x2b2c08` binds capture. The nonzero entry argument
at `0x2a33fc..0x2a340c` seeks endpoints via `0x229330`, a separate immediate
path. This delivery addresses ordinary visible entry only.

Existing original ARM close fixtures establish source interval0..16/0..8,
apply-before-advance, independent eligibility and separate endpoint/stop/idle.
They remain unchanged; see [source boundary](../native-folder-close-boundary.md).
For pause, `0x1ed1c4` preserves equal background mode; mode1 at
`0x1ed288..0x1ed298` pauses Loop and starts AppPause. See
[banner lifecycle](../native-banner-lifecycle.md). The production banner host
still reports its existing mode0 lifecycle; this bounded patch supplies the
source AppPause pose to the separate suspended-background renderer. It does
not claim a complete native mode-dispatch integration.

**Host scheduling adaptation:** a successful live Canvas pair creates an
owner-bound candidate, beginning at frame0. The selected pair stays unchanged
until a successful visible, context-live `renderer.render` acknowledges it.
That receipt commits the selected source pose and rebases the observed HOME
count; time waiting offscreen cannot become catch-up motion. The next eligible
HOME updates select a new candidate. Failed/diagnostic paints cannot publish a
receipt; hidden, sleeping and lost-context paths revoke candidates. Folder
identity and complete capture owner/generation distinguish entries; asset
replacement, power-off and disposal invalidate old receipts. Exact native input
epoch, task order, LCD publication cadence and stop/idle gates remain unproved.
No duration, easing or native sound was guessed.

**Browser stall policy follow-up:** `HOME_ENTRY_MAX_OBSERVED_UPDATE_GAP=6`
accepts a normal three-update nominal20FPS LCD sample and one missed pair.
It also accepts an ordinary five-update constrained12FPS sample. A larger
unobserved HOME-clock jump is treated as inhibited: retain the last paired
pose, rebase observedUpdate only after a successful live pair, then spend only
subsequent ordinary updates. This threshold is an explicit browser resilience
policy, not a source duration, source gate or cadence claim. It does not slow
every paint to one frame or alter System/scene clocks.
Mid-entry stall tests cover both folder and pause, failed advancement and failed
rebasing, diagnostic rebasing, repeated same-update painting, reset/re-entry and
new capture identity. Eligible pending HOME entry and Notes covers now request
the existing transition LCD paint budget. Render-quality budgets are unchanged;
lower-budget renders may sample multiple HOME updates and skip intermediate
poses. That remains a browser scheduling adaptation pending native comparison,
not a new native FPS or duration claim.

**Resource and publication guards:** entry requires the decoded FadeIn17/Fade9
nonlooping clips, original source ranges/groups, visible unique parent panes,
child-parent relationship and required nonempty Hermite tracks. Missing parent,
capture, chrome or child drawing fails both LCDs through the existing explicit
recovery/Retry path; no native-looking fallback is published. AppPause requires
the pinned MaterialConstant0/1 tint and TexCoord0/1 scale curves, interpolation,
key times/values and fixed auxiliary channels, alongside the existing model,
capture and AppQuit validation. Mutation tests exercise malformed selected
resources. Receipt tests cover frame0, delayed/one-shot publication, terminal
retention, wrong owners, failed/diagnostic draws and teardown.

## Integration and Checks

Integration order: A originals `d937cf3`, `295d029`, `44ec0bf`, `884fc11`, then
B `b9134fd`, `894d1fe`, then this publication/resource follow-up. The A originals
are already cherry-picked in this worker for interface verification; do not
also cherry-pick their worker-local copied hashes. All permitted wiring is
included; no manual `system.ts` hunk is required. Owned files:

- `src/os/home-entry-motion.ts`: pure owner-relative source-pose sampler and receipts.
- `src/os/home-folder-entry-assets.ts`: selected folder clip/parent validation.
- `src/os/firmware-presentation.ts`: source folder entry bindings and child parents.
- `src/os/screens.ts`: live clock/readiness/paired-paint binding and close precedence.
- `src/scene/home-suspended-background.ts` and `firmware-banner.ts`: validated
  AppPause-only playback alongside unchanged AppQuit override stack.
- `src/scene/console-scene.ts`: valid render receipts and existing transition
  cadence for HOME entry/Notes, plus `screenPaint.entryMotion` diagnostics
  inherited by `screenPresented.paint`, without a second clock.
- Pure source, live painter, malformed resource, actual model and scene-policy
  regression tests listed below. Notes forwarding signatures are coordinated
  with Worker A; no portfolio/stock module was manually edited by B.

Focused verification command:

```sh
node --test --test-reporter=spec tests/home-entry-motion.test.mjs tests/home-folder-entry-assets.test.mjs tests/native-home-controls-paint.test.mjs tests/home-suspended-background.test.mjs tests/home-entry-motion-scene-policy.test.mjs tests/boot-publication-scene-policy.test.mjs tests/application-close-scene-policy.test.mjs tests/home-entry-banner-scene-policy.test.mjs tests/render-quality.test.mjs tests/notes-boot-cover.test.mjs tests/stock-screen-preparation.test.mjs tests/firmware-banner.test.mjs tests/home-folder-close.test.mjs tests/home-suspended-presentation.test.mjs
```

Result:292 pass,0 fail,0 skipped. TypeScript `tsc --noEmit --incremental false`
passes. `git diff --check` and relative handoff links pass. Existing dependencies
were reused read-only; no packages installed. No full build/test suite, shader
change, worker GUI, server, new browser capture, native diff or audio inspection.
Coordinator-authored `STATUS.md` stays outside this commit.

## Required Recapture and Residuals

Coordinator: run integrated full tests/typecheck/build, then repeat the exact
folder-entry and Health-pause inputs above with muted native/browser sessions.
Retain input-down/up epoch, holds, emulation100% speed, chronological raw native
400x480 and browser400x240/320x240 LCD pairs. Start full-LCD diffs with an empty
mask; preserve failed runs, hash pairs/reports, open the comparison sheet. The
new entryMotion diagnostics expose applied host selectors, not native timing.

Exact missing evidence: ordinary empty folder entry at root selected14/two-row
viewport, and Health HOME suspension at selected8/two rows. Capture the frame
before activation, first changed frame, every intermediate native update and
settled frame; repeat populated folder with the same root viewport and density.
Native polling/touch-route failures supplied by the coordinator are not valid
motion acceptance and must remain preserved as failures.

Open: native source start epoch/cadence/gates; folder cursor/footer/banner
ordering, early Back and repeated inputs; AppPause compact window/icon ordering;
AppRestart on Resume; native service-gated apps, Camera/Sound and repeated HOME
variants. The existing capture transfer/padding/sampler and SceneIn20 geometry
are fitted host adaptations. Portfolio capture content, its internal HUD,
existing caption/footer/viewport fits, offline stock content and local portfolio
apps remain intentional or documented non-native adaptations. This change adds
no substitute native graphics or cues and does not excuse their residuals.
Muted audio remains unverified. Source-identified and implemented/tested are
complete for this bounded correction; integrated, browser-inspected and
native-compared are coordinator follow-up, not worker acceptance.
