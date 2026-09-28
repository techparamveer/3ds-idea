# Blank slots: alpha on the final texture pane

2026-09-23. Native category-5 blank slots assign **alpha 128/255** to
`LncIconDist_01`'s final **`P_IconBtnDmy_00`** pane. This happens after the
`LncIconSetSrc_00` source artwork has been rendered to a texture. The source
blank panes and the final layout resource all have authored alpha255; the
native runtime overrides the final pane. A separate native configuration
policy can select alpha32 instead of128.

This is source evidence for a missing final-slot opacity in the browser's
current direct rendering of the source blank subtree. It does not prove that
applying opacity to that subtree reproduces every offscreen blend, filter,
wrap or pixel-rounding operation. It does not change `N_BlankAnime_00`, its
animation tracks, material colors, textures, the browser, or Azahar.

## Reproduction and checked inputs

Source is the owner-supplied EUR HOME `0004003000009802`, version24576.
Addresses are ARM virtual addresses with `code.bin` mapped at `0x100000`.
Executable SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

Run [home_blank_slot_alpha.py](home_blank_slot_alpha.py) with Unicorn and
Capstone in the existing private research environment:

```sh
ART=/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E
"$ART/assets/research-venv/bin/python" -B scripts/firmware/home_blank_slot_alpha.py \
  --code "$ART/assets/extracted/home/exefs/code.bin" \
  --layouts "$ART/assets/extracted/home/unpacked/launcher_LZ/blyt" \
  --output "$ART/presentation/native-blank-composition/verified"
```

The executable hash is checked before any fixture runs. Firmware, outputs
and **14 hashed disassembly excerpts** remain private in that output directory.

| Input/output | SHA-256 |
| --- | --- |
| Fixture script | `91d07690da56e838e9ace666548b9c76a6aa5fb99c7d2f6588d052a43937a19b` |
| `verified/checked.json` | `5f2d437c46aae79ef7020c4c58e143f711d8461179b4e0609d1ad4e6a13d855c` |
| Source `LncIconSetSrc_00.bclyt` | `1296496b88f41abc6c9382f59bb51927a6b8f049f9cc02454653f27d2730dcaa` |
| Final `LncIconDist_01.bclyt` | `125fd2772c35f967f596b0fbd8692a7d13d78a425eaccc72e85d46528507f76d` |

## Source artwork to final slot

The source/final distinction is established by these native call sites:

1. Scene initialization at `0x2b1dd8..1df4` loads `LncIconSetSrc_00.bclyt`
   and its Scale controller into the helper at scene`+0x134`, with flag1.
   The existing [format evidence](FORMAT_EVIDENCE.md#ordinary-icon-template-and-density-animation)
   records the 64×128 target arguments for this flag.
2. The slot loop at `0x2b1ef8..1f54` constructs slot objects, stores them
   at scene`+0x830`, loads `LncIconDist_01.bclyt`, and finds
   `P_IconBtnDmy_00`. At `0x2b223c..2248`, it gets that pane's material
   and calls `0x1d9c68` with the source helper at scene`+0x134`.
3. `0x1d9c68` copies the helper's texture descriptor at `+0x90` into the
   material's texture-map descriptor at `+0x34`. The source draw entry
   `0x2453b8` uses the helper's layout at `+0x98` and target at `+0xa0`;
   its shared body binds that target before drawing the layout.
4. `0x29e53c..0x29e55c` is a second
   visible route: it binds the source helper's texture to a slot's material,
   disables the separate icon content, and sets the slot to category5.

The fixture executes the named-pane assignments in `0x2570d0..7110`:

| Slot field | Name loaded from the native name table |
| --- | --- |
| `+0x80` | `P_Icon_00` |
| `+0x84` | `B_Icon_00` |
| `+0x88` | `P_IconBtnDmy_00` |

The descriptor/draw call chain above is inspected source, not a simulated
GPU render. The fixture's resource parser separately verifies authored
alpha255 for `N_Color_01`, `P_Blank_00` and `P_IconBtnDmy_00`.

## Category setter and alpha inheritance

Setter `0x1f5cf4` stores the category at slot`+0x8c`, installs category-specific
UV coordinates, calls the original geometry/SRT helper `0x256e14`, and then
sets the byte at **slot`+0x88` → pane`+0xb4`**:

| Category | Final pane alpha |
| --- | --- |
| 5, blank | Word at `0x33c664`, initially128 |
| 3 | 220 |
| Other tested categories −1 through9 | 255 |

Category5's UV submission is `(-0.25,0.375)`, `(0.25,0.375)`,
`(-0.25,0.625)`, `(0.25,0.625)` before the separately applied material
texture transform. These are not final browser sampling coordinates.

The category5 branch at `0x1f5ebc` reads `[0x33c644+0x20]`, compares it
with the pane byte, and branches to the write at `0x1f5da8` when different.
The separate refresh function `0x25701c` applies the same policy. An unchanged
alpha avoids the subsequent layout refresh callback; the fixture checks both
changed and repeated calls for all11 categories.

The identification of `+0xb4` as alpha is independently checked against
the original resource-copy sequence `0x209654..0x20965c`: resource byte`+0xa`
(CLYT pane alpha) goes to pane`+0xb4` and `+0xb5`. Native inheritance code
`0x1a1ea0..1ed0` multiplies `+0xb4` by an enabled inherited factor and
stores the effective byte at `+0xb5`. Executed examples produce128 without
inheritance,128 with factor1, and64 with factor0.5.

## Configuration policy and limits

`0x1d6ad4` writes128 to `0x33c664` when its second argument is nonzero,
or32 when zero, then calls the real alpha refresh on all80 slot objects.
The fixture checks mixed categories across all80, including an unchanged
repeat that submits no refresh callbacks.

The configuration selector `0x1df9d0` is executed through its branch into
that policy, stopping before its controller/render loop. In the six checked
routes, inactive configuration chooses128 for arguments0 and1. The route
with configuration byte`+0x1f1=1`, argument0, and configuration byte`+7=3`
chooses32; tested `+0x12=1` and `+0x14=1` alternatives choose128. These raw
fields are recorded without assigning unverified user-facing theme names.
The selector later calls `0x2453b8` on scene`+0x134` to redraw the source.

The fixture uses synthetic panes, material storage and configuration. Resource
loading, named-pane lookup, UV submission, layout refresh and the configuration
manager accessor are explicit stubs. The category setter, geometry/SRT helper,
alpha copy/inheritance slices, refresh policy, 80-slot loop and configuration
selection execute original instructions. No browser/native pixel comparison,
GPU blend equation, texture filtering or full HOME lifecycle is established.
The source-backed ordinary opacity is **128/255**, not a fitted half-opacity.

All bounded checks and `git diff --check` passed. This evidence-only change
does not require an application build.
