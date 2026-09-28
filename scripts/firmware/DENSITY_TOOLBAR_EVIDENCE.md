# Density toolbar: availability, Invalid binding and input

2026-09-23. Native HOME enables density decrease only when **target density**
is above0 at root or above1 in a folder. Increase is enabled only below5.
Disabled controls bind `LncBase_D_01_Invalid` to their own group, producing
the authored **alpha120**. These conditions use neither the current density
nor the fractional interpolated density.

This is a bounded original-executable/resource audit. No runtime, public asset,
browser or Azahar state changes accompany it.

## Source and reproduction

EUR HOME `0004003000009802`, version24576, maps `code.bin` at `0x100000`.
Executable SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
[home_density_toolbar.py](home_density_toolbar.py) uses the adjacent
blank-slot fixture's memory/call helpers, with explicit stubs for controller
endpoints, hit result, sound, unrelated geometry, modal state and overlay policy.

```sh
ART=/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E
"$ART/assets/research-venv/bin/python" -B scripts/firmware/home_density_toolbar.py \
  --code "$ART/assets/extracted/home/exefs/code.bin" \
  --animations "$ART/assets/extracted/home/unpacked/launcher_LZ/anim" \
  --launcher public/os/firmware/10.7.0-32E/packs/home/launcher.json \
  --output "$ART/presentation/native-density-toolbar/verified"
```

All checks passed:108 availability cases, two input-dispatch cases,24 raw
density-callback cases, native controller/name-table anchors and resource
group/track checks. The private output contains13 hashed source excerpts.
Fixture SHA-256:
`b307cfd2e3bc0b6dd363d37b04e52da1a0633f52bcb4c8de1a2a40f3cb8a5cf3`.
Result SHA-256:
`59cdd18ceaf5d129521773aa396c4495af10e8e6493216baff5f78b92f08183d`.
The result also records helper/resource hashes; firmware/disassembly stay private.

## Controls and available range

Construction `0x2b42c0..0x2b4350` loads Select, Decide and Invalid controllers
twice, with group strings at `0x32f1e8` and `0x32f1ec`. It stores the buttons
at scene`+0xf34` and `+0xf38`:

| Control | Group | Authored pane | Availability |
| --- | --- | --- | --- |
| Decrease density / larger icons | `G_Dw_00` | `P_Dw_20` | target > minimum |
| Increase density / smaller icons | `G_Up_00` | `P_Up_20` | target < 5 |

Availability function `0x1ebe2c` calls minimum getter `0x2eb79c`. That getter
reads signed active folder ID at scene`+0x1170`, returning0 for root(-1),1
otherwise. Count getter `0x2eb78c` returns6 in both contexts. The availability
function reads **scene`+0x1190` target density** and compares against minimum
and count-minus-one. The fixture varies current0–5 independently of target0–5
for root, folder0 and folder59; all108 cases follow target alone. A fractional
value in scene`+0x1194` does not alter these results.

Density setup `0x1e3f68` uses the existing15-update geometry transition and
calls `0x1de8ec`. Its native state5 table entry resolves to `0x1dee8c`, which
refreshes these button states through `0x1ebe2c` at `0x1deec4`. This supports
using the pending target immediately instead of waiting for geometry to settle.
The availability/Invalid clip does not establish an additional fade duration.

## Genuine disabled appearance

`LncBase_D_01_Invalid.bclan` is a non-looping two-frame clip. It has exactly
two relevant pane-alpha tracks: `P_Dw_20` and `P_Up_20`, each a constant120
key at frame0. Its authored source frame range is60–61; the converted clip's
binding uses local frame0. It does not define a gradual fade into disabled.

The decoded group memberships are:

- `G_Dw_00`: `B_Dw_00`, `P_Dw_20`, `P_DwP_20`.
- `G_Up_00`: `B_Up_00`, `P_UpP_20`, `P_Up_20`.

Actual `poseNativeLayout` checks after the existing PaletteOut/MvsToggle
bindings yield `(down,up)` alphas `(255,255)` without Invalid, `(120,255)`
for Down only, `(255,120)` for Up only, and `(120,120)` for both. Neither
press backing becomes visible. These four outputs are retained privately in
`presentation/native-density-toolbar/posed-groups.json`.

Native button constructor `0x1f6854` installs vtable`0x3214b0`. Enable/disable
virtual`+0x10` resolves to `0x250208`: disabling with visual update enabled
starts the Invalid controller and sets widget state5; enabling resets the
Select controller to its endpoint and returns to state0. This does not justify
binding Select to a disabled widget in the browser.

## Hit behavior and raw setter distinction

Widget update `0x2558ac` dispatches state0 to ordinary press handler`0x255568`;
an in-bounds new touch starts Select and enters state1. Disabled state5 instead
dispatches to invalid-hit handler`0x2556a8`. It can still check hit bounds and
call its configured invalid-sound endpoint, but does not start Select or enter
the ordinary press state. The fixture confirms this distinction with the
same supplied in-bounds touch for both states.

Invalid-hit notification also requires button byte`+0x6c`. Parameter defaults
`0x22a60c` zero parameter`+0x3c`, which constructor`0x1f6854` copies into
button`+0x6c`; the density-button construction does not override it. No invalid
notification or fabricated sound should be inferred from the mere presence of
the invalid-hit handler. Resolving the configured sound is outside this audit.

The lower-level density callback`0x2a3db8` independently clamps only to0..5.
Its24 executed cases include a direct folder1→0 request. Folder minimum1 is
therefore enforced by the control availability gate, not by rewriting every
folder history or forbidding density0 geometry. Existing native geometry/history
evidence for folder density0 remains valid.

## Minimal implementation recommendation

Use one pure helper reading active context and `targetDensity`. Bind local
Invalid frame0 only for disabled groups and omit their pressed Select binding.
Use the same helper at the density-button branch in `touchMenu` to reject a
disabled toolbar activation. Preserve generic density setters, compatibility
zoom commands and restored histories. Keep other toolbar groups and clipping.

Focused tests should cover root0/1/5, folder0/1/2/5, both pending-target
directions, real resource group isolation, disabled press appearance, System
touch phases, unchanged selection/history/motion on disabled taps, and restored
folder0 geometry. Actual browser/native comparison remains integration-owned.
Physical hit-box edge equality, full controller/APT lifecycle and notification
profile differences are not established by this audit.
