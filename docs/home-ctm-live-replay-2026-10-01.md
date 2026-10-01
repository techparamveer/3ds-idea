# HOME CTM live replay - 1 October 2026

Coordinator native input diagnostic, not a native/browser acceptance pair.
The production runtime remains at `e59cc4b9`; source-only footer audit
`df0c0df1` was integrated as `1c38ae47`. All whole HOME scenarios remain
**fail**. No browser comparison or audio acceptance was performed in this slice.

## Isolated setup

Private root `R` is
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001`.
New artifacts are internal, not on the full DeveloperStorage sparsebundle.
The original/default profiles and original checkout were not changed.

The stopped `R/native-reference` was copy-on-write cloned to
`R/native-ctm-seed`. A no-title setup launch saved main-window bounds
`(1810,397,1153,781)` and closed cleanly. Read-only NSScreen metadata confirmed
Sidecar desktop `(1800,367,1357,935)` before the replay launches. Main windows
and observed dialogs were verified inside it before input or capture. Every
profile had volume zero before launch; native UI showed `VOLUME: 0%` throughout.
The existing separate 3011 browser remained muted and untouched.

Seed NAND/SD inventory `R/ctm-replay/seed-storage.sha256` has 467 entries and
SHA-256 `d515bea57eb99daaa9dd50fd4d602e4b763e77b94539b5719f7f97152a3a762b`.
Each replay used a separate clone of that stopped seed with clone-local NAND,
SDMC and screenshot paths, no symlinks under `user/`, and an empty profile-audit
issues list. This inventory identifies the seed; it is not a post-run proof that
the writable clones are still identical. Their runtime saves/logs are separate.

Executable Azahar 2126.1.2 SHA-256:
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`.
HOME title `0004003000009802`, v24576, content index0 / `00000082.app`;
the neutral clone content SHA-256 is
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.
Original hardware, EUR/English, Vulkan, native-resolution normal two-LCD layout.
Actual executable and process working directory were checked for each run.

## Launcher and cache observations

The pinned macOS meta launcher rejects long `--movie-play` before Qt handles it.
`R/ctm-replay/neutral-launch.log` records `illegal option -- -`,
`illegal option -- m`, and `Invalid option combination provided` (exit1).
Source at pinned revision `9e6f523a57fac9564ac0bf8286db3c3702d301ec` shows the
outer compression dispatcher uses BSD `getopt("c:x:o:")`; the embedded `o`
in the long option diverts it into an invalid compression request. Use:

```text
<clone>/Azahar.app/Contents/MacOS/azahar -p <absolute movie.ctm> <clone HOME content.app>
```

The HOME path must be last. The direct-executable warning is a synchronous
modal before `BootGame`; a visible game list does not establish that launch
failed. One startup dialog was initially missing from cua-driver's window
inventory. The live process sample showed `QDialog::exec`; exact-path
`cua_repl.getApp` exposed the warning, whose Sidecar position was then checked
before dismissing OK. No process was restarted on an observation timeout.

The first short-form run (`native-ctm-neutral`) reached `Playing 0 / 7056` but
spent the observation interval loading copied pipelines (6,11,61 of1033).
The coordinator requested normal Quit and confirmed Yes; shutdown exited134
with `mutex lock failed: Invalid argument`. It supplied no HOME capture.

Fresh seed clones `native-ctm-clean` and `native-ctm-left` preserved their HOME
pipeline-cache file outside the active cache before launch. The retained file
`R/ctm-replay/seed-home-pipeline.vkch` SHA-256 is
`0a82f1a2df98c25beeea8e6cce6a07b1a1c80705c6083179c2d8106bf5c54ed1`.
Shader-stage files were unchanged. These runs reached HOME and exited0 after
normal Quit. Cold compilation caused pauses and variable wall-time speed;
this is not a motion-timing benchmark.

## Observed input sequence

The neutral template retains SHA-256
`e1273f393d57175ab9cb28b443b267b089ae7af2cb777dbdf1c3a72b5ae01951`,
27,596 pad/touch pairs, matching title/revision, and entirely neutral controls.
`clean-config.before.ini` SHA-256:
`79d0dc9b9fcdef9704d1979edddb73b4c03083983138e18d0b8604d7c72002e3`.
Neutral playback visibly selected Notifications, with counter280 then1474/7056.
Its title plate contained only `N`; retain this rendering anomaly explicitly.

`left-open.ctm` SHA-256:
`c3a3f6cc67a3405a694b9916bee40c7a0b910723bd75775e784fe7d7c98c3e70`.
Bound config `left-config.before.ini` SHA-256:
`c8c0ef9ca2b7eb619918bca3495311b2752ebcac67cedb702d3364cddeee325a`.
Plan and transform manifest are `R/ctm-replay/left-open.plan.json` and
`left-open.manifest.json`. Reinspection confirms preserved header/length/type
order and the following half-open sample ranges:

| Samples | Controls | Live result |
| --- | --- | --- |
| 0..7020 | Neutral | Notifications visible at counter1417/7056, title still `N` |
| 7020..7028 | Left | Friend selected at counter2057/7056; full Friend List label |
| 7028..14040 | Neutral | Friend selection remains |
| 14040..14048 | Touch160,226 | Friend List launch visible at counter3668/7056 |
| 14048..27596 | Neutral/released | Friend List shows error002-0121; counter4527/7056 |

Eight samples are nominally34.188ms; actions begin at nominal30s and60s from
the first pad sample, not from wall-clock boot or a browser event. Status counts
are Azahar's pad-derived display estimate, not exact rendered-frame identities.
No live pad/touch navigation was injected. Emulator capture/quit menus and
the direct-executable notice were the only coordinator UI actions. The log
contains `Loaded Movie, ID: 0F3399EBD0891F43` and no movie mismatch entry.
The run was stopped before EOF; absence of a logged mismatch is not a full
determinism proof. The online-service dialog was captured but not acted upon.

## Native captures

All are Azahar's own400x480 PNGs, opened for inspection. Paths below are under R:

| State | Relative path | SHA-256 |
| --- | --- | --- |
| Neutral Notifications | `native-ctm-clean/screenshots/_01.10.26_21.48.10.918.png` | `4a984b847fff89a032fb76d783896a939234f6d417562d134fd83818fd08b7d2` |
| Friend selected after Left | `native-ctm-left/screenshots/_01.10.26_21.52.06.493.png` | `ea8f642e034bf1fc8ad6ab5c0804bb94dc883c1856940c9399f0c6d3794b80b5` |
| Friend List after touch | `native-ctm-left/screenshots/_01.10.26_21.53.12.418.png` | `a0cf693d659025c4861238b136d53cfa91dd95cf510b1d081afc811f585f5c9b` |

Window PNGs in `R/ctm-replay/` document placement and playback counters only.
One window grab had a black lower area, while the immediately following native
PNG contains both LCDs; do not compare window captures as native LCD evidence.
There is no browser pair, mask or diff report for this input diagnostic.
No global scenario matrix row was changed.

## Checks and remaining work

Integrated footer source audit `1c38ae47` regenerates its committed evidence
byte-for-byte from pinned code/launcher; focused2/2 and full1536 tests pass
(0fail,23skip,1TODO). Typecheck and production build pass. Production runtime
pixels did not change; no shader/material implementation was edited.

Next: repeat the same CTM from another identical seed clone, investigate the
initial truncated native title, then replay the same controlled HOME selection
and activation in the production browser. Do not infer an event clock from
capture filenames. Live footer theme-state inspection is the next bounded
material diagnostic in the [source audit](home-footer-theme-source-audit-2026-10-01.md).
The gate/bytes remain unknown, not a proven cause of the694 edge pixels.

Portfolio tile/content and offline behavior remain intentional adaptations.
Unresolved native title/plate/footer edges, banner yaw, wallpaper/HUD/cursor
phases, exact input/motion and muted audio remain open. This run proves an
observed CTM navigation and launch, not repeated execution, a matched browser
route, 1:1 pixels or whole-scenario acceptance.
