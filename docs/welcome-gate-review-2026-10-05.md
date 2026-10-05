# Independent review — Welcome writer-0x111 host gate — 5 October 2026

Grok 4.7 on `/Users/paramveer/.codex/worktrees/welcome-gate-review-20261005`
(`codex/welcome-gate-review-20261005`), base `6ee4f4f8`. Docs only. No
Azahar, production `:3000`, preview 3021, or CDP. Painter unchanged by
this review.

**Verdict: APPROVE-WITH-NITS** of `1863c4e4` and the host-gate section of
[Welcome page-3 TxtDlg](camera-welcome-p3-txtdlg-2026-10-05.md).

Camera setter `0x1cdb2c` stores writer flags **0x111** for alignment 4
with every line-alignment byte except 1 and 3. Both Welcome `TxtDlg`
panes are alignment 4 / line alignment 2, so the shared opt-in matches
the flag word the centring writer actually reads. Recounted page-3
interior **1078**. This is not 1:1. Input, motion, and audio were not
compared.

## Assigned leftover

Queue §3 ([leftover queue](feature-map/leftover-queue-2026-10-05.md)):
`1863c4e4`, Welcome `TxtDlg` `writer-0x111` for alignment 4 + line
alignment 2. Worker note:
[page-3 TxtDlg](camera-welcome-p3-txtdlg-2026-10-05.md).

## Dump identity

EUR Camera `0004001000022400` v4097, content 0 / `0000001a`. Image base
`0x100000`. `exefs/code.bin` SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.
Decoded with capstone (ARM), not a byte search. `lyt/C.LZ` and
`msg/EU_English.LZ` were LZ11-decompressed and read as the stock 64-byte
table; `Dlg` is DARC. Layouts and messages were decoded with
`scripts/firmware/native.py`.

| Element | Dump source | SHA-256 |
| --- | --- | --- |
| `C_DlgGuid2Btn.bclyt` | `lyt/C.LZ` → `Dlg` → `blyt/C_DlgGuid2Btn.bclyt` | `1a93160f30cd0906334d8edff697e52dfe4cf5b9cf55ec048093075d4e57505c` |
| `C_DlgGuid1BtnW.bclyt` | `Dlg` → `blyt/C_DlgGuid1BtnW.bclyt` | `aaa3aeceda6930838285e3c03f032170d9d8e23690cabca843f26405c8116773` |
| `P_tips.msbt` | `msg/EU_English.LZ` → `P_tips.msbt` | `0fd449e7831698969cd8d0f20a351990c6ddbe89f59df16bbe96ccf9b55bb1e0` |
| `RI.mstl` | `msg/EU_English.LZ` → `RI.mstl` | `f2505d2077a5c90de9ba222d1e12d82d23168f44216f3e21dfdc1e005570ef1a` |

Both `TxtDlg` panes: origin 4, size **280×152**, translation unused by
the flag setter, alignment **4**, line alignment **2**, character spacing
0, line spacing 0, font size `[20, 24]`. `D_003_0` through `D_003_4` are
style **83**. Style word 0 is **280**. Font scale is
`[0.8399999737739563, 0.8399999737739563]`. Spacing is 0.

## Flag word

`0x1cdb2c` is `ldrb r1, [r4, #0xff]` (line alignment). `0x1cdb30` sets
`r0` to 0. Line alignment 1 branches at `0x1cdb38` to `0x1cdb84` and
leaves the low bits 0. Line alignment 2 branches at `0x1cdb40` to
`mov r0, #1` at `0x1cdb78`. Line alignment 3 branches at `0x1cdb48` to
`mov r0, #2` at `0x1cdb80`. Every other byte reloads alignment from
`[r4, #0xfe]` and reduces it with `umull` by the pool word `0xaaaaaaab`
at `0x1cdc48` (`ldr r2, [pc, #0x120]` from `0x1cdb20`). Remainder 1 stores
low bit 1; remainder 2 stores 2. Alignment is reduced the same way for
the `0x10` / `0x20` bits (`0x1cdba0` / `0x1cdbac`). `(alignment * 0xab) >> 9`
(`mov r2, #0xab` at `0x1cdbb0`) stores `0x100` or `0x200`. The store is
`str r0, [r5, #0x5c]` at `0x1cdbd0`.

`nativeTextWriterFlags` matches that sequence for all 256×256 byte pairs.
Alignment **4** is the only alignment that stores **0x111**. It does so
for 254 line-alignment bytes. The two exceptions are line alignment 1
(**0x110**) and 3 (**0x112**). Welcome line alignment 2 stores **0x111**,
the same word as line alignment 0.

The only capstone `bl #0x329160` in `code.bin` is `0x329554`. That writer
loads `[r4, #0x5c]`, masks with pool `0x333` at `0x329328`, and centres
on `and #0x30` / `cmp #0x10` and `and #0x300` / `cmp #0x100`. Low bits
`and #3` / `cmp #1` call `0x329330` and add `ceil(block/2) − ceil(line/2)`
through `bl 0x23b804`. The half is float **0.5** at `0x32932c`. The
function does not load the pane's line-alignment byte. The line walker
re-reads the same flag word at `0x329714`.

The host gate accepts `writer-0x111` when alignment is 4 and
`nativeTextWriterFlags` is `0x111`, with a newline, zero spacing, and no
spans for the direct sampler. Buttons stay off the opt-in.
`Slp_U_00` / `T_Btm_00` remains alignment 4 / line alignment 0, which
still stores `0x111`, so the widened predicate still includes the power
footer.

## Colour spans

`D_003_2` (page 3, three newlines) and `D_003_3` (page 4, two newlines)
carry group 0 / type 3 arguments `ff3200ff` then `454039ff`. `D_003_0`,
`D_003_1`, and `D_003_4` have no such token. The renderer still requires
an empty colour-span list before the direct LCD sampler, so pages 3 and 4
keep the traced placement on the canvas draw and stay off that sampler.
Pages 1 and 5 have no spans, so they take it.

## Pair recount

`camera-welcome-gate-recapture-20261005/` is not under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/`.
The reports' PNGs live at
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/camera-welcome-gate-recapture-20261005/`.
Natives are on the DeveloperStorage volume. Empty mask
`dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
Threshold any RGB channel >2/255. Combined natives are 400×480: upper
`(0,0)`, lower `(40,240)`. Interior is half-open `[20,20,300,220)`.

| Page | Whole | Interior | Perimeter / other | Native SHA-256 |
| --- | ---: | ---: | --- | --- |
| 1 lower | **1401** | **0** (max 1) | perimeter **1401**; upper **0** max 2 | `52a6dcf75c85d9be6cdc9e245f5767acfcf4373400a06c584f5dbd3a915bdf6b` |
| 3 lower | **2479** | **1078** (max 14 at `(246,113)`) | perimeter **1401**; upper **7615** | `3ad989b5c214caa6be956643b2aa0785df2cc9612ffcc63a32ed5c70270f7c8a` |
| 4 lower | **2093** | **692** (max 14 at `(181,126)`) | perimeter **1401**; upper **7615** | `38c19ca07e7569cb92daf31ce1743f19fab82b3f402fc4304af4f58e49057087` |
| 5 lower | **1401** | **0** (max 1) | perimeter **1401**; upper **7615** | `616fbeaebdf290656868fd2449cba3f61362bf7be50eb08bf3db08d206cbb18f` |
| Other Settings page 1 | **0 / 0** | — | max **2** on both LCDs | `424ffb45d0fe4e82fd002d564a6ffe7f8af08dac5c984e444d5af09b56382c40` |

Page-3 browser lower
`767069b81bd5734ad036bfe4431e5bb96950fc04d126dd380fe4192b8d221445`,
report `039e98875e424d8173a9c40e2e832a1fd4409ac3edf31dd96ecfe20be2c74d76`.
Against the pre-gate lower
`57476c312f731b8f52884b8c1d777c590a13f23588f32923664713081b715339`
(**2480 / 1079**), 24 interior samples moved and none outside
`[20,20,300,220)`. Four fell to ≤2 and three rose above 2, so the
threshold count is **1079→1078** and the lower whole is **2480→2479**.
Interior max stays 14 at `(246,113)`: native `(202,200,198)`, browser
`(214,213,212)`. One dropped sample, `(101,130)`, is now the body brown
`(69,64,57)` with delta 0; it was `(73,68,62)` at delta 5.

Page-4 browser lower
`4f182d392c6beec47db961e5386076b5c9112cc88b657ca2dd41f6e9ca033df7`
matches the pre-gate matrix file byte for byte, so **2093 / 692** is
unchanged at the pixel, not only at the count. Predicted page-3 interior
**1078**. The remaining samples stay a source-gap on spanned `TxtDlg`.

## Nits

The comment on `nativeTextWriterFlags` groups `mov r0, #0` with
`0x1cdb78`. That address is `mov r0, #1`. Line alignment 1 keeps the
`mov r0, #0` at `0x1cdb30` by branching to `0x1cdb84`. The stored values
still match.

`tests/camera-welcome-p3-txtdlg.test.mjs` still titles the frozen pair
as an unchanged painter and asserts pre-gate **2480 / 1079**. It does
not lock recaptured **1078**.

`D_003_1` (Welcome page 2) has two newlines and no colour span, so the
shared `TxtDlg` opt-in takes the direct sampler. That lower screen is
not in this recapture. Pages 1 and 5, the same unspanned class, recount
interior **0**.

## Evidence

| Tier | Result |
| --- | --- |
| Source-identified | Setter `0x1cdb2c` stores `0x111` for alignment 4 / line alignment 2; sole `bl #0x329160` is `0x329554`; spans `ff3200ff` / `454039ff` on `D_003_2` and `D_003_3` |
| Delivered | Existing dialog, `P_tips`, and style packs at `1863c4e4` |
| Implemented | Reviewed; painter unchanged in this lane |
| Tested | `npm run typecheck` clean. Focused Camera/Welcome plus bitmap-font and stock-camera: 63 pass. `npm test`: 2135 pass, 36 fail, all `model/` ENOENT, 23 skipped |
| Browser-inspected | Not run |
| Native-compared | Recount of the frozen `1863c4e4` recapture. Not 1:1 |
