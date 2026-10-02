# HOME ordinary title-icon material correction

Date: 2 October 2026

Branch: `codex/home-icon-corners-20261002`

Base: `5da749daf554465fe6c89017586fdfdedb74bc79`

Status: **integrated as `3bb6c6f3`; production corner comparison meets static delta-2 tolerance; whole HOME remains fail**.

The unselected Camera icon retained a stable four-corner mismatch while its
44×44 artwork core was already effectively exact. A first bounded replay used
an incorrect y=138 diagnostic coordinate and was rejected. The production
artwork is byte-proven at `[220,137)–[268,185)`. Replaying the delivered HOME
material at that unchanged footprint removes every above-threshold icon pixel,
so no fitted mask UV, coordinate adjustment or artwork edit is needed.

## Captured defect and fresh native stability

The existing production/native baseline uses the unselected Camera tile at
body `[208,126)–[280,198)`, icon diagnostic rectangle
`[218,137)–[268,187)` and artwork core `[221,140)–[265,184)`. With an empty
comparison mask and the standard channel threshold `>2/255`:

- icon fringe: 23 / 564 pixels, RGB MAE 2.966903/255, RMSE 19.835851/255,
  maximum channel delta 246;
- artwork core: 1 / 1,936 pixels, RGB MAE 0.067837/255, RMSE 0.344676/255,
  maximum channel delta 16.

The baseline production lower LCD is
`browser-before/health-initial/lower.png`, SHA-256
`aa59a3dd4af0d88981264fb9db8ba9529757434880479901989eff4529bc8c75`.
The coordinator's fresh isolated-native replay retained mapped touch, Static 2,
Null 1 and volume 0, and exited cleanly after Quit/Yes. Its Health-initial
capture is `_02.10.26_15.12.08.182.png`, SHA-256
`0c355caf7123f47a86911e15d981f7bf36d8c948c7476ab71a0f413634e060e4`.
The Camera tile, fringe and core in that capture are byte-identical to the
earlier named native baseline. Input prefix, epoch, population and banner phase
remain unmatched, so this is diagnostic stability rather than scenario
acceptance.

## Proven authored material

The pinned executable is HOME `0004003000009802` version 24576, content index
0 / content ID `00000082`; `code.bin` SHA-256 is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
The delivered launcher pack SHA-256 is
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.

`LncIconDist_01/P_Icon_00` is an authored 48×48 picture with three UV sets:

1. sampler 0: unit UVs, default `IconDmy.bclim`;
2. sampler 1: `[.25,.25, 1.75,.25, .25,1.75, 1.75,1.75]`, mirrored S/T,
   default `IconMask.bclim`;
3. sampler 2: unit UVs, default `IconDmy.bclim`.

Its six TEV stages, constants, linear filters, alpha test and source-over blend
are retained by the existing native material evaluator. `IconMask.bclim` is a
32×32 A4 texture sourced from `launcher_LZ.bin/timg/IconMask.bclim`, source
SHA-256 `de8c6815059f79db23984571fb864f56792a738b3391a3800e3d6bc47ab59983`;
the delivered PNG SHA-256 is
`06c7438a68a45aea82d0d43477897883d5fef1cb4176d4cda15225770e8dbd4a`.
The converter is `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

The implementation replaces sampler 0 only. It deliberately leaves sampler 1
and sampler 2 authored, matching the repository's proven dynamic-picture
binding convention. It also preserves the existing rounded destination
footprint at every density: the visible 72-pixel tile at `[208,125)` retains
its icon at `[220,137)–[268,185)`; fractional/odd density destinations retain
the old `Math.round` top-left rule.
Pickup, header, suspended, folder and portfolio artwork paths were not changed.

## Corrected authored-material replay

The first replay assumed that the visible plate-body y=126 was the caller's
tile origin and placed the icon at y=138. That assumption was wrong: comparing
all 48×48 published Camera RGB bytes against the production lower LCD proves
an exact match only at x=220, y=137. The original replay report, sheet and
script are retained unchanged as an invalid-coordinate experiment; they are
not evidence about the runtime artwork footprint.

The corrected replay feeds the published Camera image
`icons/camera.png` (48×48, SHA-256
`eef80be1e6961951cb776306165fd141016760327e1c96f865a68ccb88a92f01`)
through the exact delivered `P_Icon_00` material. The material changes alpha at
24 pixels and changes RGB at zero pixels, including zero RGB changes in the
44×44 core. Only those 24 alpha-different pixels replace the captured browser
baseline; newly exposed background comes from the bounded direct SetSrc source
replay. This prevents the known 963-pixel ordinary-plate gap from being folded
into the candidate.

| Region | Baseline pixels >2 | Corrected replay pixels >2 | Baseline → replay RMSE | Baseline → replay max |
| --- | ---: | ---: | ---: | ---: |
| Icon fringe | 23 / 564 | 0 / 564 | 19.835851 → 0.574785 | 246 → 1 |
| Artwork core | 1 / 1,936 | 0 / 1,936 | 0.344676 → 0.252740 | 16 → 1 |

The corrected result improves all measured icon metrics and creates no new
above-threshold region. The runtime now decodes the unmodified 48×48 title PNG
to `NativePixels`, verifies the delivered `LncIconDist_01/P_Icon_00` pane,
UV-set and sampler identity once per presenter, and draws it only for ordinary
stock grid artwork. Missing selected icon pixels, unexpected dimensions,
material drift and renderer failure remain explicit failures. The renderer's
existing pixel-identity cache isolates different title images that share the
same runtime binding name. Disposal clears the raw icon map, abort propagates,
and a non-abort failure remains isolated until that title is selected.

The invalid y=138 replay report remains
`home-icon-corners-20261002/source/camera-icon-material-replay.json`, SHA-256
`172252d822b12ba3fad986c155536da3770f37ee74e3761e04f63e745df3acdc`.
Its four-column sheet is `camera-icon-material-replay.png`, SHA-256
`f3670835b11339f600503d9e1c1eed0d36659c8ab82e5b8468f44381560592be`.
The preserved base replay script SHA-256 is
`4bca0f131e56847fd6e49bf05b21407aa7d6c61ab4e240b1b527052dcbdf1a85`.

The corrected report is
`camera-icon-material-replay-corrected.json`, SHA-256
`a0287d58f2bb089dda9b755a61becc21498f2137bb969dd42f439239360f9613`.
Its opened four-column sheet is `camera-icon-material-replay-corrected.png`,
SHA-256
`757e538d9708032083f3de51160bf3bbfcf22b07fc043eda53bfb4d68fecd66f`.
The corrected lower-LCD candidate SHA-256 is
`d898af085a0508c721f5d32b1fbc1afbccce6c28c84485e8ee6effeb78611f99`;
the coordinate-correction wrapper SHA-256 is
`778b8a007d2ab3919b6bc10238939eb1f2b3e3697bcb56b3d7599e7d02bd2208`.
All private artifacts live under:

`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-icon-corners-20261002/source/`

## Precise remaining gap

The runtime texture descriptor and ordinary-title setter/UV contract remain
unproven. This implementation therefore binds only the repository's decoded,
pinned icon to the already-proven authored material convention; it does not
claim recovery of the original setter. Source evidence is still required for:

- the runtime texture extent and padding around the 48×48 SMDH large icon;
- which material sampler descriptors the ordinary-title setter replaces;
- the runtime UV rectangle supplied for sampler 0 (and whether sampler 2 is
  independently rebound);
- any half-texel convention or GPU edge-coverage rule applied before the
  authored mask;
- PICA filtering/blend precision at the four antialiased corners.

No uniform mask fit was attempted because the zero-offset authored material at
the actual footprint already explains the stable 24-corner pixel set. Do not
infer the original title texture contract from the folder-glyph, Manual-header
or screenshot paths: those consumers use different texture extents, panes or
UVs.

## Evidence classification

- Source-identified: `LncIconDist_01/P_Icon_00`, all three authored samplers
  and UV sets, `IconMask`, TEV constants/stages, filtering and blend state.
- Delivered: unchanged launcher pack, Camera SMDH PNG and mask PNG; no new
  public asset.
- Implemented: raw title-icon loading/disposal plus the exact guarded authored
  material path for ordinary stock grid icons; no mask fit or asset edit.
- Tested: 47 focused tests pass across real raster output, all density
  footprints, grid-only routing, negative material/resource scope, cache
  identity, load, non-abort failure, abort and disposal; typecheck and
  `git diff --check` pass.
- Browser-inspected: not performed in this worker; the captured production
  baseline was consumed read-only.
- Native-compared: corrected bounded replay against the named fresh native
  capture; not a production-browser recapture and not whole-scenario
  acceptance.

The worker evidence above is supplemented by the coordinator's actual
production recapture at `3bb6c6f3`, not another source replay. Four named states
reach zero pixels above delta 2 for the fringe and core, maximum 2 and 1
respectively. The production fringe differs slightly from the source replay's
maximum 1; do not conflate these evidence tiers. See the
[production comparison](workstream-handoffs/home-icon-corners-compare.md) for
capture hashes, masks, reports and sheets. Full 1789 tests/typecheck/build/shader
pass. Notes, unselected plate and footer controls are unchanged; static
Health/Settings and both Power origins preserve their before/after pixels.
Six desktop density states render and respond. The mobile density-increase
tap fails before and after; Notes touch/HOME return passes on both viewports.
HOME idle remains `fail`; plate963, footer694, exact input, motion and audio
remain open. No private matrix entry was changed.
