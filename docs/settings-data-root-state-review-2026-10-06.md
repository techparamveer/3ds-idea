# U21R review — Settings Data root state (6 October 2026)

Reviewer U21R (Claude Opus 5.5, independent; worker Grok 4.6). Reviewed
`git diff 743512b6..75a01519` on `codex/settings-data-root-state-review-20261006`.
Azahar and the production browser were not driven. The only evidence read was the
coordinator-published captures.

**Verdict: APPROVE-WITH-NITS.** No native graphic is reconstructed. The new
pose comes from the published `B_L_Invalid` clip driving `B_S`'s own
`N_Invalid` panes. The focus change reuses the existing Other contract, and
the painter change cannot reach screens that do not expose `selectionActive`.
This review covers tests and source only. It does not establish 1:1. The
coordinator's recapture is still owed.

## 1. `B_L_Invalid` on `B_S`

- **Pane structure (verified from the published `button.json`).** `B_S` and
  `B_L` share one tree: `Null_00`, `N_Invalid`, `B_LInvalid01_00..03`,
  `B_LInvalid03_00/01`, `Window_00`, `N_Picture`, `Window_01`,
  `I_User_L_00..03`, `I_User_C_00/01` and `TextBox_00`. `B_L` has two extra
  edges, `B_LInvalid03_02/03`, which the clip does not target. Every one of
  the clip's 13 contents resolves in `B_S`. Its two shares
  (`Button/AS_Picture_00` and `BottunPage01/AS_Picture_16`) are in
  `settingsDirectButtonClip`'s omitted set and are stripped.
- **Size keys are harmless.** The clip writes `I_User_L_02/03 size.width = 16`,
  and `B_S`'s source widths are already 16×28. This is not the Other-icon
  edge-erasure case at `src/os/stock-native-settings.ts:43-50`.
- **Native match.** In the native capture
  `azahar-data-400x480.png` (`686d3dfb…`), the Reset text region
  (lower `[60..240]×[178..194]`) has darkest pixel exactly **(197,183,140)**
  (109 px). This is `B_L_Invalid` frame 1's `TextBox_00` colour. The lower
  contact sheet shows a dashed outline that matches `B_LInvalid01/03`
  chrome, with no enabled face.
- **Provenance.** The SHAs in the note resolve in the published pack and
  manifest. `B_S` is `91bafd92…`, `B_L_Invalid` is `da9b098b…` and
  `button.json` is `4a356ef0…`. The `B_LInvalid01/03` textures `acc227c6…`
  and `7339bb3a…` are listed under `button_LZ.bin/timg/`, and also under
  `base_`/`layout_`. The pack has no `B_S_Invalid` or `B_SB_Invalid`; the
  Invalid clips present are `B_CnctW1-3`, `B_L`, `R_UpSmall` and `T_OnOff`.
  Applying `B_L_Invalid` to `B_S` is labelled as a source gap in the note's
  "Still non-native" list.
- No CSS greying, canvas fill or hand-drawn outline was added. The only
  painter change is a binding choice at `src/os/stock-native-settings.ts:263-265`.

## 2. Focus rule and regression risk

- **Data.** The native capture was touch-entered and shows no Select pose,
  which matches `selectionActive:false`. A-entry is not captured. The note
  lists this as a gap.
- **Painter scope.** `focused` now tests `selectionActive!==false` on every
  subpage. The view sets `data.selectionActive` only for
  `main|other|data|internet` (`src/os/stock-apps.ts:310`). Main is painted
  by the separate path at `stock-native-settings.ts:109`. Parental, Software,
  Profile, Clock and the other subpages get `undefined` and still focus as
  before. For Other the change is equivalent, so the held p1 **0/0**, the
  exact p1 **217/0** and p3/p4 should not move. The Settings main **0/20**,
  Parental intro **4595/0**, Software empty **6852/22** and Health pairs are
  outside the changed predicate.
- **Purity and input.** `menuState` and `settingsBack` stay pure. Touch, A and
  footer OK still share `activate` → `settingsNavigate`. The D-pad restore is
  the same `inactiveEntryFocus` branch extended through
  `settingsUsesInactiveEntry`. `stock-screen-layout.ts` is untouched.

## 3. Tests

- Targeted (`settings-data-root-state`, `stock-apps`,
  `settings-completion-routes`): **72/72 pass**.
- `npm run typecheck`: pass.
- `npm test`: **2207 tests / 2073 pass / 37 fail**. I ran the base `743512b6`
  in a temporary detached worktree (since removed): **2200 / 2066 / 37**. With
  the test numbers stripped, the two failing name sets are **identical**:
  `source-*`, `sourced-rig`, compact GLB delivery and the HNI pair hash.
  These are the pre-existing sparse-checkout ENOENT failures. None are
  caused by this change.
- `npm run build`: blocked by Turbopack ("Symlink node_modules … points out
  of the filesystem root"), as the worker reported.

## 4. Docs

The progress, feature-map, leftover and subpage docs all say "pending
recapture / tests only / not 1:1". I found no overclaim beyond nit 1.

## Findings

1. **Nit — Internet causation is not isolated**
   (`docs/settings-data-root-state-2026-10-06.md:22`). The native Internet
   settled frame `f0c5d093…` was reached through the first-run helper
   (Next/Next/OK). It is not a direct Settings → Internet entry, and the
   browser does not model that helper. "Same unfocused-entry rule" is a
   plausible explanation, not a demonstrated one. Reword it to "consistent
   with". The ~1000 prediction can stand, but a non-first-run Internet entry
   still needs its own capture.
2. **Nit — `disabled` is hard-coded, not data-driven**
   (`src/os/stock-settings-navigation.ts:36`). `blocked-users` is
   unconditionally disabled. That is correct for the portfolio fixture
   (empty list), but it should key off an explicit empty blocked-user device
   fixture, as Open Blocks 65,536 did in U20. Otherwise the adaptation is
   invisible in data.
3. **Nit — dead copy** (`src/os/stock-settings-navigation.ts:166`). The
   `'blocked-users'` detail text "Read-only preview…" is now unreachable
   because the row is inert. Remove it or note why it is kept.
4. **Nit — `B_L_Invalid` frame-0 constants**
   (`src/os/stock-native-settings.ts:42`). The clip also writes constant
   `I_User_*` material colours and `Null_00`/`Window_01` keys at frames −19
   and 0. These sit under `N_Picture`, which is hidden at frame 1, so they
   are invisible now. Only frame 1 is bound, but if this clip is ever bound
   at frame 0 on an enabled `B_S`, it would override `B_S`'s own material
   colours. A one-line comment restricting use to frame 1 would prevent
   misuse.
5. **Open, not a defect.** Disabled + D-pad-focused Reset (Invalid without
   Select) and A-entry focus are uncaptured, as the note already lists. The
   coordinator recapture should include one D-pad press on Data to confirm
   the focus restore and the Reset row pose.

Acceptance status is unchanged. Data root and Internet settled remain
**fail** until the coordinator recaptures after integration.
