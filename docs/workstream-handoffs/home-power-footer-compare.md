# HOME Power upper-footer comparison

Base: `34be5b98dd0eb4fc20157621dd4effa5f873d26b`

Source candidate: `bc37da53` (integrated as runtime `d4c96f26`)

Branch: `codex/home-power-footer-compare-20261002`

Feature: L-01. This lane compares only the three remaining upper Power footer
pixels. It does not change runtime code or assets, operate native/browser UI,
edit the private matrix, or reopen the resolved upper-list centering.

## Source and baseline contract

The source identity and element mapping remain the
[settled Power contract](home-power-menu-compare.md#native-element-and-source-contract).
The immediately preceding evidence is the
[block-centering comparison](home-power-centering-compare.md), with coordinator
summary in [Power centering integration](../home-power-centering-2026-10-02.md).

The pinned source is EUR 10.7.0-32E English HOME Menu
`0004003000009802` v24576, content index 0 / ID `00000082`, converted by
`ctr-native-web` 1.2.0 with CTRTool 1.3.0. Upper `Slp_U_00` member SHA-256 is
`4b2d4f32afdb368996a9d9f6e5947a3b0155bfad802d4c9e9b9696b5a1344027`;
English menu MSBT is
`1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350`;
RI style table is
`224aec428f67f35e0a23b3e7de464b2b4fe1d18dd1cf07fa9b0b53d5ad3db555`;
and shared font source is
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`.

Canonical baseline is runtime `57c4c824`, captured under internal
`power-centering-20261002/browser-after/`. A fresh replay under
`power-footer-20261002/browser-before/` reproduces all four raw LCDs exactly:

| Route | Upper SHA-256 | Lower SHA-256 | Fresh capture JSON SHA-256 |
| --- | --- | --- | --- |
| HOME | `905288af31f5dfdbbc22c217ae8807cafc6594ba91cd050b0a1aa848ee222bca` | `d24251c858fd8a637dce868fa1a39e12ff691fba3c43fe535e8ab30598dc0488` | `038ae1b98293f87b76eadfd96967cfc7b30898799e27a9286e27e5c74a430d88` |
| App | `905288af31f5dfdbbc22c217ae8807cafc6594ba91cd050b0a1aa848ee222bca` | `fb54121829e4dc45bf46a4be5ad41a020326cd9edf970d55f523e57781aa1dd1` | `7b8862170e66ac94c56d054414acffb78cd57936df39913f7d5db7ece1be66ad` |

The fresh native references are HOME Power
`_02.10.26_12.10.33.701.png`, SHA-256
`a585889277da13c28f9b184c279c9775997859a7dbbdd64a946016dc0dfd4a3e`,
and app Power `_02.10.26_12.12.12.064.png`, SHA-256
`238fb53e0d74c29ac914235e7b12016803ff5383a8f7e10ac9cd64d898cd7ad0`.
Each is byte-identical to its prior named native reference.
Both baseline routes have the same empty-mask result: upper 3/96,000 pixels
above 2, mean RGB error 0.048521 and maximum 50; lower 0/76,800, mean
0.006411 and maximum 2. The upper list, heading, background and divider have
zero high pixels. App `Software closed.` is 12,000/12,000 RGB-exact.

## Exact three-pixel residual

All remaining pixels are in upper `Slp_U_00/T_Btm_00`, first line of English
message `lau_press_pow5` (`Close the system to enter Sleep Mode.`), style 503.
They occupy one vertical column on the right-edge tie of the third lowercase
`s` in the line, which is the second/final `s` of `system`:

| LCD coordinate | Native RGB | Browser RGB | Absolute RGB delta |
| --- | --- | --- | --- |
| `(146,188)` | `[78,78,81]` | `[62,62,65]` | `[16,16,16]` |
| `(146,189)` | `[85,85,93]` | `[35,35,45]` | `[50,50,48]` |
| `(146,190)` | `[80,80,81]` | `[63,63,65]` | `[17,17,16]` |

The footer pane is a decoded `txt1` with size `380x63`, alignment 4 and line
alignment 0. Style 503 supplies scale `0.699999988079071`, zero character
spacing and zero line spacing. The traced pane setup selects writer flags
`0x111`: center the measured block and center each measured line. The first
line measures `337.3999938964844`, giving source origin 21.

The shared-font U+0073 glyph is atlas sheet 0 rectangle `(76,65)`, size
`12x30`, left bearing 0 and advance 13. For the affected final `s` in
`system`, the float32 cursor is `128.10000610351562` and width is
`8.399999618530273`. Its exact right endpoint is local x136.5 and, after the
pane's x10 translation, screen x146.5. The generic binary64 path ended at
local `136.49999803304672` and excluded LCD x146. Source A4 last-column alpha
and transparent-padding pairs predict the same three nonzero rows and captured
delta shape. Adjacent glyph and scan-line pixels match within threshold. This
is a glyph-endpoint arithmetic residual, not evidence for pane or line
translation, color change or a fitted offset.

Candidate `bc37da53` implements explicit `writer-0x111` geometry and direct
LCD alpha sampling only for Power upper `T_Btm_00`. It accepts only multiline
alpha text with this decoded alignment and zero spacing under an upright,
unit-scale, integer-sized pane transform. `T_Main_00` remains on
`writer-0x110`; both lower sampled labels and default text paths are unchanged.
The worker reports 53/53 focused tests, typecheck and whitespace checks passing;
native/browser comparison still belongs to the coordinator and this lane.

## Browser after identity

The coordinator captured both routes from production runtime `d4c96f26` with
explicit settled presentation sampling at 120,000 ms. Every `capture.json`
records `settledPresentationSample: true`, `inputMatched: false` and
`epochMatched: false`.

| Route | Upper SHA-256 | Lower SHA-256 | Capture JSON SHA-256 |
| --- | --- | --- | --- |
| HOME after | `40f63b22032625d7952e3bc77b3a1c9297f845dc169caa4f5c783edcb4e0955f` | `d24251c858fd8a637dce868fa1a39e12ff691fba3c43fe535e8ab30598dc0488` | `666c68bdb2457fbf96a17d8bad0aa9917c42d5bba4d1cb5ac8fbdd4764b4599c` |
| App after | `40f63b22032625d7952e3bc77b3a1c9297f845dc169caa4f5c783edcb4e0955f` | `fb54121829e4dc45bf46a4be5ad41a020326cd9edf970d55f523e57781aa1dd1` | `9003f73a19dc59b4d20ad4ec279b082a806d5738f56bf27c22cc0a10d14e5f57` |
| Coordinator app-only repeat | `40f63b22032625d7952e3bc77b3a1c9297f845dc169caa4f5c783edcb4e0955f` | `fb54121829e4dc45bf46a4be5ad41a020326cd9edf970d55f523e57781aa1dd1` | `2b2097d1c1475bf3f2327168d161dcac67b028ca48cd4b662d09dfe7bd7b16a0` |

Both lowers are byte-identical to their route-specific baselines. The
coordinator's fresh app-only repeat is byte-identical to the first app after
pair. This controls the output for this replay; it does not erase or explain
the earlier preserved same-code app variance.

## Native comparison result

The existing native CLI was run with empty mask
`dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
The existing
[`compare-home-power-menu.mjs`](../../scripts/compare-home-power-menu.mjs)
recorded route-specific before/after and source-pane regions. No comparison
code, mask or diagnostic algorithm changed.

| Empty-mask screen | Before pixels >2 / mean / max | After pixels >2 / mean / max | Outcome |
| --- | ---: | ---: | --- |
| HOME upper | 3 / 0.048521 / 50 | 0 / 0.049517 / 2 | Full upper static pixel tier |
| App upper | 3 / 0.048521 / 50 | 0 / 0.049517 / 2 | Same as HOME |
| HOME lower | 0 / 0.006411 / 2 | 0 / 0.006411 / 2 | Byte-identical; tier preserved |
| App lower | 0 / 0.006411 / 2 | 0 / 0.006411 / 2 | Byte-identical; tier preserved |

Every named after region is at zero pixels above 2. The upper list remains at
mean RGB error 0.025265 / maximum 2; heading maximum 2, background maximum 1,
divider maximum 1. Footer improves from 3 to 0 high pixels and maximum 50 to
2. Its mean error increases slightly from 0.056895 to 0.060753 because direct
sampling changes additional sub-threshold coverage. The whole-upper mean
similarly changes from 0.048521 to 0.049517. This is a threshold-tier result,
not an RGB-exact result.

Direct browser before/after comparison changes 498 upper pixels, all inside
the footer; three exceed 2 and maximum change is 50. The list, heading,
background and divider are byte-identical between browser samples. At each
captured defect coordinate, the after RGB now equals native exactly:

| LCD coordinate | Before browser RGB | After/native RGB |
| --- | --- | --- |
| `(146,188)` | `[62,62,65]` | `[78,78,81]` |
| `(146,189)` | `[35,35,45]` | `[85,85,93]` |
| `(146,190)` | `[63,63,65]` | `[80,80,81]` |

Direct before/after lower comparison is byte-exact for both routes. Every
named lower region remains at zero high pixels; app `Software closed.` stays
12,000/12,000 RGB-exact and the Power Off label remains maximum 2.

## Reports and visual inspection

Private output root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/power-footer-20261002/compare-after/`.

| Route | Empty-mask report SHA-256 | Regional report SHA-256 | Upper sheet SHA-256 | Lower sheet SHA-256 |
| --- | --- | --- | --- | --- |
| HOME | `2ac3b443b1665f1d88b7f7e4871158e3b6210ddb61e817d0ec9607873f678296` | `796224eb2dbcff047e45f37cdb6fd72c91d9523615b7f3c07c60d3f46de6c013` | `8d62f8ab11e42388ec01c174b6181a1758e02732c68779de65d1a9c0759a4b4d` | `3cfdaeb0cc1921e5d00b782f9bf4f78315abb6a8434512c8ee388dc7ed252f5c` |
| App | `cbe15ba1842d1519e5456e101eb232e7ac00c884ace52d5ba10d35860967e993` | `df499a7ec9fa5b3cc2ffab77562502a4d621dfebed7a4cdae7a69415beb0dad8` | `8d62f8ab11e42388ec01c174b6181a1758e02732c68779de65d1a9c0759a4b4d` | `e0941fa9d315cfde69a844a36fca054fa78fb1f16a248cd556dce18605fea692` |

Both upper sheets and the app lower sheet were opened. The two upper sheets
are byte-identical and their heatmaps are black; the app lower heatmap is also
black. The rendered source-backed footer, already-resolved list and exact app
lower content are visually aligned in the inspected sheets.

## Verification and acceptance boundary

The coordinator separately reports 1,780 tests passing, zero failing, 23
skipped and one TODO, plus passing production build and typecheck. Production
HOME- and app-origin Power, inert footer, HOME return and central off/reboot
passed muted without browser errors; desktop/mobile physical Power, inert
footer and HOME controls also passed. Five regression lower LCDs and two
Settings upper LCDs are byte-identical. Health main/Usage/scrolled upper
animated backgrounds differ at 241/2,034/14,281 pixels above 2, maximum
7/35/43, with unmatched local phases. Those are supporting checks, separate
from this lane's native comparison.

The source-derived footer rule gives both HOME- and app-origin Power complete
empty-mask two-LCD static pixel-tier matches: zero pixels differ by more than
2 and maximum is 2. Both whole scenarios nevertheless remain `fail`: exact
input/HID epoch, motion, shutdown timing, LCD/backlight/indicator ordering and
muted audio are unproven, and the older app-output variance remains
unexplained. No private matrix entry or global 1:1 claim changes.
