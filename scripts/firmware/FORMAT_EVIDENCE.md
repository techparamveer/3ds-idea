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
