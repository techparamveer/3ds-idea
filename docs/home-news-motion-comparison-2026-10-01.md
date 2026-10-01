# HOME Notifications motion comparison - 1 October 2026

Runtime `a578625d4ed98de1689ee9b89244ff291ce23695` integrates worker
`0de7dd33` on `codex/home-fidelity-20261001`. Notifications now uses native
generic primary motion rather than the legacy forced-front pose. **All whole
scenarios remain fail.** Source identification, implementation, tests, browser
inspection and native comparison are distinct evidence tiers below.

Private root `R` is
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001`.
No new artifacts went to DeveloperStorage; no historic matrix was changed.

## Source and implementation

The [source note](home-news-motion-source-2026-10-01.md) identifies category6,
canonical empty key/type16, BannerAppletNews, generic constructor/update and
600-update negative yaw. The host now distinguishes News16 from Friend14 even
though both use the empty key. It preserves request epochs, generation guards,
outgoing ownership, pending readiness and explicit blank failure diagnostics.
Skeletal600/material300 looping clips feed the existing primary render frame.
Memo, Web and Miiverse retain their unsupported host handoff; no parallel state
system, fallback banner, guessed phase correction or new graphics were added.

Visible News model/plate/text surface -> manifest `models.bannerAppletNews`
-> `models/banner-applet-news/model.json`, SHA-256
`7394da3f79dd9df31a6d3bcc17967cbd064979194f12a62b510be575b4a034d2`.
HOME title `0004003000009802` v24576, content index0 / `00000082.app`,
CIA-internal `romfs/3D/BannerAppletNews_LZ.bin`; compressed SHA
`5170a1c67eed6dd6536a85c0a83689552fe335ad9fa51d88085d0c5084c1a931`,
decoded CGFX SHA
`c91a037f6462c2aef79fb5944225e8a4c36e7116de804e86cc780a233805a1bc`,
converter `ctr-cgfx-web`1.4.2. Native `DmyText_00` and message/font style remain
as in the [label evidence](home-applet-title-style-2026-10-01.md).
No assets were regenerated. Zero native displacement/offsets and the initial
controller attachment/activation epoch remain provisional, not native-verified.

## Native diagnostic

Fresh stopped-seed clone `R/native-footer-runtime` passed all467 NAND/SD hashes;
log SHA `b865f182a0562a44b83beba3050619438863eaac8ba3d14ed68360f5c97fe3fc`.
Only clone storage/screenshot paths were rebased; config-before SHA
`f0c055a74742f179f0f5ad015f86fb522a502c44e94c775894ca89389d7b1409`.
Pinned executable/content hashes, original hardware/EUR/English/native-resolution
Vulkan match the [CTM setup](home-ctm-live-replay-2026-10-01.md). No user-path
symlinks; copied pipeline cache preserved outside active cache. Volume0 verified.

Same `R/ctm-replay/reselection.ctm`, SHA
`daa3b0dbacddf006bddbc9ab87aab8d9e1be84178de07b73391e3fb35893ab3f`,
uses short `-p`, Left30s/Right50s/Left70s, eight pad samples per hold and neutral
release. Main window `(1810,397,1153,781)` was independently verified on Sidecar
before boot interaction. Native own400x480 PNGs under clone `screenshots/`:

| State / filename | SHA-256 |
| --- | --- |
| Notifications full label/front pose `_01.10.26_22.44.02.434.png` | `f421953178c3f9904d9fd1490734609869de4ce5e470fd536a38b88d86ffbc57` |
| Second Friend yawed `_01.10.26_22.45.51.025.png` | `92654417811c038bffdafd3a3e0969cd9fd83021741bc303bc0a248ff18f2e07` |

Both opened; window grabs are placement/navigation evidence only. Capture,
pause/continue and save requests were delayed by menu tracking. Save State
reported `Savestates are not supported with LLE modules enabled`; no state file
or live footer RGB bytes were obtained. Three error modals initially appeared
on DELL, then each was moved and independently checked at
`(2200,640,420,167)` on Sidecar before dismissal. This placement exception is
not an iPad-only launch claim. No LLE setting was changed.

Quit was requested before EOF but delayed; process samples show
`NSMenuTrackingSession`, not proof of the earlier shutdown deadlock's cause.
The owned window closed but PID4042 survived normal termination; only that
clone was killed, exit137. No Azahar process remains. RPC/GDB stayed disabled:
pinned listeners bind wildcard addresses with unauthenticated write support.
See [footer diagnostic limits](home-footer-theme-source-audit-2026-10-01.md).
Do not repeat unsupported savestate work or enable those listeners as a shortcut.
Native event/capture counters are not exact or aligned with browser counters.

## Production comparison

Build3020 at `a578625d` used a dedicated `--mute-audio` browser. Its blank window
was independently verified at `(1810,397,1150,780)` on Sidecar before navigation.
App mute was true throughout. Ordinary controls prepared one-row Notifications;
that setup is not native input equivalence. Trusted separate Left/Right/Left
down/up events used intended30/50/70s onsets and34.188ms holds. Observed onsets
were30001.4/50001.2/70002.3ms, holds35.2/35.1/35.6ms; all six events trusted.
Both applets reached active hosted states. No reducer/scene state was mutated.

Raw metadata, not the later observer snapshot, identifies the rendered frames:
Friend244; Notifications yaw/skeletal418 material118, then448/148;
second Friend586/286. The two News PNGs visibly change orientation. A separate
read-only wait captured Friend250; its upper SHA
`3477a091bb4fd714e4790398a4c3e7bac0fe900c274b58e5d8f6bb9d59fab440`
is byte-identical to the prior Friend250 capture. This is cross-build regression
evidence, not native phase agreement. Presentation elapsed12000ms and date
`2026-09-22T19:19:00.000Z` do not establish a shared event clock.

Browser root: `R/captures/reference/scenario-matrix/v1/captures/`.
Reports: `R/news-motion/compare-<suffix>/report.json`; report scenarios are
`news-motion-<suffix>`. Empty mask SHA
`dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
All twelve upper/lower contact sheets were opened and inspected.

| Report suffix | Browser scenario (prefix `news-motion-`) | Native reference | Upper / lower pixels >2 |
| --- | --- | --- | --- |
| `news-side` | `reselection-notifications-return` | Retained22.24.16.722 | 24936 / 19210 |
| `news-side-sample` | `reselection-notifications-motion-sample` | Retained22.24.16.722 | 23533 / 19437 |
| `news-front` | `reselection-notifications-return` | Fresh22.44.02.434 | 38346 / 19167 |
| `friend-first` | `reselection-friend-first` | Retained22.23.44.158 | 38551 / 19294 |
| `friend-second` | `reselection-friend-second` | Fresh22.45.51.025 | 19127 / 19377 |
| `friend-regression-phase250` | `friend-regression-phase250` | Retained22.23.44.158 | 37089 / 19242 |

Retained files are in `R/native-ctm-reselection/screenshots/`; hashes and their
unmatched histories are in the [prior comparison](home-friend-motion-comparison-2026-10-01.md).
New/old totals are not phase-controlled improvement scores. Pose, wallpaper,
HUD/battery, title-plate edges and lower cursor phase still differ. Portfolio
tile content/population and offline flows are intentional adaptations; they
cannot excuse unrelated pixels. No new mask or fitted native graphic was added.

Fresh News footer `(0,212,320,28)` still has694 pixels >2, max21, mean0.6191964;
Open text `(130,220,60,20)` has0 >2, max2. Both footer RGBA hashes match the
previous audit. The live theme gate/RGB remains unknown, not a proved cause.

All native/browser, metadata/report hashes and metrics are in
`R/news-motion/summary.json`, SHA
`086a1a3d07f36db2cabc117d901daa21216a35113764d8d6f6a3f01a9d21d25a`.
Native diagnostic summary SHA
`462ecded63f624b7c710e50f2a138bda07fb114b9a9d1037d5187e4a040521bb`.
Reproducible summary script, input observer and logs are alongside them.

## Checks and remaining work

Integrated tests1547 pass/0 fail/23 skip/1TODO; typecheck, production build and
required shader validation pass. Independent review of exact integrated worker
content found no issues;141 focused tests pass. Browser errors empty; final
console screenshot is framed/nonblank and raw motion changes inspected. No new
mobile resize/hardware acceptance claim. All test/browser/server sessions closed;
worker worktrees preserved. User's separate3011 tab verified Audio muted and
untouched; system/unrelated audio unchanged. No push/shared-branch merge/deploy.

Next: match native/browser activation and first-controller frame, measure native
displacement, align wallpaper/HUD/cursor phases, then resolve the footer edge
residual through a safely isolated diagnostic or an explicitly labelled fit.
Initial native `N` anomaly and Memo/Web/Miiverse host handoffs remain open.
Exact input/motion/audio acceptance is unproved. **Keep every3DS session muted**;
do not unmute for audio acceptance without user permission. Goal remains active.
