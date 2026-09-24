# eShop welcome status strip source audit — 24 September 2026

This audit answers whether the EUR eShop welcome owns a status/HUD pane or a
system applet overlays it. It is a static ARM and layout trace, not a matched
native welcome capture.

## Evidence

- **Executable:** title `0004001000022900`, content `0000006b`, `exefs/code.bin`,
  SHA-256 `f69159121397ecca0164654f3f4771836f26fa9ea19f351c454f8e7364d1f4fa`,
  base `0x100000`. The file stays private under the SSD extraction root.
- **Layouts:** converted `cad/Hud.arc.lz` (`HudMenu_00`) and Common
  `info_U_00`; published `cad-Boot-arc-lz.json` for `welcome_U_00` /
  `BG_U_00`.
- **Messages:** eShop `message/europe/EU_English/hud.msbt` (`lau_connect*`,
  `lau_date`, `day_*`, `month_*`, `week_*`).
- **Reproducible probe:** SSD `reference/eshop-idle-source/hud/probe_hud.py`.
  Run it with `assets/research-venv` (Capstone). It writes `source-audit.json`,
  `layout-geometry.json` and `listings/`.
- **Native run:** the isolated Azahar direct-title capture on the integration
  branch (`docs/native-eshop-direct-launch-2026-09-24.md`) is Nintendo Network
  ID account information, not welcome. It cannot identify welcome clip frames.

## Ownership

eShop owns the strip. It is not HOME chrome, Zone `Hud_00`, Settings
`HudMset_00`, or a system applet.

| Candidate | Result |
| --- | --- |
| Welcome layout `welcome_U_00` | No status panes |
| `BG_U_00` `P_BG_01` | 400×20 at screen y 0–20, **flags 0** (hidden). Helpers `0x36ab64` / `0x36ac00` toggle it on shop pages, not on the welcome |
| Common `info_U_00` | Loaded by the HUD ctor at `0x36b480` from Common handle `0x43ac08`. `P_bg_01` is a 400×20 white `squareWhite_00` sibling of `N_info_00` |
| eShop `HudMenu_00` | Loaded at `0x36b274` from `cad/Hud.arc.lz` + `Hud.bcfnt`. Icons and text only |
| `sysMenu_U_00` | Full-screen TIGER dialog at `0x1a2be4`, not a status strip |
| APT / errEula / mint / swkbd | APT service strings exist. No overlay title is prepared for the welcome |

The HUD+info object ctor is `0x36b0e8` (0x440 bytes). App init `0x2e4e00`
allocates it at `0x2e589c` when singleton `0x44e9e8` is empty. The welcome
ctor `0x2e4498` never mentions Hud. The object is therefore already on the
upper draw list when the welcome is constructed.

`0x295b48` registers every loaded layout through `0x23fb44`. Each screen
paints in ascending priority (`0x107a08`).

## Draw order on the welcome

| Priority | Layout | Welcome pose |
| --- | --- | --- |
| 0.01 | `BG_U_00` backdrop | `P_BG_00` covers y 20–240; `P_BG_01` hidden |
| 0.5 | `welcome_U_00` | Entrance / wait / exit clips |
| 0.9 | `OKBtn_D_00` | Lower screen only |
| 0.91 | Common `info_U_00` | `N_info_00` hidden (`0x2904c0(r1=0)` at `0x36b4e8`); `P_bg_01` and `P_shadow_01` stay visible |
| ≈0.911 (`vldr` at `0x36b25c` → `0x36b620`) | `HudMenu_00` | Default `N_Scene_00` visible, alpha 255. Appear is not started |
| 1.0 | `BG_U_00` curtain | `inOut_00` |

`P_bg_01` is the opaque 400×20 fill. `HudMenu_00` then paints wireless,
`T_NetMode_00` (`cbf_std.bcfnt`), date/time (`Hud.bcfnt`) and battery in that
band. The title `Hud.bcfnt` is byte-identical to the delivered shared HUD font
(font JSON SHA-256 `a40d189bd94da15a4122c7d7d13c273e0447378d6b256e50b777dd0ce22bf519`).

The browser defect was the stock pair's `clearRect` plus a transparent top 20
px (`P_BG_00` does not cover y 0–19). HOME `HudMenu_00` therefore showed
through as a gray “Disabled” strip. That is inherited HOME chrome, not eShop
source.

## Update function and declared portfolio state

Task `0x36a7fc` (table `0x3b396c`) is registered at ctor via `0x2a5560`. It
reads a network enum from `0x253384`:

| `r7` | Label | NetMode frame | NetAtn frame |
| --- | --- | --- | --- |
| 2 | `lau_connect0` “Internet” | 0 | `0x1e9aa8` signal |
| 7 | `lau_connect4` “Disabled” | 4 | 9 (`HudNetAtnOff_00`) |
| other | `lau_connect3` “Enabled” | 3 | 8 |

The ctor binds `NetAtn`, `NetMode` and `Bat` through `0x2403cc` and immediately
clears playing (`+0x38`). By welcome time the update task has been running
since app init. The welcome-time enum is not reproduced here.

This portfolio already reports wireless off on HOME (`lau_connect4`, NetMode
frame 4) and Nintendo Zone (`HudNetAtnOff_00`). The painter therefore uses the
**Disabled** branch: `lau_connect4`, NetMode frame 4, NetAtn frame 9. Battery
frame 3 is the same sufficient-charge pose as HOME/Zone, not a PTM reading.
Date/time uses eShop `lau_date` / `day_*` / `month_*` / `week_*` with the
presentation's injected local `Date`. The pair cache keys year, month, day,
hour and minute.

The isolated account-information capture's blue Internet badge is that
profile's live enum on a different route. It is not copied onto the welcome.

## Browser implementation

`src/os/stock-native-services.ts` requests `info_U_00` from Common and
`HudMenu_00` plus its three status clips from `cad-Hud-arc-lz.json`. After the
welcome and OK button, and before the curtain, it paints `info_U_00` with
`N_info_00` hidden, then `HudMenu_00` with `eshopHudBindings`.

`scripts/firmware/stock-ui-eshop.json` selects those resources. The title's own
`Hud.bcfnt` is published; it is byte-identical to the shared HUD font. The
inventory-converted `messages-and-loose` pack has no tiger style table, so
`hud.msbt` was merged into the already published English pack that still
carries `RI.mstl.lz`. Welcome `BootWelcome_*` styles are unchanged. A full
`stock_ui.py` rewrite of this title also omitted its Notes SMDH fields
(`notesIcon`, long description); those records were restored from the previous
manifest after the HUD packs were added.

## Remaining gaps

- No native welcome LCD exists. Source rendering is not a matched capture.
- The `0x253384` enum and PTM battery table are not live telemetry.
- `HudMenu_00_Appear` / `DisAppear` and `NetAtnCnt` are not played on this
  screen.
- Shop-page `P_BG_01` / HUD hide-show helpers are out of welcome scope.
- Coordinator browser inspection and Azahar comparison remain separate.
