# HOME Power upper-centering comparison

Base: `b51e2818f293bf0e73986949b8745bc1f8094064`

Source candidate: `294dfb0c` (integrated as runtime `57c4c824`)

Branch: `codex/home-power-centering-compare-20261002`

Feature: L-01. This worker compares the bounded source-block-centering
candidate for the remaining upper Power text. It does not change runtime code
or assets, drive native/browser UI, edit the private matrix, or claim scenario
acceptance.

## Source and prior evidence

The source identity and element mapping remain the
[settled Power contract](home-power-menu-compare.md#native-element-and-source-contract).
The preceding coverage and control evidence is the
[Power raster handoff](home-power-raster-compare.md), with coordinator summary
in [Power raster integration](../home-power-raster-2026-10-02.md).

The pinned source is EUR 10.7.0-32E English HOME Menu
`0004003000009802` v24576, content index 0 / ID `00000082`, converted by
`ctr-native-web` 1.2.0 with CTRTool 1.3.0. Upper `Slp_U_00` member SHA-256 is
`4b2d4f32afdb368996a9d9f6e5947a3b0155bfad802d4c9e9b9696b5a1344027`;
menu MSBT is
`1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350`;
RI style table is
`224aec428f67f35e0a23b3e7de464b2b4fe1d18dd1cf07fa9b0b53d5ad3db555`;
and shared font source is
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`.
No new source identity or unsupported-field interpretation is introduced here.
The candidate is the traced writer-flags-`0x110` measured-rectangle rule:
`paneWidth / 2 - ceil(float32(float32(blockLeft + blockRight) * 0.5f))`.
It is explicitly allowlisted only for upper `Slp_U_00/T_Main_00`; it does not
encode the earlier comparison-only `0.375` candidate, alter the lower sampler,
or change sibling/default text paths.

## Baseline identity

The coordinator recorded a fresh lower-only runtime `766888a2` baseline under
`power-centering-20261002/browser-before/`. Its raw LCD hashes are byte-identical
to the prior final HOME and exact-restored app captures.

| Route/input | Upper SHA-256 | Lower SHA-256 | Capture JSON SHA-256 |
| --- | --- | --- | --- |
| HOME baseline | `735ffe942e43b7b8f641a99b9ef483f4254cf8fa61b9776a10c7f46a4acb134a` | `d24251c858fd8a637dce868fa1a39e12ff691fba3c43fe535e8ab30598dc0488` | `c9073162cceb723ce95a2f0ef8719306d6350bfbfe83a5c5d7d124a691a9090c` |
| App baseline | `735ffe942e43b7b8f641a99b9ef483f4254cf8fa61b9776a10c7f46a4acb134a` | `fb54121829e4dc45bf46a4be5ad41a020326cd9edf970d55f523e57781aa1dd1` | `e3f903dd77d28fc72aa7dc669fab75c770847c14a53dcc161fb40060112376ff` |
| Native HOME `_02.10.26_11.56.52.015.png` | whole-file `a585889277da13c28f9b184c279c9775997859a7dbbdd64a946016dc0dfd4a3e` | same file | n/a |
| Native app `_02.10.26_11.58.26.171.png` | whole-file `238fb53e0d74c29ac914235e7b12016803ff5383a8f7e10ac9cd64d898cd7ad0` | same file | n/a |

Both baseline routes have the same empty-mask native result: upper
4,334/96,000 pixels above 2, mean RGB error 1.748302 and maximum 211; lower
0/76,800, mean 0.006411 and maximum 2. Upper list owns 4,331 high pixels and
the upper footer retains three. Lower Power Off, app `Software closed.`, lower
divider and lower footer all have zero high pixels.

Both fresh native files are 400x480 RGB PNGs and are byte-identical to their
respective earlier named native references. They refresh the comparison input
without introducing native settled-screen variance. Exact native/browser
input cadence and event epochs remain unmatched.

The preserved same-code app variant `03cc6590...` has 6,512 native upper
pixels above threshold and is not substituted as this baseline. The previous
control established that it can recur independently of the lower sampler; it
remains an unexplained browser-output variance, not a centering target.

## Browser after identity

The coordinator captured both routes from production runtime `57c4c824` with
explicit settled presentation sampling at 120,000 ms. Each `capture.json`
records `settledPresentationSample: true`, `inputMatched: false` and
`epochMatched: false`.

| Route | Upper SHA-256 | Lower SHA-256 | Capture JSON SHA-256 |
| --- | --- | --- | --- |
| HOME after | `905288af31f5dfdbbc22c217ae8807cafc6594ba91cd050b0a1aa848ee222bca` | `d24251c858fd8a637dce868fa1a39e12ff691fba3c43fe535e8ab30598dc0488` | `a0e51c959a9a66d93bd3894f57dba2556e3eda8cf063e7a4d6ac78eaf124ffc8` |
| App after | `905288af31f5dfdbbc22c217ae8807cafc6594ba91cd050b0a1aa848ee222bca` | `fb54121829e4dc45bf46a4be5ad41a020326cd9edf970d55f523e57781aa1dd1` | `569e82fb62f6870dcafeee1e6bfefd4adf6a66fe611a037da07716c0324901b7` |
| App fresh-navigation repeat | `905288af31f5dfdbbc22c217ae8807cafc6594ba91cd050b0a1aa848ee222bca` | `fb54121829e4dc45bf46a4be5ad41a020326cd9edf970d55f523e57781aa1dd1` | `237c73a9262393d2e351406b621f5502c479d52a6ab76e0f684194b438bf7f27` |

Both lower PNGs are byte-identical to their route-specific baselines. The
fresh app-navigation repeat is also byte-identical to the first app after pair.
This controls the earlier app-only variance for this replay but does not erase
or explain the preserved `03cc6590...` sample.

## Native comparison result

The existing native CLI was run with the empty mask
`dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`.
The existing
[`compare-home-power-menu.mjs`](../../scripts/compare-home-power-menu.mjs)
recorded route-specific before/after and source-pane regions. No comparison
code, mask or diagnostic algorithm changed.

| Empty-mask screen | Baseline pixels >2 / mean / max | After pixels >2 / mean / max | Outcome |
| --- | ---: | ---: | --- |
| HOME upper | 4,334 / 1.748302 / 211 | 3 / 0.048521 / 50 | List residual removed; footer still fails |
| App upper | 4,334 / 1.748302 / 211 | 3 / 0.048521 / 50 | Same as HOME |
| HOME lower | 0 / 0.006411 / 2 | 0 / 0.006411 / 2 | Byte-identical; static pixel tier preserved |
| App lower | 0 / 0.006411 / 2 | 0 / 0.006411 / 2 | Byte-identical; static pixel tier preserved |

After source-pane regions are identical across routes:

| Upper region | Pixels >2 | Mean RGB error | Maximum |
| --- | ---: | ---: | ---: |
| Heading | 0 | 0.089167 | 2 |
| List | 0 | 0.025265 | 2 |
| Background quiet | 0 | 0.063477 | 1 |
| Divider | 0 | 0.015417 | 1 |
| Footer | 3 | 0.056895 | 50 |

The upper list falls from 4,331 to 0 pixels above 2. Direct browser
before/after comparison attributes 4,327 changed upper pixels to the list,
with heading, background, divider and footer byte-exact between browser
samples. The native comparison's only pixels above threshold are the existing
footer cluster at `(146,188..190)`; they are outside the changed pane.

Every named lower region remains at zero high pixels. App `Software closed.`
is 12,000/12,000 RGB-exact; the Power Off label has mean RGB error 0.085193
and maximum 2. Direct browser before/after lower comparison is byte-exact for
both routes.

## Reports and visual inspection

Private output root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/power-centering-20261002/compare-after/`.

| Route | Empty-mask report SHA-256 | Regional report SHA-256 | Upper sheet SHA-256 | Lower sheet SHA-256 |
| --- | --- | --- | --- | --- |
| HOME | `aec62b45abe839256540739a6cde61511dd6e569a82e81d8848afd08f40a5dab` | `062637be5a4cc593e2027462a197546b6bc8b4495a9ecb36a7f0b45ed8821587` | `b6a40b97fbd6d0611fc75305f27477b915c02116fc818c1afb9c95d27b0b60ea` | `3cfdaeb0cc1921e5d00b782f9bf4f78315abb6a8434512c8ee388dc7ed252f5c` |
| App | `5e6f8fd2a2f564d0731a889db7cabd89fdbe0850ad41662b3cd72059bce380e6` | `73cec303c9a51e9662203897fafe206ae0b9dbd03184cadc0af7c794ddd44c91` | `b6a40b97fbd6d0611fc75305f27477b915c02116fc818c1afb9c95d27b0b60ea` | `e0941fa9d315cfde69a844a36fca054fa78fb1f16a248cd556dce18605fea692` |

The HOME upper and app lower sheets were opened and inspected. The app upper
sheet is byte-identical to the inspected HOME upper sheet. The upper heatmap
shows only the three-pixel footer cluster; the app lower heatmap is black. The
coordinator additionally opened all four route sheets, desktop/mobile Power
screenshots and both browser-motion sheets.

## Verification and acceptance boundary

The coordinator separately reports 1,778 tests passing, zero failing, 23
skipped and one TODO, plus passing typecheck and build. Production HOME- and
app-origin Power, inert footer, physical HOME return and central off/reboot
passed muted without browser errors. Five regression lower LCDs and two
Settings upper LCDs are byte-identical; Health upper samples remain animated
and unmatched. The 32 HOME plus 32 app browser-motion raw pairs had no errors,
but are not native-epoch motion acceptance. Those coordinator checks are
supporting evidence, not this lane's native comparison work.

The source-derived centering rule removes the captured upper list defect and
preserves the lower static pixel tier. Both whole Power scenarios remain
`fail`: three unexplained footer pixels remain, and exact input/HID epoch,
motion, shutdown timing, backlight/indicator ordering and audio are still
unproven. No private matrix entry or global 1:1 claim is changed.
