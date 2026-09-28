# Native directional-light installation

HOME converts a CGFX directional light's cached direction into the **opposite
view-space vector** before installing the PICA light position. This closes the
direction-sign blocker in [the default material investigation](native-default-material.md).
The conversion is proved by executing the original ARM camera and draw routines;
it is not inferred from the appearance of a capture or SPICA's preview.

For the supported, untransformed `BannerDef` light, the browser correction is:

```glsl
vec3 L = normalize(-mat3(viewMatrix) * sourceDirection);
```

The native path additionally converts the transformed vector to PICA float16
before PICA normalizes it. That precision step is distinct from the sign error.
This evidence commit changes no shader, public asset or runtime code. Integration
owns the correction and matched default/folder GPU comparisons.

## Executed source path

The private fixture uses the same hash-checked HOME `code.bin` and `BannerDef`
resource as the earlier investigation, plus the actual `BannerCamera_LZ.bin`.
Addresses below are ARM virtual addresses with the binary mapped at `0x100000`.
All listed slices execute original instructions without patches or call stubs.
Stop addresses are exclusive.

| Operation | Executed bounds and data flow |
| --- | --- |
| Light direction | Constructor copy `0x185908..0x185934`, then complete updater `0x18552c`. Resource `+0x10c` reaches runtime object `+0x184` unchanged with authored flags `1`. |
| Camera view | Update prefix `0x10a324..0x10a3b0`. The real Aim vtable entry `0x18fc88` calls `0x1ad2f0`, including the original trigonometric helper. The resulting world-to-view matrix is written at camera `+0x150`. |
| Active camera | Scene-selection slice `0x236324..0x236368` selects scene 1's camera slot 0 and stores its pointer at draw context `+0xa4`. Scene registration itself is fixture setup, using the prior source trace. |
| Draw-time installation | Caller slice `0x11b4f0..0x11b584` traverses the enabled light list and calls complete installer `0x12f954`. It emits the vector and global attenuation configuration. |
| Directional configuration | Separate material slice `0x192448..0x1924e8` consumes the same light list/count/mask and emits `LIGHT0_CONFIG=1` to register `0x149`. Geometry-factor inputs are explicitly zero for this fixture. Other material setup is outside the slice. |

The base camera resource has position `(0,1,44.7859992980957)`, Aim target
`(0,1,0)`, zero twist and zero Aim inheritance flags. Its executed row-major
view matrix is:

```text
1 0 0   0
0 1 0  -1
0 0 1 -44.7859992980957
```

This establishes the matrix as the camera's view transform, not a model yaw or
an arbitrary light-local matrix. The private camera resource-registration report
is `runtime/reference/folder-camera/report.md` under the firmware artifact root.
This execution extends that earlier static report through actual view generation.

## Vector and register sinks

At `0x12f97c`, the installer reads the active camera from draw context `+0xa4`;
at `0x12f988`, it selects camera `+0x150`. The directional branch does the following:

1. `0x12fae0..0x12fb04` copies cached direction `+0x184..0x18c` and supplies
   homogeneous `w=0`.
2. `0x12fb0c` calls `0x21ead0`, which multiplies by the row-major 3×4 camera
   matrix. Translation is multiplied by zero; `w` is copied through.
3. `0x12fb20..0x12fb2c` executes `vneg.f32` on all four components.
4. `0x12fb48` calls `0x13a640` with the negated vector and light index.
5. `0x13a640..0x13a760` converts XYZ to float16 and writes an incremental command
   starting at `0x144 + 0x10*lightIndex`. X occupies the first parameter's low
   halfword, Y its high halfword, and Z the second parameter's low halfword.

The [PICA register map](https://github.com/gdkchan/SPICA/blob/bd29a7828595d7839cda2ac61c76bb63f9071250/SPICA/PICA/PICARegister.cs#L152)
identifies these as light position XY/Z, separately from spot direction.
The [pinned Azahar generator](https://github.com/azahar-emu/azahar/blob/b8c29a64c306bac3866a5ed293ebee94ef6dcb00/src/video_core/shader/generator/glsl_fs_shader_gen.cpp#L639)
uses this position directly for a directional light and then normalizes it.

Thus the native mapping is:

```text
positionPICA = Q16(-(view3x3 * cachedDirection))
L = normalize(positionPICA)
```

`Q16` is the native conversion routine. For the finite, normal values exercised
here it truncates the mantissa rather than using host float16 round-to-nearest.
The cached direction may already include a light transform on other resource
flag branches; the earlier updater fixture documents that distinction. For
`BannerDef`, flags `1` preserve the authored direction even with a parent, and
the stored source transforms are identity. Applying the banner model's yaw to
this light is not part of the verified path.

## Authored result and controls

`BannerDef/Light1` supplies `(0,-0.41036465764045715,-0.911921501159668)`.
With the executed base camera, the setter receives
`(-0,+0.41036465764045715,+0.911921501159668,-0)`.

| Output | Value |
| --- | --- |
| XY parameter / incremental header | `0x36908000 / 0x801f0144` |
| Z parameter / padding | `0x00003b4b / 0x00000000` |
| Decoded installed XYZ | `(-0,0.41015625,0.91162109375)` |
| Normalized installed vector, computed in fixture double precision | `(-0,0.4103037462,0.9119489217)` |
| Separate directional config parameter / header | `0x00000001 / 0x00010149` |

Five cases pass:

- **Authored mono:** real light update, camera Aim generation, camera selection,
  caller, installer and command writer produce the values above.
- **Translated camera:** shifting both camera and target by `(13,-7,4)` produces
  identical command words. Light translation is excluded by `w=0`.
- **Rotated camera:** moving the camera to `(44.7859992980957,1,0)` while keeping
  target `(0,1,0)` produces `(-0.91162109375,0.41015625,-0)` in view coordinates.
- **Light slot 3:** the complete installer preserves the vector and writes
  registers `0x174/0x175`, proving the index offset. This case calls the installer
  directly and does not execute the separate slot-0 config slice.
- **Nonunit cached direction:** synthetic `(0.25,-2,4)` produces
  `(-0.25,2,-4)`. There is no normalization before register conversion in this
  executed path; normalization belongs to PICA consumption.

These results support the sign correction at the shared CGFX directional-light
boundary. Keep authored material constants, TEV buffer timing, LA4 masks and
specular rules intact. The default material's front-face primary term becomes
positive, explaining why its inverse-primary addition no longer washes out the
ink and cube shading. The folder also needs a matched capture: it consumes the
authored half-vector LUT, whose input changes with this corrected convention.
An earlier visually plausible folder result does not validate the old sign.

## Reproduction and limits

The fixture and output are private files
`presentation/banner-default-material/execute-draw-light.py` and
`executed-draw-light.json` under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E`.
Run the script with that root's `assets/research-venv/bin/python`.
[Committed evidence](evidence/native-directional-light-installation.json) includes
input/fixture hashes, executed slice bounds, instruction counts, matrices and
all captured commands. The fixture can be rerun without a browser or emulator.

Runtime allocations, pointers, enabled-light registration and the unparented
camera's world position are prepared by the fixture. It installs the real Aim
vtable/resource pointer instead of executing allocators. Camera execution stops
before inverse/projection/stereo work. The per-light material configuration is
a separately executed slice, not a full material draw. No PICA GPU, native HOME
process, stereo adjustment or full vertex-normal/quaternion pipeline is executed.
The normalized result above is numerical interpretation of emitted registers,
not a GPU capture. This proves the missing direction/view conversion; it does
not certify pixel parity or every supported lighting branch.

The five execution cases, evidence JSON parsing and `git diff --check` pass.
No application rebuild is needed for this source-evidence-only change.
