# Other Settings page 1: upper LCD residual boundary

The [settings-other-1-adjacent-browser-20260926 report](/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/settings-other-1-adjacent-browser-20260926/diff/report.json)
compares the genuine native `native/combined.png` (SHA-256
`09c625dd1a8a2080865ff24f672a0fd0975827cbf81dcd7f8310dd993d4a9d51`)
with production `browser/upper.png` (SHA-256
`9cf4f24aff59e8999e113ef8c07745385c2d153a7935318a254be63bb14f666f`).
The raw upper contact sheet was inspected. The empty-mask upper diff has
**1,517 pixels over 2/255**, partitioned as follows, in half-open native
400×240 rectangles:

| Region | Rectangle | Pixels over 2 |
| --- | --- | ---: |
| Title icon | `(95,20)..(150,58)` | 349 |
| Title glyphs | `(150,20)..(305,58)` | 958 |
| HUD wireless and Internet badge | `(0,0)..(142,20)` | 43 |
| HUD date/time | `(218,0)..(368,20)` | 30 |
| HUD battery | `(368,0)..(400,20)` | 137 |
| Body below title | `(0,58)..(400,240)` | 0 |

The remaining HUD columns have no over-threshold pixels. The largest connected
title glyph region begins at `(148,30)` (146 pixels); the battery region is
`(377,6,18,8)` (137 pixels). Native uses the dark/open charging battery pose
in this capture, while the browser's declared frame 4 is solid orange. An
earlier native Settings main capture used the solid-orange frame. These are
different native charging phases; changing the fixed frame again would fit one
still and regress the other. Source telemetry/phase scheduling remains open.

The title uses native `CommonBG_U_00` → `Null_Title` / `TextBoxTitle_00`,
`IconBasic`, English message `settings_title` (`Other Settings`, style 102),
and the delivered shared `cbf_std.bcfnt`. The presenter retains its documented
95-pixel group translation; this is a capture-fitted offset, not a source
translation. An integer search over x=100..299,y=21..55 gives its lowest
over-threshold count at **(0,0)** (1,307), while shifting by one pixel left
in the same region increases the count to 1,724 and shifting right to 1,976.
The predominant opaque orange glyph pixel `(233,137,14)` occurs in both
captures. The residual concentrates on glyph/icon edge coverage and does not
support another group shift or color replacement.

The title assets map to the firmware manifest's
`packs/settings/contents/0000-0000003d/{up,message_EU}.json`, from title
`0004001000022000`, content index 0 / ID `0000003d`:

| Element | Dump source | SHA-256 |
| --- | --- | --- |
| Upper title layout | `up_LZ.bin/blyt/CommonBG_U_00.bclyt` | `a298448098578ecbbaf195fc5b87a76ac7483a363ad5196aaa212b351362f56d` |
| Upper icon layout | `up_LZ.bin/blyt/IconBasic.bclyt` | `5d9360b36dd40db93ba43c8edefad7df8aedaf9ec567d1b138eab19b642d7c48` |
| English `mset` message bank | `message_EU_LZ.bin/message_mset/EU_English/mset.msbt` | `fc91dc60b6db7fe7e2eb4d510ca6c63864eacf150bd72dc02d5541444233cbae` |

`TextBoxTitle_00` is a middle-left aligned native pane (alignment 3). A later
[source font follow-up](native-font-raster.md#settings-middle-left-title-follow-up)
traced that single-line origin and added its pixel-centre alpha path. Its
source-render comparison still leaves a large glyph residual; the baseline
figures in this note describe the earlier production capture.

The [production raster follow-up](settings-other-title-glyph-audit-2026-09-26.md)
in matrix v30 changes the glyph count from 958 to 961 and the whole upper
count from 1,517 to 1,520; the lower stays at 702. It narrows the
left-aligned origin question but leaves edge sampling and projection open.
An arbitrary fractional offset is unsupported. Both production diagnostics
remain `fail`; live HUD status/charging phase, motion and audio are open.
