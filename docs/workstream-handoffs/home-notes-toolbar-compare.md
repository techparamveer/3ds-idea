# HOME Game Notes toolbar comparison

Comparison branch: `codex/home-idle-next-compare-20261002`

Comparison base: `b83b127432367c98f4baf799698004dc3a2f2d85`

Production-before runtime: `d4c96f26`

Production-after runtime: `79597372` (`1329ddd1` -> `6cbe378d`, fixture
correction `5d1239b3` -> `79597372`)

Status: **bounded Notes region reaches the static pixel tier in four repeats;
whole scenarios remain fail**.

## Before finding

The unselected Game Notes toolbar glyph residual is repeatable across the
fresh semantic Health -> Camera -> Health route. All four fresh native
`[64,90) x [3,26)` lower-LCD crops are byte-identical to one another and to
the four earlier preserved native captures. All four browser-before crops are
also byte-identical to one another.

Every fresh pair therefore reproduces the same result:

- native crop SHA-256
  `e1c287ad67dcb6eddd9630971e0ad587ee3136c33764228463fa1589c69b927f`;
- browser-before crop SHA-256
  `513d1998879a16458ac2d31951d1964ce1876915b064d08ff3930369cd6fe3b0`;
- **201 / 598 pixels above 2/255**, mean absolute RGB channel error
  `1.9420289855`, RMSE `5.0774382361`, maximum channel delta `25`;
- differing bounds local to the crop `[1,1,25,21)`, or global
  `[65,89) x [4,24)`;
- exhaustive integer translation search through `dx,dy=-3..3` ranks `(0,0)`
  first. The next result, `(1,-1)`, worsens to 300 pixels above threshold and
  RMSE `42.7336517797`.

This strengthens the captured-visible-defect evidence. It still does not
prove native material initialization or candidate correctness: exact HID,
setup history, clock, animation epochs, installed population and HUD values
remain unmatched.

## After result

The candidate produces one invariant after crop across the same four-route
sequence:

- after crop SHA-256
  `6e5ad5f4b5254817344f1e6cb378ee8c9e6d94dab8eb8f505b22f5296ef14dad`;
- **0 / 598 pixels above 2/255**, mean absolute RGB channel error
  `0.0863991081`, RMSE `0.2939372520`, maximum channel delta `1`;
- 129 pixels differ from native, all by at most one channel value;
- before -> after changes 237 crop pixels, 202 above 2, maximum 25;
- all four Health/Camera states reproduce the same native, before and after
  crop hashes.

The Notes crop therefore improves `201 -> 0` pixels above threshold and
maximum `25 -> 1`. This is a static pixel-tier result for one source-owned
toolbar material. It is not RGB exactness, native initialization proof, an
accepted whole LCD, or a motion/input/audio result.

## Fresh inputs and identities

Azahar's own 400x480 PNGs were visually checked for the named selection.
Native lower LCD is cropped at `(40,240,320,240)` without scaling.

| Pair | Native own-PNG SHA-256 | Browser upper SHA-256 | Browser lower SHA-256 | Capture metadata SHA-256 |
| --- | --- | --- | --- | --- |
| Health initial | `9cf0e063670fcd7b598768af0a45b45a33ccea430e5905a4c9e71f84d1b1b755` | `ed8201a00e3957aeb2ebc04d8a5f82f6fccebb48df702dbf0b18d6e1924060de` | `a083b9333cd6a9afc303de0de89fa704d20ca8bcdd817a16837d66d3deb80ea2` | `d1d1a73223d9d877c030309f9197603835d8274d55d4299642d023bb1ab452b2` |
| Camera selected | `48971331a51667150149d78599a1866d90fe40c853f5066117e4c04f533a6fe0` | `3736bdd59e54046d765ff30fb037e7b7042036c9c78c5404af0b30374288a3c1` | `a4f86d6db5c80c107d1d1554132b3bd9ef1b8d8613fc3e9595bff837108954c4` | `3b85699253fec2c0c1d406dd2797a82d08b414cd244c7f29f74b5217297cf575` |
| Health reselected | `0bd89694a6a5e4e29c06a60ae5a35d6707f5d50e248a4a3e7a89c1fe55eea079` | `cecb73519da37e133d0f76c30cd3f5c575786e626238b9fe61b3e53cfa8113d3` | `d5c6d85a260a707319cc4fd531b41998d3b5ada4a274022d01cc046a7b5f13e9` | `b3c4fd5a8cc31a0cbc0f048763e7e3fbaef5626583996ae4b840d49ce583ad5f` |
| Health repeat | `5d5768b7b2ebe6141324cb69537f4dfccc82d15ef2e1c6955ad4c804d513b0a3` | `65d72ce91f542bcdd43e5286ae7ca81847101b564a4a16d0d854ef74a0416a0a` | `ba3f4900e3bcf84f13225ed13cc7962beb07835af2e3ce2f4b47ac421a38d733` | `f2723db0189e874ef1cce25cae51ca96b012b0cff2429f03d6bddf09c77101c1` |

Browser metadata records the normal semantic route at runtime `d4c96f26`:

| Pair | Selection / cursor centre | HOME updates | cursor frame | banner skeletal/yaw | wallpaper Loop |
| --- | --- | ---: | ---: | ---: | ---: |
| Health initial | Health / `(76,161)` | 70 | 9 | 37 / 37 | 70 |
| Camera selected | Camera / `(244,161)` | 139 | 18 | 36 / 36 | 139 |
| Health reselected | Health / `(76,161)` | 210 | 29 | 37 / 37 | 210 |
| Health repeat | Health / `(76,161)` | 382 | 21 | 209 / 209 | 382 |

The browser captures explicitly retain `inputMatched=false` and
`epochMatched=false`. The native route used the same 200 ms semantic pointer
sequence after dismissing a visible startup warning, but earlier failed tap and
quit attempts remain part of setup history. The native process later stopped
through Quit/Yes with exit 139 / `EXC_BAD_ACCESS`, not a clean exit. Audio
remained Null output 1, Static input 2 and volume 0. These facts prevent an
exact HID/session or audio claim; they do not invalidate the saved PNG bytes.

Production-after runtime `79597372` repeated the same semantic route without
state injection and with muted state true and no browser errors:

| Pair | After upper SHA-256 | After lower SHA-256 | Capture SHA-256 | HOME updates / cursor | banner skeletal/yaw / wallpaper Loop |
| --- | --- | --- | --- | ---: | ---: |
| Health initial | `da828434b6062f7811b0d3c4d5853f8ef8b9d179935c02c375ae8cb9ac6e6b48` | `6e163632d33a2f33188a93522052813b05b5eed195b5c0b651bee4d66901ae25` | `56779712d2b138996076a1cd74a50eea9060a8fb48c1667bf80eadfc92193b87` | 57 / 56 | 50 / 50 / 57 |
| Camera selected | `99d08f87872dccd8383c757fea3a75fc33445df4ff888e43621531cb9dc1d358` | `846b2e2601d69e1b8067acebc1bcc836d8cb0351fe4031e659c7961d7f0d477e` | `fada807d72d973430ce0c69ad0641fcf2054df1d1653cef1d103c3134a669e30` | 128 / 7 | 37 / 37 / 128 |
| Health reselected | `c441248b14442677db51089db68915e9ac0fc07f864b85e259d14e8bc444d885` | `56b38289cbf98032e8c53805148f056308feadde83d5b6b419cc568b8b69c915` | `97dad894665db0b8dacbd6913f57123587a566bfc8a62a5511aeb87f8e347810` | 201 / 20 | 37 / 37 / 201 |
| Health repeat | `0bed195333162db47ff43c94f2fb485d029fda2c88debc3319f5df5aa0f82a26` | `4705745bbacd283d71eef86331648433fd0ffbe6032ac225815e36a36c4f57be` | `f198cfb5734bead2c8a7eee77aaa4e845761218aac6c111af9807eebf24c3cd5` | 375 / 14 | 211 / 211 / 375 |

These after captures also retain `inputMatched=false` and
`epochMatched=false`. Their cursor and wallpaper frames differ from the before
captures, so unrelated whole-LCD before/after movement is not a candidate
regression by itself.

## Empty-mask whole-LCD diagnostics

Every pair uses the empty mask and remains `unexplained-differences`.

| Pair | Before upper / lower pixels >2 | After upper / lower pixels >2 | After mean upper / lower | After max upper / lower | After report SHA-256 |
| --- | ---: | ---: | ---: | ---: | --- |
| Health initial | 50,382 / 16,138 | 49,244 / 15,627 | 12.014743 / 5.341970 | 255 / 246 | `edb833ad7616d41ef01fbcd68f04543166c1d20940c5e7aae3b2c572e8051db9` |
| Camera selected | 12,878 / 15,265 | 15,662 / 15,542 | 6.643313 / 5.234826 | 255 / 246 | `7004b8476b1680e96e77f3d57093d33bea6ef24272d12211e39f1a8265c7df3d` |
| Health reselected | 34,642 / 16,070 | 31,707 / 14,997 | 6.230490 / 5.051823 | 220 / 246 | `93038757b180e9f83f36119157caf9731cbe5006e9e350c45cba01bec3c7612c` |
| Health repeat | 55,032 / 16,262 | 55,011 / 16,145 | 8.674722 / 5.492274 | 215 / 246 | `05952cec1ce192dfc6bf445f304f526ef91d596f5d853b0b4e4bda66e8798780` |

The opened upper overview confirms unmatched HUD/network/clock, banner pose
and wallpaper phase. The opened lower overview confirms the scoped native
vacancy versus browser Settings population adaptation, cursor phase, partial
edge content and plate/footer residuals. None of those differences is hidden
or promoted to acceptance.

## Fixed control regions

The controls reproduce the existing classification rather than introducing a
new geometry claim:

| Control | Fresh result | Interpretation |
| --- | --- | --- |
| Open footer `[0,320) x [212,240)` | 694 / 8,960 above 2, maximum 30 in every pair | Exact recurrence of the known active-theme edge source gap. Camera's two-button source has a different RGB hash but the same threshold count. Do not reopen or mask it. |
| Camera artwork `[221,265) x [140,184)` | 1 / 1,936 above 2, maximum 16 in every pair | Stable single high pixel; not a pixel-tier pass and not evidence for moving the artwork. |
| Camera ordinary plate excluding `[218,268) x [137,187)` | After Health pairs: 963 / 4,224, maximum 26; after Camera-selected: 2,070 / 4,224, maximum 90 | Existing `LncIconSetSrc_00` plate/theme plus unmatched selection-cursor phase. Before Camera was 1,646/max22 at cursor frame18; after is frame7. Do not attribute that phase change to Notes sampling. |
| Notes toolbar crop `[64,90) x [3,26)` | before 201 / 598, max25; after **0 / 598, max1** in every pair | Bounded static pixel-tier result. |

The native Camera artwork region SHA-256
`4e9bbee8600e5170bcece8540da70aa4321ad1fe9dd700d55d8d778f675b2b7e`
and browser region SHA-256
`bfbedf30953401fb11f5ed72525ff8dde71d54c8ee573fe55c0b78769fe481be`
are identical across all four states. The Notes region is likewise invariant
across both selections and the two Health epochs.

Direct before/after controls further constrain the change:

- the footer and Camera artwork are byte-identical before/after in every pair;
- toolbar pixels outside `[64,90) x [3,26)` have no deltas above 2. Eleven
  changed pixels sit immediately below the ROI at `x=65..75,y=26`; all are
  Notes fringe with maximum delta 2;
- remaining lower pixels above 2 are confined to the selected cursor region:
  Health bounds are approximately `[32..120) x [118..206)`, and Camera bounds
  `[201..287) x [119..205)`. Counts are 1,884 / 1,800 / 2,170 / 1,812 for the
  four routes and follow the changed cursor frames;
- upper before/after counts are 10,831 / 6,591 / 3,088 / 5,812 pixels above 2
  and follow unmatched HUD, banner and wallpaper epochs. The Notes candidate
  does not paint the upper LCD.

The direct lower sheet was opened. Its only stable toolbar change is the Notes
glyph; its other bright components are the differently sampled mint cursor.

## Candidate boundary and acceptance

The pixels support source candidate `1329ddd1` only as a narrowly scoped
**inferred Notes zero-UV sampling adaptation**. The pair does not establish
what value native hardware initializes for the absent UV attribute, nor
justify applying the behavior to another material. No palette, texture,
color, pane geometry, toolbar binding or broad renderer default is accepted
from these pixels.

Static regional verification is complete:

1. four fresh native crops and four before crops reproduce one stable defect;
2. all four after crops reach zero pixels above 2 and maximum 1;
3. footer and Camera artwork controls are byte-identical before/after;
4. all opened whole-LCD reports remain fail and no differences are masked;
5. exact input, motion, banner/wallpaper epochs, initialization and audio stay
   open.

The coordinator reports that build, typecheck and shader validation pass. The
first full-suite run had 13 synthetic-fixture failures because two fixtures
lacked the now-required UV sets. After fixture-only coordinator commit
`58205d29`, the final suite reports **1,782 passing, 0 failing, 23 skipped and
1 TODO**. This comparison worker did not run those commands; these are
coordinator-reported results.

Coordinator regression captures also report all five lower-LCD images and the
two Settings upper-LCD images byte-identical before/after. Health upper images
remain epoch-unmatched. HOME-power and app-power origins, plus powered-off
upper/lower images, are byte-identical before/after. These are regression
checks, not native scenario acceptance.

No scenario status, native initialization proof or whole-HOME acceptance is
promoted. All four whole pairs remain `unexplained-differences`.

## Artifacts and verification boundary

Internal artifact root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-notes-toolbar-native-20261002/comparison-worker/`.

- before named report: `before/report.json`, SHA-256
  `4d94d8245fc3826cf3497723040aa7d5301b062f6495e53e4f9d7eab3cbc0a75`;
- four-row native/browser/6x-difference Notes sheet:
  `before/notes-before-native-browser-diff-sheet.png`, SHA-256
  `3639e1c38f5cc86d425f24b3d8f9315bddb66744511d829fa25f8e7dddde23fe`;
- all-pair upper overview sheet SHA-256
  `3af6068168febf801b52011a6ec0deb8727be533ed22afd5ef046bb4e7b65632`;
- all-pair lower overview sheet SHA-256
  `9e96c0c67f7167f5376a9a15c0d650acad1e75b600efb27f673d80c17e09d35a`;
- preserved-repeat report SHA-256
  `55d23c47d676fc002ce13f05068482d083f93c246f7aecbb8e8acd79d6b286ed`;
- preserved-repeat sheet SHA-256
  `78cb0031aeaa66b62c8f37fdece0b8d4d9778363eddb8b5f7143b37613d66d9d`;
- after named report: `after/report.json`, SHA-256
  `3fc1d990cf5ca956f5814564ee3c86732fd9bc53069107ede66d968126f532fa`;
- native/before/after/6x-difference Notes sheet SHA-256
  `745dfef48f58ad04f59de7c0aa635c708098760b2208100925fb08df1b75ba3d`;
- direct before/after lower sheet SHA-256
  `c9f2d135c63ed1d1e1d5ce5b3b33b906ac07a857a1ddf7d67641d85e428c5147`;
- after upper/lower overview sheet SHA-256 values
  `b50bffa8734319b98771417cb53cd486ff0766b3a4193916d1b50552db741320`
  and `f0195b822fe710205f7e6f2d5a790951f7f4a8299b2a3ffa9674912d486eb521`.

The four source native PNGs, before Notes sheet, final Notes sheet, direct
lower sheet and before/after stacked upper/lower contact sheets were opened
and inspected. This worker changed no runtime, asset, shared doc, matrix,
build, GUI/native/browser/audio state or DeveloperStorage artifact.
Documentation-only verification is `git diff --check`.
