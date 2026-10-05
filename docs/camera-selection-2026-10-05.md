# Camera date-folder browse selection — 5 October 2026

HOME-fidelity Camera worker on `codex/camera-selection-20261005` from fidelity
`b75f275d`. One leftover: the lower-LCD gallery cursor after a date folder
opens. No Azahar. No production browser. No preview 3021. No CDP. No
recapture. Capture stays inert. The painter and the folder-open reducer are
unchanged. This is not a 1:1 claim. This note does not close pixels, input,
motion, or audio.

`PicL_Op` / `ThmbBase` / `cameraDateGroupOrange`, date-cell `TxtThmb`, the
browse-slider chrome, and the upper HNI crop were not retuned.

## Assigned still

Frozen native combined PNG
`reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png`
SHA-256 `cae793c31bdf9f13d44f0834582bf99fead5bb8d652321913993bedde7ae1652`.
Mac-screen browser lower after the PicL_Op recapture at `1da03426`:

| Item | SHA-256 |
| --- | --- |
| Browser lower | `0265b51095b1051f94424eea9cf2b2c31ad23da3ed6a1137d4cc9a9a31d05616` |

Empty mask `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Threshold any RGB channel >2/255. Whole lower **10482**. Date pane leftover
**1006** and slider strip **1992** are out of scope. Upper **33522** is the
already-bound stereo window.

The HNI fixture (`?cameraFixture=hni`) has two photos, `HNI_0001` and
`HNI_0002`, with identical decoded RGB. Gallery rows are the date group,
then those photos. Opening the dated folder sets `selection` to **1**
(`src/os/stock-apps.ts`), so the row is `HNI_0001`. The painter draws
`P_BrwsCursor_D` on `view.selection`. The recapture announcement is
`Nintendo 3DS Camera. HNI_0001`. The native lower cursor sits on the
right-hand thumb.

Large-grid centres for that row order are `(84,74)`, `(160,74)`, and
`(236,74)`. Index 1 is the middle cell. The right-hand thumb is index 2
only if native uses this same row order. That visual reading is not an
index the dump names.

## Source identity

EUR Camera `0004001000022400` v4097, content index 0 / `0000001a`, image
base `0x100000`. Private executable
`contents/0000-0000001a/exefs/code.bin`, SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.
Converter **ctr-native-web 1.2.0**.

| Element | Manifest / site | Dump path | SHA-256 |
| --- | --- | --- | --- |
| `code.bin` | title `0004001000022400` v4097 | `contents/0000-0000001a/exefs/code.bin` | `3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c` |
| Cursor layout | `packs/camera/.../lyt-P_Brws_D-arc-LZ.json` | `lyt/P_Brws_D.arc.LZ/blyt/P_BrwsCursor_D.bclyt` | existing published pack |

Selection lives at browse object `+0x2232`. `0x1fccf4` and `0x1fcf18` both
store that halfword. Item count is `+0x36`. `0x1fccf4` also writes the
five-word record at global `+0x3ae8`. Its type byte is **0** for a blank or
out-of-range index (`0x1fce78`), **1** for a folder (`0x1fcd64`), and **2**
for a photo (`0x1fcd9c`).

## Writers that can settle the cursor

The browse state byte at object `+4` picks the writer. `0x2d4bcc` is the
update. State **9** (`0x2d4d30`) calls `0x2d384c`, which calls `0x1fbf30`
with r1 = 0 (`0x2d38d4`). State **5** calls `0x2cf8a8` (`0x2d4f68`). State
**7** calls `0x2d0988` (`0x2d4ecc`). A later list rebuild at `0x2dddbc` can
store yet another index. `code.bin` does not say which of these is the
settled frame of this date folder.

### `0x1fbf30` — saved item, or the last index

```
ldrh r5, [r0, #0x36]     ; count
cmp  r5, #0
subgt r5, r5, #1         ; 0x1fbf50: default candidate is count−1
; copy global+0x3ae8
ldrb r0, [sp, #4]        ; saved type
cmp  r0, #0
beq  fallback            ; 0x1fbf70 → 0x1fbfec
```

Type **0** keeps `count−1`. Type **1** binary-searches by the saved word
(`0x2ce3b8`). Any other type searches with `0x210df4` / `0x2ce4cc`. A
negative search leaves the candidate at `count−1`. A hit replaces it with
that record's first halfword before the same store. The halfword `0xFF7F`
with the folder bit clear follows `+0xa` to a second record. r1 = 0 still
stores, through `0x1fcf18` (`0x1fc034`). r1 = 1 stores through `0x1fccf4`.
The r1 = 1 call at `0x2d0798` runs only when the pre-rebuild count was 0.

For three rows, `count−1` is 2. A restored folder or photo is that item's
own index, which can be 0 or 1. The saved record for this capture is not
in `code.bin`.

### `0x2cf8a8` and `0x2d0988` — keep an in-range index

Both load count from `+0x36` and the current selection through the literal
`0x2232` (`0x2d07b0` and `0x2d0ff4`). `cmp` / `bhi` (`0x2cf8cc`, `0x2d09ac`)
skips the reset when count is greater than the selection. Only an
out-of-range selection, and only when count is non-zero, is rewritten to
`count−1` (`0x2cf8dc`, `0x2d09bc`) and committed with `0x1fccf4`. An empty
list calls `0x1fcf18` with r1 = 0. The following `0x1fc470` walk adjusts a
stack halfword for the list rebuild. It is not a second unconditional
cursor store.

An incoming index of 1 with three items stays 1.

### `0x2dddbc` — value, or value minus one

After the list count is stored, `cmp r1, #0` on the word at `sp+0xc` selects
the arm: non-zero stores that word minus one (`subne`), zero stores the word
itself (`ldreq`). Both arms call `0x1fccf4`. The word is an index computed
while the list is built. It is not the constant 2.

## Decision

**Source gap.** The dump does not unique-own an index other than the
browser's 1 for this date folder. `count−1` is the default of one writer
and the out-of-range clamp of two others. A saved folder or photo, an
already in-range index, and the `0x2dddbc` list word are all live stores
of a different index. Choosing 2 because the native thumb is on the right
would be a capture fit.

The painter still draws `P_BrwsCursor_D` on `view.selection`. The dated
folder open still sets `selection` to 1. No cursor offset, no row reorder,
and no fitted index.

## Evidence

| Tier | Result |
| --- | --- |
| Source-identified | Three settle writers above. No single index for this folder |
| Delivered | Existing `code.bin` and browse pack. No new asset |
| Implemented | Painter and reducer unchanged |
| Tested | `node --test tests/camera-selection.test.mjs` |
| Browser-inspected | Not run. Preview 3021 and CDP were out of scope |
| Native-compared | Reused frozen pair only. Not recaptured. Not 1:1 |

## Independent review

Grok 4.6 `camera-selection-review-20261005-r1`: **APPROVE**. Cherry-pick
`9c431d1d` matches worker `075fbac7`. Painter unchanged. Dump does not
unique-own index 2. Three settle writers can store 1, `count−1`, a saved
item, or a list-build word. Fitting the right-hand thumb would be a
capture fit. Frozen whole lower **10482** on the assigned PicL_Op pair.
Not 1:1.

## Remaining

Whole lower stays **10482** on the assigned pair (later Settings recapture
is **10158** and does not reopen this gap). The cursor disagreement stays
with this lock. Date-cell `TxtThmb` **1006**, slider strip **1992**, and
upper HNI **33522** stay outside this slice. Input, motion, and audio were
not compared. Whole `camera-readonly-view-photos-page1` stays fail.
