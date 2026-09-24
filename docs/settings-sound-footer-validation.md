# Settings Sound footer correction

Settings → Other Settings → Sound now shows the original Cancel/OK footer.
Previously its lower painter fell through to the generic Back-only footer.
The semantic Cancel action still returns to Other Settings page 2; OK and
Surround/Stereo/Mono stay inert under the portfolio's read-only scope.
Nintendo 3DS Sound playback and all Camera files are unchanged.

## Exact source evidence

EUR Settings title `0004001000022000`, content `0000003d`:

- Executable SHA-256:
  `1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`.
- Original `table_LZ.bin` SHA-256:
  `1df90f560d13eb1fbc46f0a1c33b9f743b2686ad64eb5c0f980ac75224de7794`.
- Its `sound.bin` record SHA-256:
  `d5f023a1e5554463fd4de73987e6271f195617e12fdcdadd993b996b2cd24e5b`.
  Byte 0 is footer kind **2**. The source text fields name
  `base_2b_cancel` and `base_2b_decide` (**Cancel**, **OK**).
  The scene separately names `Sound_D_00`, type `Sound`, parent `basic_top2`
  and native confirmation `dlg_sound_set`.
- Executable footer table `0x2987bc`, index 2, points to `Base_D_01`.
  The delivered layout exactly matches original member
  `base_LZ.bin/blyt/Base_D_01.bclyt`, SHA-256
  `52134982abf8c89ec50635bf684220696718baeed8190f6ad81bdc28134e3ec3`.
- Original footer bounds are 120×32 at lower-left and lower-right, logical
  rectangles `(0,208,120,32)` and `(200,208,120,32)`. Existing Back action
  geometry already matches the native Cancel rectangle. OK has no target.

No resource was republished or edited. Both foreground/shadow labels retain
the delivered English message styles. The existing source mode buttons,
upper screen, source selection endpoints and shared preferences are unchanged.
`dlg_sound_set` and device configuration are deliberately not invoked.

## Verification

- `audit-settings-sound-footer.py` re-reads the original table and executable,
  asserts scene/footer mapping, compares original and delivered layout member
  identity and verifies the English labels. Passes with absolute private paths.
- `settings-sound-footer.test.mjs` verifies original bounds, navigation into
  Sound, semantic Cancel, inert modes/OK/A, parent return and shared-data
  immutability. Together with `stock-screen-layout.test.mjs`: **27 passed**.
- `npm run typecheck` and `git diff --check` pass.
- Existing `verify-stock-settings.mjs` now asserts the two-control Sound footer
  and four styled labels. All **86 LCD renders** pass with no diagnostics.
  Before/after hashes differ only for `detail-sound-bottom`; the upper LCD and
  every other Settings specimen remain identical. The before/after lower PNGs
  were visually inspected.

Private evidence is under
`/Users/paramveer/.codex/artifacts/settings-sound-footer/`: `source-audit.json`,
`tests.log`, `comparison.json`, and `before/` / `after/` rendered specimens.
Home-disk artifacts follow the coordinator's override while the SSD is full.
No browser or native-emulator comparison was performed; the coordinator owns
that verification. Strict whole-page 1:1 acceptance remains open.
