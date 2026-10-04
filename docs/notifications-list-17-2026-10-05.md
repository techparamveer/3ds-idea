# Notifications list 17: white `g`/`p` descender leftover — 5 October 2026

Worker `codex/notifications-list-17-20261005` from `74bd87ec` identified
the 17 pixels. Independent Grok 4.6 review **REJECTED** commit `4d02c3de`
(`nativeWriter0101TextClip`). That dest-rect `[0, -0.5, 216, 19]` is host
Canvas growth so AA-clip stops cutting a sample the frozen pair liked. It
is **not** a traced NW/PICA clip. Runtime is not on fidelity. This note
keeps the ownership evidence and labels the leftover.

No Azahar, production browser or recapture in this record. Scrollbar **34**,
Close, HUD, Camera `TxtNumber0` and ungated 3/2 are not reopened. Not 1:1.
Tests never pass the scenario.

## Pair (frozen)

| Item | SHA-256 |
| --- | --- |
| Native `_27.09.26_13.16.53.105.png` | `58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389` |
| Browser lower | `22da8b1175cb0e3364abaa3e28d66789e95ae28da420f6f1b024aceec22f8f3a` |
| Report `db8c1f8c…` | `db8c1f8cb487807c89ff7be3c58ef09a155f04a0b4bba49227d1e90ef4ff7c8b` |
| `code.bin` | `b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228` |

Empty mask, 2/255. Whole lower **51** = scrollbar **34** + list **17**.
Close **0**, HUD **0**, upper **0**.

## Owner

All 17 pixels are one LCD row of `T_NewsTitleB_00` (white back, layout y
−9.5, phase `[0, 0.5]`). `T_NewsTitleF_00` ends about 1.5 px higher, so
its quad does not cover y 62 / 115 / 168.

| Row | Glyph | LCD |
| --- | --- | --- |
| HOME Menu Settings | `g` | y 62, x 203–207 |
| Touching and Sliding | `g`, then `g` | y 115, x 121–125 and 209–213 |
| Sleep Mode | `p` | y 168, x 95–96 |

Shared font `fonts/shared/font.json` (`cbf_std.bcfnt`, cell 25×30). `g`
is sheet 0 at (794, 33), 13×30. `p` is sheet 0 at (1, 65), 13×30. B's
pane bottom sits at screen 62.5 / 115.5 / 168.5. The direct sampler's
included bottom-edge pixel is v=30.5. Half coverage in the browser is a
host Canvas `clip()` on pane `[0, 18)` cutting local `[17.5, 18.5)`.
PICA scissor is integer pixels and cannot paint 50% of a pixel.

`txt1` flags are 0. Pane flags are 1 (visible). There is no layout clip
field. Writer `0x18fe2c` (caller `0x190138`) does not emit
`[0, -phase, w, h+ceil(phase)]`. Scissor immediates `#0x65/#0x66` live in
`0x166544`, called from `0x173348`, not from this writer.

## Rejected bind

`4d02c3de` named that dest rectangle a writer-0x101 clip rule. Review:
dump clip was not traced; matching unclipped bilinear RGB to native used
the leftover as the spec. Close `T_EndB_00` (phase 0.5, not 3/2) and
Camera `TxtNumber0` stayed off the helper. F does not own the 17.

## Remaining

List **17** stays leftover until a follow-up either (a) traces that this
writer installs **no** pane scissor (address-level) and labels any dest
unclip as leftover **host compositor**, not dump clip, or (b) leaves the
pane clip. Scrollbar **34** labelled. Whole lower **fail**. Input, motion
and audio are not compared.
