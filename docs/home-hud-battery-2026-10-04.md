# HOME HUD charging battery and device-status owner

Worker `3ds-home-hud-battery-20261004` / `codex/home-hud-battery-20261004`.
Follows the [colon caller](home-colon-caller-2026-10-04.md) and
[reference-profile HUD](home-hud-profile-2026-10-04.md).

Private scratch:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-hud-battery-20261004/`.

## Source identity

EUR 10.7.0-32E HOME `0004003000009802`, version 24576, content index 0 /
`00000082`. Addresses use virtual base `0x100000`.

| Artifact | SHA-256 |
| --- | --- |
| `exefs/code.bin` | `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9` |

Idle update `0x27c63c..0x27c778`, confirmed with Capstone:

1. `0x27c644..0x27c64c`: `ldrb +0xcc`; nonzero skips to `0x27c774`.
2. `0x27c650..0x27c66c`: load byte at `0x32f144`; if that global is 0 and
   `+0xa9` is set, return 1 at `0x27c778`.
3. Clock helpers `0x1ef4a4` / `0x1ef15c` / `0x1ef388`, then WhiteBlack
   animator `+0x74` state 1 or 2 skips to `0x27c774`.
4. `0x27c6a8`: `ldrb +0xdd`, `tst #1`. Pane `T_TimeC_00` (`+0xa4`)
   visibility bit 0: odd hide, even show.
5. `+0xbb` low-battery: blink `P_Bat_00` (`+0xa0`) visibility instead of
   the charging clip.
6. `+0xba` charging: `G_Bat_00` (`+0x88`, looked up at `0x27c2d8`) to
   float **4.0** at `0x27c780` on odd seconds, **5.0** at `0x27c784` on
   even seconds, via vtable `+0x2c`.

`+0xcc`, `0x32f144` / `+0xa9`, hold `+0xb0`, `+0xbb` and WhiteBlack
states 1/2 are not replayed. Live HOME binds `HudMenu_00_WhiteBlack`
frame 0.

Settings already used the same 4/5 map on cached seconds
(`stock-settings-hud.ts`). HOME uses **current** `Date.getSeconds()`,
matching the colon.

## Change

- `src/os/device-status-profile.ts` is the single typed
  reference-session owner: Internet, 42 Play Coins, charging battery.
  HOME, Settings HUD and eShop/Zone consume it. Charging=`true` is a
  labelled adaptation of the isolated Azahar PTM default.
- Live HOME `hud()` derives `HudMenu_00_Bat` from that owner and the
  same seconds byte as `T_TimeC_00`. `lcdHomeHudSample` still supplies a
  complete one-shot pose and is not a default.
- Reduced-motion HOME, which otherwise paints only on minute change or
  input, keeps the native 1 Hz colon/battery blink with a HUD-visible
  second-parity paint. WalkCoin and cursor stay frozen. Labelled
  accessibility adaptation.

## Tests

`tests/home-hud-sample.test.mjs` now pins colon/battery parity, the
shared profile owner across HOME/Settings/eShop/Zone, capture-sample
override, and the reduced-motion parity helper. Settings still owns its
counter/previous-displayed-seconds sampler.

## Remaining

`+0xcc`, `0x32f144` / `+0xa9`, `+0xb0`, `+0xbb` and WhiteBlack 1/2 are
unreplayed. eShop/Zone apply the shared profile; their title-local PTM
callers are not traced. WalkCoin fade, wallpaper, banner yaw and
whole-scenario acceptance stay open. Matrix unchanged. Coordinator
recapture owns preview 3021 and Azahar.
