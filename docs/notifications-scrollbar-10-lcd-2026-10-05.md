# Notifications scrollbar 10 — fractional size samples — 5 October 2026

Worker on `codex/notifications-scrollbar-10-lcd-20261005` from `ea2906fd`.
Not the coordinator. No Azahar, no production browser, no recapture. No
snap of height, extra, `thumbY`, or the emboss. Close, list titles, and
the HUD stay closed. This is not a 1:1 claim. Tests lock the guard and
the frozen pair. They do not pass the scenario.

## Pair (frozen, unchanged until recapture)

Native `_27.09.26_13.16.53.105.png`
`58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389`.
Browser lower `6536e8eb3222b7bfab55ae070f00bedc2ca72c86313a7db448cdac91e0f21c56`.
Report `2639cbb2672ecc26cb814feffe1741779180595c39754058d60cc78efe57f350`.
Artifacts
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/notifications-scrollbar-34-lcd-recapture-20261005/`.
Empty mask, 2/255. `code.bin`
`b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228`,
image base `0x100000`.

Upper **0**. Lower **10** at y=112, x 301–310. Extra-6 idle pose stays
(`thumbHeight` `119.60000610351562`, `thumbY` = travel × 0.5, top at LCD
y=4). The right strip `SBBtnRT` is local x=11, width 11, height
`108.60000610351562`, LCD origin `(301, 4)`.

## Bind

`0x13a1e0` is `vstr s16, [r0, #76]` (float size.y). The same float is
stored at `0x13a1f4`, `0x13a208`, and `0x13a22c`. Width is `vstr s18,
[r0, #72]`. `vstmia` at `0x13a2c0` writes both. There is no
`vcvt.u32.f32` of that height. The integer-translation early return in
`projectedPicture` is a host shortcut, not that store.

`pictureSampling:'lcd'` samples once at LCD centres. An axis-aligned
opt-in now samples when **w or h is non-integer**, even if `m.e` and
`m.f` are integers. The skip remains when lcd is on and translation and
size are all integers. Health Usage's thumb is the integer 22×22 pane
(`B_Slide_00` override `[24, 22]`); it stays on the Canvas path.

Guard predicate, the axis-aligned clause of the early return:

```
!m.b && !m.c && (!lcd || Number.isInteger(m.e) && Number.isInteger(m.f) && Number.isInteger(w) && Number.isInteger(h))
```

## A8 frames left on Canvas

`SBBtnRT` is LA8. Its LCD centres at y=112 are the face: x=301–308
`(239,239,237)` against native `(238,238,237)`, x=309 `(236,236,234)`
exact. Those strips, and the sibling LA8 content strips, take the lcd
path.

`SBBtnFrame` and `SBBtnShdw` share the integer origin and the 108.6
height, and their frame textures are A8 (`picaFormat` 8). The hard
centre of `SBBtnFrame` at x=310 is opaque black. Native x=310 is
`(200,200,198)` on every row; the frozen browser matches that column
except y=112. LCD-sampling those A8 frames at this idle origin would
replace the column with the stroke. They stay on Canvas **when `e` and
`f` are integers**. A fractional translation still samples, so Health
Usage's 8 px scrolled thumb (`thumbY=76.7066650390625`) keeps the lcd
path it already matched. That idle-origin skip is a host leftover of
this frame geometry. It is not a dump scissor, not a dest clip, and
not a reason to keep Canvas edge-filter on the LA8 strip.

## Still open

Scrollbar `[291,0,320,210]` is still **10** on the frozen pair. This
slice does not recapture. Input, motion, and audio are not compared.
Not 1:1.
