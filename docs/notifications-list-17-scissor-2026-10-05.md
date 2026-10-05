# Notifications list 17: title writer installs no pane scissor — 5 October 2026

Worker `codex/notifications-list-17-scissor-20261005` from `f6e8a76c`.
Capstone 5.0.7 on Notifications `exefs/code.bin`. No Azahar, production
browser or recapture. Not 1:1. Tests never pass the scenario.

This takes path (1): the title writer does not install a pane scissor.
The host pane `clip()` on that direct path is a **host compositor
adaptation**. It is not a dump clip and it is not `nativeWriter0101TextClip`.

## Pair (frozen)

| Item | SHA-256 |
| --- | --- |
| Native `_27.09.26_13.16.53.105.png` | `58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389` |
| Browser lower | `22da8b1175cb0e3364abaa3e28d66789e95ae28da420f6f1b024aceec22f8f3a` |
| Report `db8c1f8c…` | `db8c1f8cb487807c89ff7be3c58ef09a155f04a0b4bba49227d1e90ef4ff7c8b` |
| `code.bin` | `b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228` |

Empty mask, 2/255. Whole lower **51** = scrollbar **34** + list **17**.
Close **0**, HUD **0**, upper **0**. Virtual base `0x100000`.

## Scissor site

PICA scissor mode is register `0x65`. The only `mov r1, #0x65` instructions
in this executable are inside `0x166544`:

| Address | Word | Instruction |
| --- | --- | --- |
| `0x166544` | `e92d4fff` | function entry |
| `0x16668c` | `e3a01065` | `mov r1, #0x65` then `bl 0x188088` (read) |
| `0x1666b0` | `e3a01065` | `mov r1, #0x65` then `bl 0x13cf38` (write) |
| `0x1666cc` | `e8bd8ff0` | return |

`0x188088` reads a GPU register. Its only callers are `0x166644` (`#0x6e`)
and `0x166690` (`#0x65`), both inside `0x166544`. `0x13cf38` writes a GPU
register. Callers `0x166584`, `0x1665ac`, `0x166668` and `0x1666b4` are in
`0x166544` (`#0x96`, `#0x8d`, `#0x6e`, `#0x65`). The other two BLs,
`0x166f0c` and `0x166f34`, write `#0x8c` and `#0x8e`; the `mov r1`
instructions are `0x166f04` and `0x166f2c`.

`#0x66` is not an immediate in `0x166544`. The only `mov r1, #0x66` is
`0x1675d8` in `0x1675c4` (caller `0x17ff78`), an object initialiser, not
this writer.

`0x166544` has one BL caller: `0x173348`, inside `0x17329c` (`e92d47f0`).
`0x17329c` has one BL caller: `0x173bb0`, inside `0x173a50`, called from
`0x173f20` and `0x18cc7c`. No word in the file stores the address
`0x166544`, so it is not a vtable slot. The call passes object fields and
the constants `0x80` and `0x1200`. It is not a 216×18 title rectangle.

## Title writer does not reach it

| Address | Role |
| --- | --- |
| `0x18fe2c` | Origin writer. One caller, `0x190138` (`ebffff3b`) |
| `0x1900d4` | Function that contains `0x190138`. One caller, `0x1900ac` |
| `0x190078` | Contains `0x1900ac`. Called from `0x16b288` |
| `0x16b23c` | Text-box draw. Called from `0x1897f0` |
| `0x189780` | Calls `0x16b23c` and returns. No BL to `0x166544` |

Direct BL targets inside `0x18fe2c`…`0x18ff88` and `0x1900d4`…`0x1905b0`
do not include `0x166544`, `0x17329c`, `0x13cf38` or `0x188088`. A
prologue-bounded walk of direct calls from `0x1900d4` (51 function starts)
does not either. Virtual calls in `0x1900d4` (`0x1901a8`, `0x190248`, `0x1902b8`,
`0x190484`, `0x1904ec`, `0x190554`) and `0x172678` (called at `0x190518`)
return glyph metrics (`vcvt.f32.s32` / signed bearings). They are not
register `0x65`.

`T_NewsTitleB_00` / `T_NewsTitleF_00` are alignment 3 / line alignment 2,
flags `0x101`, drawn by this writer. The host was still doing
`ctx.clip()` to the pane before compositing the dest image. That is
Canvas coverage on a pixel the integer scissor path does not half-cover.
List **17** is that cut on B's white `g`/`p` at y 62/115/168.

## Change

For the direct writer-0x101 path only, `native-renderer.ts` no longer
calls that pane `clip()`. Dest x/y/width/height are unchanged. The
allowlist stays `T_NewsTitleB_00` / `T_NewsTitleF_00`.

Still clipped, or never on this path:

- Close `T_EndB_00` (alignment 4 / line alignment 0, phase 0.5) and
  `T_EndF_00`
- Camera `TxtNumber0` (`lcd-source-size`, not writer 0x101)
- ungated alignment 3 / line alignment 2
- scrollbar and HUD

No colour, snap, `azahar-12p4-fit`, font or sampler change. Rejected
`4d02c3de` is not revived.

## Recapture (coordinator, Mac built-in, `987addcc`)

User-authorized laptop display (Sidecar disconnected). Frozen native
reused (`58fff714…`); Azahar not relaunched. Production `127.0.0.1:3000`.
Chrome `--window-position=80,60`. Raw LCD `captureScreensAt`. Browser
lower `b65e668d…`, report `a11ec76c…`, artifacts
`notifications-list-17-scissor-recapture-20261005/`. Empty mask, 2/255.
Upper PNG SHA unchanged (`dc73ce72…`). One muted 404 in the capture log.

| Region | Before | After |
| --- | ---: | ---: |
| Upper | 0 | **0** |
| Lower | 51 | **34** |
| List `[0,0,291,210]` | 17 | **0** |
| Close | 0 | **0** |
| Scrollbar `[291,0,320,210]` | 34 | **34** |

List **17** is gone. The skip did not open a new top-edge leftover on
these titles. Scrollbar **34** stays labelled unbound extra-6. HUD 0
closed. Whole lower remains **fail**. Input, motion and audio are not
compared. Not 1:1.
