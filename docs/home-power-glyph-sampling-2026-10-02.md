# HOME Power glyph sampling — 2 October 2026

## Bounded source contract

Runtime `82d26a8b` left 4,331 upper-list and 668 lower-label pixels above
threshold 2, all at a best translation of `(0,0)`. The app-origin lower
`Software closed.` region remained an exact 12,000-pixel RGB match. Those
results are from the coordinator's empty-mask reports and inspected contact
sheets under private root
`power-native-20261002/compare/{home-after,app-after}/`; they support a glyph
coverage correction, not another layout offset.

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

Upper `T_Main_00` is the source 380x136, middle-centred multiline pane
(`alignment 4`, `lineAlignment 1`, zero character spacing). English message
`lau_press_pow_u1` uses RI style 504 at `.65/.65`, one-pixel line spacing and
the already decoded newline advances `[1,.2,1,.2,1,1]`. Its two reduced
advances lead only into whitespace spacer rows. A new explicit
`lcd-spacer-lines` mode accepts only that bounded shape: an upright integer
pane, alpha font, centred multiline text, no color spans or cursor advances,
at least one reduced advance, and every reduced advance leading into a
whitespace-only line. The Power call allowlists only `T_Main_00`.
Its settled matrix is the upright unit transform `[1,0,0,1,10,33]`.

The bitmap writer retains the existing source-derived multiline block and
per-line positions, then samples each original shared-font A4 glyph mask at
final LCD pixel centres with the existing bilinear atlas sampler. This change
adds no font, offset, color, source-size change or capture-fitted coverage
curve. Default and non-eligible paths are unchanged; malformed pane allowlists
and invalid newline-scale arrays fail explicitly.

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

Focused bitmap-font, renderer and system-presentation tests pass 51/51, and
TypeScript checking passes. This worker did not operate Azahar or the shared
production browser and did not run a production build. Therefore improved or
exact native coverage is not yet claimed: the coordinator must integrate,
capture both HOME- and app-origin Power pairs, inspect empty-mask diffs and
rerun the exact `Software closed.` regression. Unsupported RI style words,
input cadence, motion, shutdown fade, LCD/backlight ordering and audio remain
open; both whole scenarios remain fail until new evidence says otherwise.
