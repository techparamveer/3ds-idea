# Independent review — HOME idle upper ROI 12255 — 6 October 2026

U18R. Grok 4.7 on
`/Users/paramveer/.codex/worktrees/home-idle-12255-20261006`
(`codex/home-idle-12255-20261006`). Review of leftover `0c610722` /
worker note [HOME idle 12255](home-idle-12255-2026-10-06.md).
Different model from the U18 worker (GPT-5.6 Sol). Docs only. No Azahar,
production `:3000`, or painter edit. The coordinator checkout was not edited.

**Verdict: APPROVE** of `0c610722`.

No unique unused dump writer, pane, or source-size exists for the upper
title/wallpaper ROI `[40,80,360,210)`. Health `banner.bin` already supplies
`COMMON1`/`COMMON2` on `pTitle1`/`pTri`. HOME `BannerBG` is one mesh and
already plays `BannerBG_Loop`. The note does not invent a pane and does not
excuse a painter change. Predicted hold **12,255** stands. This is not 1:1.

Implemented: N/A. Tested: N/A (no new suite). Browser-inspected: N/A.
Native-compared: N/A; the pinned pair was re-hashed and re-counted, not
recaptured.

## Assigned leftover

Worker commit `0c610722` on parent `9f14e0cc`. That commit adds
`docs/home-idle-12255-2026-10-06.md` only.

## Pair (reused, not recaptured)

Empty mask. Threshold any RGB channel >2/255. Native upper crop of the
400×480 PNG is `(0,0,400,240)`. Lower crop is `(40,240,320,240)`.

| Item | SHA-256 |
| --- | --- |
| Native `_06.10.26_13.55.03.154.png` (`azahar-health-idle-400x480.png`, same bytes as `azahar-after-arrow.png`) | `ebbc274385b53c3b1c4e78f8aab47208d408bde50be91168977f2e542c57a643` |
| Browser upper | `441d366dc42c5d7a60cca12514c676ccba15179889fd485c76545722be119832` |
| Browser lower | `656f808fe85d7e9e9ffc236744bfd31c0f94147303f8abe290eb776db8ba7bc0` |
| Report | `f5d9435f0a3bfbcde0436426542b6dbde026e533a4c9d8f712213c72e754513b` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Recount: upper **23,182**, lower **14,754**, ROI `[40,80,360,210)` **12,255**
(max channel error in the ROI **204**). Artifacts:
`/Volumes/Sandisk1/3ds-fidelity-artifacts/home-idle-20261006/`.

## Dump identity

The documented `assets` symlink under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets`
points at a missing overflow directory. These checks used the decrypted NCCH
copies whose SHA-256 values match `manifest.json` `sources`.

Health and Safety `0004001000022300`. TMD title id `0004001000022300`, title
version **3077** (`0x0C05`). Content index **0**, id **`00000008`**, size
995,328. NCCH SHA-256
`6c135f500a77070633a0308182b75aa0a672d5403c3535ce4bcbba29fe5f2492`.
ExeFS `banner` SHA-256
`bb810ecddba00bf196d7f480d8c1c13fc569a707416fded522b78ae5679f0755`.
SMDH English long description is “Health and Safety Information”.

EUR-English CBMD selection: `modelOffset` 3067, `modelEnd` 17822,
`usedCommon` false. Decoded CGFX SHA-256
`97a1a31d289451077579c641c3826968907c2e16f6bf3855afbbf55f9653ea21`.
That CGFX names `COMMON1` and `COMMON2` and has no model, mesh, or material
section. Common CGFX at CBMD offset `0x88` decodes to SHA-256
`e1560e2ca6dfe8d01932c78eaa81ca5c93389c13852e2e4adcf20cb46d5b8032`
and names `COMMON`, `COMMON1`, `COMMON2`, `lambert16`, `mt_iconBack`,
`locator1`, `pTitle1`, and `pTri`.

HOME `0004003000009802` content SHA-256
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`
(`audio/contents.0000.00000082`, manifest version **24576**). That NCCH
contains `romfs/3D/BannerBG_LZ.bin`. Compressed SHA-256
`27d58c2113d2c2d46e3bcc36bb2ae56c35e19d9823488287b6759df998108711`;
decoded CGFX SHA-256
`092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595`.
Identifier names are `BannerBG`, `root`, `mt_BG`, `BG_DmyApp_00`, `BG_64_00`,
`BG_CapMask_00`, `BG_DefBase_00`, `BannerBG_SceneIn`, `BannerBG_SceneOut`,
`BannerBG_AppPause`, `BannerBG_AppQuit`, `BannerBG_AppRestart`, and
`BannerBG_Loop`. There is no title-pane name and no separate cell-edge name
inside this CGFX.

## Already bound

Delivered `health-banner-common/model.json` and `health-banner-eur/model.json`
record those two CGFX hashes and `ctr-cgfx-web` 1.4.1. The common pack is one
`COMMON` model, bones `locator1` / `pTitle1` / `pTri`, and two meshes:

| Mesh | Bone | Material | Texture | Delivered size |
| --- | --- | --- | --- | --- |
| 0 | `pTitle1` | `lambert16` | `COMMON1` | common 8×8 A4; EUR 512×128 LA4 |
| 1 | `pTri` | `mt_iconBack` | `COMMON2` | common 8×8 A4; EUR 128×128 RGBA8 |

The only skeletal clip is looping 600-frame `COMMON` on `locator1`. Material,
visibility, and camera clips are empty. `prepareStockTitleBanner` for `health`
requires this pair and replaces both texture names with `allowSizeChange`.
`drawStockTitleFrame` draws that prepared model through `BannerFrame`.

Delivered `home-background/model.json` records the BannerBG hashes and
`ctr-cgfx-web` 1.1.0. It has one `BannerBG` model, one mesh, and one `mt_BG`
material. Samplers are `BG_DmyApp_00`, `BG_64_00`, and `BG_64_00`.
`BannerBG_Loop` is the 600-frame looping translation of texture coordinate 1.
`drawBackgroundLifecycleFrame` submits `BannerBG_SceneIn` and `BannerBG_Loop`.
`BG_CapMask_00` and `BG_DefBase_00` are present and are not `mt_BG` sampler
names.

`romfs/3D/BannerBGmask_LZ.bin` is a sibling, compressed SHA-256
`d8c3cf350e2af35263f640a80144a40aa1d9a1b878f1b6eb872be0b4ec669541`,
decoded SHA-256
`d9139c60d5d608704b26252699a275f034ba04640859e0a8b1b9037047e1d233`.
Its model name is `BannerBGmask`; it is not a pane inside `BannerBG`, and it
names the same four textures. It is not a unique idle cell-edge writer for
this ROI.

`LncBase_U_00` / `T_AppTitle_00` is the suspended-window title
(272×38). `home-suspended-window.ts` already binds it and shows it only when
the window is expanded. Idle `LncBase_U_00` drawing hides `N_Wndw_00`. It is
not an unused Health title pane. Launcher `P_Edge*` pictures are icon-card
edges, not a second BannerBG cell edge.

## Left open

Live-clock/HUD and the lower vacant-native-versus-Settings residual stay
outside this slice. No excluded title was added. Input, motion, audio, and
whole-scenario pixel fidelity remain open.
