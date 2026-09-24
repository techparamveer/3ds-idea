# Settings Language source audit

System Settings → Other Settings → Language now draws the EUR source scene,
`language_eu`, as a read-only page. The lower screen shows the eight-language
`Country_D_00` list with configured English decided, the source slide bar and
the `Base_D_01` Back/OK footer. The upper screen was already source-correct
and is byte-identical to the previous render. Before this change the lower
screen was an adapted text card showing "English".

This is source-render evidence only. It has not been inspected in a browser
or compared with a native LCD capture; both belong to the coordinator. Strict
1:1 fidelity remains unproven.

## Source identity

- **Title:** Settings `0004001000022000`, content `0000003d`, EUR 10.7.0-32E.
- **Code:** `code.bin` SHA-256 `1f9351cd921d3f3d…d45b5`, mapped at `0x100000`.
- **Scene table:** `table_LZ.bin` SHA-256 `1df90f560d13eb1f…7794`.
- **Messages:** `message_EU_LZ.bin`, `EU_English/mset.msbt`.

The firmware was read as data and never executed.

## Route and scene record

Other Settings page 4 (`basic_top4`) names the target scene `language`.
Its table-copy function reads the region word at `0x297600`. On EUR (case 2)
the code at `0x231748` copies the `language_eu` record over `language`, and
`start_lang_eu` over `start_language`.

The `language_eu` record contains:

- Footer kind 2, which the footer table at `0x2987bc` names `Base_D_01`, with
  labels `base_2b_back` and `base_2b_decide` ("Back" and "OK").
- Background state 1, the same as the other ordinary Other Settings leaves.
- Header byte 1 = 8, the row count.
- Return scene `basic_top4`, confirmation dialog `dlg_language_set`, lower
  layout `Country_D_00` and scene type `Language`.
- Upper chrome `CommonBG_U_00` and `TextBG_U_00`, icon `IconLang`, title
  `language` and instruction `language_comm_u`.

The US record `language` (`LanguageUS_D_00`, four rows) and the Taiwan record
`language_tw` (`LanguageA_D_00`, two rows) are regional variants that EUR never
reaches.

## Executable trace

- **Factory:** `0x216664` matches type `Language` and constructs the scene
  class (vtable `0x28c1e8`). Setup `0x22c748` takes the fixed-button path only
  for region 1 (USA). Every other region calls the list constructor `0x22c7d0`.
- **Rows:** `0x22c7d0` copies the labels `eu_english`, `eu_french`, `eu_german`,
  `eu_spanish`, `eu_italian`, `eu_dutch`, `eu_portuguese` and `eu_russian`, in
  that order. Its jump table at `0x22c8b0` maps rows 0–7 to CFG language codes
  1, 2, 3, 5, 4, 8, 9 and 10.
- **Selected row:** when the cached CFG language byte matches a row's code, the
  row index is written to the saved state block (`0x197724`). Nothing traced
  reads that value back into the list.
- **List:** `0x19f56c` loads `Country_D_00` and attaches the `R_SlideBar` child
  at its pane of the same name. The parameters are 8 rows, 4 visible and 2
  leading slots. The pitch is `N_T_SB_00.y − N_T_SB_01.y` = 44.
- **List constructor:** `0x19f204` sets top = 0, last top = −1 and decided
  item = 0. Scroll range is (8 − 4) × 44 = 176.
- **Slide bar:** `0x1f37c4` sets the thumb height to
  \(144 − 24 − (8 − 4) × 4 = 104\), with a minimum of 22. It applies the height
  to `SBBtn`, `SBBtnShdw`, `SBBtnFrame` and `B_Slide_00`. The 144 is the source
  `B_Groove_00` height; 24.0, 4.0 and 22.0 are literal-pool floats.
- **Refresh:** `0x1a022c` at top 0 shows row k − 2 in slot k's `TextBox_00`,
  so slots 2–7 hold English to Nederlands. Slots 0–1 have no row and are
  hidden through `0x1c3a3c`, which clears pane-flag bit 0.
- **Decided mark:** row 0 lands in slot 2, which gets the exclusive decide
  call `0x1a0084`. That jumps the button's Decide clip (`+0x3c`, `T_SB_Decide`)
  to its final frame. Other slots keep the layout default.
- **Thumb position:** Language setup never calls `setItem` (`0x19f170`) or
  `setPos` (`0x1a07b8`), and the slide bar's per-frame handlers respond only to
  touch. So the thumb keeps `N_Slide`'s layout y = 0 and sits centred in the
  groove.

`scripts/audit_settings_language.py` re-derives the scene records, footer
names, string operands, CFG codes, list constants, thumb literals, range
hashes, source members and label texts.

## Presentation

| Pane | Source | Drawn as |
| --- | --- | --- |
| `Country_D_00` | `SceneIn_00` frame 20 | Settled pose; `Null_00` y 0, alpha 255 |
| `N_T_SB_02`…`_07` | `T_SB` with `eu_*` labels | English, Français, Deutsch, Español, Italiano, Nederlands |
| `N_T_SB_00`, `_01` | Hidden, no row | Not attached |
| Slot 2 | `T_SB_Decide` final frame | Only when the configured language is English |
| `R_SlideBar` | Thumb 22×104 | `N_Slide` at layout y 0 |
| Footer | `Base_D_01` | Back / OK |

Slots 2–5 (English to Español) are centred at screen y 35, 79, 123 and 167. The footer band `bg_03`
covers Italiano (slot 6) except for about 8 px above y 196. Nederlands
(slot 7) is off the canvas. The slide bar is centred at (304, 101).

`T_SB_Decide` carries two archive-level shares with no endpoint in `T_SB`. It
goes through the existing `settingsDirectButtonClip` adapter, as the other
Settings buttons do. The source packs stay immutable.

The painter marks a row only when the configured value equals the `eu_english`
text. Any other value renders no decided row rather than an unproven mapping.
The portfolio locale is fixed to English and the value cannot be edited.

## Adaptations

These differences from native are intentional, within the read-only scope:

- OK is drawn but inert. Natively it applies the choice, through
  `dlg_language_set`, which is not implemented.
- Rows and OK remain inert. The slide-bar arrows now scroll the read-only
  viewport; see the follow-up below. Dragging and language selection remain
  unsupported.
- Back keeps its existing target (0, 208, 120, 32) and returns to Other
  Settings page 4 with Language selected.

## Evidence

- **Implemented:** `3d73bf6` publishes the resources; `2097bbf` adds the
  painter branch, tests and verifier checks.
- **Published resources:**
  - `Country_D_00` with `SceneIn_00`/`_01`, `T_SB`, `R_SlideBar` and
    `T_SB_Decide`, plus five content-addressed textures.
  - Publishing the unchanged plan first reproduced the existing delivery
    byte-for-byte. The new plan only adds entries.
  - Each resource's member hash matches the original RomFS archive.
- **Tested:**
  - `tests/settings-language-delivery.test.mjs` pins members, labels and
    styles, and checks that list scroll/select clips stay unpublished.
  - `tests/test_settings_language_audit.py` covers the new decoders.
  - `tests/stock-apps.test.mjs` covers the route and data.
  - `tests/stock-screen-layout.test.mjs` covers the inert targets.
- **Source-rendered:** `scripts/verify-stock-settings.mjs` asserts:
  - the calls, labels, styles and footer;
  - the thumb size and the absence of a slide-bar clip;
  - that only English is decided;
  - that `Country_D_00` `SceneIn_00` and `_01` settle identically.

  Of the previous 56 renders, only `detail-language-bottom` changed.
  `supplied-language-top`/`-bottom` are new.
- **Not done:** browser inspection and native LCD comparison.

Artifacts are under `presentation/settings-language-source/` at the firmware
SSD artifact root:

- **Source audit:** `audit-after.json` reports no missing dependencies.
  `audit-before.json` lists the six resources this change publishes.
- **Disassembly:** `asm/` (annotated) and `armdis.py`.
- **Publication:** `publish.log` and `delivery-baseline/`.
- **Delivery audit:** `delivery-audit*.json`, each with a `-baseline` twin.
  - The public-only run keeps its two existing converter-script hash drift
    errors.
  - With the verified multi-content extraction, the error set is unchanged
    and 23 more private sources pass (2,626 → 2,649).
  - The run against the plain `assets` root lacks the Settings extraction, so
    it reports the new members as missing, as it already did for the older
    Settings members.
- **Renders:** `verifier/` and `verifier-baseline/`.
- **Logs:** `typecheck.log`, `test.log`, `build.log`.

Type checking passes. `npm test` passes except for 39 tests that fail with
ENOENT on `model/` and `public/models/` files, which this worktree's sparse
checkout excludes. The production build fails in this worktree because
Turbopack rejects the external `node_modules` symlink. It passes on an exact
copy of the tree with a cloned `node_modules`.

## Unresolved

- **Thumb position.** The trace leaves the thumb centred (layout y 0).
  `setPos(0)` would instead raise it 20 px to the top of its travel. No native
  capture confirms which.
- **Hidden slots.** Hiding slots 0–1 depends on part byte `+0x5b`, whose
  setter was not traced. Slot 1 would otherwise show about 5 px between the
  top band and English.
- **Entry clip.** The constructor does not choose between `SceneIn_00` and
  `_01`, but both settle identically. Entry, scroll and exit motion are not
  presented.
- **Cursor state.** No row Select state is applied. A native D-pad cursor on
  entry was not traced.
- **Other languages.** The decided mapping for non-English CFG values is
  unproven, because the saved row index is never read back.
- **Native comparison.** No native LCD capture or browser check has been made.

## Reproduction

```sh
python3 -B scripts/audit_settings_language.py --romfs <settings romfs> \
  --code <settings exefs/code.bin> --published <published Settings pack dir> \
  --report <absolute report path>
python3 -B scripts/firmware/stock_ui.py --source <private settings-converted> \
  --output <delivery dir> --plan scripts/firmware/stock-ui-settings.json
node scripts/verify-stock-settings.mjs --artifact-dir <abs> --asset-root <abs delivery> \
  --canvas-module <abs @napi-rs/canvas> --font-manifest <abs fonts/shared/font.json>
```

See also the [Settings main and subpage trace](settings-main-source-validation.md),
[native Settings subpages](native-settings-subpages.md) and the
[Data Management list audit](settings-data-lists-source-audit.md), whose audit
helpers this script reuses.

## Follow-up: read-only arrow scrolling

The original page made the two visible arrow buttons inert. The follow-up in
`codex/settings-language-scroll` connects those buttons to the existing Settings
navigation reducer, preserving the fixed English configuration and read-only
rows/OK. It changes no public resource or source pack.

Source traces in the same Settings `code.bin` establish:

- `0x19f044` dispatches arrow 0 only when top is nonzero and arrow 1 only
  when top differs from `rowCount − visibleCount`. It starts the corresponding
  scroll controller. The range here is 0–4.
- `0x1983d4` and `0x198434` wait for the corresponding controller to reach
  state 2, then decrement/increment top by one. These are settled outcomes;
  the browser adapter currently applies them on a completed touch.
- `0x1a022c` refreshes the eight reusable slots with `top + slot − 2` and
  the configured decided item. English stays decided even while its slot moves
  outside the four visible rows. The implementation never marks a recycled slot
  as a different configured language.
- `0x198484` sends `(top × 44 + animatedOffset) / 176` to `0x1a07b8`.
  At a settled offset of zero, its 40-pixel thumb travel gives local
  `N_Slide.y = 20 − 10 × top`; the sibling `B_Slide_00` receives the same
  position. Untouched entry still uses the original centred layout pose.
- The source `R_SlideBar` bounds `B_Up_00`/`B_Dw_00` are 24 × 24 at local
  y ±84. Their settled Country mounts give logical touchscreen rectangles
  `(292, 5, 24, 24)` and `(292, 173, 24, 24)`.

The state field `languageTop` is transient. Back returns to Other Settings
page 4 with Language selected, and reopening resets the list. Boundary arrows
are no-ops. No stock save, shared preference, device operation or language
confirmation is emitted.

This is a bounded settled-pose adaptation, not a completed native list control.
Native `_ScrollDw`/`_ScrollUp` motion, pressed-arrow clips, dragging, hold/repeat,
D-pad row focus, selection and confirmation remain unsupported. No native LCD
comparison was performed. The original entry thumb and hidden-slot questions
above are still open.

Verification in the isolated worktree:

- **62 focused tests pass**, including complete touch traversal in both
  directions, both bounds, no touch-down/move/cancel action, stale actions,
  inert rows/OK, Back/reopen and shared-data/save immutability.
- **TypeScript checking passes.**
- **Source renders pass:** five main and twenty-nine subpage pairs (68 PNGs),
  zero renderer diagnostics. The added five scrolled poses preserve the upper
  LCD pixel hash and have distinct lower LCD hashes. Label binding, thumb
  placement, decided mark and immutable source packs are asserted.
- Rendered `language-scroll-1-bottom.png` and `language-scroll-4-bottom.png`
  were visually inspected. The latter exposes Italiano, Nederlands, Português
  and Русский together. Browser inspection remains the coordinator's task.

Artifacts: `reference/language-scroll/` under the firmware SSD artifact root.
It contains `source-ranges.json` (full code and traced-range SHA-256 hashes),
`list-arrow-dispatch.asm`, `list-arrow-update.asm`, `tests.log`,
`typecheck.log`, `render.log` and `render/verification.json` plus paired PNGs.

The subsequent [source scroll motion validation](settings-language-motion-validation.md)
adds the two original four-frame Country clips and completion-gated row
recycling. It supersedes the settled-only motion limitation above; pressed
arrows, dragging and D-pad focus remain unproven.
