# HOME root page boundary — 2 October 2026

## Scope and conclusion

This bounded slice separates the captured root exposure from the browser's
300-slot storage capacity. The isolated native profile exposes slots `0..59`:
six rows fit one page with no arrows; five rows have a one-column endpoint at
left slot `15`, with both arrows before that endpoint and only the left arrow
at it. Keyboard navigation also stops at slot `59`.

The browser therefore keeps all 300 stored slots but uses an exposed extent of
60 for painting, hit testing, drag scrolling, keyboard input, page-arrow input,
arrow visibility and `LncPlt_00` pane geometry. To avoid hiding existing browser
data, the exposure expands only far enough to include an already occupied or
folder slot, a restored selection, or a restored viewport. That expansion is a
portfolio data-preservation adaptation, not a claim about native allocation or
growth. It is derived at runtime and does not change the saved-data schema.

## Captured evidence

All native captures are Azahar's own 400×480 PNGs from the isolated profile:

| State | Capture SHA-256 | Observation |
| --- | --- | --- |
| six-row folder selection | `498decca8e484be750bb6b212cf94f5556b6cf4cceab668a5cbd0d51119e1989` | no arrows; right tray corner closes at x310 |
| six-row vacant selection | `4cc1f8febd8f6985e06cab7250c0903703cac73b751573728dc5d3372c979c97` | same boundary, independent of occupancy at the selected slot |
| six-row raw right-edge tap | `9e6359e3a4bfca8e61570238482ac4ec494056c97304bfd6b58723b1a60a03b5` | viewport and selection remain unchanged |
| five-row right endpoint | `ee317ea2af4ff3b7ae21a3ec8347fc4a78de0e5c760c163886fd40c3b80c1677` | left arrow only; tray closes on the right and extends past the left LCD edge |
| five-row origin | `62535b29e97a05040a0f4e90afed5bc0c36cc393e38889c8af48bcf1bd430533` | right arrow only; tray closes on the left and extends past the right LCD edge |
| six-row restored | `d10e0890847774006f5a33776d7f8925e717d257139fd0e043ccec5670983ab5` | returns to one page with no arrows |
| keyboard slot 53 → 59 | `8f67a5bc341e9c07eceb668ad6309f0afa907ed0035aa014b0fb8c2fe2068787` | last captured root slot is reachable |
| keyboard right at slot 59 | `93378f5dc438bf47f7d9e596969f8c811867161664aa66d95b26f9880feb336a` | selection remains at 59 |

The pre-change browser lower captures are under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-page-boundary-20261002/browser-before/`.
Notable SHA-256 values are six-row root
`9f29d2bba3ec11f5f8cee3736ba760039e46d59912b815e8e1af069112979087`,
six-row right attempt
`b88636c6a06deae7e7ace0efc13d5974d62122dc62a1ab36ed292f527049bc1a`,
five-row root
`dee453d02a689243fc70c0884709728782cadaf68c445d3c993d4a1a95d16d61`,
and five-row right attempt
`df1fb44fff6cebb74f8c5f54af5353c077a9d2850c0bf94fc8969a7f7bb75261`.

## Native resource mapping

The pinned source is EUR HOME Menu title `0004003000009802`, version `24576`,
content index `0` / content ID `00000082`, RomFS `launcher_LZ.bin` SHA-256
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.
The checked manifest was produced by `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

| Visible element | Manifest key / internal path | SHA-256 |
| --- | --- | --- |
| root tray | `home.launcher` → `layouts.LncPlt_00` → `launcher_LZ.bin/blyt/LncPlt_00.bclyt` | `e4875783c38f0fde3656ed9c1964110fb9210765400ba2cfca49480998e9874b` |
| tray settled palette | `animations.LncPlt_00_PaletteOut` → `launcher_LZ.bin/anim/LncPlt_00_PaletteOut.bclan` | `8b0a99c062aeac2cf891c519cd66019e6f5f1e3348bc95e05d5d7d3d9c430a44` |
| page arrows | `layouts.LncArw_00` → `launcher_LZ.bin/blyt/LncArw_00.bclyt` | `b10fb39ab2c122041512b2b504107c792c40193344c907441acb603895816ed8` |
| settled arrow pose | `animations.LncArw_00_Appear` → `launcher_LZ.bin/anim/LncArw_00_Appear.bclan` | `cd26320af0d48b4af048fb58bbe755115fa0cde3e959285519b724bbd65dd11f` |

`LncPlt_00` supplies the pane art. The existing source-derived pane setter is
retained; this slice corrects its root extent input from storage capacity 300 to
the captured exposure. `LncArw_00` has independent `N_arwL_00` and
`N_arwR_00` groups, so both visibility decisions are now explicit.

## Verification status and remaining gap

Focused HOME presentation, scroll-consumer, paint and navigation tests pass
91/91. A second focused controls/gesture/history/density/cursor/folder-close
sweep passes 104/104 (the added persistence case was rerun separately). The
typecheck (`npm run typecheck`) and `git diff --check` pass. Per lane rules, this worker did not
run the full suite/build or operate Azahar/the shared production browser.

Strict native comparison remains pending coordinator integration and recapture.
The native rule for growing a profile beyond 60 exposed root slots is still
unknown; the compatibility expansion above must remain labelled as an
adaptation until captured/source evidence replaces it.
