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
| HOME `exefs/code.bin` | `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9` |
| eShop title `exefs/code.bin` | `f69159121397ecca0164654f3f4771836f26fa9ea19f351c454f8e7364d1f4fa` |

The eShop applet `code.bin` (SHA-256
`329d98921ef213da0b53ef8f62227f6b3f753347ed859bfa8cd0e4016be4842d`) is a
different binary and does not contain VA `0x36a7fc`.

Idle HOME update `0x27c63c..0x27c778`, confirmed with Capstone:

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
matching the colon. That 4/5 map is sourced only for HOME and Settings.

## eShop `0x36a7fc` (round 3)

Title `0004001000022900` content `0000006b`. Capstone listings are in the
private scratch (`36a7fc_update.asm`, `1e9aa8_signal.asm`,
`1e9b10_charge.asm`, `36ad88_datetime.asm`).

1. `+0x410` vs 1000 ms toggles `+0x43e` (ctor stores 1) and
   `T_TimeC_00` visibility at `+0x220`.
2. When `+0x438==5`, that tick writes Bat 4 (`+0x43e!=0`) or 5.
3. `0x253384` is the network enum. `r7==2` is Internet: `lau_connect0`,
   NetMode 0, NetAtn from `0x1e9aa8` (`ldrb [0x1FF81066]`).
4. `0x27b8e4` is `0x1FF81085` bit 0 (charging). `0x1e9b10` is bit 1 and
   chooses battery state 5 vs 6. Bit 1 is not a profile field; charging
   `true` selects the state-5 4/5 path.
5. `0x36ad88` rewrites date/time labels only.

eShop `HudMenu_00` is a different atlas (`P_BatF_00`, `HudBat_00`/`01`,
`HudBatLgt_00`, `HudBatPlg`). Posed Internet NetAtn map 0 is
`HudNetAtnInt_00`. Until an eShop HUD elapsed owner exists, the welcome
keeps the ctor flag: `colonVisible:true` and Bat frame 4 (`+0x43e!=0`).
It does not call `deviceStatusBatteryFrame` or `Date.getSeconds()`, and
`eshopHudClock` omits seconds so the pair cache does not republish Bat
every second. Labelled strip adaptation, not HOME `0x27c6a8`.

## Zone `Hud_00_Charge_anim`

120 frames on `Grp_Bat`. `P_Bat_00` pattern 0 for frames 0–59
(`HudBat_04`), pattern 1 from 60 (`HudBat_05`). The painter uses the same
`clock.frame` as `Hud_00_time_Blinking` (119-step loop). Paint key keeps
`frame<60` plus that 0/1 pattern.

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
  second-parity paint. The minute paint and the parity paint do not both
  run in the same animation frame. WalkCoin and cursor stay frozen.
  Labelled accessibility adaptation.
- Settings without `settingsHudElapsedMs` keeps the fixed portfolio
  battery frame (4). Native Settings refreshes through the HUD sampler,
  not live `Date.getSeconds()` on every paint.
- The HUD charging icon does not match the 3D console (no charger, no
  charging LED).
- eShop welcome Bat is frozen at ctor frame 4 with a visible colon. Native
  would blink 4/5 on the +0x410 tick; that elapsed owner is still missing.

## Tests

`tests/home-hud-sample.test.mjs` pins colon/battery parity, the shared
profile owner, capture-sample override, reduced-motion parity including
the same-frame skip, Settings constructor / counter 2 / 1 / 0, eShop Bat
frozen at ctor frame 4 (odd and even seconds equal), and pose-level
eShop/Zone textures from the shipped packs.
`scripts/verify-eshop-welcome.mjs` and `scripts/verify-native-services.mjs`
assert those textures; the services verifier compiles
`stock-screen-layout` / `camera-browse` so Zone runs.
Settings verifiers compile `device-status-profile` before importing
`stock-native-settings`.

## Remaining

`+0xcc`, `0x32f144` / `+0xa9`, `+0xb0`, `+0xbb` and WhiteBlack 1/2 are
unreplayed. eShop colon/Bat phase still lacks a ctor-relative elapsed
owner; `0x1e9b10` bit 1 has no profile field. WalkCoin fade, wallpaper,
banner yaw and whole-scenario acceptance stay open. Matrix unchanged.
Coordinator recapture owns preview 3021 and Azahar.
