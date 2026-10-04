# HOME HudMenu_00 colon blink caller

Worker `3ds-home-colon-caller-20261004` / `codex/home-colon-caller-20261004`.
No runtime visibility change. Follows the
[odd-second colon paint](home-hud-colon-2026-10-04.md). That pass hid
`T_TimeC_00` on odd painted seconds to match the 26 September still, and
left HOME's caller untraced. Settings
[previous-displayed seconds](settings-hud-runtime-2026-09-26.md) is a
different title and is not ported.

Internet / 42 / orange stay `HOME_REFERENCE_HUD_STATUS`. This is not a PTM
clock and not 1:1 acceptance.

## Source identity

EUR 10.7.0-32E HOME `0004003000009802`, version 24576, content index 0 /
`00000082`. Addresses use virtual base `0x100000`.

| Artifact | SHA-256 |
| --- | --- |
| `exefs/code.bin` | `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9` |
| `home-arm.txt` | `87721bf7b4fd4e9e99ecf26820c03327c2ced62a312011f75f5c989114c501d8` |
| `packs/home/hud.json` | `76df2ed42d3bbe09bef599bc242ac2946b811a3c5ee362a8776483a257b4c775` |
| `hud_LZ.bin/blyt/HudMenu_00.bclyt` | `c27b927db06ec234601e3fc1bfa3f55f1c9570353ac8016c5ad9812ebaab28de` |
| `hud_LZ.bin/anim/HudMenu_00_WhiteBlack.bclan` | `bf1d78508153e670a37bd4b24ae01f4d1e7a8715116d1e294bf567b5e1a3f433` |

The listing is private
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/boot-reveal-source/home-arm.txt`,
lines 389521–389575. Converter ctr-native-web 1.2.0. Pane
`T_TimeC_00` is the delivered HUD layout pane; no new graphics.

## Idle caller

HUD constructor `0x27c358..0x27c364` looks up `T_TimeC_00` and stores the
pane at object `+0xa4`. The same constructor stores the `G_WhiteBlack_00`
animator at `+0x74` (`0x27c208..0x27c214`).

Idle update `0x27c63c..0x27c718`:

1. `0x27c644..0x27c64c`: `ldrb +0xcc`; nonzero skips the rest of this
   function (`bne 0x27c774`).
2. `0x27c67c r1=0`, `bl 0x1ef4a4`; then clock update `0x27c684 r1=0`,
   `bl 0x1ef15c`; then `0x27c690 r1=0`, `bl 0x1ef388`.
3. `0x27c694..0x27c6a4`: load WhiteBlack animator `+0x74`, then state at
   `+0x14`. Equal 1, or else equal 2, skips the colon (`beq 0x27c774`).
4. `0x27c6a8..0x27c718`: `ldrb +0xdd` / `tst #1`. Pane `+0xa4` visibility
   byte `+0xb7` bit 0: odd `and #0xfe` (hide), even `orr #1` (show).

`0x1ef15c` with `r1=0` writes the current calendar as 12 bytes at `+0xd4`.
Seconds are byte 9 of that structure (`+0xdd`). The same function compares
`+0xdd` with previous `+0xe9` only to decide whether hour/minute/date text
needs a refresh. The colon branch does not read `+0xe9`.

## Not Settings

Settings title `0004001000022000` `0x238aec..0x238b10` hides `T_TimeC_00`
from the **previous displayed** seconds (`+e5`) before copying the current
date. HOME idle uses **current** `+0xdd` after `0x1ef15c`. Copying Settings'
sampler would be a wrong-title fit.

## Runtime

`hud()` already paints
`T_TimeC_00.visible = (date.getSeconds() & 1) === 0`. That is the idle
odd-hide / even-show mapping. Existing tests keep odd `:35` hidden and even
`:34` visible. The formula is not replaced.

**Labelled adaptation.** `date` is the injected calendar Date, not HOME's
`+0xdd` sample after `0x1ef15c`. Flag `+0xcc` and WhiteBlack states 1/2 are
not replayed. Live HOME binds `HudMenu_00_WhiteBlack` frame 0. No PTM
battery/network clock is invented.

## Remaining

WalkCoin fade, wallpaper, banner yaw and whole-scenario acceptance stay
open. Matrix unchanged. Coordinator recapture owns preview 3021 and Azahar.
