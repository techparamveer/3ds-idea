# Notifications list 820: row-title direct sampling (writer 0x101) — 4 October 2026

Worker `codex/notifications-list-direct-20261004` from `ca4d95d5`. No Azahar,
production browser, Sidecar or recapture. No CSS, colour, font, snap, mip,
sampler, `azahar-12p4-fit`, HUD, scrollbar or Close-writer change.

This is **not** a 1:1 claim. Tests and offline renders do not close pixels,
input, motion or audio. Coordinator recapture is the acceptance gate.

Follows [the list 820 note](notifications-list-820-2026-10-04.md), which
was this feature's one source-only slice. This slice makes the visible change.

## Pair (frozen, not recaptured)

| Item | SHA-256 |
| --- | --- |
| Native `_27.09.26_13.16.53.105.png` | `58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389` |
| Browser lower (`notifications-close-240-recapture-20261004/browser/lower.png`) | `6397346da81a190c587b058b9612badc6bd9a99704a1d123569d427c87605151` |
| `code.bin` | `b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228` |

Report `9b57a711…`, threshold 2/255. Target regions: list `[0,0,291,210]`
**820**, seam `[0,210,320,214]` **56**.

## Same origin as line alignment 0

The list 820 note traced `0x16b080` → flags **0x101** for alignment 3 /
line alignment 2, and origin `0x18fe2c`. Bit `0x100` is the same vertical
`ceil` as 0x100. Low bit 1 adds `ceil(block/2) − ceil(line/2)`. For one
line, block equals line, so the result is **0**. No `0x10` means the
horizontal origin stays left. So a one-line 0x101 title uses the same quads
as 0x100 (alignment 3 / line alignment 0): `nativeLeftGlyphQuads`. The
test renders both through `drawNative` on the direct sampler and checks that
the coverage is byte-identical.

## Change (bounded, opt-in)

- `native-renderer.ts` `text()`: new `writer0101` term in `direct`. It
  needs an **explicitly allowlisted** pane (`textSamplingPanes` contains the
  pane), plain `lcd` sampling (not `lcd-source-size*`), alignment 3, line
  alignment 2, one line, alpha font, character spacing 0, and no colour
  spans, cursor advances, line-advance scales or block-origin overrides.
  Every glyph bearing must also be ≥ 0, so the measured left is 0. Otherwise
  the pane keeps the old raster path, with phase `[0,0]`.
- `bitmap-font.ts` `nativeAlignedLine`: accepts alignment 3 / line
  alignment 2 / alpha only when the caller's direct LCD sampler is active
  (`lcdBottomEdge`, which the renderer sets to `direct`). A negative bearing
  on that path throws `Unsupported native writer-0x101 line`. Raster callers
  are unchanged.
- `stock-native-personal-tools.ts`: `NewsWndwNews_D_00` rows draw with
  `textSampling:'lcd', textSamplingPanes:['T_NewsTitleB_00','T_NewsTitleF_00']`.
  `T_NewsTitleB_00` (y −9.5) samples once at phase `[0,0.5]` and
  `T_NewsTitleF_00` (y −8.00074) at `[0,0.00074]`. Close `NewsTopBtn_D_00`
  keeps `textSamplingPanes:['T_EndB_00']`. `T_EndF_00` stays on
  writer-0x110, which still rejects LCD sampling.

## Other alignment 3 / line alignment 2 panes (audit)

Converted packs with one or more 3/2 text panes:

| Pack / layout | Panes | Drawn with `textSampling`? |
| --- | --- | --- |
| camera `lyt-C-Dlg` `C_DlgGuid1BtnW`, `C_DlgGuid2Btn` | `TxtNumber0` | yes, whole-layout `lcd-source-size` (no allowlist) |
| sound `lyt-C-Dlg` (same two layouts) | `TxtNumber0` | no |
| home `themeshop` `TmsWndwBtn_D_00` / `_U_00` | `T_TitleF_*`, `T_PriceTex_*` | no (not drawn) |
| settings `up` `SMng_U_00/01/02` | `TextBox_00`, `TextBox_03` | no |
| sound `S_Common-Text`, `S_Inf_U-TitleBar` | `Null`, `TitlTxt` | no |
| notifications `NewsWndwNews_U_00` | titles | no (not drawn) |

The dump does not show that these panes share Notifications' writer. They
belong to other titles. So the extension requires an allowlist rather than
treating every 3/2 pane the same way. Camera `TxtNumber0` uses
`lcd-source-size` without an allowlist, so it fails both the `explicitPane`
and the `!sourceSize` conditions. Its output is unchanged. Settings, Sleep,
HUD and Health callers do not reach the new term.

## Offline proxy (not a pixel bar)

`@napi-rs/canvas` 0.1.100 full-painter render (`notifications-list`, nine
source rows, selection 0) through the real `drawNativePersonalToolFrame`.
Artifacts are private, in
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/notifications-list-direct-20261004/`
(`probe-render.mjs`, `cmp.mjs`, `where.mjs`, `head/`, `new/`).

| Region (vs native, 2/255) | HEAD `ca4d95d5` | This slice |
| --- | ---: | ---: |
| List `[0,0,291,210]` | 1154 (max 46) | **17** (max 10) |
| Seam `[0,210,320,214]` | 80 (max 40) | **0** (max 2) |
| Close glyphs | 0 | 0 |
| Scrollbar | 38 | 38 (unchanged) |

HEAD → new changes only `[62,46]..[250,211]`, the title boxes. All 17
remaining list pixels are on single glyph rows at y 62, 115 and 168. The
HEAD proxy is not the frozen browser: it differs by 371 list pixels
because napi `drawImage` filtering is not Chrome's. The new path rasterises
glyphs with `rasterNativeAlphaGlyph` and composites at integer positions,
so its result depends less on the host. Only a coordinator recapture
measures the browser.

## Not changed

Multiline, `sourceTopLeft`, writer-0x111 / 0x110, Close
`T_EndF_00` / `T_EndB_00` bindings, `azahar-12p4-fit`, scrollbar **34**,
HUD, upper cards, Camera / Settings / Sound / Sleep / Health callers, assets
and manifests. No new asset. Provenance stays as in the list 820 note:
`packs/notifications/news.json` (`9f6e27e6…`, from `RomFS/news_LZ.bin`
`4b4e5bd8…`, converter 1.3.1) layout `NewsWndwNews_D_00` (`dfa42ef3…`),
shared `fonts/shared/font.json`.

## Checks

`tests/notifications-list-direct.test.mjs` (new) covers:

- `renderer.draw` wiring on slots 0–3: B phase `[0,0.5]` with LCD on, F
  LCD on.
- Opt-in: no allowlist, `lcd-source-size` and a negative bearing all keep
  phase `[0,0]`.
- Close is unchanged: `T_EndB_00` LCD at 0.5 and `T_EndF_00` rejects LCD.
- 3/2 equals 3/0 on the direct sampler, and the raster path is unchanged.

The four painter-pinning tests (`notifications-close-list`, `-list-820`,
`-lower`, `-upper-body`) are updated to the new allowlist. `npm run
typecheck` passes. In `npm test`, only the 36 tests that need model GLBs
fail: those files are absent from this sparse worktree (ENOENT). The full
`npm test` / `npm run build` and recapture remain the coordinator's job.
Whole lower remains **fail** until recapture. Input, motion and audio are
not compared.
