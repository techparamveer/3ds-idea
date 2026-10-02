# Suspended HOME Highlight and Parallel Work

## Delivered

Runtime `7b243793` draws the source lower suspended-software highlight on the
retained owner only and hides the ordinary footer under a switch dialog.
Worker `366e9342`, integrated as `dc6d19f7`, supplies the pure Sleep controller;
`47845dc5` wires one owner-scoped clock sample to both LCD painters. Leaving
suspended HOME clears it; repeated paints do not advance it; reduced motion
consumes updates at frame0. Source upper/lower alpha curves are distinct.
The owner-relative epoch and 120-update loop remain host timing adaptations.

Two existing chats worked concurrently in separate new branches/worktrees:
`codex/home-sleep-motion-20261002` and
`codex/home-transition-motion-20261002`, both based on `7b243793` under
`/Users/paramveer/.codex/worktrees/`. Latest user-supplied preference is
GPT-5.6 Sol/high. Service tier is not exposed. Workers never drive GUI.
The close worker delivered `43b18bf0`, a reviewed pure controller, not live
closing motion. Its next integration must preserve the terminal frame through
a paint, use a sole monotonic identity allocator, consume inhibited updates
without catch-up, and revalidate owner/capture generation before closing once
and launching the frozen switch target. No duplicate source-only slice.

## Source Identity

No new assets or conversion. Manifest `home.launcher` points to
`packs/home/launcher.json`, SHA-256
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.
HOME title `0004003000009802`, v24576, content index0 / ID `00000082`:
CIA SHA `2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
decrypted content SHA `c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`;
`romfs/launcher_LZ.bin` SHA `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.
Converter `ctr-native-web` 1.2.0 / CTRTool 1.3.0. Inherited converter-script
hash drift and legacy font-content/MSBT-member provenance gaps are not fixed.

| Visible element / pack key | Internal member below launcher_LZ.bin | Member SHA-256 |
| --- | --- | --- |
| Lower highlight / layouts.LncIconSleep_00 | blyt/LncIconSleep_00.bclyt | 7f8b8f7da609e138c0c0c153de0d58aca2c123c8072be6aa847c40fe86153a39 |
| Appear20 / animations.LncIconSleep_00_Appear | anim/LncIconSleep_00_Appear.bclan | fbea24e9b2b35a2a57566173805c52577fe3fa0108a1fbd80eaa16303a7813ac |
| Density / animations.LncIconSleep_00_Scale | anim/LncIconSleep_00_Scale.bclan | a38e525aad2caf213a846f7156bd47e0f3efd2f8a8a39a5234c17d0832cb905d |
| Lower pulse / animations.LncIconSleep_00_Sleep | anim/LncIconSleep_00_Sleep.bclan | 97766a9870ec736b90751deea67121f18eb714f1387202a99ec911b36c214b0d |
| Upper pulse / animations.LncBase_U_00_Sleep | anim/LncBase_U_00_Sleep.bclan | 2def63b54f9f1f7c938620aeda619dcf8077e266f2a354940533f5bb1b9d2719 |
| Hidden switch footer / animations.LncBtmBtn_02_SceneOut | anim/LncBtmBtn_02_SceneOut.bclan | df95bfcc74135a116fe14b39604cdd1300197e48b2c864989d3b40d35f13cf1d |

`textures.LncIconSleep_02.bclim` maps original16x16 A8 member
`timg/LncIconSleep_02.bclim`, source SHA
`c9e9d35ded9edd103071207add8a6be8adf52205b7b623ac8f9236feee8cb4e5`, to
manifest resource `textures/63dbd94243e435f3d045fc48bec1a4325676492c6f5f4c6b7b3d55a2fbcc3f25.png`
with matching delivered SHA. Original material, UVs and sampler preserved.
Upper icon/source window mapping remains in the [compact-window record](home-compact-window-2026-10-02.md).

## Verification

Private artifact root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/suspended-highlight-native/`.
Static `summary.json` SHA
`5fc3fcc8b9150cc6c5f7e9ce0c102f2e47f45e8593b721137a3b74594303ece4`;
runtime `pulse-summary.json` SHA
`29da0fd14592d36e331383b397a61bcddac58406cba85ce5b4ebdb1ee50f1300`.
They track each raw LCD/capture hash, named pair, source mapping, empty mask,
diff report and sheet. No historical matrix change.

- Tested: `7b243793` full1690 pass; `47845dc5` full1695 pass. Both0 fail,
  23 skip,1 TODO; typecheck/build pass. No shader/material changes in this slice.
- Browser-inspected:18 static and10 pulse production pairs at400x240/320x240,
  ten browser sheets plus native comparison sheets opened. All muted, no page
  errors. Actual controls/touch cover suspend, switch/cancel, moving Camera,
  footer-switch, resume, reselection, close and portfolio owner. Pulse history
  records expanded HOME updates362 and396; both48x48 icon interiors change at
  all2304 pixels >2. This proves browser motion, not exact native phase/cadence.
  Desktop1150x693 and mobile390x740 screenshots are nonblank and framed;
  canvas RGB standard deviations exceed55, ready/muted true, no error overlay.
  These are viewport checks, not hardware/model fidelity acceptance.
- Native-compared: independent muted copies `native-close-clean-20261002` and
  `native-home-motion-20261002` ran side by side on Sidecar at1810,397 and
  2460,397,630x780 each. Both executable SHA
  `3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`;
  separate real NAND/config/log/screenshot trees, original EUR hardware,
  Static input2 / Null output1 / volume0. Coordinator alone operated both.
  Primary own PNGs06:38:22.082 expanded,06:38:35.647 Camera and06:38:39.694
  switch are paired against the production captures. Secondary06:37:39.346
  supplies independent idle. Startup warning dismissal preceded working
  input. Concurrent slowdown and disabled Advance Frame prevent timing proof.

| Pulse pair at47845dc5 | Upper pixels >2 | Lower pixels >2 | Status |
| --- | ---: | ---: | --- |
| suspended-pulse-expanded-20261002 | 8242 | 33756 | fail |
| suspended-pulse-camera-20261002 | 12119 | 22004 | fail |
| suspended-pulse-switch-20261002 | 14257 | 10542 | fail |

Input prefixes, population/slot placement, HUD and phase remain unmatched.
The static same-density icon diagnostic translates native rect92,376,48,48
to browser lower220,136,48,48:8/2304 pixels >2, max6, mean RGB0.213.
It is not whole-screen acceptance. Switch footer mean RGB error9.205 ->3.250
and max76 ->11: buttons disappear, but6398/6400 pixels still exceed2 because
the backdrop shade differs. Do not describe its threshold count as improved.

Both Azahar processes were stopped after captures; Quit/Yes exited139 in
both, not clean exits. PID absence verified. Logs/configs preserved and
temporary HOME/touch bindings restored while stopped, retaining mute and
separate screenshot paths. Profiles remain available for the next comparison.
No system audio, Spotify or microphone settings changed.
The testing browser closed with launcher exit0; the dedicated verifier stopped
with exit143. Only the intentional refreshed preview on127.0.0.1:3021 remains.

## Remaining

H-12/L-05 remain partial. Native Sleep epoch/cadence, closing/resuming motion,
HUD glyph/style, footer background shades, capture sampler/placement and exact
input/audio remain open. Full scenarios fail. Settled footer SceneOut14,
upper caption fits and backdrop bindings remain adaptations. Portfolio art,
footer policy and its duplicated frozen HUD, Settings fits/local persistence/
previews and offline boundaries remain explicit non-native differences.
Next is the reviewed close-controller's visible integration, then power-on
and HOME button interactions, preserving already designed screens.
