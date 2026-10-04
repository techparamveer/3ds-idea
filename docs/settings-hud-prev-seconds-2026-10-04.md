# Settings HudMset previous-seconds owner — 4 October 2026

Worker `3ds-settings-hud-prev-seconds-20261004` /
`codex/settings-hud-prev-seconds-20261004` from HOME fidelity `573cd702`.
Sparse worktree; `node_modules` linked from HOME fidelity. No runtime change.
No Azahar. No preview 3021. No CDP 9320. No recapture. Lower 8/35 glyph-edge
AA is untraced; no raster was invented.

This follows the [Other pages 3/4 recapture](settings-other-p34-recapture-2026-10-04.md).
Those pairs remain **169 / 8** and **169 / 35** over 2/255. The entire upper
169 is `HudMset_00` colon clusters `[339,5,4,4]` / `[339,11,4,4]` (16+16) and
Bat `[377,6,18,8]` (137). Page 3 native `21:45` colon on (even 42s) versus
browser `21 45` colon off; page 4 native `21 46` colon off (odd 07s) versus
browser `21:46` colon on. Battery is Bat 4 versus 5. Injected `lcdDate`
even/odd does not paint those stills.

Evidence: source-identified and tested. Not browser-inspected here. Not
native-compared here. Not 1:1.

## Source identity

EUR 10.7.0-32E System Settings `0004001000022000`, content 0 / `0000003d`,
`exefs/code.bin` SHA-256
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`.
Virtual base `0x100000`. Capstone 5.0.7 via
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/camera-grid-venv/bin/python`.

Delivered `HudMset_00` pane `T_TimeC_00` and `HudMset_00_Bat` frames 4/5 are
unchanged. Clip SHA-256
`e8c70db4c5f366e5251aba8c93e2a32a7622e595e511d000ac063f567de83729`
(`hud_LZ.bin/anim/HudMset_00_Bat.bclan`). Decoded `HudBat_04.bclim` /
`HudBat_05.bclim` PNG SHA-256
`a38db030a56d4f7be610ea8a6b1c567d9d12d6c65df2e7450ee16e9e41f6d179` and
`0eefbdb3e25aabc813e86b6b4e1f7e16ae0b1f28f2b8f34b88edbf7c24e7fc47`.

## Constructor `0x23986c` — no previous-seconds owner

Function entry is vtable slot `0x28c3fc` = `0x239778`. The documented init
join is `0x23986c` (also the failed last-child alloc branch). Bounded ARM:

| Address | Write | Value |
| --- | --- | --- |
| `0x239874` | `strb +c8` | `-1` (signed HUD counter) |
| `0x239878` | `strb +c9` | `0` |
| `0x239880` | `strb +ca` | `-1` |
| `0x239884` | `strb +cc` | `1` (colon uses previous seconds) |
| `0x23988c` | `strb +cd` | `1` |
| `0x239890` | `strb +cb` | `0` |
| `0x239894` | `str +d0` | `-1` |
| `0x239898` | `str +dc` | literal `0x76c` = 1900 at `0x2398f4` |

`+dc` is displayed-date word 0 (year). `0x76c` is a sentinel year so the first
real calendar (`0x238b14`) always treats the date as changed. It is **not**
seconds. Seconds are byte 9 of that 12-byte structure (`+e5`). The constructor
range contains no `strb`/`str` to `+e5`. Tail `0x2398a8 b 0x1633b0` is a
global/once helper and does not write the date. First-update `displayedDateMs=0` remains
the explicit adaptation already recorded in
[the HUD runtime note](settings-hud-runtime-2026-09-26.md). Copying `lcdDate`
into that field would be a guess: source does not store the current calendar
into `+e5` before the first update.

## Update `0x2389b8` — colon versus Bat branches

Called from `0x239654`. Calendar refresh at counter `<=0` (`0x2389d4..0x238a18`)
runs converter `0x1b01a4` into `+e8` (current seconds at `+f1`).

Colon, only when `+cc != 0` (constructor sets 1):

- `0x238af0 ldrb +e5` / `tst #1`
- odd: hide `T_TimeC_00` (`and #0xfe` at `0x238b0c`)
- even, or `+cc == 0`: show (`orr #1` at `0x238c88`)
- **then** `0x238bb0..0x238bbc` copies the current 12-byte date onto `+dc`

Battery at counter `== 2` or `< 0` (`0x238e4c..0x238e5c`); counter 0 skips it.
Charging selector `0x238f10..0x238f20` uses **current** `+f1`: odd → float 4,
even → float 5 (`0x238dc0` / `0x238dbc`). Counter wrap: `<=0` becomes 29
(`0x238f7c..0x238f90`).

Colon therefore lags one date-refresh (~30 updates) behind the cached sample
that Bat reads at counter 2. A single even/odd `lcdDate` cannot drive both.

## Why these stills stay unmatched

`sampleSettingsHud` already implements those branches. Verification
`sampleCalendar` still feeds live `settingsHudElapsedMs` and interpolates
backward from the injected Date. Historical `lcdElapsedMs=12000` is not a
recovered native epoch.

Replaying `sampleSettingsHud(null, 12000, lcdDate)` for the recapture stamps:

| Still | `lcdDate` local | If current seconds painted | Sampler colon / Bat |
| --- | --- | --- | --- |
| Other page 3 | `21:45:42` even | colon on, Bat 5 | colon off, Bat 4 |
| Other page 4 | `21:46:07` odd | colon off, Bat 4 | colon on, Bat 5 |

Page 3 native is mixed (colon on + Bat 4): previous even, cached odd. Using
`lcdDate` seconds for both would paint colon on + Bat 5 and miss native Bat.
Seeding previous seconds from `lcdDate`, inverting colon/Bat, or guessing
`elapsedMs` until the still matches is not source-justified.

Lower 8/35 remain the recapture's sparse glyph-edge clusters. No HUD sampler
change addresses them.

## Tests

Focused `tests/settings-hud-clock.test.mjs`: constructor Date(0) colon does
not follow an odd current second; Bat on counter `-1` does; the 12000 ms
page 3/4 replay does not follow `lcdDate` even/odd. Existing counter-0 /
counter-2 tests keep the previous-seconds versus cached-Bat split.

## Artifacts

Private root
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/settings-hud-prev-seconds-20261004/`.

| File | SHA-256 |
| --- | --- |
| `prev-seconds.asm` | `7752b259a96f3b74b635b729d1aef5c36065d3122832c3dd280be5e54fb23dec` |
| `trace-report.json` | `e584897e97770c2bb73dcbda26f805488f880200e7145854c0667d5850c22e57` |
| `trace_prev_seconds.py` | `8a0ed2323979aa20dac573693e18a778cc3298b9b65be310cc39b7d8bb6624e6` |

## Remaining / doubts

- Allocator zeroing of the HUD object before `0x239778` was not proven, so
  native `+e5` at first update could be 0 or residual. Either way it is not
  `lcdDate` seconds.
- Native HUD counter and previous displayed date at the 26 September stills
  remain unrecovered. Motion and audio remain open.
- Pixel tiers still fail. Whole scenarios still fail. No 1:1 claim.
