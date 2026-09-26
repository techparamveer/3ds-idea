# Settings upper HUD phase boundary

This is a source and offline pixel check of two existing raw LCD pairs. It does
not change the browser renderer or establish a matched animation sequence.

## Source and captured states

EUR 10.7.0-32E System Settings title `0004001000022000`, content index 0,
content ID `0000003d`, owns `hud_LZ.bin/anim/HudMset_00_Bat.bclan` (SHA-256
`e8c70db4c5f366e5251aba8c93e2a32a7622e595e511d000ac063f567de83729`).
The delivered `hud.json` clip has seven stepped frames. Frame 4 selects
`HudBat_04.bclim` (solid orange), and frame 5 selects `HudBat_05.bclim`
(dark/open orange). The texture PNGs have SHA-256
`a38db030a56d4f7be610ea8a6b1c567d9d12d6c65df2e7450ee16e9e41f6d179`
and `0eefbdb3e25aabc813e86b6b4e1f7e16ae0b1f28f2b8f34b88edbf7c24e7fc47`.

The Settings executable `exefs/code.bin` has SHA-256
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`.
Its HUD update at `0x2389b8` reads status through `0x16325c`, `0x19bf48`
and `0x163274`. The battery controller is at object offset `0x44`.
At `0x238ed0..0x238f24`, one branch writes controller frame 6 or selects
frame 4 versus frame 5 using bit 0 at object offset `0xf1`. The bounded trace
does not establish who updates that bit, the cadence, or a browser-equivalent
input. The clip's seven texture keys do not themselves supply a wall-clock
schedule. See the private `presentation/settings-status-hud/hud-update.asm`.

The native Settings main pair
`settings-main-battery04-browser-20260926` shows frame 4. Its native/browser
upper SHA-256 values are respectively
`b64e3a699eca8c47e9bd6a17cab66d9d85a593cc4f84aaafa29b78787dc6d576`
and `55e3a93a430b44d9366100cd002d8b7ae71b49a2440afd9c249d8dcc4f3c5a4d`.
The native Other page 1 pair
`settings-other-1-text-raster-browser-20260926` shows frame 5. Its upper
SHA-256 values are respectively
`09c625dd1a8a2080865ff24f672a0fd0975827cbf81dcd7f8310dd993d4a9d51`
and `efda9969da2e710a850a3062b51213889209a437b6a7bfbc8c913a0cdad07463`.
Both browser captures use the fixed frame 4. The pairs are under the private
`reference/scenario-matrix/v1/captures/` root and use empty masks at a
maximum-channel threshold of 2/255.

## Bounded frame substitution

The 32×20 source frame 4 and frame 5 textures share an identical opaque alpha
mask. Every one of frame 4's 190 opaque RGB pixels matches the browser battery
rectangle at `(368,0)..(400,20)` in both pairs. An in-memory substitution of
only those pixels with source frame 5 produces:

| Pair | Frame 4 battery / whole upper | Frame 5 battery / whole upper |
| --- | ---: | ---: |
| Settings main | 0 / 102 | 137 / 239 |
| Other page 1 | 137 / 1,520 | 0 / 1,383 |

All 137 Other page 1 battery differences lie inside the source frame 4/5
texture difference mask. The substitution is exact for this one still, but a
global frame 5 change would regress Settings main by the same amount. It is
not a runtime phase implementation or an accepted capture pair.

The remaining Other page 1 HUD differences are 43 network/badge pixels
(`x=60..98`, `y=7..14`) and 30 date/time pixels (`x=304..363`, `y=4..16`).
The network residual is also 43 pixels at the same bounds on Settings main;
main date/time has 59 pixels. The current native status text and network clips
already render in both pairs. These small residuals require a separate font,
sampler or status-input check; the battery clip cannot explain them.

## Decision and next evidence

Keep the current fixed frame 4 until a matched native sequence records the
Settings HUD battery at multiple frame-indexed moments with charging/PTM state
and the `0xf1` phase bit, or an executable trace establishes how that bit is
updated. Then select the source clip frame from an explicit portfolio status
model, replay both Settings main and Other page 1 at the matched phase, and
verify the raw browser LCD. Do not choose frame 5 by page, timestamp, or a
capture-fitted timeout. The upper HUD residual is not resolved by this audit;
both matrix entries remain `fail`.
