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

## Live diagnostic, 1 October

The coordinator attempted the next runtime read using the pinned executable in
a separate `native-footer-runtime` clone under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001`.
All 467 frozen-seed NAND/SD hashes passed. Paths were rebased only in the clone,
volume remained zero, and the main window was verified on Sidecar at
`(1810,397,1153,781)`. Config-before SHA-256:
`f0c055a74742f179f0f5ad015f86fb522a502c44e94c775894ca89389d7b1409`.

The pinned debugger interfaces are not loopback-only: RPC uses a wildcard UDP
endpoint on port 45987 and GDB binds `INADDR_ANY`. Both accept memory writes
without authentication. They remained disabled. See pinned
[RPC source](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/core/rpc/udp_server.cpp)
and [GDB source](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/core/gdbstub/gdbstub.cpp).
A local Save State request then failed with the native error
`Savestates are not supported with LLE modules enabled`. No state file was
created and no LLE setting was changed. Even an available save state is a
Zstandard-compressed Boost object archive with process page tables, not a flat
virtual-address memory dump; arbitrary pointer arithmetic would be unproved.

The run yielded native 400x480 Notifications and Friend PNGs, not live theme
bytes. Their identities and the limitations are in private
`footer-runtime/summary.json`; both PNGs were opened. Pause/continue and error
dialogs mean these are not exact-frame captures. Three save-error dialogs
appeared on the DELL display; each was moved to Sidecar and independently
verified before dismissal. Native menu delivery later remained in
`NSMenuTrackingSession`; Quit was requested before movie EOF but the process
outlived its window and SIGTERM. Only that owned process was then killed
(exit 137); samples and logs are retained.

The theme gate/nine RGB bytes remain **source-gap**. No footer color was fitted,
no renderer behavior changed and no scenario was accepted. Next investigation
must use a safely isolated read mechanism or a separately declared adaptation,
not repeat this unsupported save-state route or enable an exposed debugger.
