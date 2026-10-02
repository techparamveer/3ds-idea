# HOME ordinary title-icon corner source gap

Date: 2 October 2026

Branch: `codex/home-icon-corners-20261002`

Base: `5da749daf554465fe6c89017586fdfdedb74bc79`

Status: **bounded source gap; candidate rejected; no runtime change**.

The unselected Camera icon retains a stable four-corner mismatch while its
44×44 artwork core is already effectively exact. The delivered HOME layout
does prove an authored mask/material path, but the bounded replay shows that
installing the current 48×48 delivery image into that material is not a safe
correction without the still-missing runtime title-texture and UV setup.

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

The bounded candidate replaced sampler 0 only. It deliberately left sampler 1
and sampler 2 authored, matching the repository's proven dynamic-picture
binding convention. It also preserved the existing rounded destination
footprint at every density: a 72-pixel tile remains `[220,138)–[268,186)`;
fractional/odd density destinations retain the old `Math.round` top-left rule.
Pickup, header, suspended, folder and portfolio artwork paths were not changed.

## Rejected bounded replay

The candidate replay feeds the published Camera image
`icons/camera.png` (48×48, SHA-256
`eef80be1e6961951cb776306165fd141016760327e1c96f865a68ccb88a92f01`)
through the exact delivered `P_Icon_00` material. The material changes alpha at
24 pixels and changes RGB at zero pixels, including zero RGB changes in the
44×44 core. Only those 24 alpha-different pixels replace the captured browser
baseline; newly exposed background comes from the bounded direct SetSrc source
replay. This prevents the known 963-pixel ordinary-plate gap from being folded
into the candidate.

| Region | Baseline pixels >2 | Candidate pixels >2 | Baseline → candidate RMSE | Baseline → candidate max |
| --- | ---: | ---: | ---: | ---: |
| Icon fringe | 23 / 564 | 33 / 564 | 19.835851 → 17.626510 | 246 → 205 |
| Artwork core | 1 / 1,936 | 1 / 1,936 | 0.344676 → 0.344676 | 16 → 16 |

Although the fringe RMSE and maximum improve and the core remains unchanged,
the acceptance-threshold count regresses by ten pixels. That mixed result does
not support shipping the candidate. The runtime edits and focused candidate
tests were reverted; `src/os/firmware-presentation.ts`, `src/os/screens.ts` and
the renderer remain unchanged.

The replay report is
`home-icon-corners-20261002/source/camera-icon-material-replay.json`, SHA-256
`172252d822b12ba3fad986c155536da3770f37ee74e3761e04f63e745df3acdc`.
The opened four-column sheet (native, browser baseline, source-material replay,
6× difference) is `camera-icon-material-replay.png`, SHA-256
`f3670835b11339f600503d9e1c1eed0d36659c8ab82e5b8468f44381560592be`.
The replay script SHA-256 is
`4bca0f131e56847fd6e49bf05b21407aa7d6c61ab4e240b1b527052dcbdf1a85`.
All live under:

`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-icon-corners-20261002/source/`

## Precise remaining gap

The layout proves the material, but this slice did not establish the ordinary
stock-title runtime call that installs the SMDH image and its UV rectangle. In
particular, source evidence is still required for:

- the runtime texture extent and padding around the 48×48 SMDH large icon;
- which material sampler descriptors the ordinary-title setter replaces;
- the runtime UV rectangle supplied for sampler 0 (and whether sampler 2 is
  independently rebound);
- any half-texel convention or GPU edge-coverage rule applied before the
  authored mask;
- PICA filtering/blend precision at the four antialiased corners.

The next safe source slice is the ordinary stock-title resource setter and its
`0x206484`/`0x206458` caller, not another mask, offset or color fit. Do not infer
the title texture contract from the folder-glyph, Manual-header or screenshot
paths: those consumers use different texture extents, panes or UVs.

## Evidence classification

- Source-identified: `LncIconDist_01/P_Icon_00`, all three authored samplers
  and UV sets, `IconMask`, TEV constants/stages, filtering and blend state.
- Delivered: unchanged launcher pack, Camera SMDH PNG and mask PNG; no new
  public asset.
- Implemented: documentation and private replay only; **no runtime change**.
- Tested: the focused candidate tests passed before the candidate was reverted;
  final documentation/link/diff checks are recorded in the handoff.
- Browser-inspected: not performed in this worker; the captured production
  baseline was consumed read-only.
- Native-compared: bounded replay against the named fresh native capture; not
  a production-browser recapture and not whole-scenario acceptance.

The HOME idle scenario remains `fail`. Plate963 and footer694 are unchanged;
input, motion and audio remain open.
