# HOME toolbar banner mapping correction - 1 October 2026

## Scope and implementation

Commit `0e71b654676fe328f3e065223450fabcb34bedc4` on
`codex/home-fidelity-20261001`, based on `1886d49140837b5a7de141d8723edc9b12658fb2`.
Worktree: `/Users/paramveer/.codex/worktrees/3ds-home-fidelity-20261001`.
The original dirty checkout and sibling branches remain untouched; no merge,
push or deployment was performed.

A captured visible defect selected the yellow Notes icon but painted the
orange Friend List banner. The source cursor panes and live isolated Azahar
agree: focus 1/category 5 is Game Notes (`N_CPos_Memo_00`), and focus 2/category 4
is Friend List (`N_CPos_Frd_00`). Only the two renderer assignments changed.
Native category values, assets and host lifecycle are unchanged. The new
regression test joins the resolver, native cursor anchor, label and renderer
for all five applet positions. The older 28 September notes misidentified
these two focus numbers; their capture measurements remain historical.

## Source identity

Both existing models come from pinned EUR 10.7.0-32E HOME title
`0004003000009802`, version 24576, content index 0 (`00000082`), converted by
`ctr-cgfx-web` 1.4.2. No assets were newly generated or substituted.

| Element | Manifest key / delivered resource | CIA-internal RomFS path | Source SHA-256 | Delivered model SHA-256 |
| --- | --- | --- | --- | --- |
| Notes banner | `models.bannerAppletMemo` / `models/banner-applet-memo/model.json` | `romfs/3D/BannerAppletMemo_LZ.bin` | `ac476f4901148b4ca1dbd85db9d8c6780945539f40cddab47e11d3dfe96097e0` | `f470cde9f806cebb043fbbb89757fb97e385fa86b6991dc7c7a12492e3c2b549` |
| Friend banner | `models.bannerAppletFriend` / `models/banner-applet-friend/model.json` | `romfs/3D/BannerAppletFriend_LZ.bin` | `4b99060b220166bdf158a5949ab00d509d29a34fc1701249fa1865c5d141af10` | `0a512e2bbde90ff7f592821f6d4f3360a9335c9b806abf01ce8cbd62e0a7c02e` |

Decoded CGFX identities and original limitations are in the
[Notes source record](home-game-notes-banner-source-2026-09-28.md) and
[Friend source record](home-friend-banner-source-2026-09-28.md).

## Native and browser evidence

Private root `R` is
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001`.
The read-only isolated profile was copied to `R/native-reference`; the default
Azahar profile was never launched. Executable SHA-256:
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`.
Only the cloned screenshot destination was changed. A stalled cloned Vulkan
pipeline cache was preserved at `R/pipeline-cache-before` and a clean-cache
restart booted EUR HOME successfully. Original hardware mode and English
were retained. Native audio was muted; no audio match is claimed.

Azahar's own 400x480 captures were compared with the rebuilt production
browser's raw 400x240 upper and 320x240 lower targets. Lower native crop is
`(40,240,320,240)`. All reports use the empty mask (SHA-256
`dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`)
and >2/255 channel threshold. No portfolio region was hidden.

| Diagnostic pair | Native file under `R/native-reference/screenshots/` | Browser scenario | Upper / lower differing pixels | Status |
| --- | --- | --- | --- | --- |
| `notes-before` | `_01.10.26_20.38.24.679.png` | `notes-density0-before` | 41,084 / 27,648 | fail |
| `notes-after` | same retained reference | `notes-density0-after` | 39,913 / 27,481 | fail |
| `friends-before` | `_01.10.26_20.42.54.075.png` | `friends-density0-before` | 43,483 / 20,403 | fail |
| `friends-after` | same retained reference | `friends-density0-after` | 40,029 / 20,275 | fail |
| `notes-settled-after` | `_01.10.26_20.48.59.746.png` | `notes-density0-settled-after` | 54,425 / 19,926 | fail |
| `friends-settled-after` | `_01.10.26_20.47.52.66.png` | `friends-density0-settled-after` | 51,683 / 20,064 | fail |

Each pair's `R/comparisons/<pair>/report.json` records exact native/browser
PNG hashes, crop sizes, commit, mask and error regions. Browser images and
metadata are under
`R/captures/reference/scenario-matrix/v1/captures/<scenario>/browser/`.
Upper/lower contact sheets for both final settled pairs were opened and
inspected. These are run-local diagnostic records; the historic global
private scenario matrix was not overwritten or promoted.

Final native Notes SHA-256:
`0b5b7728be12670c9270dd2a4d087764c8fb9fbb11e1a08b24458e65c1325734`;
Friend SHA-256:
`7fa3aa28a474d9d6b1d82196dadae238ce0a54290129aa7d675628b9930bcab6`.
Final browser Notes upper/lower SHA-256:
`3be334783e340a97dfc5f6df852fa81f70c5cfdbd4d13b7b3e8b642e0942438f` /
`d927f1a474395bea7bbbfe04200c07b93383d52dd63fa4cf3f5a02e35058b6a5`.
Final browser Friend upper/lower SHA-256:
`3d6a9fe216e6fccc0cbd593cdd043e7299a2c445340f8426bc2cfaf86e73cb67` /
`7618fde375ff4f210f965baff70799951727f4545b8e0deefe7424d7f5bd3bec`.

Input history is diagnostic, not a matched replay: native initially persisted
Notifications; brief D-pad events were sometimes missed. Foreground mapped
`f` inputs reached Notes, `hhhh` reached Browser, then two individually
observed `f` inputs reached Notifications and Friend. After the fresh Friend
capture, one observed `f` reached Notes for its recapture. Browser reload
restored one-row Work; ArrowUp selected Notes, ArrowRight selected Friend,
then ArrowLeft selected Notes. Source time was sampled at 12,000 ms; final
browser dates were explicitly 19:43Z/19:42Z for the native displayed
20:43/20:42 clocks. This does not align the native animation origin, frame
cadence or full input history. Earlier pairs and immediate-transition samples
are preserved, not repurposed as settled acceptance.

## Verification and remaining work

- Implemented and committed: corrected banner identity only.
- Tested: focused suite 28/28; full suite 1,526 passed, 0 failed, 23 skipped,
  1 TODO; typecheck and production build passed. Initial 36 failures were
  missing `model/` fixtures in the inherited sparse checkout; restoring the
  committed fixtures resolved them. Logs: `R/tests.log` and
  `R/tests-restored.log`.
- Browser-inspected: production on localhost:3020, both toolbar selections
  and both final raw LCD pairs. Correct title/model identity is visible.
- Native-compared: all listed pairs fail. No whole-scenario 1:1 claim.

Remaining non-native/adapted or unexplained elements: the eight portfolio
tiles/content and offline status are product adaptations; toolbar banner
front yaw and clip origin remain untraced approximations; native font assets
are used but the applet title appears smaller than native; wallpaper phase,
HUD state/battery, cursor timing, lower footer split/text placement and grid
population differ. The portfolio adaptations do not excuse those native
residuals. Input, motion, cue timing and audio remain open. Next visible slice:
trace the native applet label sizing/placement and lower footer configuration
against these named pairs, then rerun the native/browser loop without guessing
geometry or hiding differences.
