# HOME workstream handoff: H-12 suspended window and H-10 footer identity

Checkpoint: source base `f5ed204c7955880d59b097a632d48deaa7d80252` on
`codex/complete-home-ui-20261001`. This slice adds semantic tests and this
inventory only. It does not change a renderer, publish an asset, operate a GUI,
or establish a browser/native match.

The coordinator's 1 October model-policy update supersedes the older policy in
this checkout: workstream chats target GPT-6 Astra with high reasoning; any new
bounded helper must use GPT-6.1 Sol with medium reasoning. This already-running
turn was not claimed to have switched models, and it did not create a helper.
The tooling exposes no Fast-mode setting, so this handoff makes no unsupported
claim about that setting.

## Existing semantic owner and footer contract

The bounded Work route already has one unambiguous owner. After Work reaches
`phase: 'app'`, HOME calls `showRuntimeHome` and the existing runtime records:

- `phase === 'home'`, `runtime.active === null`;
- `runtime.application === runtime.homeReturn === <Work owner>`;
- `runtime.instances[owner].appId === 'work'`;
- `runtime.instances[owner].suspended === true` and it is not closing; and
- `system.app === 'work'`, derived from that same application slot.

For this first bounded renderer slice, all of those conditions should be
required together. Do not infer a window merely from `system.app`, a non-null
application slot, or a selected HOME tile. In particular, applet-on-application
states are a separate owner graph and need their own capture before this gate is
generalised.

`getHomeFooter` currently derives the intended H-10 identities:

| HOME state | Selected tile | Left | Right |
| --- | --- | --- | --- |
| no software | Work | none | Open |
| Work suspended | Work | Close software | Resume |
| Work suspended | About | Close software | Open |
| Work closed | Work | none | Open |
| About suspended after confirmed switch | About | Close software | Resume |

The new [route regressions](../../tests/home-completion-routes.test.mjs) assert
the exact owner survives Resume and switch cancellation, is removed by Close or
confirmed switch, and is never reused after closing. They also assert the five
footer identities above. They do not test pixels or native timing.

## Exact delivered source inventory

The native window itself is already delivered. The manifest identity is EUR
10.7.0-32E / EU English. Its root converter is `ctr-native-web` 1.2.0 with
CTRTool 1.3.0. HOME is title `0004003000009802`, version 24576, product code
`CTR-N-HMMP`; the CIA source SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`
and the recorded content SHA-256 is
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.

| Element | Manifest / pack key | Recorded private source | SHA-256 |
| --- | --- | --- | --- |
| HOME launcher pack | `manifest.home.launcher` -> `packs/home/launcher.json` | `launcher_LZ.bin` | pack `f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`; source `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834` |
| Suspended-window layout | `layouts.LncBase_U_00` | `launcher_LZ.bin/blyt/LncBase_U_00.bclyt` | `b1afe7bece548a4ffad1211d011b4822349f61b002616e3a173e2923f06f6a50` |
| Window expansion | `animations.LncBase_U_00_ScaleUpDown` | `launcher_LZ.bin/anim/LncBase_U_00_ScaleUpDown.bclan` | `e1669ce6c081b61200d24d99cd4f61fd24b8c4967fef9b4a99728c29ee10f8d8` |
| Scene entrance | `animations.LncBase_U_00_SceneIn` | `launcher_LZ.bin/anim/LncBase_U_00_SceneIn.bclan` | `784a355f31faa9a43aea6bc5c8a1c3ecb0b4b54060ebb8f114748caecdb5e47a` |
| Appearance | `animations.LncBase_U_00_Appear` | `launcher_LZ.bin/anim/LncBase_U_00_Appear.bclan` | `2984f92736035fec7a9475b6840fc2ba27763a8dd5081cd883ab32651d6fb427` |
| Palette | `animations.LncBase_U_00_WhiteBlack` | `launcher_LZ.bin/anim/LncBase_U_00_WhiteBlack.bclan` | `1adba811dd4430e27477accc344a3654547a1225abc821869edd57e659caef9d` |
| Window frame | `textures.BaseWndwLT_16x32.bclim` | `launcher_LZ.bin/timg/BaseWndwLT_16x32.bclim` | `04d23bbcc333d1ecd997bca51253cfe4add4ca32527fbb9d612e181a8d070380` |
| Split background | `textures.BgSplit.bclim` | `launcher_LZ.bin/timg/BgSplit.bclim` | `393d4e1154607a362a5f893fca4f24cd5753856a24b159e8774fd50264e09425` |
| Icon dummy/mask | `textures.IconDmy.bclim`, `textures.IconMask.bclim` | corresponding `launcher_LZ.bin/timg/*` | `56e03621dcc286b497b4208a6750d013d52905bee1017331d5fe69ad4186afde`, `de8c6815059f79db23984571fb864f56792a738b3391a3800e3d6bc47ab59983` |
| HOME glyph | `textures.PictHome.bclim` | `launcher_LZ.bin/timg/PictHome.bclim` | `e1ff2cab9d9a41d5ed754e2dcb6666d1a7ae845980b7848bf1eea3c067d793f0` |
| EU English messages | `manifest.home.messages` -> `packs/home/messages-and-loose.json`; `messages.menu_msbt_LZ` | `RomFS/message/EU_English/menu_msbt_LZ.bin` | pack `3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`; leaf `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350` |

The exact message bindings are `lau_pose_title_u` (index 14, style 179,
“Suspended software”) and `lau_rest_comm_u` (index 15, style 178,
“HOME: Resume suspended software”). H-10 already uses `lau_2b_close` (index
491, style 185) and `lau_2b_restart` (index 42, style 193).

`LncBase_U_00` owns `N_Wndw_00`, `N_WndwScale_00`, `W_Wndw_00`,
`T_TextTop_00`, `T_AppTitle_00`, `N_TextBtm_00`, `T_TextBtmR_00`,
`N_IconWrp_00` and `P_Icon_00`. Source `ScaleUpDown` frame 15 moves the window
anchor to `(0,2)` and sizes `W_Wndw_00` to 296x132, corresponding to upper-LCD
region `(52,52,296,132)` under the delivered centred 400x240 layout. That is a
source pose and region, not evidence that native settled HOME selects frame 15.

The public manifest does not record a HOME content index/content ID for these
launcher/message leaves. It records `launcher_LZ.bin` and the RomFS message
path shown above. Keep those fields explicitly unavailable; do not invent a
content index or prepend an unrecorded CIA-internal directory.

## Work title/icon identity is an adaptation

Work is not a firmware title and has no SMDH/title ID. Its existing descriptor
is `{id:'work', title:'Work', kind:'application', source:'portfolio',
assetPack:'portfolio'}`. [apps.ts](../../src/os/apps.ts) names its authored icon
`case`. The existing Notes metadata adapter already represents it as
`portfolio:work`, description `Work`, plus an authored 64x64 raster. Reuse that
portfolio identity or the same icon producer; never describe it as a native
SMDH conversion.

For the native gate/geometry reference, Health is a suitable in-scope firmware
application: title `0004001000022300` version 3077, title/description “Health
and Safety Information”, manifest icon `icons/health-and-safety.png`, and
`ExeFS/icon` source SHA-256
`ab6cfc9da9089bb7209bee980ff79b365638e84eacb663e1a792fed58e7a9055`
(content index 0 is recorded on its publisher source). The delivered 48x48 icon
resource SHA-256 is
`156d28fc628375d35813b90a19954241f6da6c34e067f5c2a9b2ccc48dc84aa4`.
Using Health to establish native window behavior does not make Work's title or
icon native; those pixels require an explicit portfolio-adaptation mask.

## Coordinator capture tickets

All captures are coordinator-only, muted, and placed on Sidecar after a fresh
display-geometry check.

1. **Native gate and motion, Health:** from a clean settled HOME with Health
   selected and no suspended software, capture Azahar's own 400x480 PNG. Send
   the recorded A hold/release, wait for the first complete Health pair, then
   send HOME hold/release. Capture the first returned HOME frame and exactly
   1, 5, 10 and 15 subsequent 60 Hz updates. Record the full CTM/input samples,
   selection, clock policy and every frame count. Repeat from a fresh clone to
   establish reproducibility rather than guessing that source frame 15 is the
   settled endpoint.
2. **Browser Work baseline:** clean production HOME, default density 1, root
   slot 0 Work selected, no application owner. Capture at a named HOME update,
   date and hosted-banner/background sample. The Work tile core is lower region
   `(76,82,72,72)`; include `(70,76,84,84)` for its cursor.
3. **Browser Work suspended:** from the identical initial selection and phase,
   A down/up, wait for the first complete Work pair, HOME down/up, then capture
   the same return-frame checkpoints as ticket 1. Record the application owner,
   `homeReturn`, update count and source sampling metadata. The settled window
   candidate is upper region `(52,52,296,132)`; also diff the full 400x240 upper.
4. **Resume and close:** from ticket 3, touch right-footer centre `(212,226)`
   and confirm the same owner resumes. Return HOME, capture, then touch
   left-footer centre `(52,226)`, capture the close dialog separately, confirm,
   and capture no-software HOME. Diff the full 320x240 lower plus footer region
   `(0,212,320,28)`, and require the entire upper window region to disappear.
5. **Switch/stale-owner:** suspend Work, select About at root slot 6 (settled
   core `(244,82,72,72)` with current left slot 2), open, capture the switch
   dialog, cancel and verify Work remains. Repeat and confirm; after About first
   paints, HOME it and capture. Require the upper title/icon to be About and no
   Work pixels/owner generation to survive. Diff both full LCDs, the upper
   window region, the lower footer, and `(238,76,84,84)` around the About tile.

For a native/browser window-geometry comparison, use the Health native sequence
against a browser Health sequence first. Then replay the Work sequence with a
reasoned mask limited to the portfolio title/icon pixels. Do not mask the native
window, messages, HOME glyph, motion, HUD, footer, or stale-owner differences.

## Small proposed renderer change after the capture gate

No renderer edit is authorized by this slice. If the captures establish the
activation predicate and animation sample, the smallest change is:

1. Add one HOME-derived `getHomeSuspendedApplication` view using the exact owner
   predicate above. It must return the owner ID and descriptor and must return
   null after close, during a replacement, or for an applet graph not covered by
   the capture.
2. Pass an explicit title/icon payload into the existing `upperBase` presenter.
   Firmware applications use the already loaded 48x48 manifest title icon;
   portfolio applications use the existing authored icon adapter and remain
   labelled adaptations.
3. Keep the current no-owner draw byte-for-byte: `N_Wndw_00` forced hidden and
   clip `(0,212,400,28)`. For the evidenced owner only, render the full
   `LncBase_U_00`, bind `ScaleUpDown` at the captured frame, bind the two source
   messages plus `T_AppTitle_00`, and inject only `P_Icon_00` through a named
   runtime texture binding. Preserve `SceneIn`, `Appear`, `WhiteBlack`, native
   darkening, cache bounds and disposal.
4. Do not add another owner, capture cache, state field, SMDH loader, or fallback
   window. A missing title/icon is an explicit unavailable state. H-10 needs no
   semantic reducer change; only capture-led native footer residual work remains.

This proposal stays behind the coordinator's capture and shared-file reservation
for `screens.ts`. It is not a claim that the source frame, activation timing,
title fit, icon sampling, or window opacity already matches native HOME.
