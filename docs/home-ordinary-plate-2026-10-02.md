# HOME ordinary plate render-to-texture gap

Date: 2 October 2026

Branch: `codex/home-ordinary-plate-20261002`

Base: `1e5fb2004ba3bd86c0440db506477d8f67d7d556`

Status: **bounded source gap; no runtime change**.

The unselected Camera ordinary plate remains a stable native/browser mismatch.
The source proves that native HOME does not draw `LncIconSetSrc_00` directly at
each slot: it renders that layout to a helper target, installs the resulting
texture descriptor into `LncIconDist_01/P_IconBtnDmy_00`, and samples it again.
The bounded trace does not prove the target's logical orientation, clear/load
state or PICA fragment precision. Two source replays were therefore evaluated
and rejected rather than installed as guessed rendering behavior.

## Captured defect

The comparison-worker handoff is commit `6d703ef7`; its private report path and
identity are recorded below.
Three fresh production captures at runtime `1e5fb200` reproduce the preserved
`79597372` Camera tile byte for byte in three Health-selected states. Against
the corresponding native crops, the 82x82 tile minus the 50x50 icon interior
has:

- 963 / 4,224 pixels above 2/255;
- mean absolute RGB-channel delta 1.422033;
- RMSE 3.516488;
- maximum channel delta 26.

The fixed mask splits into 415 outer-shadow pixels and 548 body/rim pixels.
The Camera artwork core has one pixel above threshold and is not the owner of
this slice. Position search already found the authored plate position best;
no coordinate, color or mask fit is introduced here.

The private baseline report is
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-ordinary-plate-20261002/comparison/report.json`
(SHA-256 `521267010f385264ed603360c37d6d2e4b514d0186957a4bfd1773ee0e8c87bd`).

## Proven native route

The pinned executable is HOME `0004003000009802` version 24576, content index
0 / content ID `00000082`. Its `code.bin` SHA-256 is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Addresses below are ARM virtual addresses with that executable mapped at
`0x100000`.

1. `0x2b1ddc..0x2b1df4` loads `LncIconSetSrc_00.bclyt` and
   `LncIconSetSrc_00_Scale.bclan` with helper flag 1.
2. Loader `0x1bbc74` maps flag 1 to the ordered arguments 64 and 128 and passes
   them to `0x208230`. The other loader path passes 128 and 128.
3. `0x208230` forwards those two values to projection setup `0x245180`, stores
   them at helper `+0xa4/+0xa8`, and packs them into the texture descriptor at
   helper `+0x90`.
4. Source draw entry `0x2453b8` uses the layout at helper `+0x98`, the target at
   helper `+0xa0`, and the stored dimensions. The recovered excerpt establishes
   viewport/scissor-related register writes and target binding, but not their
   complete PICA interpretation.
5. `0x2b2238..0x2b2248` finds the final slot material and calls `0x1d9c68`.
   That function copies the helper texture descriptor into the destination
   material texture-map descriptor and marks the material dirty.
6. Original category-setter execution establishes the ordinary-category UV
   quad as `[0.125,0.125, 0.875,0.125, 0.125,0.875, 0.875,0.875]` and final
   pane alpha 255. The final source pane is
   `LncIconDist_01/P_IconBtnDmy_00`, authored at 96x96 with linear minification
   and magnification, mirror S wrapping and clamp T wrapping.
7. A focused rerun of the original category setter also records an identity
   texture SRT for ordinary categories: translation `(0,0)`, rotation `0`,
   scale `(1,1)`. There is no hidden source-backed transform available to fit
   the capture.

The executed category fixture remains private at
`presentation/native-blank-composition/verified/checked.json`, SHA-256
`5f2d437c46aae79ef7020c4c58e143f711d8461179b4e0609d1ad4e6a13d855c`.
The focused SRT probe is
`home-ordinary-plate-20261002/source/category_srt_probe.py`, SHA-256
`95945f3ed1bc0bd12e35dbc9048de2b6fb18817af427c9053eb8ce28b69846be`.

## Rejected source replays

Both replays use the pinned frame-1 layout, decoded textures and existing
native material evaluator. They preserve the authored tile position and leave
the 50x50 icon interior unchanged. They are diagnostic source replays, not
native acceptance captures.

| Replay | Plate pixels above 2 | Mean / RMSE | Maximum | Result |
| --- | ---: | ---: | ---: | --- |
| Existing production baseline | 963 | 1.422033 / 3.516488 | 26 | Reference defect |
| Collapse SetSrc pictures to one LCD-centre sampling pass | 1,213 | 2.792929 / 8.247809 | 52 | Rejected; worsens the fixed mask |
| Literal transparent 64x128 target, then ordinary UVs through the authored 96x96 destination | 1,614 | 7.800347 / 15.806162 | 78 | Rejected; wrong split-boundary atlas and visible right-hand lobe |

The literal 64x128 replay report is
`home-ordinary-plate-20261002/source/rtt-64x128-replay.json`, SHA-256
`dd99f9d048c7bac22f48a4dd356bd90e4077f646e17bd507855011cc91e56226`.
Its opened four-column sheet (native, browser, replay, 6x difference) is
`rtt-64x128-replay.png`, SHA-256
`eef20d5eb6958140921c9cb2ade6a5da48f39c99ed2ed663fe2277cf66c85df1`.
The visible intermediate atlas is `rtt-64x128-atlas.png`, SHA-256
`5e451f43cb54a0426407da06babd781733fffb7bfead3ac6dfddd83e178741c3`.
All are under:

`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-ordinary-plate-20261002/source/`

## Precise gap and boundary

The integers 64 and 128 are proven arguments and descriptor fields. Treating
them as an ordinary web 64-pixel-wide by 128-pixel-high logical canvas is not
proven. That interpretation visibly fails because SetSrc places the ordinary
and blank sources at opposite 32-pixel X offsets, leaving split shapes at the
target boundaries. The recovered source does not yet establish:

- how the 3DS rotated render-target storage maps the stored dimensions to
  NintendoWare logical X/Y;
- the target clear/load color and alpha before SetSrc is drawn;
- the exact viewport/scissor and framebuffer-coordinate transforms behind
  the register helper calls in `0x2453b8..0x2455bc`;
- the intermediate target format, byte conversion and PICA fragment precision
  used before the final linear sample.

Resolving this path would require source identification of those target-state
helpers or a trustworthy capture of the intermediate native helper texture.
Swapping axes, choosing a clear color, changing offsets, or fitting edge colors
from the final screenshot would be a guess. The direct one-pass alternative is
also disproved by the replay. Consequently `src/os/firmware-presentation.ts`
and renderer/layout support remain unchanged, and there is no browser/native
recapture for this branch.

## Evidence classification

- Source-identified: SetSrc layout/Scale, 64/128 helper arguments, helper
  descriptor copy, final Dist pane, ordinary UVs, identity texture SRT and
  final alpha.
- Delivered: existing pinned HOME pack and textures; no new public asset.
- Implemented: documentation and private replay only; **no runtime change**.
- Tested: replay reports parse and reproduce their recorded metrics; focused
  repository tests and typecheck are recorded in the commit handoff.
- Browser-inspected: not performed in this worker; the coordinator-owned fresh
  production baseline is consumed read-only.
- Native-compared: the private replays compare against the named native crop,
  but are not acceptance captures and both regress the captured plate mask.

The scenario remains `fail`; this note neither changes the private matrix nor
claims input, motion, audio or whole-scenario parity.
