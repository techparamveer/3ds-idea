# HOME footer theme source audit - 1 October 2026

This bounded source-only audit follows the remaining full-width material edge
in the applet footer. It does not change runtime presentation. The coordinator's
post-font recapture reports 694 pixels above the 2/255 threshold in component
`(0,212)..(319,220)`; whole-scenario acceptance remains **fail**. No emulator,
browser, GUI or audio session was used for this audit.

## Pinned sources

- HOME title `0004003000009802`, EUR 10.7.0-32E, version 24576, content index
  0 (`00000082`).
- `code.bin` SHA-256
  `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
- `packs/home/launcher.json` SHA-256
  `f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`;
  its source is `romfs/launcher_LZ.bin`, SHA-256
  `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.
- Checked machine-readable findings are in
  [home-footer-theme-runtime.json](evidence/home-footer-theme-runtime.json).
  `scripts/audit-home-footer-theme.py` regenerates them from explicit absolute
  `--code` and `--launcher` inputs without third-party modules.

## Executable route

Function `0x2ac8c4` is the footer material producer. It reads the controller at
`scene+0xab0`, the `LncBtmBtn_02` layout at controller `+0x8`, and iterates the
20-name table at `0x308a98`. The first two entries are `P_BtnW_C_01` and
`P_EdgeW_C_01`. For every named pane it resolves the material and calls RGB
slot setter `0x1d47d0` three times:

| Producer call | Input record | Material RGB slot |
| --- | --- | --- |
| `0x2aca08` | `+0x4..+0x6` | 0 |
| `0x2aca18` | `+0x7..+0x9` | 2 |
| `0x2aca28` | `+0xa..+0xc` | 1 |

The producer has exactly two direct callers, `0x1d3514` and `0x1d35b4`, in
function `0x1d3354`. Singleton accessor `0x217a90` returns the manager at
`0x35f9d8`. Manager `+0x14` supplies the active-theme object and manager
`+0x18` supplies the default palette. If active-theme byte `+0x10` equals 1,
the producer receives active object `+0x74`; otherwise it receives default
palette `+0x5c`.

The default palette does not explain the residual. During HOME initialization,
`0x2a8bf0` snapshots `P_BtnW_C_01` material RGB slots 0, 2 and 1 into default
palette `+0x60..+0x68`. The decoded layout assigns material 0 to
`P_BtnW_C_01` and material 3 to `P_EdgeW_C_01`; those materials are identical
apart from name, including flags, TEV stages, blending, buffer color and all
six constants. Their relevant authored RGB values are `[255,254,250]`,
`[255,255,255]`, and `[223,219,215]`. The default route therefore normalizes
both panes to values they already share.

## Source gap and next diagnostic

The only established color-changing route is the active-theme record. Its
gate and nine RGB bytes are runtime profile/theme state, not values contained
in the pinned executable or decoded layout. Deriving them from the captured
pixels would be a screenshot fit, so this slice deliberately makes no color or
material correction.

The next native diagnostic is one settled-frame memory read, performed by the
coordinator under the required isolated, muted Sidecar session:

1. Treat `0x35f9d8` as the manager object base, then read the active/default
   pointers at `0x35f9ec` and `0x35f9f0` (manager `+0x14` and `+0x18`).
2. Read active byte `+0x10`. If it is 1, dump active `+0x78..+0x80`; otherwise
   dump default `+0x60..+0x68`.
3. Break at `0x2aca08`, `0x2aca18`, and `0x2aca28`; for loop indices 0 and 1,
   confirm the button and edge receive the same slot values.

Only that runtime evidence can distinguish a missing active-theme application
from a remaining renderer/material interpretation defect. Any correction must
then be recaptured against both Notes and Friends; this source audit alone does
not change the scenario's failed status.

## Checks

The focused Node regression verifies the two decoded pane/material bindings,
their complete authored-material equality, the slot order and the explicit
source-gap contract. The Python checker verifies the pinned hashes, exact ARM
words, surrounding executable section hashes, direct calls and the 20-name
table before emitting the evidence object. Documentation links and whitespace
are checked separately; no build is required because production code is
unchanged.
