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
count; time waiting offscreen cannot become catch-up motion. Each subsequent
eligible receipt spends at most one source step, even if several HOME updates
elapsed. Failed/diagnostic paints cannot publish a receipt. Hidden, sleeping,
lost-context, failed-draw and Retry boundaries discard all unpresented pending
pixels and retain only the last receipt-backed pose. The first valid resumed
pair repeats that pose and rebases its count; only subsequent receipts advance.
Before the first valid restored-context render, the scene repaints and rearms
the pair instead of rendering stale Canvas pixels without an owner receipt. Folder
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
policy, not a source duration, source gate or cadence claim. It does not alter
System/scene clocks. Ordinary multi-update intervals now spend one source step
per receipt, preventing source-pose skips under constrained render budgets.
Mid-entry stall tests cover both folder and pause, failed advancement and failed
rebasing, diagnostic rebasing, repeated same-update painting, reset/re-entry and
new capture identity. Eligible pending HOME entry and Notes covers now request
the existing transition LCD paint budget. Render-quality budgets are unchanged;
lower-budget renders retain every source pose but take longer to present the
sequence. That timing remains a browser scheduling adaptation pending native
comparison, not a new native FPS or duration claim.

**Dynamic accessibility policy:** toggling reduced motion invalidates old
pending pixels and selects an owner-bound terminal candidate. Only a valid
render receipt terminalizes the retained source state. Toggling normal motion
back on cannot replay a midpoint after the endpoint was acknowledged; an
unpresented endpoint is discarded and the prior receipt-backed pose is rebased.

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
B `b9134fd`, `894d1fe`, `ad6d540`, then this invalidation/cadence follow-up. The A originals
are already cherry-picked in this worker for interface verification; do not
also cherry-pick their worker-local copied hashes. A's separate `fd56dd4` fixes
the failed-folder B/HOME recovery branch; coordinator integrates it independently.
All permitted wiring is
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

Result:296 pass,0 fail,0 skipped. TypeScript `tsc --noEmit --incremental false`
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

## AN-03 Upper Departure Follow-up

This 7 October bounded correction targets the premature upper folder departure,
not Manual, Notes, folder close, reducers, scene cadence or wider composition.
Worker base is reviewed `3651b39d681db9914920e37178e0c1d66b4fac67`, plus the
approved local dependency `bd6622bc21d045b29d7ee53ebbb5cb8844ab8eb5` (A original
`fd56dd4`, failed-folder B/HOME escape). **Do not integrate that dependency
again:** coordinator already has it as `c8e1e93`. Git wins over this worker's
inherited STATUS SHA; coordinator-authored dirty STATUS remains untouched and
unstaged. Coordinator's reported code checkpoint is `59fb1d5`; served runtime
is `61f8b4e`. The commit carrying this section contains only the new folder
helper, folder-only screens binding, focused tests and this handoff.

### Captured Defect

Immutable native ownPNG:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/native-folder-slow/screenshots-folder/_07.10.26_15.11.14.196.png`,
SHA-256 `25643ec0b93be0c860d78b16fe2960542b665a35e57c81460804caf8bddb235c`.
Its lower entry is complete while the upper still shows the folder banner;
the later native `15.11.14.657.png` shows the default banner. These slow-motion
observations prove ordering, not normal-speed duration.

The first chronological browser folderFrame16 is repeat1 index020, runtime
`2169497`, at 466.7ms. Raw copies and inspected sheets are under
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/comparisons/folder-reentry-frame16-2169497/`.
Selection JSON SHA-256:
`620cbb0ce1bfc4ee5f599dea9915b2d4787082b65862d67b7c2662ea6893e198`.
Browser upper SHA-256:
`157f5b802ee06f28e8dcc528874a7f327ac98849140aceb9b7a453107b28edcb`;
lower `c32677f1295aa06cad6bc84f71a63badc174553face3f121a5a1969791402bb8`.
Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`;
report `08626b745f521ad07c8e57cb18c30ffeb12da4d92a56a7236a10f483162e6626`.
At RGB delta threshold2 the baseline differs by **61126 upper / 7478 lower**
pixels. This worker created no new captures or private evidence.

### Ordering Evidence

One read-only source pass used the same pinned HOME decrypted code.bin above.
Disassembly SHA-256:
`656187735b0ac3f3352e060308bf65ff54d0c460c581d6ee6c851cbaadd770b5`.
At `0x29b954`, r5 is r4+e30. `0x29b9bc..0x29b9cc` reads that object's +14
status and returns while it is1 or2. This comparison does **not** independently
check a second folder status. The successful ordinary path later requests mode0
via `0x1e8f38` at `0x29bb54..0x29bb5c`; mode0 `0x29a184` prepares selection/host
and calls banner refresh `0x1e0f44` at `0x29a4dc`. Child refresh is therefore
downstream of successful lower-controller completion. See
[banner targets](../native-banner-targets.md) and
[folder source boundary](../native-folder-close-boundary.md).

Source does not prove that browser FadeIn16 receipt equals the native status
boundary, or that banner manager/global-3D clocks are phase-locked to lower
publication. This delivery applies the bounded ordering adaptation: retain the
last successfully presented matching root-folder primary and label through the
acknowledged lower terminal, then permit the already-requested native child on
the next eligible paint. Its first successful paired WebGL receipt retires the
old source permanently. The early child-host request remains unchanged and is
an adaptation, not a recovered native request epoch.

### Resource Mapping

Unchanged upper folder -> `manifest.models.folder` ->
`models/folder/model.json` SHA-256
`9518fc61118875d7989e84b4b5d15ae32a9bd495f73fbdff87ada5d14c376015`
-> HOME v24576 content0/00000082 `romfs/3D/BannerFolder_LZ.bin`, compressed
SHA-256 `6414be9d3752a1cd541f97ad47ae67ad852bbe6e041956ab542ea6831b978ecd`,
decoded CGFX `28f62936179fe1e0787080e62ac7b4d5d3e8e279cb4bbccb9c8fd2a47c799305`.
Both native BannerFolder skeletal/material clips are looping600-frame resources.
They are evaluated by the existing lifecycle and model renderer; no copied LCD,
new geometry, label fit, texture, font, visual asset or sound was introduced.

The label retains `BannerFolder/mt_Text`, `manifest.home.banner` ->
`packs/home/banner.json` SHA-256
`44622f5f4607489a9ab7788d528faa63bb093bd80a8785411c4bcdc7835357aa`,
`romfs/banner_LZ.bin` SHA-256
`5ed6d1edc6daed5decdf1425832be8567e54e809f9b81278b1275381d86e2fc3`,
layout `BnrDsTitle_00`, and unchanged `manifest.fonts.shared` ->
`fonts/shared/font.json` SHA-256
`d48b661f446e3e581abeceb62b86312a6fea6c8120cd1214ba76b298f94c9f27`.
Font title `0004009b00014002`, `cbf_std.bcfnt.lz` SHA-256
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`.
Banner pack lacks per-member resourceSources; that provenance limitation remains
explicit. Original label binding/metrics are in the
[folder label source record](../native-folder-label-2026-09-22.md).

The returning empty-slot child remains `manifest.models.bannerDefault` ->
`models/banner-default/model.json` SHA-256
`d0d771a36fe3cc054db94582bd6c7ebbec2d2c9eedbba9a09946c20e3488dfb6`
-> `romfs/3D/BannerDef_LZ.bin`, SHA-256
`4833f9e4ac3bfb59c046f6df47c32cc72dd1a3b21868d4b60bb19e455068d165`.
Shared frame is `manifest.models.bannerFrame` -> `models/banner-frame/model.json`
SHA-256 `61f4e90b11e341ba857edd73e5d0ce3eba8fbc5a2aff9a03bb0581f402c9fd83`
-> `romfs/3D/BannerFrame_LZ.bin` SHA-256
`794bfb7f116c5686e44bc5701b4ea715c32f169e76306a272926d5d979a7e9ba`.
These models share unchanged converter `ctr-cgfx-web`1.3.0, wrapper
`76e55cdf027b8a0a8d647f873e8dd89e81dd08478a588bbdaa91a03315b72da6`,
exporter `0a450efe7fbdba7a3bda05635c7abe9448080b719f9703e728efd46cc189a7d4`.
Lower capture/FadeIn and wallpaper/HUD mappings above remain unchanged.

### Lifecycle and Checks

The root source is staged only after a successful native draw, then stored only
through the existing valid-render hook with exact primary generation/request/
activation and application/firmware/System guards. Entry requires the immediately
preceding root selectionRevision+1. Active lower receipts require that exact
entry revision. Folder readiness quarantines child input through the paired
terminal receipt; B/HOME/power recovery remains available. This input gate is a
browser presentation adaptation, not proven native input timing. After release,
ordinary child revisions are free; existing close sequence identity prevents a
completed Back/re-entry from reusing the previous root receipt.

Every pending pair stays selected until a valid receipt. At most one existing
banner manager/clip pass accompanies each advancing lower source pose. No
elapsed catch-up, timer or render-budget override was added. Hidden/sleep/
diagnostic/context/failure/Retry revocation discards unpresented candidates and
rebases the last presented pose. Terminal source remains until a current native
child draw and matching child receipt succeed. Once retired, later revocations
cannot resurrect the folder banner. Reduced motion selects the terminal source
and still needs its receipt; existing reduced HOME paint scheduling is unchanged.
Missing retained label/model or selected child draw uses paired host recovery.
Wallpaper/HUD stay live; only the native primary/label lifecycle is retained.
Asset replacement, power-off, root return and disposal invalidate owned data.

Selected verification (no full suite/build/server/GUI):

```sh
node --test --test-reporter=spec tests/home-folder-entry-banner.test.mjs tests/home-folder-entry-banner-live.test.mjs tests/home-entry-motion.test.mjs tests/home-folder-entry-assets.test.mjs tests/native-home-controls-paint.test.mjs tests/home-banner-host.test.mjs tests/home-banner-service.test.mjs tests/home-banner-lifecycle.test.mjs tests/firmware-banner.test.mjs tests/home-entry-motion-scene-policy.test.mjs tests/home-entry-banner-scene-policy.test.mjs tests/home-folder-close.test.mjs tests/native-screen-input.test.mjs tests/render-quality.test.mjs tests/manual-entry-live.test.mjs tests/lcd-capture.test.mjs
npm run typecheck -- --incremental false
git diff --check
```

Tests cover all lower poses and terminal retention, stale/no-paint re-entry,
foreign/replaced/unpresented root, current-child release/failure/retargeting,
monotonic retry, context/sleep/diagnostic/reduced rebasing, ordinary child input,
normal Back, firmware replacement and disposal. Existing held-pickup fixture now
publishes a real root/entry sequence before testing its settled visibility policy.
Result: **364 pass, 0 fail, 0 skip, 0 TODO**. Nonincremental TypeScript and
`git diff --check` pass. Dependencies were reused without installs.

Coordinator must integrate only the new folder commit, run full checks and
recapture the immutable one-row re-entry route with normal/reduced desktop/mobile
repeats, early B/HOME, restored context and failed resources. Retain chronological
terminal and first-child receipt samples, compare raw LCDs with the empty mask,
and inspect sheets. Source ordering is identified and the correction is delivered/
implemented/tested; updated browser inspection/native comparison remains pending.
AN-03 stays **fail** until recapture explains the baseline upper/lower residuals.
Exact native clock/gate alignment, frame cadence, timing and muted audio remain
unaccepted. Existing font raster/overlay transfer, viewport/footer fits, portfolio
content and other previously documented non-native adaptations are unchanged.

## AN-03 Trailing Native Hide Follow-up

Base: reviewed worker `132fcd5f6493711d381f5f1cb9c5891875cda58e` (root integration
`52af0c5bf111947b9b0d2f95ce45b2c8b1c81f6c`). This bounded follow-up adds the
missing native upper hide producer. It does not change lower resources, native
host requests/load gates, scene, reducers, Manual or applet lifecycle. Shared
screens edits are only the approved folder sampler, hidden-resource guard and
folder active query, coordinated with the applet worker. STATUS stays untouched.

### New Visible Baseline

Coordinator inspected the continuous native sequence: `15.11.13.222` root folder
full with lower pressed feedback; `13.702` lower partial/root full; `14.196`
lower complete/root shrinking; `14.657` no folder. No screenshot-derived scale
or geometry is implemented. The first fix retained the folder but kept scale1
until abruptly handing off the already-hosted child.

Current immutable comparison:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/comparisons/folder-reentry-frame16-52af0c5/`.
Selection JSON SHA-256
`8851aa296812bc79ab20045d6f5c651263bbcd2cfdca89dcdd104617ff1f78a6`;
`report/report.json` SHA-256
`1e2bbdd6e7a9ff17f0b9a6ce9862e7a7523bb6ec6dcaf10138d19d9fa38df068`.
The same native `14.196` ownPNG hash and empty mask above are retained. Browser
first valid presented lower16 is repeat1 index23 at537.8ms; upper SHA-256
`b4298fe627a950a1fd4b3348d9b22d36e8690b5f6cbad44614fe221897cf4dcc`,
lower `bed1b01bdca456c050fd56a7d683dd677e797da593338954957eba8e6d6b6960`.
Empty-mask delta2 report is **57999 upper / 7450 lower**, previously61126/7478.
Presence improved, but the missing hide transition is an active native mismatch.
The root source wait is recorded browser fixture preparation, not native input
epoch or duration. No new worker capture or private evidence was written.

### Original Producer and API

The pinned HOME title/version/content, model, textures, font and converter mapping
in the previous section is unchanged. Original `code.bin` is SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
The existing [native banner lifecycle](../native-banner-lifecycle.md) identifies
normal requested visibility at `0x1f9e64`, separate requested/actual visibility
and float32 scale at `0x1fa344`, manager yaw at `0x24e0c0`, and visible-only clip
passes at `0x24f300/0x24f484/0x103850/0x10b3d0`. Original isolated ARM golden
results are already tested by `home-banner-lifecycle.test.mjs`; no fresh ARM
execution or general source archaeology was performed. The historical private
`presentation/folder-lifecycle` directory is unavailable at its recorded path in
this worker environment; the pinned-source documentation and committed golden
tests, not a newly generated native execution, support this reuse.

After a valid lower16 receipt, the retained source's next eligible sample calls
the existing `setHomeBannerVisibility(lifecycle,false)` and one existing
`advanceHomeBannerManager` plus `advanceHomeBannerClips` pass. Successive visible
producer outputs are the original float32 .95/.90/.85/.80 samples; the separate
next call actually detaches. No curve, scale, easing, count-derived milliseconds,
new banner target, replacement activation or loader wait was invented. Hidden
source frames still use the renderer's existing handled-hidden/resource check;
they do not require or repaint a visible label. Missing/disposed resources remain
paired failures. The hidden producer output itself requires a valid receipt
before a child pair can be staged; current-child receipt guards still retire the
old source permanently.

`sample(owner,motion,destinationReady,reducedMotion=false)` preserves its first
three parameters; poses expose `phase: entry|hiding|hidden`. `complete(owner)`
now requires acknowledged actual hidden state, or an already-retired source.
`active(owner)` stays true through trailing hide and pending child release, even
though the lower visible selectors remain FadeIn16/Fade8. It requires a matching
retained source or entry; missing/reset/foreign ownership cannot hold cadence.
The existing folder
readiness gate therefore quarantines child input through the hidden receipt;
B/HOME/power escapes remain available. Exact navigation revision remains required
until that endpoint; ordinary post-endpoint child selection and existing close
sequence guards are preserved. Cadence requests the unchanged existing transition
budget via the helper's active query, without a scene or quality-budget override.

Reduced motion first publishes the retained visible upper with lower16 and needs
that pair's receipt, including a mid-entry reduced toggle. Only the following
candidate seeks the source detach endpoint by executing that same visibility
producer; the hidden endpoint then needs its own receipt. It never fabricates a
receipt and does not reissue a hide request when already hidden. Disabling reduced
motion after a presented hidden endpoint cannot replay a previous shrink pose. Revocation before
endpoint publication rebases the last receipt-backed phase. Failed/offscreen/
diagnostic/context/sleep/stalled samples cannot advance the committed producer;
Retry repeats the presented pose before subsequent ordinary source steps resume.
The existing receipt-relative lower observation cursor continues beyond16 while
its visible lower selectors stay16/8; no second timer or shared clock was added.

### Verification and Acceptance

Run the same selected verification command above. Added checks compare every hide
motion to the original lifecycle producer, reject release before actual detach
receipt, keep cadence through trailing hide, exercise mid-hide three-update LCD
cadence/stall/failure/diagnostic/context/retry, reject stale hidden receipt after
rapid no-paint Back/re-entry, and retain child failure/release/reduced/disposal
coverage. The held-pickup fixture now completes the full entry/hide publication
before its settled child interaction. Tests also cover reduced first-entry and
mid-entry visible-terminal/hidden-endpoint receipt ordering, plus absent or reset
source cadence ownership.
Result: **367 pass, 0 fail, 0 skip, 0 TODO**. Nonincremental TypeScript and
`git diff --check` pass. Relative handoff links resolve. No dependencies were
installed and no full suite, build, server or GUI was run by this worker.

The **lower16 receipt -> hide start**, one producer pass per eligible render
receipt and input quarantine are explicit browser adaptations. Native ordering
proves child refresh follows lower-controller completion, not this exact browser
boundary, phase lock, duration or LCD cadence. In particular, the first lower16
browser pair can still show scale1 while native `14.196` is already shrinking;
this follow-up does not claim to resolve that epoch mismatch by fitting a scale.
It delivers the missing original hide sequence and requires coordinator normal/
reduced desktop/mobile recapture with retained first lower16, each upper hide
pose, actual hidden endpoint and first-child paired receipts. Keep empty-mask
diffs and inspected sheets; AN-03 remains **fail** until residuals are explained.
Audio stays muted/unaccepted; all prior font/transport/viewport/portfolio and
early child-host request adaptations remain explicit and unchanged.

## AN-03 Child Host Ordering Follow-up

Base: reviewed worker `33a67ee0bce273edd21c750110a01c1284c91a50`, integrated by
the coordinator as `05f16ed`. Git wins over inherited STATUS; its preexisting
coordinator-authored dirty SHA remains untouched and unstaged. Coordinator HEAD
at delivery preparation is `18d3fa32aabb80b25bc3155912737c2152ed30b9`, including
the independent applet work. This worker does not cherry-pick or redeliver that
work. This section supersedes the earlier early-child-request adaptation and
hidden-receipt-only input boundary; prior evidence is preserved as history.

### Captured Defect and Source

The coordinator inspected runtime `05f16ed` at
`/Volumes/Sandisk1/3ds-fidelity-artifacts/animation-20261007/integrated-05f16ed/folder-native-tile/repeat-terminal-hide-sheet.png`,
SHA-256 `f9c249e7564df4e48afcf12dd500705b46a66f840f10c23d831e682b3b3e5fa2`.
Root shrink is now present, but repeat1 index27 at692.8ms reveals the child already
fully scaled and advanced immediately after hidden index26 at671.9ms. Capture
JSON SHA-256 is `3a65ee51eeb77c2391082419a163b14dd3f0236df57ea9a44901aa896a1ea4d3`.
Index27 raw upper is `d401986f796f1dabfcdb9d485fffe65789a2e78337424882c8fc98e74f557cf7`,
lower `73f40b9bb630aedda8713a2567d9da0d1929ac9c21e3c4225d04603db8c2145c`;
its hosted default primary is visibility scale1, skeletal/material frame21.
The unchanged native continuous sequence has root full at13.702, shrinking at
14.196, removed at14.657, then later child growth. No new pixel diff or timing
acceptance is inferred from these sparse slow-speed samples. No worker GUI,
capture, private evidence update or screenshot-derived geometry was used.

One bounded read of the existing pinned disassembly confirmed the ordering
already identified above: `0x29b954` establishes r5=r4+e30;
`0x29b9bc..0x29b9cc` returns while that object's +14 status is1 or2. The successful
path requests mode0 via `0x1e8f38` at `0x29bb54..0x29bb5c`; the mode0 selection/host
preparation calls refresh `0x1e0f44` at `0x29a4dc`. This is child refresh downstream
of lower-controller completion, not an independent check of two controllers,
nor proof that browser lower16/hidden receipts equal native caller epochs.
Code/disassembly SHA-256 and HOME title/version/content identities in the prior
sections are unchanged. All visible elements still use the same mapped folder,
default, Frame, label, lower capture/FadeIn, wallpaper and HUD resources and
`ctr-cgfx-web`1.3.0 converter; no asset, visual producer, curve or cue was added.

### Narrow Wiring Contract

`createHomeFolderEntryBanner` now exposes `requestReady(owner)` after the same
entry's valid lower16 receipt, and `activationReady(owner)` only after its valid
actual-hidden receipt. Both reject a retained source in rebase, missing source,
replacement firmware/application/System/close sequence and foreign navigation.
Once the first child pair is acknowledged, ordinary child cursor revisions remain
free. Before that release, even an acknowledged hidden source requires the exact
entry revision: loading B/HOME escape does not allocate the normal close sequence,
so rapid Back/re-entry without a new presented root cannot reuse that endpoint.

The folder-only screen forwarders are `homeFolderBannerRequestReady(state)` and
`homeFolderBannerActivationReady(state)`. Root/nonfolder behavior is unchanged;
opened-folder eligibility, panel failure and disposal remain guarded. The scene's
`observeFolderBanner` selection boundary and `advanceBeforeMutation` before/after
manager observations use the request gate. Once it opens, the observer resolves
the current child even if the original entry selection observation was withheld.
Activation combines the new folder gate with the existing `homeEntryActivationReady`
instead of replacing it. The original Host request, resource ticket, hide, worker
wait, loading, activation, manager and clip sequencing remain untouched. No reset,
new target/controller, guessed duration, counter override or host-clock rewrite
was introduced. A child instance therefore cannot run its clips behind the
retained visible root; it is activated by its original producer after hidden
publication, and grows from that producer's original activation.

The tiny folder-only `stockStatus` clause stays loading while the retained session
is active, including hidden root and pending/unready child. Only the existing
matching successful child draw plus paired WebGL release receipt makes it ready.
Failure retains priority; B/HOME/power recovery remains available. Failed, foreign
or unpresented child paints cannot release input. This clause is separate from
the applet worker's stock source-readiness quarantine. Shared changes were
coordinated: folder query return properties and only those host-boundary lines;
the coordinator must retain both workers' return properties/activation factors
and both independent `stockStatus` guards during sequential integration.

### Checks and Open Acceptance

Selected verification is the prior16-file command plus
`tests/home-folder-entry-host-scene-policy.test.mjs`. Result: **372 pass, 0 fail,
0 skip, 0 TODO**. Nonincremental typecheck, `git diff --check` and handoff relative
links pass. Dependencies were reused read-only; no full suite, production build,
server or GUI was run. Real `HomeBannerHost` plus actual screen composition tests
cover normal/reduced two-cycle re-entry, three native host passes per LCD paint,
unacknowledged lower/hidden endpoints, monotonic context/Retry rebase, original
child activation and initial growth without resets. Focused helper/painter tests
reject missing, foreign, failed and firmware-replaced readiness, stale child
receipts and rapid recovery re-entry without an intervening root paint. Hidden
loading input stays quarantined until child receipt; ordinary post-release input,
Back and root policy remain covered. Static scene checks bind these tested gates
to all live request/activation boundaries.

The **lower16 receipt -> child request**, **hidden receipt -> activation** and
**first child receipt -> input readiness** boundaries are browser presentation
adaptations, supported by native ordering but not recovered native epochs. The
retained root still takes one native producer pass per eligible receipt. The
fresh child uses the unchanged native Host's HOME-update scheduling; with three
updates between LCD paints, tests observe its original counter3/scale0.9/frame3
first pair then scale1, not guaranteed capture of every source pose. There is no
new timing, cadence or render-budget claim. Reduced mode still separately
publishes visible lower16 and actual hidden endpoints, then lets the original
host activate the child; it does not synthesize receipts or restart that producer.
Existing font/transport/viewport/portfolio differences and muted audio remain.

Integrate only this new follow-up commit atop the coordinator's existing folder
chain, retaining the disjoint applet wiring. Run full checks and matched normal/
reduced desktop/mobile recaptures, including repeated entry, early B/HOME and
context/recovery. Keep chronological lower terminal, every upper hide, hidden and
first child receipts plus current native ownPNGs, empty-mask raw LCD diffs and
inspected sheets. Source ordering is identified and this correction is implemented
and tested; new browser inspection/native comparison remains coordinator-owned.
AN-03 stays **fail** until the active child-growth mismatch and prior residuals
are explained. Exact native phase/duration/clock alignment and audio remain open.
