# U20R review: Settings Open Blocks `65,536` bind, 6 October 2026

Reviewer U20R (Claude Opus 5.5, independent; worker U20 was Grok 4.6).
Reviewed worker commit `c9da97c0` against `8a707877`. The worker's actual
parent is `743512b6`. `8a707877` is a STATUS-only commit, so the
`STATUS.md` hunk in `git diff 8a707877..c9da97c0` is the reverse of that
commit. The worker did not edit STATUS. Integrate by merge or cherry-pick,
not by copying the tree.

I did not drive Azahar or the production browser.

## Verdict: **APPROVE-WITH-NITS**

## Independent checks

1. **Pane, font and binding provenance: confirmed.**
   - `up.json` `resourceSources.layouts.SMng_U_01` = title `0004001000022000`,
     content `0000003d` index 0, `up_LZ.bin/blyt/SMng_U_01.bclyt`, SHA-256
     `a644e562…60c5`.
   - `TextBox_05` is the only `txt1` pane in `SMng_U_01` that holds the
     numeric placeholder `888888`. It is 120×36, font 0, size 25×30,
     alignment 4 and line alignment 2, with white top and bottom colours.
   - `fonts/shared/font.json` `sourceSha256` = `95d5a675…b581`, and it has
     glyphs for `6 5 , 3`.
   - Native official PNG `9c5cb75c…7881` (SHA re-hashed) shows white
     **65,536** centred in the orange window right of "Open Blocks", in the
     same pane slot.
   - Extra Data native `7c7f2f93…46f3` also shows **65,536** in the same
     window, so writing it from both list screens matches native.
2. **No CSS font, no `fontSize` override, no hand-drawn digits: confirmed.**
   The override is `{text}` only (`src/os/stock-native-settings.ts:253`),
   and the existing native-layout/BitmapFont path draws it. Two tests assert
   that `fontSize` is undefined. The bind note's adaptation labels are
   honest: the integer is a portfolio empty-SD fixture, and the comma is
   captured grouping, not a re-trace of `0x19a0b8`.
3. **37 failing tests existed before this commit and are unrelated:
   confirmed.** I re-ran `npm test` at `c9da97c0` and got 2069 pass / 37
   fail. All 37 are ENOENT:
   - 36 need `model/candidates/joshua-xl/*.glb` or `component-report.json`.
     The worktree's sparse pattern is `/* !/model/`.
   - 1 (`camera-date-group.test.mjs:44`) needs an external overflow artifact
     `…/camera-3d-badge-sdmc-recapture-20261005/browser/lower.png`.

   None of them imports `stock-native-settings`. All five Settings test
   files pass, and the new `tests/settings-open-blocks.test.mjs` passes 3/3.
   `npm run typecheck` passes.
4. **Code correctness: no regression found.**
   - `TextBox_05` is written only in the `dataList` branch
     (`stock-native-settings.ts:246-254`). The profile branch (`:259`) still
     hides its own unrelated `TextBox_05` on a different layout.
   - The clamp `min(max(0, n|0), 0xf423f)` agrees with the audited formatter,
     which clamps before formatting.
   - `|0` wraps only above 2³¹ blocks, which is unreachable for real SD sizes.
   - The fixture is a constant, so no live state is invented.
5. **Docs do not overclaim.** The feature map still marks the row `fail` and
   says "recapture owed". The progress entry says "Not browser-inspected. Not
   native-compared". No `pass` is claimed. The ROI arithmetic is consistent:
   6852 − 841 ≈ 6010.

## Findings

1. **Nit: the bind note overstates the build.**
   `docs/settings-open-blocks-2026-10-06.md:117` lists "`npm test` /
   typecheck / build" as tested. The worker reported that build was blocked
   by the `node_modules` symlink, and 37 `npm test` cases fail for sparse
   reasons. Reword to "typecheck pass; `npm test` 2069/37 (sparse ENOENT
   only); build not run". The coordinator's integration build is still owed.
2. **Nit: stale paragraph in the audit body.**
   `docs/settings-open-blocks-source-audit.md:40` still says "The
   deliberately blank field therefore remains a portfolio adaptation". The
   new header note supersedes this, but the paragraph now contradicts the
   code. Mark it as historical, or point it to the bind note.
3. **Nit: verifier change is unexercised.**
   `scripts/verify-stock-settings.mjs:173-174` now asserts `65,536`, but
   neither the worker nor I ran the verifier: it needs an absolute
   `--canvas-module`, and no canvas package is installed in this worktree.
   The coordinator should run it once during integration.
4. **Info: render placement is predicted, not observed.**
   `SMng_U_01` still uses the generic pane raster, not the
   alignment-4 / line-2 sampler. Exact glyph placement inside the 120×36
   pane is therefore unobserved until the coordinator recaptures. The note's
   0–80 ROI prediction reflects this.

The remaining non-native elements are as listed in the bind note: the
fixture integer, the captured comma grouping, the implicit orange material,
HUD frames, the empty lists and the DS Profile blanks.
