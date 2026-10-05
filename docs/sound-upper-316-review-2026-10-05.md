# Independent review — Sound upper 316 volume overhang + `S_Back_U` — 5 October 2026

Grok 4.6 `sound-upper-316-review-20261005` on
`/Users/paramveer/.codex/worktrees/sound-upper-316-review-20261005`
(`codex/sound-upper-316-review-20261005` at `b6620fa4`). Review of leftover
`14533857` / worker `codex/sound-upper-316-20261005`. Worker note
[upper 316](sound-upper-316-2026-10-05.md) and
`tests/sound-upper-316.test.mjs`. Different model from the leftover worker.
Docs and tests only. No Azahar, production `:3000`, preview 3021, or CDP.
Sparse checkout without `model/`. This lane did not recapture and did not
byte-grep `code.bin`.

**Verdict: APPROVE** of `14533857`.

Keep the source-gap. Independent dump decode plus the frozen first-run pair
confirm volume overhang **42** + `S_Back_U` **274** = **316**. Predicted
whole upper **6094**. This is not 1:1. Tests and this note do not close
pixels, input, motion, or audio.

## Assigned leftover

Queue rank 2 ([leftover-queue](feature-map/leftover-queue-2026-10-05.md)):
Sound upper unlabelled 316, labelled `14533857` as volume-icon spill
`[30,216,37,240)` **42** plus room **274**. Worker note:
[upper 316](sound-upper-316-2026-10-05.md). Prior volume box **130**
**APPROVE** `c4f0fb90` / `11f3cb3c`.

## Pair (reused, not recaptured)

Empty mask `dc4b320b…`. Threshold any RGB channel >2/255. Official upper
crop of the native 400×480 PNG is `(0,0,400,240)`. Recapture identities
held at `a5b8aa9e` (receipt commit `5fac611a`): upper **6094**.

| Item | SHA-256 |
| --- | --- |
| Native `Nintendo 3DS Sound_25.09.26_22.27.14.541.png` | `9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69` |
| Browser first-run upper `16565d8e…` | `16565d8e586edce659beadb9e7f7d72bcd8e2b81479a85bca424480d4294ceab` |
| Empty mask | `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95` |

Recounted the hashed pair: whole upper **6094**. Volume `[0,216,30,240]`
**130**. Overhang `[30,216,37,240)` **42**, max 226 at `(30,221)`. Icon
`[7,218,37,238)` **172**. Band `[0,114,400,160)` **269**, max 10. Diagonal
`[103,85,107,89)` **4**, max 3. `(98,81)` channel delta **3**. Union
**274**. Sum **42 + 274 = 316**. Title `[0,3,400,30]` **1774**, Span
`[0,100,400,114)` **2314**, Line01 `(92,220)` still over threshold. The 42
and 274 do not overlap those labelled ROIs, the volume-130 box, clock, or
battery.

Native empty-entry `65fc5f88…` is identical on the 274 (0 channels
differ). Span natives differ by **2297**. Clock-recapture empty upper
`8d76f568…` and later empty `ebe8959e…` both keep **42** and **274**;
those two browsers differ by **190** pixels elsewhere.

A one-pixel shift of the browser band is worse: unshifted **269**; ±1 x
is 1791 / 1793; ±1 y is 5513 / 5469.

Queue row 19 packs **274** into `[0,114,400,160)`. That box is **269**.
The worker note's union (269 + 4 + `(98,81)`) is the 274. Not a reject.

## Dump identity

EUR Sound `0004001000022500` v3088, content index 0 / `0000000b`.
`exefs/code.bin` SHA-256
`3c57f2c4091c1bec6b3834609f1e2a6488712e21775d7548b441c69c60b3e5a9`,
image base `0x100000`. `romfs/res/S.pack` SHA-256
`05550cfa807aa19cd27347e1b309a60aed7f20cf208be13ea2bab1bc942f161d`.
LZ11/DARC/stock-table unpacked with
`scripts/unpack_home_resources.py` and `scripts/firmware/archives.py`.
Layouts and clips decoded with `scripts/firmware/native.py`. Textures
decoded with `scripts/firmware/texture.py` `decode_bclim` /
`decode_texture`. Converter **ctr-native-web 1.2.0**, room converter
**ctr-cgfx-web 1.4.0**, extractor CTRTool **1.3.0**. ARM `add r0, pc, #imm`
at `0x191f10` (`0xe28f0098`) and `0x191f64` (`0xe28f0044`) both resolve
to `res/S--S_Back_U.bcmdl`.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| HUD pack | `packs/sound/contents/0000-0000000b/lyt-C-Hud.json` | `lyt/C.LZ` / `Hud` | pack `bb4bfdd539b1ae9cb11b34718c33eda010192d9af0cdce72c2e9e4d9902500d3` |
| `C_HudSndB` | same pack | `lyt/C.LZ/Hud/blyt/C_HudSndB.bclyt` | `37180cd45d2f60fc7b1580a2680c83ccd0d6f4a8fe072205fb3524994cf2b25c` |
| `C_HudSndB_Pattern` | same pack | `lyt/C.LZ/Hud/anim/C_HudSndB_Pattern.bclan` | `9f7057bf5d384ae5598949a625978f69bb84d9415158065ebb2dfa6cdc0856dd` |
| `HudSnd_B_00`…`04` | same pack | `lyt/C.LZ/Hud/timg/` | BCLIM `88a71155…` / `0911e0b3…` / `66b66633…` / `7bbba00d…` / `8e8ba220…`; each LA4 30×20 |
| Info pack | `lyt-S_Inf_U-arc-LZ.json` | `lyt/S_Inf_U.arc.LZ` | pack `ff48060bf81844c2992394038aa386a064a55a0a7fe5b6e7e533a77e4919c9` |
| `UnderBar.bclim` | same pack | `timg/UnderBar.bclim` | BCLIM `1c80567ccbd7d067ba48f8ed1597ac65099a96f2c3494d0477dfa8fc1da9ca00`; decoded ETC1A4 8×32 PNG `38e2651a…`; **144** texels `(62,46,29,255)` |
| `S_Back_U` | `models/sound-room/model.json` | `romfs/res/S.pack` `S_Back_U.bcmdl.LZ` offset 896 size 26427 | compressed `8c7d41fee74034b22bbd39b3a35d24906057f996c9201de51596feb218f504f5`; decompressed CGFX `134099e5050c465200be110ed53258c2d81c6bfc43456496bb60b53d69fd27bd` |
| `S_BG_U_Tx_A` | same model | CGFX TXOB, ETC1A4 128×128, 5 mips, 21824 bytes at `0x3a80` | published PNG `f75709862c0153b16e158a9a72f5df2f55ee78e3fe3c0aca883ae77d52835632`; dump decode equals that PNG RGB; mip1 encoded `c7b72ff0…` |
| `S_BG_U_Tx_BC` | same model | CGFX TXOB, ETC1 256×128, 4 mips, 21760 bytes at `0x9000` | published PNG `5dac73facf3c83df29f50326ed3a50082e8134a69175f173793007de1ebd65c7`; dump decode equals that PNG RGB; mip1 encoded `0b8b75bc…` |

Dump BCLIM bytes equal the published `resourceSources` hashes. CGFX
dictionaries: one model `S_Back_U`, two textures, one camera `camera1`,
empty skeletal / material / visibility / camera clip lists. `S_BG-Record_U_Default`
translation Y key 0 is **−332**, so `BG_Record_01` starts at LCD y=188,
below the 274.

## Volume icon (42)

Dump `-H-SndB` is `pic1`, flags 1, alpha 255, origin 4 (centre), size
30×20, translation `[15,0,0]`. Mounted at `[7,228]` that is LCD
`[7,218,37,238)`. Material flags 21, empty TEV, mag filter 1 (linear),
white vertex colours. `C_HudSndB_Pattern` is `texture.pattern` step keys
0..4 selecting `HudSnd_B_00`…`04`.

`DefUndBar` is 400×32 at `[0,−104]`. Source-over of each dump-decoded
pattern frame on the tiled underbar, threshold 2, across 600 icon pixels:

| Frame | Texture | Native | Browser |
| ---: | --- | ---: | ---: |
| 0 | `HudSnd_B_00` | 428 | **600** |
| 1 | `HudSnd_B_01` | 476 | 552 |
| 2 | `HudSnd_B_02` | 510 | 518 |
| 3 | `HudSnd_B_03` | 526 | 502 |
| 4 | `HudSnd_B_04` | **600** | 428 |

Frame 0 is the browser icon, including the 42 pixels past x=30. Frame 4
is the native icon. Of those 42, native is `(62,46,29)` on **38** (decoded
underbar through frames 1..4 alpha 0) and `(204,204,204)` on **4** (frame
4 body). Binding frame 4 because this still matches it would hide the
unsupplied `hid:USER` `GetSoundVolume` byte. Painter stays
`{name:'C_HudSndB_Pattern',frame:0}`. Same live-slider gap as the
approved **130**. Widened icon **172**.

## Room (274)

CPU authored-mip specimen (`scripts/verify-sound-room-source.mjs
--sampling native`, 40 triangles, levels 0/1/2) on the first-run native,
restricted to the 274:

| Comparison on the 274 | Pixels within 2 |
| --- | ---: |
| CPU vs native | **47** |
| CPU vs browser | **230** |
| Both CPU and browser miss native | **227** |

Decoded dump `S_BG_U_Tx_A` / `S_BG_U_Tx_BC` are what both rasters sample.
The 227 shared misses are the published mip specimen's edge tail (greens
at y 122–126, greys at y 138–152), max channel delta 10. No dump LOD bias
selects the 47 GPU-versus-specimen pixels without moving pixels that
already agree. The room sampler, camera and colour fit stay as published.

## Runtime

`drawNativeSoundFrame` is unchanged. `C_HudSndB_Pattern` stays frame 0.
`S_Back_U` stays the authored-mip room. Predicted counts on these stills:
volume overhang **42**, icon **172**, room union **274**, whole upper
**6094**. Empty-entry later upper **6222** keeps the same 42/274.

## Evidence

| Tier | Result |
| --- | --- |
| Source-identified | Dump `C.LZ/Hud` LA4 icon + ETC1A4 underbar; dump `S.pack` `S_Back_U` CGFX TXOBs; ARM `res/S--S_Back_U.bcmdl`; empty clip lists |
| Delivered | Existing published HUD pack `bb4bfdd5…` and `models/sound-room/` `134099e5…` |
| Implemented | Painter unchanged. Frame 0 kept. Room mip path kept |
| Tested | `node --test tests/sound-upper-316.test.mjs` |
| Browser-inspected | Not run |
| Native-compared | Reused frozen pair only. Not recaptured. Not 1:1 |

## Checks

`node --test tests/sound-upper-316.test.mjs tests/sound-volume-130.test.mjs
tests/sound-room.test.mjs` **12/12**. `npm run typecheck` passes. `npm test`
2135 pass / 36 fail / 23 skip / 1 todo (2195); the 36 fails are sparse
`model/` / GLB ENOENT. `git diff --check` clean. This lane did not drive
Azahar or preview 3021 and did not recapture.

## Remaining

Predicted first-run upper **6094**: icon **172** (130+42), room **274**,
title **1774**, Span **2314**, birds **1558**, battery **1**, Line01 **1**.
Whole `sound-first-run` stays fail. Static still only. Not 1:1.
