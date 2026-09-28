# Settings Manual page-0 scrollbar source audit — 27 September 2026

The settled Settings Important Information capture has an upper scrollbar
residual at x363, y41, 6×145 (858 pixels). The production comparison at
`8cbee36` reports 3,054 upper and 2,071 lower pixels over 2/255 with an empty
mask. This audit does not change the renderer.

## Pinned source

The Manual applet executable is `0004003000009b02` `ExeFS/code.bin`, SHA-256
`cf4658f9f618a41f8d32ff7aed40d0ea565da78a2ace349cb93698ff5f7df5d8`,
under the private pinned EUR 10.7.0-32E dump. The delivered
`layout/ScrollIndicator.arc` supplies the `ScrollIndicator` layout, its
`StartPic` and `EndPic` artwork, and `ScrollIndicator_Wait`/`_Limit` color
animation. `MainNull/ScrollIndicator` places the host at upper x366. The
layout's default 8+24-pixel span does not define the observed long strip.

ARM disassembly locates an indicator owner used by the applet. At `0x139cc4`,
the constructor allocates a layout control and stores it at object `+4`.
`0x139de4` reads that control's vector count through `0x144ff0`, computes
`217.5 - 9.375 * count`, clamps the result through the two source global
limits at `0x1ae710` and `0x1ae714`, then passes the result to `0x143074` for
pane geometry. `0x143074` enforces a minimum of 32, subtracts 8, scales by
1/8 and updates the nested pane. This establishes that runtime code can
resize an indicator and that the BCMA layout alone is insufficient.

The call chain from the Settings page-0 scene to this owner, the vector's
page-0 contents, and the initial page scroll state remain untraced. The
constructor appears in a broader applet layout path, so assigning its
count-derived size to page 0 would be speculative. No page-0 scrollbar is
added from the 145-pixel capture measurement. The next source task is to
identify the page scene's indicator instance and replay its size and initial
position writes with the Settings Manual's decoded page state.

This is a source-only audit. It does not change the 3,054/2,071 production
residual, nor establish pixel, input, motion or audio fidelity.

## Executable ownership follow-up

The pinned extracted `code.bin` was rechecked against the SHA-256 above and
disassembled as ARM code loaded at `0x100000`. The direct call chain is now
slightly narrower:

| Address | Observed operation |
| --- | --- |
| `0x159448` | Constructs the 12-byte indicator holder at scene object `+0x18`, passing scene `+0x08` as its second argument. |
| `0x139e78`–`0x139ed4` | The holder allocates its geometry object at holder `+0x08` and calls `0x139de4` immediately. |
| `0x159f88`–`0x159fa0` | A later update reads the scene holder at `+0x18` and tail-calls `0x139de4` after `0x13d4b4` on scene `+0x08`. |
| `0x117bc0`–`0x117bcc` | A virtual scene callback calls that later update with scene `+0x04`. The callback address occurs in the executable's data at `0x1b8f20`. |

These addresses prove both an initial geometry calculation and a subsequent
update route in the applet. They do **not** yet identify the scene object as
the Settings Important Information document. The `0x139de4` count comes from
the separate layout control at holder `+0x04`, created by `0x139cc4` and
installed by the broader scene constructor at `0x159698`. The record does not
yet show which entries that vector contains for the first Settings page.

The remaining source links are: resolve the vtable at `0x1b8f20` to the
page-0 document scene selected from Settings content-1 `Manual.bcma`; decode
the scene `+0x08` / indicator control `+0x04` vector at page-0 entry; trace
the initial scroll offset and the nested pane translation written after
`0x143074`. Only then can the source-derived height and y position be passed
to the delivered `ScrollIndicator` layout. No renderer dimensions are inferred
from the capture's 6×145 strip.
