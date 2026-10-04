# Notifications list 820: no unique 0x101 direct writer — 4 October 2026

Worker `codex/notifications-list-820-20261004` from HOME fidelity `01b1ba7b`.
No Azahar, production browser, Sidecar or recapture. No CSS, colour, font,
snap, mip, sampler, `lcd` allowlist, `textSampling` or `azahar-12p4-fit`
change. `T_EndB_00` LCD sampling and `T_EndF_00` `writer-0x110` stay as
bound. HUD (upper 0) and scrollbar **34** are not reopened.

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
(native `(255,255,255)` / browser `(241,251,253)`).

## What was traced

`NewsWndwNews_D_00` (`news.json` `9f6e27e6…`, layout
`dfa42ef3…`) at SceneIn frame 10. SceneIn and Select do not animate
`T_NewsTitle*`. They only move `N_News_00` / `P_BllnDir_00` and paint the
balloon konst `(216,251,255)`.

| Pane | Translation y | Alignment / line | konst0 | Flags |
| --- | ---: | --- | --- | --- |
| `T_NewsTitleB_00` | **−9.5** | 3 / 2 | 255 (white front) | **0x101** |
| `T_NewsTitleF_00` | −8.000740051269531 | 3 / 2 | 50 (dark) | **0x101** |

Both are origin 0, size 216×18, glyph size `[15.000000953674316, 18]`.
The painter still sets `text` only. Row parent override
`N_News_00` `[-150, 85−slot·53, −10]` puts the title boxes at LCD x
62..278 and y `44.5+slot·53` for 18 px. Every one of the **820** list
pixels falls in those boxes. Slot 3's box is y 203.5..221.5, so it crosses
the list/Close boundary. All **56** seam pixels are x 81..250 at y 210..211,
inside that same box. They are the white-title fringe over the cyan
balloon, cut by the y=210 boundary, not a second Close writer and not the
balloon picture's own edge.

## Dump owner (not unique, not a direct sample)

EUR Notifications `000400300000a002` v4097, content `00000012`,
`exefs/code.bin` `b3993f1e…` at
`/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/extracted/notifications/exefs/code.bin`.

Flag setup `0x16b080` has one caller (`0x16b264`). Byte `+0xfd` is line
alignment. Value 2 takes `cmp r1,#2` / `beq` / `mov r0,#1`
(`0x16b0ec` `0xe3510002`, `0x16b0f0` `0x0a00000c`, `0x16b128`
`0xe3a00001`). Alignment 3 then adds vertical-middle `0x100` and does not
add horizontal `0x10` (`alignment % 3 == 0`). That is flags **0x101**. The
same function builds Close `T_EndF_00` **0x110** and `T_EndB_00` **0x111**.

Origin `0x18fe2c` has one caller (`0x190138`), inside the shared line
loop. Bits `0x100` use the same `ceil` (`0x136998`) as every middle pane,
including Close. Low bits `1` (`0x18ff8c`) add `ceil(block/2) −
ceil(line/2)`. One line whose measured left is 0 adds **0**, so generic X
already matches. Glyph size height 18 on an 18 px pane puts the writer Y
at 0. The half pixel is the layout translation −9.5, not a writer phase.

Glyph emission is the font object at text `+0x60` (vtable `+8` / `+0xc`).
It is not gated on `0x101`. There is no second sampler.

The renderer's direct LCD path still requires line alignment 0, or
`sourceSize` with alignment 4 and line alignment 2
(`native-renderer.ts`). Titles are alignment 3 / line alignment 2, so
`direct` is false. `textSampling:'lcd'` would pass the transform and still
keep phase `[0,0]`. Close `T_EndB_00` could use that path because it is
already alignment 4 / line alignment 0 at y 26.5. Titles are not on it.
Opting them in would be a guess, not a traced direct writer.

## Leftover (unchanged)

- List **820**: white `T_NewsTitleB_00` edge coverage at layout y −9.5 over
  the cyan balloon. Flags 0x101 do not own a distinct LCD sample.
- Seam **56**: the same fringe on the slot-3 title where it crosses y=210.
  Same panes, same flags. Not reopened as Close.
- Scrollbar **34**, HUD **0**, Close glyphs **0**: unchanged.
- Whole lower remains **fail**. Input, motion and audio are not compared.

No painter, renderer, font or asset bytes change.
