# Keyboard retained capture texture

`scripts/firmware/keyboard_capture_texture.py` executes the original keyboard
static initializer, capture descriptor allocation/binding, caller texture
descriptor construction/query and picture UV generation. It pins the keyboard
code SHA256 to `a0b78005b0a99116ca703bc9b7625ce1b0f2d4cc45f66fc6fb9ab8a34244d4f0`
and reads `swkbd_common_LZ.bin/blyt/ApltFade_D_00.bclyt` directly. Executables and
resource bytes remain private.

Private evidence is
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/keyboard-opening/capture-verified.json`.
Reproduce with the artifact root's `assets/research-venv/bin/python -B`,
`PYTHONPATH=scripts`, and explicit `--code`, `--layout`, `--output` paths. The
script rejects repository output locations and unexpected executed addresses;
each call has an instruction budget. Executable bytes are checked unchanged.

## Retained keyboard

Original initializer `0x199030` sets logical dimensions320×240 and allocation
dimensions512×256. The original allocator at `0x17ae78` requests the latter and
creates a descriptor containing both sizes. Descriptor format5 becomes PICA
format3 (RGB565) through original `0x141da0`; the retained image must therefore
not be assumed to have the same precision as a live RGBA Canvas.

Original `0x17ae04` copies the handle/address and all four dimension fields,
updates only format bits8–11 in the destination sampler word, regenerates its
GPU sampler fields and clears material cache flag4. A nonzero sentinel verifies
preservation of unrelated sampler bits.

Original `0x13d6bc` and its two original allocation getters process the source
unit UVs and identity texture matrix. It multiplies coordinates by logical /
allocation size and flips V for GPU sampling. The four emitted pairs, in native
TL/BR/BL/TR order, are:

```
(0, 1), (0.625, 0.0625), (0, 0.0625), (0.625, 1)
```

The retained capture is distinct from the caller's framebuffer. Replacing both
samplers with the same untransformed Canvas image would lose this distinction.

## Caller image

Original constructor `0x1084d8` and query `0x15bf30` execute for all five supported
platform format values0–4. GPU handles, imported buffer base, capture-available
flags, mono configuration and platform format are explicit handoff inputs;
they are not observations of a complete native boot. Every case produces
logical and allocation dimensions256×512. Format values map to descriptor
formats6/6/5/7/8 respectively.

With that descriptor, original UV generation maps the actual `P_App_00` source
UVs to these native TL/BR/BL/TR pairs:

```
(0.9375, 1), (0, 0.375), (0, 1), (0.9375, 0.375)
```

For the UV-only caller probe, the common descriptor copier supplies the material;
the separate caller-owner copy call site is not executed. This distinction is
recorded in the report.

## Boundaries

Texture creation, resource lookup/import, physical address lookup and heap
allocation are explicit endpoints. Original source dimensions, descriptor
writes, format mapping, texture matrix lookup, UV arithmetic and corner order
execute without arithmetic callbacks. The source matrix has zero translation /
rotation and unit scale; this fixture does not establish arbitrary matrix cases.

GPU pixels, padding clear values, RGB565 render-target quantization, the actual
caller's format/content, browser filtering/sample positions and native LCD
comparisons remain unverified. This contract does not yet add a live transition
painter or change the established opening CPU schedule.
