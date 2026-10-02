# HOME Power glyph sampling — 2 October 2026

## Measured result and retained source contract

Runtime `82d26a8b` left 4,331 upper-list and 668 lower-label pixels above
threshold 2, all at a best translation of `(0,0)`. The app-origin lower
`Software closed.` region remained an exact 12,000-pixel RGB match. Those
results are from the coordinator's empty-mask reports and inspected contact
sheets under private root
`power-native-20261002/compare/{home-after,app-after}/`; they support a glyph
coverage experiment, not another layout offset.

The lower `T_BtnB_01` and `T_BtnF_01` panes are source single-line,
middle-centred text (`alignment 4`, `lineAlignment 0`, zero character spacing,
236x27 integer panes). English label `lau_b_shutdown` uses RI style 501 at
`.65/.65`. They now opt into the renderer's existing final-LCD A4 sampler.
Only those two pane names are eligible, so `T_Top_00` (`Software closed.`), the
footer and all other layouts keep their prior raster path.

At settled source `SceneIn` frame 20, the renderer pose gives unit upright
pane matrices `[1,0,0,1,42,169.5]` for `T_BtnB_01` and
`[1,0,0,1,42,167.5]` for `T_BtnF_01`. The existing single-line LCD path is
therefore eligible and preserves the source half-pixel vertical phase instead
of resampling an already painted pane image.

Production runtime `459d623f` measured this lower opt-in in both HOME- and
app-origin Power. Lower pixels above threshold 2 fell from 668 to zero, with
maximum RGB delta 2 and mean RGB error `0.006410590277777778`. The button-label
region likewise has zero pixels above 2 and maximum delta 2. App-origin
`Software closed.` remains exactly matched across all 12,000 region pixels.
This supports retaining only the pane-scoped lower sampler.

The same candidate tried direct final-LCD sampling for upper `T_Main_00`.
That source pane is 380x136, middle-centred multiline text with settled matrix
`[1,0,0,1,10,33]`; its decoded newline advances remain
`[1,.2,1,.2,1,1]`. Despite that eligibility, the result did not explain the
residual: upper pixels above 2 changed only from 4,334 to 4,329, while mean RGB
error worsened from `1.748302` to `1.7498888888888888` and maximum delta stayed
211. The list region changed from 4,331 to 4,326 high pixels and its mean
absolute RGB difference worsened from `5.304089` to `5.309017`. The direct
before/after upper comparison changed only five pixels above threshold.

Consequently the `lcd-spacer-lines` renderer mode, multiline bitmap branch,
upper opt-in and their specific tests were removed. Upper `T_Main_00` keeps its
previous multiline raster path and remains an open source question. The
retained change adds no font, offset, color, source-size change or
capture-fitted coverage curve. Default and non-allowlisted paths remain
unchanged; malformed or missing pane allowlists fail explicitly.

The comparison report's bilinear diagnostic selects candidate sample offset
`(+0.375,0)` for every upper list block. That is not a decoded source
coordinate and does not authorize a fitted runtime offset. It does identify a
bounded trace target: the current generic multiline path uses
`(width-blockWidth)/2` for this `alignment 4` / `lineAlignment 1` block,
whereas traced centred writer paths apply ceil-half rounding. Whether native
block centring uses analogous rounding remains unproven and is the next upper
source question, outside this cleanup.

## Source identity and evidence limit

The pinned source remains EUR 10.7.0-32E HOME Menu
`0004003000009802` v24576, content index 0 / ID `00000082`, converted by
`ctr-native-web` 1.2.0 with CTRTool 1.3.0. Upper `Slp_U_00.bclyt` member
SHA-256 is `4b2d4f32afdb368996a9d9f6e5947a3b0155bfad802d4c9e9b9696b5a1344027`;
lower `Slp_D_00.bclyt` is
`1609d6b1bd27a954da7c65be5782b77320e8a5faedca5f3dd1f25d3eea95d56d`;
English `menu_msbt_LZ.bin` is
`1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350`;
RI style table is
`224aec428f67f35e0a23b3e7de464b2b4fe1d18dd1cf07fa9b0b53d5ad3db555`;
and shared `cbf_std.bcfnt.lz` is
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`.

The measured HOME report and regional report have SHA-256
`add9c6406c9d7f0b2d2499d4293cb7896d4d4a2fbff7843cd991743f86634878`
and `ac0ea183f379d5745482247507e9b0a173809850467941956a1ed555acdc9419`;
the app equivalents are
`acb3069b86eab66a2a56eed3f195b82903c47cd1d383fda02055d0cd35a65dde`
and `7e4ca080f6af480eeaba3ef3330db723f0dfe0a95a0c87f81e531702d60e0cb0`.
They are under private root `power-raster-20261002/compare-after/{home,app}/`.

After removing the ineffective upper path, focused bitmap-font, renderer and
system-presentation tests pass 50/50, TypeScript checking passes and the diff
whitespace check passes.

This worker did not operate Azahar or the shared production browser and does
not claim whole-scenario acceptance. The coordinator must integrate this
cleanup, rebuild and recapture to confirm that the lower improvement remains
while the ineffective upper change disappears. Unsupported upper coverage,
RI style words, input cadence, motion, shutdown fade, LCD/backlight ordering
and audio remain open; both whole scenarios remain fail.
