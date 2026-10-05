# Notifications scrollbar 1 — A8 blit edge clamp — 5 October 2026

Worker on `codex/notifications-scrollbar-1-clamp-20261005` from `7aae8d6d`.
Not the coordinator. No Azahar, no production browser, no recapture. No
snap of height, extra, `thumbY`, or the emboss. Close, list titles, and
the HUD stay closed. This is not a 1:1 claim. Tests lock the clamp and
the frozen pair. They do not pass the scenario.

## Pair (frozen, unchanged until recapture)

Native `_27.09.26_13.16.53.105.png`
`58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389`.
Browser lower `1473f0e78a9413d2cfe423e97d5ff86dc890260e96d79ba11e774b6d9e0a7d87`.
Report `45a57def3a0feab3bc5b5fe970264e2132a7de30591ca2fa44da99aaf0b7ce0d`.
Artifacts
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/notifications-scrollbar-10-lcd-recapture-20261005/`.
Empty mask, 2/255.

Upper **0**. Lower **1** at `(310, 112)`: native `(200,200,198)`, browser
`(209,209,207)`, max 9. `(310, 111)` is `(200,200,198)` in both. Face
x 301–309 at y=112 already matches. Extra-6 pose stays (`thumbHeight`
`119.60000610351562`, right-strip height `108.60000610351562`). Whole
lower remains **fail**.

## Bind

`SlideBar.bclyt` `SBBtnFrameLT` map bytes `02 00 04 04`: texture 2,
wrapS 0, wrapT 0, min 1, mag 1. Mag 1 is linear. `0x13a1e0` is still the
float size store. The right A8 strip dest height is
`108.60000610351562`, ceil raster 109. LCD y=112.5 is local `108.5`,
source `108.5*(109/108.6)≈108.90`, so Canvas bilinear reads row 108 and
row 109 past the bitmap (transparent). Dump wrapT 0 repeats row 108.
Native `(310,112)` equals `(310,111)`, that interior sample.

`linearEdgeClamp` pads the ceil raster with its last row and/or column
and stretches the dest by the same ratio `(n+1)/n`. The source
coordinate of every point inside the original dest is unchanged, so the
linear kernel mixes the edge texel with itself instead of with empty
pixels. A clip at the next device pixel drops only the extra dest
sliver. Integer dest returns before any pixel read.

That pad is a **host compositor adaptation of wrapT 0**, the same class
as skipping the writer0101 pane `clip()`: Canvas OOB is not dump clamp.
It is not a dump scissor. `imageSmoothingEnabled` is not set false.
Integer-origin A8 is not lcd-sampled. The extra-6 pose is unchanged.

## Clamp site

`NativeLayoutRenderer.linearEdgeClamp`, called from `composite` on the
source-over `drawImage` when the window loop passes
`framePixels.picaFormat===8`. LA8 strips still take `projectedPicture`.
Health Usage's 22×22 thumb stays the integer-size Canvas blit (the
helper no-ops). A fractional thumb translation still lcd-samples.

Right strip, height `108.60000610351562`, raster 109, pad 110, dest
height `108.60000610351562*110/109`, clip height 109. Local `108.5`
still maps to source ≈108.90. Local `107.5` (LCD y=111) stays below
row 108 and does not read the pad.
