# Other Settings: exact upright LCD bottom-edge ownership

Base `0ad8efd`. This bounded follow-up changes exact vertical ties only in the
already opted-in direct LCD text path. It does not round nearby endpoints or
change normal/default text rendering.

## Exact production residual

The genuine native/production pair
`settings-other1-direct-calendar-0ad8efd-20260926` has17 upper /0 lower pixels
above2/255, empty mask. Private root:
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v1/captures/`.
Native: `_26.09.26_04.31.13.302.png`, SHA-256
`424ffb45d0fe4e82fd002d564a6ffe7f8af08dac5c984e444d5af09b56382c40`.
Production upper SHA-256:
`549371adf1f3bfafb723e40bb11163231856ad5eb6260c3ad90d7219f60cd4e6`.

| Residual | Coordinates | Cause/boundary |
| --- | --- | --- |
| Existing HUD |(304,15),(305,16) |Unresolved font sampling |
| `O` right edge |x160,y35..41 |Emitted right160.49999809265137; final transform precision unresolved |
| `g` bottom edge |x272..279,y50 |Emitted bottom exactly50.5; current upright vertical rule excludes the tie |

The previous offline title replay showed only the eight `g` pixels because its
Canvas transform arithmetic included the `O` column. Chrome's production
transform retains the just-below-half endpoint. This source/backend discrepancy
is now explicit; the offline result must not be called a production match.

## Source endpoint and edge evidence

The source resources are unchanged from the
[centering audit](settings-other-source-centering-2026-09-26.md): EUR10.7.0-32E
Settings `0004001000022000`, `CommonBG_U_00`, English `settings_title`, shared
A4 font SHA-256
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`.
The original `g` occupies sheet0,(794,33), width13,height30, bearing1,advance16.
The source0.8500000238418579 scale gives a float32 glyph height25.5; the traced
single-line writer gives local Y0 and the pane begins at screen Y25. Thus the
quad bottom is **50.5**, exactly the center of row50. There is no fitted epsilon.
The original atlas contains the visible descender coverage at this boundary.
Native includes it; browser previously emitted only background there.

The retained shared-writer trace stores cached size/position/UVs at
`0x1abff4..0x1ac01c`; the immediate endpoint form uses `0x1ac058` and stores
that endpoint at `0x1ac06c..0x1ac078`. Executable HOME SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
These are shared-library coordinates, not assumed Settings instruction addresses.

The pinned Azahar
[OpenGL display mapping](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/video_core/renderer_opengl/renderer_opengl.cpp#L500-L505)
reverses the source texture coordinates for the upright Portrait presentation.
Framebuffer edge names cannot simply be carried into upright LCD coordinates.
As in the earlier horizontal tie correction, the concrete upright ownership is
established by the original glyph endpoint and genuine native capture. This does
not claim that the software rasterizer proves all OpenGL or PICA precision rules.

The direct-LCD path now uses the vertical interval `(top,bottom]`: exclude an
exact top tie and include an exact bottom tie, so neighboring quads own a shared
center once. Default rendering keeps its previous vertical interval. Fractional
endpoints on either side of a tie retain their prior coverage. The direct-mode
flag participates in cache identity even when the fractional raster phase is0.

## Verification and remaining scope

Before/after source replay changes nine RGB pixels, x271..279,y50. Eight were
above threshold; x271 was already within2. Every changed pixel is now within2
of native. Other source title residual8→0. The production expectation is17→9:
seven `O` pixels and two HUD pixels remain, pending actual browser recapture.

Across the source verifier output, only `other-top.png` changes. All Settings
main renders and all50 lower renders are decoded-pixel identical; Other lower0
is preserved. Five main selections and44 subpages pass source verification.
115 focused font/renderer/Settings/Health tests pass, with one existing TODO;
typecheck and diff-check pass. Tests cover exact bottom ownership, shared-edge
uniqueness, unchanged non-ties, existing transformed-edge behavior and cache
phase. No assets, shader, colors, masks or translations were changed.

Artifacts: lane `.local/settings-final17/{pixels,comparison}.json`, source
renders under `after/`, and tests/typecheck/verifier logs. No browser or Azahar
operation was performed. The `O` endpoint would become160.5 under screen-space
float32 rounding, but that operation's source ordering remains unproven, as in
the [lower endpoint audit](settings-lower-endpoint-source-gap-2026-09-26.md).
No such rounding is added here. Full native acceptance remains open.

### Combined Health footer regression

Also tested temporarily with L4 commit `734468d`, which extends direct sampling
to centered Health Back text. All nine Health screen pairs (18 raw LCD images)
are decoded-pixel identical between old top-edge and new bottom-edge ownership,
including Usage initial, second warning/end, 3D top/interior/end, main and General
thumb pressed/released. Against native `_26.09.26_04.46.01.113.png`, Usage lower
remains22 pixels above2 at x151/x172,y218..233, RGB MAE0.109361979. These are
horizontal endpoint differences; this vertical exact-tie rule does not resolve
them. Combined focused tests:117 passed, one existing TODO; typecheck passed.
Artifacts: `.local/settings-final17/health-combined-comparison.json`,
`health-combined/`, `health-topedge/` and `combined-{tests,typecheck}.log`.
L4 changes were removed from this lane after the combined check; they remain a
separate integration commit. The phase-test mock must read argument9 explicitly
when resolving the overlapping test edit, because argument10 is now edge mode.
