# Native HOME format evidence

Confirmed by static analysis of the owner's decrypted EUR HOME Menu, title
`0004003000009802`, version 24576, from firmware `10.7.0-32E`.
CIA SHA-256: `2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`.
Uncompressed ExeFS code SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Addresses below use code base `0x100000`. Firmware code is reference data only;
neither the compiler nor this investigation executes it. No executable bytes or
disassembly are included in public delivery or this repository.

## RI_mstl and TSY1

The loader at `0x105c50` loads each message bank's `RI_mstl_LZ.bin`; decoded
style-table pointers go into the array at `0x34797c`. The getter at `0x1338f0`
looks up a message's TSY1 index, returns null for -1, or returns
`table + 4 + index * 44`. Both English files have exactly that shape:
679 records for HOME messages, seven for HUD, preceded by their uint32 count.

Text application at `0x11e5b0` changes the following fields only when the getter
returns a record. The TextBox constructor at `0x1a42c8` independently connects
the object destinations to the CLYT text-resource fields.

| Record offset | Exported field | Native evidence |
| --- | --- | --- |
| `0x18` | `fontScale[1]` (Y) | `0x11e638..650`: this float multiplies the font metric used for TextBox `+0xe8` (height). |
| `0x1c` | `fontScale[0]` (X) | Same sequence: this float multiplies the font metric used for TextBox `+0xe4` (width). |
| `0x20` | `lineSpacing` | `0x11e69c..6c4` writes TextBox `+0xec`; constructor `0x1a43b0..3b4` copies CLYT `+0x70` there. |
| `0x24` | `characterSpacing` | `0x11e6c8..6f0` writes TextBox `+0xf0`; constructor `0x1a43a8..3ac` copies CLYT `+0x6c` there. |

The constructor at `0x1a4380..384` copies CLYT font width/height (`+0x64/+0x68`)
to TextBox `+0xe4/+0xe8`. Thus the scale words on disk are Y, X, even though
the exported vector is X, Y. All current HOME records use equal X/Y scales;
the synthetic regression uses unequal values to guard this ordering.

Words at offsets `0x00`, `0x04`, `0x08`, `0x0c`, `0x10`, `0x14`, `0x28` remain
explicitly unresolved. Some values resemble the fields in the documented
[MSBP SYL3 format](https://nintendo-formats.com/libs/lms/msbp.html), but that is
a different, shorter record. Similar values are insufficient to assign names.
In particular, do not infer a text color or alignment from these words.

## CLTS matrix indices

Material animation function `0x1a1608` dispatches `CLTS` to `0x1a172c`.
At `0x1a1748..1764`, it reads the track's index byte and the allocated matrix
count from Material `+0x2c`, bits 2..3. If `index >= count`, the unsigned branch
skips that track. Otherwise `0x1a1784..1798` writes the evaluated float to
`matrixBase + index*20 + component*4`. There is no alias to matrix zero.

Material constructor `0x208eb4` reads the CLYT flags at resource `+0x30`.
`0x208fa4..fac` extracts the matrix count from the same bits, and `0x209068..078`
passes it to the allocation function `0x1a4630`, which stores capacity in
Material `+0x2c`. The only direct call to that allocation function in this
executable is the constructor. This supports native skipping for the delivered
base layouts; it does not claim to model arbitrary application material changes.

Across the converted HOME layouts, 351 CLTS tracks target unallocated slots:
336 have identity values and zero slopes, 15 contain nonidentity values. The
latter include cursor loops. Both classes are skipped by the native bound check.
Keep their original keys and indices for provenance and diagnostics.

## CLMC color registers

The same material animator dispatches `CLMC` to `0x1a16a4`. It uses the component
byte, evaluates the float, rounds with +0.5 and clamps to 0..255, then calls
`0x209c90`. That setter bounds components below 28, selects register by
`component >> 2` and channel by `component & 3`, writing Material `+0x10` onward.
Constructor `0x208f34..88` copies seven consecutive colors from CLYT material
`+0x14` onward to those same destinations: buffer color, then six constants.
This directly confirms the converter's existing register numbering.

These findings establish field routing and skip behavior, not shader or visual
equivalence. Rendering still needs the orchestrator's matched Azahar/browser
checks, especially color evaluation, text controls and alignment.

## TEV stage constant composition

Native TEV setup `0x1a2f78` selects a **single RGBA constant per stage**.
At `0x1a3034` it gets the stage array, then addresses each 12-byte record.
`0x1a3044..305c` reads the selector word at stage `+8`: the low nibble
selects a color's RGB, and the high nibble selects a color's alpha. Both
indices address the seven Material colors beginning at `+0x10`, established
above (buffer = 0, constants 0..5 = indices 1..6).

`0x1a3188` clears the alpha of the low-selected color; `0x1a319c..31a4`
extracts the high-selected alpha and combines it with that RGB. The resulting
packed RGBA is written to the PICA stage constant at `0x1a3308`. Thus **every
constant operand uses the composed color**, including an RGB operation that
reads constant alpha or an alpha operation that reads a constant RGB channel.
Using the low-selected color wholesale for RGB and the high-selected color
wholesale for alpha operations is wrong; swapping the nibble meanings is also
wrong. `LncArw_00.bclyt` supplies a useful regression: both arrow materials'
last stages have selector word `0x00000051` (buffer offsets `0x14c` and `0x1f0`).

This independently explains the arrow and toolbar-shadow mismatch. The
presentation worker reports an arrow pixel of `(161,193,188)` versus native
`(161,193,187)`, and shadow pixel `(206,208,217)` matching native after the
composed-constant correction. Those are limited matched-pixel checks, not
proof that all materials or runtime theme colors match.

## Ordinary icon template and density animation

Scene initialization `0x2b1ddc..1df4` loads `LncIconSetSrc_00.bclyt` and
`LncIconSetSrc_00_Scale.bclan` into the object at scene `+0x134`. It separately
loads `LncIconCard_00` at scene `+0x1f8` (`0x2b1e04..1e1c`). These are distinct
resources; the card shape is not evidence for every ordinary application tile.
The SetSrc helper flag is 1. Loader `0x1bbc74` passes the corresponding
64-by-128 render-target arguments to `0x208230`, loads the Scale animation
into object `+0xc0`, and sets its initial frame to 0. Frame 0 is initialization,
not a fixed frame for every density.

Steady update `0x1d61d4` reads density index at scene `+0x118c`, indexes the
float table at `0x308868` (`[0,1,2,3,4,5]`), and passes that frame to SetSrc
at `0x1d6324..6338`. Helper `0x1d9fa4` forwards the float to the animation's
SetFrame virtual method. During transitions `0x1d7c48..60` interpolates start
and end frame values into scene `+0x1194`; `0x1d30dc..e4` forwards this fractional
frame to the same helper. Preserve interpolation rather than rounding early.

Rendering goes through `0x2453b8`, which uses the object's layout at `+0x98`
and offscreen target at `+0xa0`. At `0x2b2244`, `0x1d9c68` copies SetSrc's
texture descriptor at object `+0x90` into another material's texture map and
marks it dirty. Together these support using its rendered template/atlas for
ordinary tiles. They do not justify drawing every template pane directly at
every application position.

The native trace establishes density-index-to-animation-frame routing. The
presentation worker's independent native capture establishes two displayed
rows use frame 1 and a 72-pixel ordinary backplate. A complete native proof of
the density-index-to-row-count mapping was outside this bounded trace. Runtime
basic-theme recoloring, including the observed footer/background tint, remains
unresolved; do not infer material writes from a similar screenshot color.

Private excerpts are in the artifact directory `assets/material-research`.
