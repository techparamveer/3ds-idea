# Other Settings page edges

26 September 2026. This is a static lower-LCD comparison against fresh EUR
10.7.0-32E Azahar captures. It does not establish page-transition timing,
input latency or audio parity.

`BasicTop_D_00` supplies `Null_LeftPage` at x = -276, `Null_RightPage` at
x = +276, and both arrow mounts. The original `BasicTop_D_00_Special_00`
clip moves `ScrollBg` from x = 270 to -6, a 276 px page pitch. Its settled
`SpecialIn_00` pose sets x = 270. The browser previously reused that entry
pose on every page and rendered only `Null_RightPage`.

The painter now mounts the preceding page's three original icon buttons at
`Null_LeftPage`, matching its existing next-page mounting. It sets `ScrollBg`
to 270 on page 1, -6 on pages 2–3 and -282 on page 4. These are the source
entry and page-pitch positions constrained by the captured settled edges;
the repeated -6 for page 3 is capture-constrained, not an executable timing
trace. Arrow layout, material, clip and hit targets are unchanged.

| Page | Native screenshot time | Lower pixels over 2/255 before | Offline after |
| --- | --- | ---: | ---: |
| 2 | 21:40:05.978 | 3,558 | 960 |
| 3 | 21:45:42.533 | 3,247 | 8 |
| 4 | 21:46:07.466 | 6,702 | 35 |

These counts use an empty mask and the 320×240 lower LCD. The after images
were rendered by `scripts/verify-stock-settings.mjs` and compared against the
same genuine 400×480 Azahar screenshots. Page 2's remaining 959 left-edge
pixels lie at x = 0–34, y = 66–167 beside the prior page 1 buttons and left
arrow; one other lower pixel remains. Page 3 has eight scattered middle-row
pixels. Page 4 has 35 middle-row pixels. The upper offline image has an
unmatched diagnostic clock, so the production browser must be recaptured
before claiming a two-LCD pixel-tier result. No residual is masked or called
resolved.
