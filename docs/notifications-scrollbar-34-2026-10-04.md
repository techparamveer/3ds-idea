# Notifications scrollbar 34 — no further idle owner — 4 October 2026

Stock worker on `codex/notifications-scrollbar-34-20261004`. Not the
coordinator. No Azahar, no browser, no recapture. No CSS, mip, sampler,
snap, colour or `azahar-12p4-fit`. Close 240, list 820 and the HUD stay
out of this slice. This is not a 1:1 claim. The test locks the frozen
pair and the already-bound pose; it does not pass the scenario.

## Pair (reused)

Native `_27.09.26_13.16.53.105.png`
`58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389`.
Browser lower after the `0x13a160` bind, from
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/notifications-close-list-recapture-20261004/browser/lower.png`
`f132dc8d0ba3eaf5aa10c58c5cf952c13e89bfe18b902a6eb886a16e6311b0e0`.
Empty mask. Threshold any RGB channel >2/255. Official lower crop of the
native PNG is `(40,240,320,240)`. `code.bin`
`b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228`,
image base `0x100000`.

Scrollbar `[291,0,320,210]` is **34** (was 2479). The 34 pixels are three
rows and nothing else:

| Row | x | Pixels | Native → browser | Max |
| --- | --- | ---: | --- | ---: |
| y=62 grip shoulder | 295–306 | 12 | `(188,188,190)` → `(178,178,179)`, edges 207→201 | 11 |
| y=68 grip shoulder | 295–306 | 12 | same | 11 |
| y=112 right-frame end | 301–310 | 10 | `(238,238,237)` → `(199…219)` | 39 |

The grip cores on the same lines match: y=61 and y=67 are `(142,142,142)`
in both images, and y=60/66 are `(208,208,208)`. The thumb face at x=300
is `(238)` from y=7 through y=119 and both images agree until the corner
rolls off at y=120. That is the extra-6 silhouette (height
`119.60000610351562`, top at LCD y=4, bottom at y=123.6), not the traced
initial extra 0 (height `174.8`, bottom at y=178.8).

## Travel is already the idle write

`0x1770cc` stores travel = `B_Groove_00` size.y − thumb size.y, and copies
groove translation.y. Authored `B_Groove_00` translation is `[0,0,0]`. The
align block at `0x13a284` writes sizes (`SBBaseLine_00` becomes the host
8×184, `SBBaseWndw` / `B_Groove_00` become 16×204). It does not write
translation.

`0x13aa9c` then writes thumb translation.y =

`groove.ty + travel * (s4 − s3 − ratio)`

with `s3` at `0x13ab1c` = `0.5` and `s4` at `0x13ab20` = `1.0`, so

`groove.ty + travel * (0.5 − ratio)`.

Ratio is `(+0x90 + +0x7c * stride) / extent`, and `0x13a554` skips the
call when extent ≤ 0. Ctor `0x1390ac` stores `+0x7c = 0` and `0x1390cc`
stores `+0x90 = 0` (constant at `0x139184`). Groove.ty is 0, so the idle
write is `thumbY = travel * 0.5`. The painter already does that. There is
no second idle term in `0x1770cc` / `0x13aa9c`.

## Count is traced, and it is not the nine

`extra = max(0, index + [+0x0c] − [+0x08])`.

List setup `0x17dddc` does `mov sl, #0` at `0x17dde8`. `0x17e0a4` stores
`[+0x04]=3`, `[+0x08]=sl` and `0x17e0b8` stores `[+0x0c]=sl`. Ctor
`0x139080` `memcpy`s that descriptor to controller+4 (`0x153fa8`, length
`0x78`). The controller kept at list+0x28 therefore has bias 3 and
`+0x0c = 0`.

The controller `0x179660` actually updates is the one stored at list+0x24
by the ctor call at `0x17a0c8`. Its descriptor sets `[sp+8]=1` at
`0x17a054` (`r6` was `mov r6, #1`). After the same memcpy that literal is
`+0x0c`. It is not `view.rows.length`. The bias word is the truncated
ratio of two pane heights (`0x17a048`), not a second copy of the row
count. Detail `0x17ace4` is the only traced non-constant store to
`+0x0c`, and it runs on the detail path immediately before its own
`0x13a160` call.

On `0x179660` the float at list+0x314 is multiplied and then divided back
out, so the integer argument is list+0x31c. The stores of that field are
`0x17a834`, `0x179f24` and `0x129360`, and each writes 0.

Bias 3, index 0, count 0 or 1 all clamp extra to 0. `0x13a4b0` then skips
`0x13aa9c`. That is a 174.8px thumb ending at LCD y=178.8. The frozen
still is the 119.6px thumb. Replacing the nine-row profile with the
traced 0 would put the groove back through the face that already matches.
The painter therefore keeps `notificationSlideBarOverrides(start, view.rows.length)`
for this idle still. That nine is the profile that matches the capture.
It is not a located populated store.

## What the 34 rows are

`SBBtn` is a four-frame window. `SBBtnWndwLT_16` / `SBBtnWndwLB_16` decode
to 11×11. With thumb height 119.6 the right strip is local
`x=11, height=108.6` and ends at LCD y=112.6. The 10 dark pixels at
y=112, x=301–310 are that fractional end (button centre x=301, strip
width 11). Native stays on the face `(238,238,237)`; the browser samples
the strip end darker. `0x13a1e0` stores the float size with `vstr`. There
is no truncating store to round 119.6 onto an integer.

`SBBtnEmb` is the 16×16 grip, texture `SBBtnEmb_8x16`, wrapS repeat.
Its dark cores at y=61 and y=67 already match. y=62 and y=68 are the
light shoulders, 8–11 levels darker in the browser. That is the same
texel row, not a shifted thumb. Moving `thumbY` or the emboss translation
to chase 10 levels would be a screenshot fit.

No remaining idle field in `0x13a160`, `0x1770cc` or `0x13aa9c` owns
these 34 pixels. Scroll ratio stays 0 on this still because `+0x7c` and
`+0x90` are 0; a scrolled capture is a different slice.

## Leftover

Scrollbar `[291,0,320,210]` **34**. Close `[0,210,320,240]` **240** and
list `[0,0,291,210]` **820** are not this slice. Input, motion and audio
are open. Not 1:1. Coordinator recapture stays on Sidecar.
