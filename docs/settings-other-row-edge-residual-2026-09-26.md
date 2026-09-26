# Other Settings page 1: remaining row-edge residual

The integrated [settings-other-1-adjacent-browser-20260926 report](/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/settings-other-1-adjacent-browser-20260926/diff/report.json) uses the
same preserved native Other Settings page-1 LCD and a new production browser
capture after the source `Null_RightPage` mount. Its empty-mask report remains
**1,517 upper / 702 lower pixels over 2/255**. The lower count fell from 1,235
after the adjacent-page change. This is still a failing pair with different
entry routes; motion, audio and the charging-battery phase are not established.
The raw lower contact sheet was inspected.

The four largest remaining current-row components are the second and third
button edges: left `(34,100,20,38)` 127 pixels, `(34,148,20,38)` 128 pixels;
right `(266,100,19,38)` 96 pixels, `(268,148,17,38)` 94 pixels. The first row
has no over-threshold pixels in the corresponding full button rectangle.
An integer translation search over each 251×38 row rectangle has its strict
minimum at `(0,0)`: 0, 223 and 226 over-threshold pixels for the first,
second and third rows. Moving either lower row by one whole pixel introduces
at least 4,900 over-threshold pixels. The central opaque button pixels are
visually aligned; the residual follows their curved, translucent edge.

The delivered source `BasicTop_D_00` places the three current page mounts at
Y offsets `+44`, `−4`, `−52`, all with X offset zero. The source
`I_User`, `I_Date` and `I_Touch` layouts contain identical converted `Window_01`
pane records, with the same `I_User_L.bclim` button-frame texture and
`I_UserShdw.bclim` shadow texture. Their separate icon art does not explain
this edge-only residual. These keys are in the firmware manifest's
`packs/settings/contents/0000-0000003d/{layout,button}.json`, from title
`0004001000022000`, content index 0 / ID `0000003d`:

| Source member | SHA-256 |
| --- | --- |
| `layout_LZ.bin/blyt/BasicTop_D_00.bclyt` | `1262f71b7b29cc91ac342cc56161f39bbd4dc2a5b8fb1c42aa31e90669943273` |
| `button_LZ.bin/blyt/I_User.bclyt` | `b93a470881def69963791e5412bd0df01ccf9f55789a069d9df852071d97e139` |
| `button_LZ.bin/blyt/I_Date.bclyt` | `291c1e96e8889fb377ed5593febe58908284920e4572967093b6b2d64fe8eee0` |
| `button_LZ.bin/blyt/I_Touch.bclyt` | `0c31f5c8346f3b0ccd96fe741b8aded0d12016db5e076bcaab53365900106c15` |

The source/button data supports the current placement, while the remaining
edge blend is not resolved by a different mount or clip. For example, at
`(30,120)` the native background is `(218,211,159)` and browser
`(217,211,159)`, within threshold; at the second-row left edge `(34,120)`
native is `(186,179,139)` and browser `(210,203,152)`. Other edge pixels have
deltas of both signs, so a uniform tint or shift is not supported.

## Follow-up source audit

The row edges are **not** three identical source pictures. `I_User_Select`
contains frame-0 `size.width = 16` keys for `I_User_L_02` and `_03`.
`stock-native-settings.ts` reused that clip for every Other Settings icon.
The `I_User` source layout has 16/16 px pictures, but `I_Date` and `I_Touch`
each have 22/21 px pictures. Their LA8 `I_User_L.bclim` begins drawing at the
left edge of the widened pane. Reusing the `I_User` width keys reduced those
panes by six and five logical pixels in the browser. At row-centre `(34,120)`,
the native/browser RGBs are `(186,179,139)` / `(210,203,152)`; the same
relative point on the 16 px `I_User` row is `(210,203,152)` / `(211,203,152)`.
This explains the row-specific left-edge concentration without a global
translation or tint. The right edge uses the other overridden width.

The bounded presentation correction preserves the sibling layouts' picture
widths while reusing the clip's other tracks, including source material colour
and visibility. It applies to current rows and the mounted adjacent page.
The source records give no sibling-specific selected-frame width keys, so this
correction keeps their layout widths for that state too. A production browser
recapture against the same native image is still needed to measure the pixel
effect. The unchanged `702` count above remains the pre-correction baseline;
adjacent-page components, footer, and upper title/status residuals are separate.
