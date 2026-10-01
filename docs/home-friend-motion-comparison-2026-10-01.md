# HOME Friend motion comparison - 1 October 2026

Integrated runtime `c2cb1158` from worker `2cbf433e`; failure-path follow-up
`95865ae9` from `3ae8ca1c`. Coordinator branch `codex/home-fidelity-20261001`.
**All whole scenarios remain fail.** Source-owned motion is now implemented
and visibly exercised, but native activation/clip phase is not aligned.

Private root `R`:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001`.
No new artifacts went to DeveloperStorage. All visible reference/browser work
was on verified iPad Sidecar, native `(1810,397,1153,781)` and browser
`(1810,397,1150,780)`. Browser placement was independently checked while blank
before navigation. Azahar volume0 and browser `--mute-audio` plus app mute
remained enabled. System/unrelated audio and the user's separate3011 browser
were untouched. Audio acceptance remains open.

## Source and delivery

Only Friend focus2/category4 enters the existing ticketed host as type14 with
canonical empty key. It reuses generic quarter-step visibility/scale and
600-update yaw, with source looping skeletal600/material300. The old Friend
elapsed-time/forced-front-yaw path is removed. Other nondefault toolbar applets
still use their explicitly unsupported host handoff. Reducers, generation
guards, resource tickets and disposal ownership are preserved.

Element mapping: Friend model/plate/text surface -> manifest
`models.bannerAppletFriend` -> `models/banner-applet-friend/model.json`, SHA
`0a512e2bbde90ff7f592821f6d4f3360a9335c9b806abf01ce8cbd62e0a7c02e`.
HOME title `0004003000009802` v24576, content index0 / `00000082.app`;
CIA-internal `romfs/3D/BannerAppletFriend_LZ.bin`, compressed SHA
`4b99060b220166bdf158a5949ab00d509d29a34fc1701249fa1865c5d141af10`.
Converter `ctr-cgfx-web`1.4.2. The existing native applet label uses
`lau_title_fri_u`; its layout/font mapping is unchanged from the
[title-style record](home-applet-title-style-2026-10-01.md).
The [Friend source note](home-friend-banner-source-2026-09-28.md) records the
decoded hash and code.bin dispatch/update chain. No asset was regenerated.

`nativeDisplacementY=0`, `offsetX=0`, `offsetY=0` and the host activation epoch
remain provisional gaps. No guessed plate-Y fit or phase offset was added.
An independent review found a pre-activation asset failure would be silent.
Follow-up `95865ae9` forwards known Friend/frame failures into the existing
deduplicated unavailable diagnostic even while pending. Normal loading stays
silent; failure stays blank with no substituted banner. Retry was not added.

## Fresh native replay

`R/native-ctm-reselection` is a separate frozen-seed clone. All467 NAND/SD
hashes passed before launch; no user-directory symlinks. Paths were rebased,
config snapshotted, volume0/profile audit issues[] verified, and copied HOME
pipeline cache preserved outside the active cache. Executable/content hashes
and original-hardware/EUR/English/Vulkan/native-resolution setup match the
[first CTM record](home-ctm-live-replay-2026-10-01.md).

Config SHA `27a456bae00e5f8179be4a71916476e2fbd0bd006850051846abd9303709d5cc`.
Movie `R/ctm-replay/reselection.ctm` SHA
`daa3b0dbacddf006bddbc9ab87aab8d9e1be84178de07b73391e3fb35893ab3f`.
Its plan/manifest preserve the neutral template header and type order:

| Half-open samples | Input | Observed result |
| --- | --- | --- |
| 7020..7028 | Left, nominal30s | Friend selected, full label |
| 11700..11708 | Right, nominal50s | Notifications reselected, full label |
| 16380..16388 | Left, nominal70s | Friend selected again |

All other controls are neutral/released. No live navigation was injected.
Initial Notifications again showed only `N`; reselection restored its full
label. This bounds the startup anomaly, not its underlying cause. Capture/quit
before EOF avoided the previous completion-modal deadlock; normal exit0.
There were brief pause/continue menu operations after the Right capture;
native screenshots are not exact CTM/render-frame identities.

Azahar's own400x480 PNGs, under `R/native-ctm-reselection/screenshots/`:

| State / filename | SHA-256 |
| --- | --- |
| Startup black, excluded: `_01.10.26_22.23.08.785.png` | `d69f16b3cb6bd6ed17d611e71aaf50f4e40bb15f8b5ab6bfbc39b8c3dc3f73e3` |
| Initial Notifications `N`: `_01.10.26_22.23.27.746.png` | `773bc1bf916059c7fc6a8640b213f11ea2e6e30c93108fa46b0f36c41e0ad47d` |
| First Friend: `_01.10.26_22.23.44.158.png` | `569ecba2502d03f180e9f61c2632ec860e6c6b21cb6c2a26d6b02d6cdad08cd6` |
| Notifications return: `_01.10.26_22.24.16.722.png` | `cad01085bbeb14feea4aba08395334a2ec6d0b1c52669edc160203853efc6eaf` |
| Second Friend: `_01.10.26_22.24.45.055.png` | `21e86f75e860e132c11e368c7f21407ae31068a0872fc010b5283606181bd465` |

All five PNGs were opened. Window captures only establish navigation/placement.

## Production comparison

Production3020 was freshly built at `c2cb1158`. Preparation used ordinary
controls to mute, select one-row HOME and focus Notifications; exploratory
zero-duration arrow presses did not register, so explicit50ms pulses were used
for preparation. That preparation is not native-input equivalence.

The measured sequence used the exact existing Sidecar tab and repository CDP
client: Left30s, Right50s, Left70s with separate trusted down/up events and
requested eight-sample34.188ms holds. Actual DOM holds were34.6/35.6/34.1ms;
onsets30001.7/50002.7/70002.6ms. All six events were trusted and app mute stayed
true. Both Friend selections reached the hosted active state; Notifications
returned through the unchanged legacy route. No scene/reducer state was edited.

Raw capture uses the presentation-only elapsed12000ms/date
`2026-09-22T19:19:00.000Z`, not a native event-clock lock. Friend samples have
live yaw/skeletal counters250,280,594 and material250,280,294. The first two
upper images visibly differ as motion advances. Final95865ae9 was rebuilt and
reloaded, then observed at counter250 without changing state. Its upper PNG is
byte-identical to the earlier counter250 capture, SHA
`3477a091bb4fd714e4790398a4c3e7bac0fe900c274b58e5d8f6bb9d59fab440`.
This verifies normal-path stability across the diagnostic fix, not native phase.

Browser directories: `R/captures/reference/scenario-matrix/v1/captures/<scenario>/browser/`.
Reports: `R/friend-motion/compare-<suffix>/report.json`. Every pair uses the
empty mask SHA `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
All ten upper/lower contact sheets were opened and inspected.

| Scenario | Report suffix | Upper / lower pixels >2 |
| --- | --- | --- |
| `friend-motion-reselection-friend-first` | `friend-first` | 37089 / 19257 |
| `friend-motion-reselection-notifications-return` | `notifications-return` | 26686 / 19449 |
| `friend-motion-reselection-friend-second` | `friend-second` | 46796 / 19337 |
| `friend-motion-retained-reference` | `friend-retained` | 49549 / 19123 |
| `friend-motion-final-diagnostic-fix-phase250` | `final-phase250` | 37089 / 19338 |

The retained-reference report reuses the earlier native Friend PNG and the
first new browser capture; all other rows use the fresh named native states.
Old retained-reference upper50877 ->49549 is not a phase-controlled improvement
metric. Fresh pairs differ in pose and wallpaper/HUD/cursor phase; the second
Friend pose is closer but remains unexplained. Portfolio tile content/population
and offline network behavior are adaptations, not excuses for unrelated native
differences; battery/HUD state remains unmatched. No new masks or adapted native
graphics were added.
Footer remains694 pixels >2/max21; Open text0 >2/max2. The native/footer pixel
hashes are identical to the prior audit. Live theme material bytes remain unknown.

Full native/browser/capture/report hashes, input measurements and footer metrics:
`R/friend-motion/summary.json`, SHA
`25ae5133c1cb7191bf45584aa01b8c7dd97f70c593163188eb496891eab52ce1`.
Replay/script/logs are alongside it. No historical private matrix was changed.

## Checks and next

Final integrated suite1541 pass,0 fail,23 skip,1 TODO; typecheck/build pass.
Shader validation also passed before the diagnostics-only follow-up. Independent
review verified its P2 resolved and91 focused tests pass. Browser errors were
empty. The real console screenshot and raw LCDs are nonblank, framed and moving.
All owned test sessions completed; dedicated browser and production server
closed, native exited0. Worker worktrees remain preserved. Nothing pushed,
merged to a shared branch or deployed.

Next: measure the native Friend activation/first submitted controller frames
and displacement against these captures; align wallpaper/HUD/cursor phases;
then source-trace the now cleanly captured Notifications yaw and inspect live
footer route bytes. Exact input/motion/audio and all whole-scenario acceptance
remain open. Keep all3DS sessions muted until the user permits audio validation.
