# HOME Notifications generic primary motion source

This bounded trace addresses the selected Notifications pose in the 1 October
reselection pair. Native
`_01.10.26_22.24.16.722.png` (SHA-256
`cad01085bbeb14feea4aba08395334a2ec6d0b1c52669edc160203853efc6eaf`)
shows a side-yawed Notifications primary, while the production capture still
uses the old authored front pose. The pre-change empty-mask report records
26,686 upper and 19,449 lower pixels above 2/255. This is a visible correction
target, not a passing baseline.

## Pinned code path

The source is EUR 10.7.0-32E HOME `code.bin`, SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`,
with virtual base `0x100000`. Focus 3 resolves to category 6. Its branch at
`0x1d75e0..0x1d7600` writes the canonical empty key `(-1,-1,medium 0)` and
native type 16. Dispatcher `0x1f9324` subtracts 3 and indexes the table at
`0x1f9344`; the type-16 entry is `0x1f9978`.

The type-16 branch reads resource-table slot `0x32ed44`, which points to
`BannerAppletNews`. It allocates the `0xa4`-byte primary and calls generic
constructor `0x1fa0fc`, then stores the object at manager `+0x64` and invokes
its resource-binding virtual method. The constructor loads vtable `0x3210f0`;
that vtable's update slot `+0x14` is `0x1fa344`. The active-primary manager path
at `0x24c23c..0x24c264` checks the prepared object and its ready byte before
calling that update slot. `0x1fa344` owns the common quarter-step
visibility/scale transition and tail-branches at `0x1fa490` to `0x24e0c0`,
which increments the yaw counter modulo 600 and writes the common negative
full-turn yaw. Notifications therefore uses the same generic primary motion
producer already proved for Friend; a stationary front yaw is not its native
host behavior.

The public model remains the separately sourced Notifications resource:
HOME title `0004003000009802` v24576, content index 0 / `00000082`,
`romfs/3D/BannerAppletNews_LZ.bin`, compressed SHA-256
`5170a1c67eed6dd6536a85c0a83689552fe335ad9fa51d88085d0c5084c1a931`.
The decoded CGFX SHA-256 is
`c91a037f6462c2aef79fb5944225e8a4c36e7116de804e86cc780a233805a1bc`;
converter `ctr-cgfx-web` 1.4.2. `BannerAppletNews` has one 600-frame looping
skeletal clip and one 300-frame looping material clip. Its `DmyText_00` label
surface remains bound to the Notifications label; it is not shared with the
Friend model.

## Runtime boundary and gaps

Only focus 3/category 6 enters the hosted type-16 path. It uses the canonical
empty key but remains a distinct target from Friend type 14; target equality
includes native type, and resource tickets cannot cross that handoff. The
existing readiness, generation, failure, blank-on-failure and disposal paths
remain authoritative. No fallback model or elapsed-time clock is added.

The trace does not establish the category-6 activation epoch, first submitted
skeletal/material frames, attach ordering, native displacement, extra offsets
or plate Y. Runtime `nativeDisplacementY=0`, `offsetX=0` and `offsetY=0` are
therefore explicit provisional gaps, and no phase offset is fitted. Tests and a
source trace do not prove a native/browser motion match or whole-scenario
fidelity. Coordinator integration must rerun the matched muted Sidecar replay,
capture both raw LCDs and inspect a fresh diff before making any visible claim.

Bounded disassembly scratch is under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/news-motion/source-trace/`.
