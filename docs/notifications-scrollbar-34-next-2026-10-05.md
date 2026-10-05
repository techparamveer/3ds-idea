# Notifications scrollbar 34 — traced filter, host resample — 5 October 2026

Worker on `codex/notifications-scrollbar-34-next-20261005` from `0b31e46f`.
Not the coordinator. No Azahar, no production browser, no recapture. No
snap, colour, `azahar-12p4-fit`, or extra-0 thumb. List titles, Close and
the HUD stay closed. This is not a 1:1 claim. Tests lock the frozen pair
and the traced sampler; they do not pass the scenario.

## Pair (frozen, unchanged)

Native `_27.09.26_13.16.53.105.png`
`58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389`.
Browser lower after the list-17 scissor skip, Mac built-in recapture,
`b65e668da346a0a63c0e3ae252b6f4f28f2ccbf816c429cbebbe89a582d1e7bf`.
Report `a11ec76ce9ba3ebc8f4cc8324b7f055aef1227f710c0eb945cf2cc71b4cfb9bd`.
Artifacts
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/notifications-list-17-scissor-recapture-20261005/`.
Empty mask, 2/255. Whole lower **34** = scrollbar **34**. List **0**,
Close **0**, HUD **0**, upper **0**. `code.bin`
`b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228`,
image base `0x100000`.

The 34 pixels are still the three rows in
[scrollbar 34](notifications-scrollbar-34-2026-10-04.md): grip shoulders
y=62 and y=68, x 295–306, and the right-strip end y=112, x 301–310.
`thumbY` and the emboss translation stay the extra-6 idle write. Moving
either to chase 10 levels is still a screenshot fit.

## Dump sampler (already the material)

Notifications `slidebar_LZ.bin` / `blyt/SlideBar.bclyt`
`95b8f85852202c608a0b7579777a6643bc577d2820a5eef1c55555c6841a2c6d`.
The earlier note called `SBBtnEmb` wrapS repeat. The BCLYT byte is
**2**, which this renderer treats as mirror (0 clamp, 1 repeat, 2 mirror).
The picture UV is `[0,0, 2,0, 0,1, 2,1]`.

| Material | Texture | wrapS | wrapT | min | mag | TEV stages |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `SBBtnEmb` | `SBBtnEmb_8x16` LA8 | 2 mirror | 0 clamp | 1 | 1 | 0 |
| `SBBtnLT` / `RT` / `LB` / `RB` | `SBBtnWndwLT_16` / `LB` LA8 | 0 | 0 | 1 | 1 | 0 |

Empty TEV is the implicit buffer/constant interpolation already in
`rasterNativePicture`. `SlideBar_Select` frame 0 does not change wrap,
filter, or those colours. There is no second wrap or mag-filter field to
bind, and no scrollbar scissor in `0x13a160` / `0x1770cc` / `0x13aa9c`.
The only `mov r1, #0x65` site remains `0x166544`, already traced off the
title writer. It is not a thumb-strip rectangle.

## What owns the 34

An offline replay of this pack, with the same extra-6 pose, samples the
thumb once at LCD pixel centres (the existing `pictureSampling:'lcd'`
path). Against the frozen native crop those 34 pixels fall to at most 1
level: shoulder `(188,188,190)` becomes `(189,189,190)`, face
`(238,238,237)` becomes `(239,239,237)`, and `(310,112)` stays
`(200,200,198)`. A software bilinear of the old pane-raster plus
`drawImage` is the same except 33 pixels at delta 1–2, also inside 2/255.
The frozen Chrome lower is 10–39 levels off the same texels (shoulder
`178`, strip end `199…219`).

That gap is host Canvas resampling of the fractional thumb. The cores at
y=61 and y=67 already match because they land on a texel centre. The
shoulders and the strip end at y=112.6 do not. Integer panes, including
the groove, keep the old path: the direct sampler returns on an integral
LCD translation. No colour, snap, or thumb move.

## Change

`drawNativePersonalToolFrame` opts the Notifications `SlideBar` draw into
`pictureSampling:'lcd'`. Health's slidebar already uses that opt-in. The
direct path runs only when the destination box is opaque. Live dest is
not the `clearRect` itself: `NewsTopUI_D_00` (`P_Bg_D_00` 320×240) is
painted first. Whether that box is fully opaque under the thumb is
unproven. If the guard declines, Canvas `drawImage` stays.

## Unproven

No recapture. The frozen pair is still scrollbar **34**. Whether Chrome
keeps the 1:1 blit, and whether the opaque-box guard accepts the live
thumb, is not shown here. If the guard declines, production stays on the
host resampler and these 34 pixels remain. Input, motion and audio are
open. Not 1:1.
