# Notifications list 820: shared writer, renderer gap — 4 October 2026

Worker `codex/notifications-list-820-20261004` from HOME fidelity `01b1ba7b`.
Independent review **APPROVE-WITH-NITS**. No Azahar, production browser,
Sidecar or recapture. No CSS, colour, font, snap, mip, sampler, `lcd`
allowlist, `textSampling` or `azahar-12p4-fit` change. `T_EndB_00` LCD
sampling and `T_EndF_00` `writer-0x110` stay as bound. HUD (upper 0) and
scrollbar **34** are not reopened.

This is **not** a 1:1 claim. Tests do not close pixels, input, motion or
audio. Coordinator recapture remains the acceptance gate.

Follows [the Close/list writer note](notifications-close-list-2026-10-04.md)
and [the Close 240 note](notifications-close-240-2026-10-04.md).

## Pair (frozen, not recaptured)

Close-lcd recapture
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/notifications-close-240-recapture-20261004/`
(commit `928f9ed7`, report `9b57a711…`, empty mask `dc4b320b…`, threshold
2/255).

| Item | SHA-256 |
| --- | --- |
| Native `_27.09.26_13.16.53.105.png` | `58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389` |
| Browser lower | `6397346da81a190c587b058b9612badc6bd9a99704a1d123569d427c87605151` |
| `code.bin` | `b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228` |

Lower **910** = scrollbar `[291,0,320,210]` **34** + list `[0,0,291,210]`
**820** + Close seam `[0,210,320,214]` **56**. Close glyphs
`[125,216,195,234]` are **0**. List max **18** at `(124,111)` (native
`(251,254,254)` / browser `(233,249,251)`). Seam max **14** at `(138,211)`
(native `(255,255,255)` / browser `(241,251,253)`). Independent recount:
all **876** list+seam pixels sit in the four title boxes (x 62–278,
y `44.5+slot·53`, 18 px); by slot 288, 289, 190, 109.

## What was traced

`NewsWndwNews_D_00` (`news.json` `9f6e27e6…`, layout
`dfa42ef3…`) at SceneIn frame 10. SceneIn and Select do not animate
`T_NewsTitle*`. They only move `N_News_00` / `P_BllnDir_00` and paint the
balloon konst `(216,251,255)`.

| Pane | Translation y | Alignment / line | konst0 | Role |
| --- | ---: | --- | --- | --- |
| `T_NewsTitleB_00` | **−9.5** | 3 / 2 | 255 | white **back** highlight (drawn first) |
| `T_NewsTitleF_00` | −8.000740051269531 | 3 / 2 | 50 | dark **front** |

Both are origin 0, size 216×18, glyph size `[15.000000953674316, 18]`,
flags **0x101**. The painter still sets `text` only. Row parent override
`N_News_00` `[-150, 85−slot·53, −10]` puts the title boxes at LCD x
62..278 and y `44.5+slot·53` for 18 px. Slot 3's box is y 203.5..221.5,
so it crosses the list/Close boundary. All **56** seam pixels are x
81..250 at y 210..211, inside that same box.

The leftover is not only lost white coverage. Of the 820 list pixels,
179 have min RGB below 200 (20 below 120). The browser is brighter at
355 of them and darker at 465. Dark F edges contribute. That is a phase
or resampling offset of the shared title glyphs over the cyan balloon,
cut at y=210 for the seam.

## Dump owner (shared writer; renderer coverage gap)

EUR Notifications `000400300000a002` v4097, content `00000012`,
`exefs/code.bin` `b3993f1e…`.

Flag setup `0x16b080` has one caller (`0x16b264`). Byte `+0xfd` is line
alignment. Value 2 takes `cmp r1,#2` / `beq` / `mov r0,#1`
(`0x16b0ec` `0xe3510002`, `0x16b0f0` `0x0a00000c`, `0x16b128`
`0xe3a00001`). Alignment 3 then adds vertical-middle `0x100` and does not
add horizontal `0x10` (`alignment % 3 == 0`). That is flags **0x101**. The
same function builds Close `T_EndF_00` **0x110** and `T_EndB_00` **0x111**.

Origin **`0x18fe2c`** (one caller `0x190138`) is the owner. Bits `0x100`
use the same `ceil` (`0x136998`) as Close. Low bits `1` (`0x18ff8c`) add
`ceil(block/2) − ceil(line/2)`. One line whose measured left is 0 adds
**0**, so generic X already matches line alignment 0. Glyph size height
18 on an 18 px pane puts the writer Y at 0. The half pixel is the layout
translation −9.5 on B, not a writer phase.

Glyph emission is the font object at text `+0x60`. It is not gated on
`0x101`. There is no second sampler.

This is **not** a source gap. Close `T_EndB_00` used the same writer
family; LCD sampling took its glyphs to 0 because it already satisfied
the browser direct path (alignment 4 / line alignment 0). Titles miss
two host predicates, not a dump owner:

- `native-renderer.ts` `direct`: alpha, no glyph-scale/fixed-width spans,
  single line, alignment 3 or 4, **line alignment 0** (or `sourceSize`
  with alignment 4 / line alignment 2), plus `sourceTopLeft` and
  `writer0111` branches (neither applies here).
- `bitmap-font.ts` `nativeAlignedLine`: alignment 3 / alpha also requires
  **line alignment 0**.

`textSampling:'lcd'` on these panes would still keep phase `[0,0]` until
those predicates accept alignment 3 / line alignment 2. Allowlisting
alone is inert. The next slice is a bounded renderer + font extension of
that coverage, with an offline proxy before recapture. This source-only
record does not change pixels; AGENTS.md requires the next 820 slice to
be visible.

## Leftover (unchanged pixels)

- List **820**: shared `0x18fe2c` title glyphs (white B back at y −9.5,
  dark F front at y ≈ −8) over the cyan balloon, pane-rastered.
- Seam **56**: the same titles on slot 3 where they cross y=210. Not a
  second Close writer.
- Scrollbar **34**, HUD **0**, Close glyphs **0**: unchanged.
- Whole lower remains **fail**. Input, motion and audio are not compared.

No painter, renderer, font or asset bytes change in this commit.

Follow-up: [the list direct note](notifications-list-direct-2026-10-04.md)
extends those two predicates for allowlisted 0x101 titles.
