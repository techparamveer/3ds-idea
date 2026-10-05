# Camera Welcome page-3 `TxtDlg` 1,079 source-gap — 5 October 2026

HOME-fidelity Camera worker on `codex/camera-welcome-p3-txtdlg-20261005`
from fidelity `2258268a`. One leftover: Welcome page-3 guide interior
`TxtDlg` **1079** after Slideshow and Settings `TxtSet` source-size
closed those browse labels. No Azahar. No production browser. No preview
3021. No CDP. No recapture. Capture stays inert. Page-1 perimeter
**1401**, page-5 live-feed **7615**, browse Settings **0**, Slideshow
header **0**, date **1006**, slider **1992**, thumb interiors
**846/918**, photo crop, selection, and Sound stay untouched.

This is not a 1:1 claim. The painter is unchanged. Tests, this note, and
the reused still do not close pixels, input, motion, or audio.

## Assigned defect

Frozen pair from
[pages 3/4 body](camera-welcome-p34-body-2026-10-04.md). Empty mask
`dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Threshold any RGB channel >2/255. Recapture `eb501e00` left these
counts unchanged.

| Item | SHA-256 |
| --- | --- |
| Page-3 native | `3ad989b5c214caa6be956643b2aa0785df2cc9612ffcc63a32ed5c70270f7c8a` |
| Page-3 browser lower | `57476c312f731b8f52884b8c1d777c590a13f23588f32923664713081b715339` |
| Page-3 report | `1e8cf7907e4a9cc6447b10621bb4eb57d974333b46c928ca8b75d4049eed51be` |

Whole lower **2480**. Interior `[20,20,300,220]` **1079**. Perimeter
**1401**. Interior maximum is 14 at `(246,113)`: native `(202,200,198)`,
browser `(214,213,212)`. The labelled page-4 interior **692** is the
same pane and is not reopened.

## Dump identity

EUR Camera `0004001000022400` v4097, content index 0 / `0000001a`. Image
base `0x100000`. Private executable
`/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/reader-extracted/camera/contents/0000-0000001a/exefs/code.bin`,
SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| `exefs/code.bin` | title `0004001000022400` v4097 | `contents/0000-0000001a/exefs/code.bin` | `3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c` |
| `C_DlgGuid2Btn` | `lyt-C-Dlg.json` | `lyt/C.LZ/Dlg/blyt/C_DlgGuid2Btn.bclyt` | `1a93160f30cd0906334d8edff697e52dfe4cf5b9cf55ec048093075d4e57505c` |
| `P_tips` | `msg-EU_English.json` | `msg/EU_English.LZ/P_tips.msbt` | `0fd449e7831698969cd8d0f20a351990c6ddbe89f59df16bbe96ccf9b55bb1e0` |
| `RI.mstl` | same message pack | `msg/EU_English.LZ/RI.mstl` | `f2505d2077a5c90de9ba222d1e12d82d23168f44216f3e21dfdc1e005570ef1a` |

`C_DlgGuid2Btn/TxtDlg` is origin 4, size **280×152** (both integers),
translation `[0,25]`, alignment **4**, line alignment **2**, character
spacing 0, line spacing 0, font size `[20,24]`, font `cbf_std.bcfnt`.
`D_003_0` through `D_003_4` are all style **83**. Style word 0 is **280**.
Font scale is `[0.8399999737739563, 0.8399999737739563]`. Spacing is 0.
`nativeMessageOverride` already installs that style on every Welcome page.

## Why TxtSet does not open a second writer

`code.bin` `0x1cdb2c` (`ldrb r1, [r4, #0xff]`) loads line alignment.
Value 2 takes `mov r0, #1` at `0x1cdb78`. Alignment 4 is horizontal
centre (`orreq r0, r0, #0x10` at `0x1cdba0`) and vertical middle
(`orreq r0, r0, #0x100` at `0x1cdbc0`). The store at `0x1cdbd0` writes
flags **0x111** to writer `+0x5c`. The setter does not test a pane name
or a newline.

The only `bl` to centering writer `0x329160` is `0x329554` (word
`ebffff01`), inside the line walker `0x3294f0`. `0x329170` loads mask
**0x333** from `0x329328`. Horizontal centre is `and #0x30` / `cmp #0x10`
at `0x3291f8` / `0x3291fc`, then `ceil` of the block half
(`vldr s18` of float **0.5** at `0x32932c`, `bl 0x23b804`). Low bits
`and #3` / `cmp #1` at `0x329268` / `0x32926c` call `0x329330` and add
`ceil(block/2) − ceil(line/2)`. That add is 0 for one line. After the
block centre has already subtracted `ceil(block/2)`, a multiline line
lands at `pane − ceil(line/2)`.

That is the same function Settings `TxtSet` and Slideshow `TxtSShow`
already use. Their source-size caller matters because the stored widths
are **76.8** and **134.4**. `TxtDlg` is already an integer **280×152**,
so `ceil` of the pane does not move the box. The host generic multiline
path already centres each alignment-4 / line-alignment-2 line with
`width/2 − ceil(line/2)` and `nativeCenteredBlockY`.

Welcome `drawLayout` for `C_DlgGuid1BtnW` / `C_DlgGuid2Btn` already
passes `textSampling:'lcd-source-size'` on the whole layout. The direct
sampler still requires no newline before
`sourceSize && alignment === 4 && lineAlignment === 2`. The host
`writer-0x111` multiline gate requires line alignment **0**, so it is a
different flag word from this pane. There is no second placement
function for a newline. A character-walker return of 3 at `0x329714`
reads the same `+0x5c` low bits and stays in this walk.

## Same pane already matches other multiline pages

| Page | Message | Newlines | Colour spans | Labelled interior |
| ---: | --- | ---: | --- | ---: |
| 1 | `D_003_0` | 1 | no | **0** |
| 3 | `D_003_2` | 3 | group 0 / type 3 | **1079** |
| 4 | `D_003_3` | 2 | group 0 / type 3 | **692** |
| 5 | `D_003_4` | 4 | no | **0** |

Pages 1 and 5 are the same `TxtDlg`, the same flags **0x111**, and the
same style 83, and they are also multiline, so they also miss the
single-line source-size sampler. Their interiors are already **0**. A
new multiline sampler on this pane would move those matching pages.
`D_003_2` / `D_003_3` colour spans are already installed by
`nativeMessageColorSpans`. The interior sample is grey coverage, not a
missing red run. Binding `_flw`, Push, or Disable stays rejected by the
page-3/4 body note.

## Labelled gap

Page-3 interior **1079** stays a **source-gap** on the already-bound
`TxtDlg`. The painter is unchanged. Perimeter **1401** stays the
labelled page-1 chrome.

## Evidence

| Tier | Result |
| --- | --- |
| Source-identified | Flags `0x111` at `0x1cdb2c`; only `bl` to `0x329160` is `0x329554`; integer 280×152 pane |
| Delivered | Existing dialog, `P_tips`, and style packs |
| Implemented | Painter unchanged |
| Tested | `node --test tests/camera-welcome-p3-txtdlg.test.mjs` |
| Browser-inspected | Not run. Preview 3021 and CDP were out of scope |
| Native-compared | Not run. Frozen pair reused. Not 1:1 |

## Checks

`tests/camera-welcome-p3-txtdlg.test.mjs` locks the frozen hashes, the
**1079** interior, the single `bl` to `0x329160`, the integer pane, the
newline gate, and the unchanged Welcome draw. `git diff --check` is
clean. Application typecheck and build were not rerun. This lane did
not drive Azahar or the production browser.
