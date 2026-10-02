# HOME native border sampler handoff

Status: **implemented and source-tested; not integrated or native-compared**.
This bounded renderer slice adds opt-in authored ClampToBorder sampling to the
generic firmware-model path. No HOME consumer has been changed in this branch,
so existing suspended-background binding, padding and runtime behavior remain
unchanged until the coordinator applies the explicit opt-in below.

## Source basis

The pinned native reference executable is
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/native-reference/Azahar.app/Contents/MacOS/azahar`,
SHA-256
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`.
Its embedded GLSL fragment-generator text names
`src/video_core/shader/generator/glsl_shader_decompiler.cpp` and implements
ClampToBorder by testing each selected axis independently: a coordinate less
than 0 or greater than 1 returns the complete `tex_border_color[unit]`; all
coordinates exactly at 0 or 1 continue to the texture sample. This establishes
the source sampler rule used here. It does not establish the still-missing live
HOME texture binding at the first AppQuit frame.

The pinned SPICA checkout is revision
`bd29a7828595d7839cda2ac61c76bb63f9071250`. Its
`SPICA/PICA/Commands/PICATextureWrap.cs` retains ClampToBorder as an authored
enum; `SPICA/Formats/CtrGfx/Model/Material/GfxTextureMapper.cs` decodes the
border-color register and nearest/linear filters into the material sampler;
and `SPICA.Rendering/Mesh.cs` maps ClampToBorder, nearest and linear to their
OpenGL sampler values. The delivered HOME background `mt_BG` texture0 sampler
contains ClampToBorder on both axes and border RGBA `(0,0,0,255)`.

## Implemented contract

`FirmwareModelOptions.nativeBorderSampling` is false by default. With it
disabled, `picaFragmentShader` emits the same three direct `texture2D` samples
as before and no border uniforms. With it enabled:

- each texture unit with an authored ClampToBorder axis receives its decoded,
  normalized RGBA border uniform;
- U and V are tested independently with strict `< 0.0` / `> 1.0` predicates;
- coordinates on either exact edge sample the texture, matching the pinned
  emulator generator;
- non-border axes keep ClampToEdge or Repeat, while opted-in source `Mirror`
  maps to Three.js MirroredRepeat; nearest and linear filtering remain
  unchanged (the unopted legacy `Mirror` fallback is deliberately untouched);
- the underlying DataTexture remains ClampToEdge because the shader handles
  only the authored outside-coordinate result;
- dynamic `setTexture` replacement retains texture identity, sampler state,
  border uniform, generated shader, cache behavior and disposal ownership;
- native mip opt-in is untouched, and the in-range `texture2D` call continues
  to use its existing mip/filter state.

Opted-in sampler enums, magnification filter and any selected border color are
validated before the first DataTexture allocation. Unsupported values remain
explicit failures. The option does not mutate shared model data.

## Coordinator integration hunk

Apply only after integrating this commit. In
`src/scene/firmware-banner.ts`, change the existing suspended-background
construction from:

```ts
      suspendedBackground = createFirmwareModel(suspendedBackgroundAsset(asset), suspendedBackgroundPlayback(), { drawGroup: 0 });
```

to:

```ts
      suspendedBackground = createFirmwareModel(suspendedBackgroundAsset(asset), suspendedBackgroundPlayback(), { drawGroup: 0, nativeBorderSampling: true });
```

Do not change
`home-suspended-background.ts`, its mask padding, texture-slot copy, source
dimensions, playback, owner/generation guards or cache behavior in the same
integration step.

## Verification

- `node --test tests/firmware-model.test.mjs`: 28 tests, 27 passed, 1 expected
  private-fixture skip.
- `npm run typecheck`: passed.
- `git diff --check`: passed.
- Build intentionally not run because the delegated locked-Mac slice forbids
  it. No browser, Azahar, audio or capture session was used.

Tests cover unchanged unopted shader output, strict exact-edge behavior,
independent U-only and V-only border axes, authored RGBA normalization,
nearest and linear filtering, stable same-size and allowed-size-change dynamic
replacement, and pre-allocation rejection of invalid wrap/filter/color state.

This is implementation and source-test evidence only. After integration the
coordinator must capture the matched native/browser close boundary and keep the
scenario `fail` or `source-gap` until the unexplained live binding/timing
difference is resolved. ClampToBorder source support alone does not prove the
HOME close scenario passes.
