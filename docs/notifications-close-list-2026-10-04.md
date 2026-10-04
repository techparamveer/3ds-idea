# Notifications lower Close 577 / list 820 writer trace — 4 October 2026

Worker `codex/notifications-close-list-20261004` from HOME fidelity
`d46f845e` (runtime `7b773b71`). Sparse worktree; `node_modules` linked.
No Azahar, production browser, Sidecar, preview 3021, CDP 9320 or
recapture. No CSS, colour, font, snap, mip, sampler, `lcd`,
`textSampling` or `azahar-12p4-fit` change. HUD (upper 0), text-origin
`8dc72ac6`, SlideBar `0x13a160` (scrollbar 34) are not reopened.

This is **not** a 1:1 claim. Tests and offline renders do not close
pixels, input, motion or audio. Coordinator recapture on Sidecar is the
acceptance gate.

This supersedes the "no unique owner" conclusion for the Close half of
[the earlier source-gap note](notifications-lower-2026-10-04.md). The
list half stays a labelled gap.

## Pair (reused, not recaptured)

Post-scrollbar recapture
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/notifications-scrollbar-recapture-20261004/`
(commit `7b773b71`, empty mask `dc4b320b…`, threshold 2/255).

| Item | SHA-256 |
| --- | --- |
| Native `_27.09.26_13.16.53.105.png` | `58fff71424e1301e6ead6d7ef9281689faa368bf0e6403dc6dccaef1f9afa389` |
| Browser lower | `dfe73825f8f9c299412f71c16e0f127bd7a9e567b494cd5ed4b8048b5c1496c2` |

Lower **1431** = scrollbar `[291,0,320,210]` **34** + list
`[0,0,291,210]` **820** + Close `[0,210,320,240]` **577** (glyphs
`[125,216,195,234]` **521** + seam `[0,210,320,214]` **56**).

## What the Close residual is

Ink centroids of native and browser `× Close` agree to within 0.1 px, and a
0 px shift scores best, so the label is not misplaced. Per-glyph values show
that the white front glyphs sit on a different sub-pixel phase. The native
`l` column is `149 / 255 / 171`, while the browser's is split
`82 / 226 / 243`, about 0.3 px to the right.

Source panes (`news_LZ.bin/blyt/NewsTopBtn_D_00.bclyt`, SHA-256
`3d2c34fc…`): `T_EndF_00` (white, material konst0 255) is alignment 4 /
**explicit line alignment 1**; `T_EndB_00` (konst0 50, y 26.5) is alignment
4 / line alignment 0. Both are 312×21 with size 17.5×21 and `new_back`
` Close`.

Before this change, the renderer sent `T_EndB_00` through the traced
single-line writer: origin `156 − ceil(f32(w/2)) = 120`. `T_EndF_00` fell
back to the generic path, which places it at `(312 − 71.4)/2 = 120.3`.
It was also drawn with Canvas `drawImage` instead of the original alpha
sampler.

## Dump owner (unique, delivered)

EUR Notifications `000400300000a002` v4097, content index 0 / ID
`00000012`, `exefs/code.bin` SHA-256
`b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228`
(private extract
`/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/extracted/notifications/exefs/code.bin`).
Both NW writer routines match the traced HOME routines
([block centring](home-power-block-centering-2026-10-02.md), HOME
`code.bin` `243a728e…`) uniquely, byte for byte, apart from `bl` targets:

| Notifications | HOME | Role |
| --- | --- | --- |
| `0x16b080` (single hit; `0x16b0d8 ldrb r1,[r4,#0xfd]`, `and r1,r1,#3`) | `0x1a3e24` | TextBox → writer flags. Alignment 4 sets `0x10 \| 0x100`; explicit line alignment 1 leaves low bits 0 → `T_EndF_00` = **0x110**; line alignment 0 with `alignment%3==1` → `T_EndB_00` = **0x111** |
| `0x18fe2c` (single hit) | `0x2ffc90` | Origin. `0x10` subtracts `ceil(f32((left+right)·0.5))`. Low bits 0 keep that X for each line. Low bit 1 (`0x18ff8c`) adds `ceil(block/2) − ceil(line/2)` |
| `0x18fffc` | `0x2ffe60` | Line measure returns `right − left` (`0x190058 vsub.f32`) |

For one line whose measured left is 0, the 0x110 and 0x111 origins are
identical. Every `new_back` glyph has a non-negative CWDH bearing (U+E071 1,
space 9, C 1, l 1, o 1, s 0, e 1). So the source owner of the `T_EndF_00`
origin is the same traced single-line writer that `T_EndB_00` already uses.

## Binding

- `src/os/bitmap-font.ts`: new opt-in `singleLineBlockOrigin:
  'writer-0x110'`. It is accepted only for one-line alpha text with
  alignment 4, explicit line alignment 1, zero spacing, no
  cursor/fixed-width/scale spans, and non-negative glyph bearings and
  advances. Any other shape throws `Unsupported native single-line block
  origin`. An accepted pane takes the existing 0x111 single-line route
  (`nativeCenteredGlyphQuads` + `rasterNativeAlphaGlyph`).
- `src/os/native-layout.ts` / `native-renderer.ts`: the override is
  carried as a pane-text field (cleared on text replacement, like
  `multilineBlockOrigin`) and passed to `drawNative`.
- `src/os/stock-native-personal-tools.ts`: only `T_EndF_00` opts in.
  `T_EndB_00`, `new_back`, SceneIn 20, rows, titles and SlideBar are
  unchanged. Default callers elsewhere are unchanged.

Provenance: manifest `packs/notifications/news.json` (`9f6e27e6…`, from
`RomFS/news_LZ.bin` `4b4e5bd8…`, converter 1.3.1) layout
`NewsTopBtn_D_00`; message `packs/notifications/messages-and-loose.json`
bank `newslist_msbt_LZ` label `new_back`; shared `cbf_std` font
`fonts/shared/font.json`. No new asset is delivered.

## Offline proxy (not acceptance)

`@napi-rs/canvas` render of the worktree painter (private
`.../home-fidelity-20261001/notifications-close-list-20261004/`,
`probe-render.mjs` adapted from `scripts/verify-native-personal-tools.mjs`).
Offline differs from Chrome by 448 px at baseline, so these counts are
diagnostic only:

| Offline vs native | Close | Close glyphs | List |
| --- | ---: | ---: | ---: |
| before | 613 | 533 | 1154 |
| bound `T_EndF_00` | 262 | 182 | 1154 |

Remaining Close-glyph error is mostly the dark `T_EndB_00` shadow. It sits
at y 26.5, a half-pixel phase on the already-traced 0x111 path, and native
draws it slightly darker (Δ ≤ 24). The seam is the balloon clip at y = 210.
Both are left as they are. Expected browser Close is lower than 577. Only
coordinator recapture can establish it.

## List 820 stays a labelled gap

`T_NewsTitleB_00` / `T_NewsTitleF_00` are alignment 3 / line alignment
2 → flags `0x101`. With `left = 0`, the low-bit-1 branch adds
`ceil(w/2) − ceil(w/2) = 0`. So the generic path's X (`0`) already equals
the source origin, and the writer does not own the list residual. Browser −
native in the list is small edge AA (|Δ| ≤ 13), mostly on the white
`T_NewsTitleB_00` shadow at its half-pixel y (−9.5) over the cyan balloon.
Changing that would be a sampler or precision guess. The titles are not
opted in. **820** remains labelled AA / source gap.

## Remaining residuals (labelled)

- Close: `T_EndB_00` shadow half-pixel coverage and seam **56**: adaptation
  gap, browser count pending recapture.
- List **820**: title-shadow AA, source gap.
- Scrollbar **34**: separate leftover, not reopened.
- Whole lower still **fail** until recapture. Input, motion and audio not
  compared.

## Checks

`tests/notifications-close-list.test.mjs` (source pane flags, writer
equivalence and guards, painter binding, private `code.bin` words) and
the updated painter regex in `tests/notifications-lower.test.mjs`, plus
`tests/bitmap-font.test.mjs`, `tests/native-renderer.test.mjs` and
`tests/notifications-upper-body.test.mjs`: 62/62 pass. `npm run
typecheck` passes. Full `npm test` gives 2043 pass / 36 fail / 23 skipped.
All 36 failures are `model/` ENOENT GLB tests, because this sparse worktree
has no `model/` by instruction. `npm run build` cannot run here: Turbopack
rejects the linked `node_modules` symlink as outside the filesystem root.
The coordinator's integrated build is still required.
