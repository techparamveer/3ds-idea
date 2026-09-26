# HOME HUD profile and service state audit

Evidence: source/profile inspection at `03b2d31`; no new native/browser capture
or acceptance result. Scope remains the stock 3DS portfolio UI. Firmware-derived
artwork is unchanged.

## What differs

Coordinator's native HOME view shows Internet, 42 coins and an orange battery;
the browser shows Disabled, 0 and a blue battery. These differences include
selected runtime state, rather than demonstrating missing graphics.

| Field | Current browser HOME binding | Evidence and boundary |
| --- | --- | --- |
| Network | `lau_connect4`, `NetMode=4`, `NetAtn=8` | Explicit presentation constants; no AC service/profile reader. Native Internet is an observed emulator state, not proof of an actual internet connection. |
| Coins / steps | `T_Coin_00='0'`, `T_Walk_00='0'` | Explicit constants. The isolated native profile contains 42 coins; 42 is also the pinned emulator's default. |
| Battery | `HudMenu_00_Bat=3` | Explicit fixed pose. Pinned emulator PTM reports full charge and defaults charging=true. The exact HOME charging pose and update phase still require HOME-specific verification. |

Implementation: [firmware presentation](../src/os/firmware-presentation.ts),
`hud()`; the existing [presentation validation](firmware-presentation-validation.md)
already declares wireless disabled and zero counts. Date/time are injected from
Date, and WalkCoin advances with `time*.06`; neither reads the isolated profile.

## Asset and profile provenance

The delivered [HOME HUD pack](../public/os/firmware/10.7.0-32E/packs/home/hud.json)
comes from EUR 10.7.0-32E HOME title `0004003000009802`. Its recorded source hash
is `9b71bc33490ca291eb1d31ba75dad85a8a9cacf1e0141d80d5b37e5c1ad1bc27`;
pack SHA-256 is `76df2ed42d3bbe09bef599bc242ac2946b811a3c5ee362a8776483a257b4c775`.
`resourceSources` maps the existing NetMode, NetAtn, Bat and WalkCoin clips to
`hud_LZ.bin/anim/*.bclan`. For example, native `HudMenu_00_Bat.bclan` SHA-256 is
`7f2906be6975fa97b14f72f10e0d7f5a3648ec996c43ad5930a0fb3c9b32d046`.
There is no need to manufacture network labels, coin digits or battery artwork.

Private artifact root:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E`.
Read-only inspection of
`reference/user/nand/data/00000000000000000000000000000000/extdata/00048000/F000000B/user/gamecoin.dat`
found 20 bytes, SHA-256
`e5ad6a70466faa9bde8c818ae80f51a39f6ca0a68e2c766d37364010e4a6e19e`.
The little-endian u16 at offset4 is42. This is profile data, not a firmware
layout default, and was not copied into public assets or modified.

Pinned Azahar release2126.1.2, commit
`9e6f523a57fac9564ac0bf8286db3c3702d301ec`, is recorded in private
`runtime/reference/source-provenance.json`. The local
`src/core/hle/service/ptm/ptm.cpp` SHA-256 matches that record:
`9f20776d122b8fc8760d8f12c6f610961a3ed921ac36f0d6578c7cb398cad2c9`.
Its default GameCoin initializer supplies42; `ReadGameCoinData()` reads the
shared extdata file, and `GetPlayCoins()` returns `total_coins`.
The [same-revision PTM header](https://raw.githubusercontent.com/azahar-emu/azahar/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/core/hle/service/ptm/ptm.h)
confirms the offset4 field and default charging=true. The local implementation
returns CompletelyFull for battery level and the module charging flag for
adapter/charge queries. These emulator defaults explain plausible native inputs;
they do not establish HOME's exact status sampling or animation clock.

## Source gaps and bounded options

The [eShop HUD audit](eshop-welcome-hud-source-audit.md) traces Internet to
`lau_connect0`/NetMode0 and the disabled branch to NetMode4/NetAtn9. HOME currently
uses NetAtn8 with Disabled. This is a specific consistency question for a HOME
trace, not evidence that eShop's branch addresses or mappings can be copied
unchanged. Likewise, [Settings HUD timing](settings-hud-runtime-2026-09-26.md)
proves Settings' sampled charging animation, not HOME's timing.

1. For matched verification, add an explicit capture profile after tracing HOME's
   status bindings: recorded coins42, recorded network mode/signal, and recorded
   battery state/phase. Keep the profile separate from firmware asset data and
   from the default product session. Native and browser must share the recorded
   input prefix and clock; a still-image pose alone cannot validate motion.
2. For product behavior, retain or deliberately change the declared simulated
   session through a typed state owner. An Internet label would describe the
   simulated console state; it must not be inferred from browser connectivity.
   Do not silently replace all zero counts with42 just to match this profile.

Next evidence needed is a bounded HOME service-to-pane/clip trace plus consecutive
native HOME captures establishing charging and WalkCoin phase. Until then the
status pixels remain mismatches; no mask, parity pass or live telemetry claim
is introduced. This audit does not change the native profile, runtime or assets.

Validation: profile and local source SHA-256 checked, delivered pack hash checked,
relative links checked, and `git diff --check`. Documentation-only; application
tests/build are not required by this change.

## Renderer diagnostic seam

`DiagnosticHomeHudSample` in [home-hud-sample.ts](../src/os/home-hud-sample.ts)
now permits a **single paint** to select explicit delivered HUD clip poses,
source network message and coin/step strings. Call
`screens.paint(state, date, elapsedMs, sample)` or the lower-level
`createFirmwareHome(...).hud(context, date, elapsedMs, sample)`.
The sample requires `kind: 'source-pose'`, a nonempty `evidence` description,
`networkMessage` (`lau_connect0` through `lau_connect4`), `netModeFrame`,
`netAtnFrame`, `batteryFrame`, `walkCoinFrame`, `coins` and `steps`.
Discrete frames must be integers in their delivered clip range; WalkCoin allows
fractional frames inside its cycle. Counters must be nonnegative safe integers.

This seam deliberately accepts the message and frame independently. Native HOME
service-to-frame bindings and charging/WalkCoin phase are still untraced; no
mapping is asserted by this API. In the delivered pack the valid ranges are
NetMode 0–4, NetAtn 0–9, Bat 0–6 and WalkCoin [0,360). The test's Internet/42,
NetMode 0, NetAtn 3, Bat 4 and WalkCoin 180 are an explicit **synthetic pose
probe**, not a reconstruction of the 04:14:35 native capture. The 42 counter has
the private-profile provenance above; the chosen battery, signal and cycle
frames have no native timing claim. Source artwork/messages are reused and no
new native graphics are fabricated.

No default fixture, network telemetry, persistence or URL/capture hook was added.
An ordinary paint still selects Disabled, zero counters, Bat 3 and the existing
elapsed-time WalkCoin cycle. The diagnostic does not mutate that state. The
coordinator must gate any caller to the existing local capture surface, record
the complete sample in its JSON evidence and restore an ordinary paint in
`finally`; until that integration, this renderer capability has no browser entry
point. A HOME trace and native consecutive captures remain prerequisites for a
source-driven profile fixture or runtime change. No pixel or acceptance result
changes here.

Validation: seven focused HOME HUD/balloon tests pass, including diagnostic then
ordinary-paint equivalence and rejection of invalid poses. Typecheck and production build pass.
Browser/native comparison remains a coordinator integration check; these unit
tests establish binding behavior only.
