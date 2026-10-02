# HOME density sequence comparison

Comparison branch: `codex/home-density-compare-20261002`

Comparison base: `6e1a22524fa552a0cc4a45c4f292a825e55c6d08`

Browser-before runtime: `3bb6c6f3`

Status: **the six-row production-before and production-after comparisons are
complete. All empty-mask whole-LCD pairs remain fail; the diagnostic-coordinate
fix changes no stable lower-screen region**.

## Scope and comparison boundary

This slice compares the settled HOME density states from six rows down to one
row. Native and browser each take a recorded 50 ms decrease step between the
six comparison states, but that does not establish exact input equivalence:
native HID/emulated epochs, setup prefix, population, HUD/banner/cursor clocks,
motion and audio remain unmatched.

The coordinator's native first 200 ms increase does **not** settle at two rows.
An immediate window snapshot transiently showed two, but Azahar's later own PNG
is rows 5. A second 200 ms increase reaches rows 6, after which each 50 ms
decrease settles exactly one step through rows 5, 4, 3, 2 and 1. The native
200 ms repeat cadence remains unresolved and must not be inferred from the
browser's behavior.

The source fix under test (`43cbf493`, integrated as `a751b2dd`) refreshes
diagnostic `data-targets` after a responsive resize. It does not change the
application pointer/raycast/UV path, reducers, density geometry or LCD
rendering. Any production-before/after LCD change therefore requires a phase
or capture explanation rather than attribution to the fix.

## Native sequence

Native inputs are Azahar's own 400x480 PNGs. Lower LCDs are cropped at
`(40,240,320,240)` without scaling. The primary comparison uses the stable
descending sequence:

| Rows | State | Own-PNG SHA-256 |
| ---: | --- | --- |
| 6 | descending after second 200 ms increase | `2e67157e8e0f6d49e4c310d989f7d4a6b6ce8032e505f62a14da1dc48111951b` |
| 5 | 50 ms decrease | `95641bc563eba2e6c4b7c38c2121478ec4bcb5aa95bb91dc2f51344cca63a55b` |
| 4 | 50 ms decrease | `18800efffae6ed66835d37c907b159b1ccd19dfda7b93be077d9f1a613c2e887` |
| 3 | 50 ms decrease | `ded630e9b7276c4d898862e25d9e495e8fa2e91430355600558c1a1ed5f66354` |
| 2 | 50 ms decrease | `56545fd966d6b490e0065c01efe439362af0d6024c52720334d0c6711312b3b3` |
| 1 | 50 ms decrease | `ca6b3510cb3e69344157dc2d6b06ff0c420c50b310868a1448cc4adbf3d63cf6` |

Two additional phase controls are retained: initial rows 1
`303ddf7fe22ddc364617780c420a1921aedbd3f60bd0bdc8a7a41c3f5cee3749`
and first-increase rows 5
`e94b5d905077c7809e1eeb19cd2528ebbf5fcebd0ed8c5ed8dbf558f88280781`.
Against the primary captures, their whole upper/lower differences are
7,121 / 1,426 pixels above 2 for rows 1 and 37,046 / 539 for rows 5. Despite
that live variance, toolbar, density-control and footer crops are byte-exact
in both repeats; the rows-5 selected neighborhood is also byte-exact. The
rows-1 selected neighborhood changes 1,426 pixels, maximum 80, with its live
banner/cursor phase.

`coordinator/native-run.json` records the full setup, points, holds, capture
names and shutdown. Its SHA-256 is
`6b626a8c135fc254412d433fa2280d0d783260c10cfc2b9364ef1a954600e095`.
The current native Quit/Yes run exited 139; PID absence, mapped touch and muted
audio readback were verified unchanged. An earlier clean exit does not replace
this run's exit evidence.

## Browser-before inputs

The coordinator's muted production route reaches rows 1 through 6 and back to
1 with 50 ms semantic touches, min/max clamps correctly and records no browser
errors. The comparison uses its descending captures:

| Rows | Upper SHA-256 | Lower SHA-256 | Capture metadata SHA-256 | HOME updates |
| ---: | --- | --- | --- | ---: |
| 6 | `d04e5f536724158ff0c18b35586e53fa4d36f4e9c3fc0c0ad7f3823b0b6a49a8` | `7cc31945c7f0e5d8d198d22902c9adfcd2e4f5ff467a8a96d070633d98ac6989` | `2e72bf750658d5bd3b4bbb2be2f6a543da5c0ebb9e88726ddb6d1901e508e49f` | 596 |
| 5 | `27c15ddd74a822df1771253296ce174fde7e23d4236cedca03117f5b1cda59c2` | `ebddfaa1f991fd23c3d7f36ceaba282aa9926bb7e7ab46e02a7591e4e7c9c78e` | `f6fdb1d97a6da96148aabc6a7e0abd60e9a6770a9806a719d022c44fa45b0dd5` | 647 |
| 4 | `c467fa7c9d8c03a962d77fd921e64a2072e96a685bf3f6d13577c21176774dd9` | `9ac11e52ea878ada1334f36bd5196306942b343dccf268805a1277abdebde5a3` | `0080d03570897287a18260e525d620eb869323e2d9f9c0636a88bccbca839599` | 698 |
| 3 | `2de4bff1c773c42298ecc7ac5001c21298082fa760e64f835249c92028cbced2` | `7f9b3aa013cdc5775b7228d23e9a1f750119df0f4384e5f9e32729897993aac5` | `8c528bf530077f243ba0d3ea91f9ac76aae2b1f5dfda494ecabc28859af18133` | 748 |
| 2 | `8e2554478ab2c1b75811be57748591af3ae60b11ab06e5b8fbc6ffcb5bea5ee0` | `05f725d3c94313e97b81e7490c65ee40710d04a4c37decf361d0c6884809836d` | `f51c35d5175c7216ecb74ab361a112a5d90a8960ce0a815cf5fccd6ba723fdda` | 799 |
| 1 | `2585c631e5053076f00e5d8c59ef19941519d144ae32d5bf942e69361d3804c0` | `eb00b6986e6305207b11d4193c109a38f356cf8bff91ab0024e4cbec79d803c2` | `0fe6117bbc9d1c644db436e33f3197d4701abbbf8c8b7ced5d3de8110e9bc447` | 849 |

`density-before/result.json` SHA-256 is
`526ad1d33f8e01dbffd5f53885a280ef7a9a3e8b72084b7a9c84a12e6984e5fd`.
The browser's one-step 50 ms behavior is functional evidence only, not proof
of native HID cadence.

## Browser-after inputs

The integrated runtime is `a751b2dd`; its source candidate is `43cbf493`.
The same muted production route reaches rows 1 through 6 and back to 1 with
50 ms semantic touches, clamps at both endpoints and records no browser errors.
The descending inputs are:

| Rows | Upper SHA-256 | Lower SHA-256 | Capture metadata SHA-256 | HOME updates |
| ---: | --- | --- | --- | ---: |
| 6 | `3ad241041c23d4806315945d4dda682018785223cb85d0c89fc308ecb99371f4` | `f472cf524e591bcb75fbb79943c78f4ec221dcd00b7ae0b741d44ea350f0c08a` | `eddf82a60c39fad3e71c7854178b12996464a76d660fb851cd44c846b9704a9b` | 607 |
| 5 | `0f77f0e5f15be8a29d7657c8fbc1490edf1ea01e9fbd784e5f7a681e5d6e1243` | `0b41e247393fe26b27b67259710c435075e0a75fcb42c7262cd40a90307e696d` | `001f285214bac6001127c46bb962f401150f32dad94f7e6c25362bc32ca244bd` | 659 |
| 4 | `915791c36a93c4bc0fdeb583db19aa2be7422c91f60d4b2b0ba941996ba4801e` | `8bc3b264af6cc7ce75ad868d81aba27a25234510a0e5723bc8de2ee8adefe351` | `a683830008a8db172e7640460f2b3e6437b435e9d42a3447d4bffc3b71b7d49f` | 709 |
| 3 | `822dc47dc75c31819a57941ab10eca926890ecec5e25d7f883658e17329103db` | `1ca4dedc12c4051aee5704496d8e63eef0b32fa37414b19ad076c7ec6472b210` | `973f9609f8c6fda19e73b54d358dcc0ea5f88d1f8b7630ee5286c20d5089b1a6` | 762 |
| 2 | `a77e6854cd4feaf1431410a0d241281c07b373b7875d043177bebf8756944867` | `520064c05523f3264e1f102f0bdd355f8cc28ad242df121175e9b4df5882251f` | `10518436f311e453f114d51dc5ea828bf3c5398f270f2da873dadd93a8179cea` | 812 |
| 1 | `a8a188f0b394e89b3d95936469d76b75101f4ff4f08df7ec2ef7f6e456732674` | `d63cc727ef0ef86b96c2ea3d6f0e00a25cf5a1eefba4474a09cd033ca33e2df7` | `0299b7a1019bb514fcc0f83979b08ce299f5a4b46f5a9214d2302ef786b87d6b` | 863 |

`density-after/result.json` SHA-256 is
`6551189c29545f4aff24cef56be283865e12a3b113b7d553014da2a97f4aa112`.
This route verifies the refreshed diagnostic target against the current
viewport, but it does not establish native HID cadence or a matched native
input epoch.

## Static baseline

Every empty-mask whole-LCD pair remains `unexplained-differences`:

| Rows | Upper pixels >2 / mean / max | Lower pixels >2 / mean / max | Report SHA-256 |
| ---: | --- | --- | --- |
| 6 | 14,005 / 9.359330 / 251 | 15,142 / 7.414136 / 255 | `8710f33b78b41cca9abbcc3c5cf247a0d21284d87472eff82535187438fdfa06` |
| 5 | 14,905 / 5.082108 / 215 | 13,891 / 8.853012 / 255 | `e7ef81cf5ee8350b7503be3244ae19de8b23e33a7594fe335c022cd814f96002` |
| 4 | 57,962 / 10.006799 / 215 | 19,861 / 11.075061 / 255 | `b915dd706f85993c827e2d8c3963063781be6d76a76ef6fcc2fb3391e942e574` |
| 3 | 52,398 / 5.971774 / 215 | 33,186 / 22.011762 / 255 | `c8ef2c2d29d1907a1ac5854644f6f89b647b33d79c10104c10f6af84209de553` |
| 2 | 57,269 / 6.449684 / 220 | 29,984 / 16.112266 / 255 | `fc93a9ae70f41d746e84d4c592e217adf52aaf48e325211034a994d4bd0940db` |
| 1 | 56,584 / 7.748194 / 220 | 15,499 / 5.183268 / 245 | `d120d63fc14e4e8e22e0f2fae1cfca6236ea812b0a66a72ad7d232974a569831` |

Population is intentionally unmatched: native uses the pinned installed-title
set while browser includes scoped portfolio titles. HUD, wallpaper, banner and
cursor epochs also differ. The grid and selected-neighborhood counts are
therefore controls, not alignment fits. The opened lower sheet confirms the
same authored density sizes with different title population/order.

Four lower regions are stable across all six rows:

| Region | Rectangle | Baseline result |
| --- | --- | --- |
| HOME toolbar | `[0,320) x [0,32)` | 0 / 10,240 above 2, maximum 2 |
| Notes glyph | `[64,90) x [3,26)` | 0 / 598 above 2, maximum 1 |
| Density controls | `[267,320) x [0,32)` | 0 / 1,696 above 2, maximum 2 |
| Open footer | `[0,320) x [212,240)` | 694 / 8,960 above 2, maximum 30; known separate source gap |

Rows 2 through 5 have identical sub-threshold toolbar/density-control metrics;
rows 1 and 6 differ slightly because the disabled endpoint control binds the
authored alpha-120 Invalid state. All remain within the static delta-2 tier.

## Production-after comparison

Every production-after empty-mask whole-LCD pair also remains
`unexplained-differences`:

| Rows | Upper pixels >2 / mean / max | Lower pixels >2 / mean / max | Report SHA-256 |
| ---: | --- | --- | --- |
| 6 | 16,952 / 9.848840 / 251 | 15,126 / 7.418377 / 255 | `9f7547e28877524a01f0a7771343f9111e6d97ec85efc1cc4aac8c0f0de6ab93` |
| 5 | 12,679 / 6.767517 / 215 | 13,900 / 8.867886 / 255 | `047634b45f7fb9544a68abbdd1087b6172fa8f92f0e32dacc1050b136e3aa90f` |
| 4 | 57,423 / 7.685861 / 215 | 19,962 / 11.138628 / 255 | `0a49448dc54de823bb641953f35c8e8558891afd0f12c0bc6720fd8a60d98bcd` |
| 3 | 51,525 / 8.978063 / 215 | 33,227 / 22.013516 / 255 | `9e9102bf6825c47928a97fcf067e8aa105f063278c1a7a980bc16c5bb754b65e` |
| 2 | 58,541 / 9.062684 / 220 | 29,559 / 15.762986 / 255 | `3878fa202bea82de348ca531a0b457b630077fe138a39456e9a74ed4077a3b15` |
| 1 | 55,280 / 6.092854 / 220 | 15,393 / 5.136888 / 245 | `e1a0cc8f222b3615fb93c73953d524c96172b34822cfc5561074c590165d9701` |

The stable lower regions reproduce the baseline exactly at the acceptance
threshold in every row: toolbar `0 / 10,240` above 2, max 2; Notes `0 / 598`,
max 1; density controls `0 / 1,696`, max 2. The known separate Open-footer
gap remains `694 / 8,960`, max 30. Density variation therefore exposes no new
stable toolbar or density-layout residual.

The direct browser-before / browser-after result is deliberately not zero
because the captures did not freeze live presentation clocks:

| Rows | Upper pixels >2 / mean / max | Lower pixels >2 / mean / max |
| ---: | --- | --- |
| 6 | 6,802 / 1.211497 / 124 | 462 / 0.045734 / 37 |
| 5 | 9,824 / 2.680979 / 203 | 826 / 0.209180 / 163 |
| 4 | 10,638 / 3.152438 / 203 | 570 / 0.079514 / 79 |
| 3 | 11,187 / 3.957184 / 204 | 1,374 / 0.153750 / 58 |
| 2 | 9,727 / 3.229764 / 204 | 2,364 / 0.382318 / 103 |
| 1 | 9,423 / 2.217104 / 196 | 2,054 / 0.384071 / 106 |

All direct lower pixels above 2 fall inside the row-specific selected cursor
neighborhood; toolbar, Notes, density controls and footer are byte-identical.
The opened direct sheet shows only the advancing mint cursor loop on lower.
The opened upper sheet shows advancing Health banner and wallpaper phases.
Those differences are capture-phase variance, not an LCD effect of refreshing
diagnostic coordinates.

The next visible source-backed residual in this density set is the selected
mint cursor loop around Health. It recurs at every density, while the Health
icon itself has previously reached the static pixel tier. However, its direct
before/after changes and the native rows-1 phase control prove that the cursor
epoch is not matched here. The next action is therefore a named cursor-frame
replay using the existing `LncCsr_00` / `LncCsr_00_Scale` source scope, not a
geometry fit or source-only correction. No new stable background/layout target
is justified by these captures; wallpaper and upper-banner residuals also
remain epoch-dependent.

## Source provenance

All visible density chrome and geometry remain mapped to the pinned HOME pack:

| Element | Delivered key / owner | Dump source | SHA-256 |
| --- | --- | --- | --- |
| Launcher pack | `manifest.home.launcher` -> `packs/home/launcher.json` | HOME `0004003000009802` v24576, content index 0 / ID `00000082`, `romfs/launcher_LZ.bin` | archive `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`; delivered pack `f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044` |
| Density toolbar | `LncBase_D_01`, groups `G_Dw_00` / `G_Up_00`, panes `P_Dw_20` / `P_Up_20` | `launcher_LZ.bin/blyt/LncBase_D_01.bclyt` | `787e6b58e0455130ae1f7f4f35a5edf4472c8a21151a53bbce782e813fab5adf` |
| Disabled endpoint state | `animations.LncBase_D_01_Invalid`, constant alpha 120 | `launcher_LZ.bin/anim/LncBase_D_01_Invalid.bclan` | `d8167f86a74f324ff88f0b9baae43106e56ddc805b2e8fe0ab87f3c18a417502` |
| Ordinary tile density | `LncIconSetSrc_00` / `LncIconSetSrc_00_Scale` | `launcher_LZ.bin/blyt/LncIconSetSrc_00.bclyt`; `anim/LncIconSetSrc_00_Scale.bclan` | layout `1296496b88f41abc6c9382f59bb51927a6b8f049f9cc02454653f27d2730dcaa`; animation `ffbd67a63b4ea0a9396edb95a1f5d44c309131930f8a7de4efd92b092b68a4a6` |
| Cursor density | `LncCsr_00` / `LncCsr_00_Scale` | `launcher_LZ.bin/blyt/LncCsr_00.bclyt`; `anim/LncCsr_00_Scale.bclan` | layout `72f59f9f3d0a327c6c1e3e012a1aa9f1a1a84ab3d0c829772ae4a2a43ecd0738`; animation `74277ac0ec8debf4f035b6e4c629fb9605c897fcb50e6b5ed2447250c671c2dd` |

The pinned HOME CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
executable SHA-256 is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Conversion is `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

## Verification boundary

The coordinator reports 1,793 tests passed plus typecheck, production build and
shader check at the integrated runtime; an independent review reported no
findings. This documentation worker did not rerun those implementation checks.
No whole scenario, native input cadence, HID repeat cadence, motion, cue timing
or audio claim is promoted from this static comparison. All six whole pairs
remain fail, the current native run retains exit code 139 evidence, and the
diagnostic-coordinate fix earns only its responsive target-coordinate result.

## Artifacts

Private root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-touch-projection-20261002/comparison/`.

- comparator: `compare.mjs`, SHA-256
  `b69e0156e69bfcc14f82f7c0593af7ee775fd199d99b99b4980f72e8ade4cc94`;
- empty mask: `empty-mask.json`, SHA-256
  `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`;
- baseline report: `baseline/report.json`, SHA-256
  `90a3987e111a99627732b8c70835cf7d47c40430b563ff607355b81f7b44c388`;
- opened combined native/browser/heatmap lower sheet:
  `baseline/density-lower-native-baseline-contact-sheet.png`, SHA-256
  `c95f34c9d25efb0fc8f90bec1ccfb13317d46274fc8fd219a831cb87885eaaaf`;
- opened combined upper sheet:
  `baseline/density-upper-native-baseline-contact-sheet.png`, SHA-256
  `2af67ea805216c03f0f15e98de9e906e810460eb742ec6e030cfc5e49610452e`;
- after report: `after/report.json`, SHA-256
  `d5ad918a7a58450e1f88422ffc71ae9362ad023d9efcdaf789a1d16c0a9a9562`;
- opened after native/browser/heatmap lower and upper sheets: SHA-256
  `96ae9b7f70fce6e412d96eb3fdc7fc39e6247e640154ad8a6f13dad8b5a5bd96`
  and
  `2647be791032282a5c772c4afa43868520d3d5224f9910507e44d2903fd4ec0d`;
- opened direct before/after lower and upper sheets: SHA-256
  `75f45310cd79de70edfbc0344738aa35e60a00e23b24bdc40232f6f36f93dae0`
  and
  `3e0fbb46417c95ea77fd2f336cc9c8bd210d59000f3b152dce6147dab4e1defe`;
- per-row reports and sheets: `baseline/whole-lcd/rows-{1..6}/` and
  `after/whole-lcd/rows-{1..6}/`.

The JSON reports parse successfully and all four after combined sheets were
inspected at original resolution. This worker changed no runtime, asset,
shared project document, matrix, GUI, native, browser, audio or build state.
Documentation-only verification uses `git diff --check`.
