# HOME Power message spacing — 2 October 2026

## Defect and bounded correction

The browser Power upper screen drew the five visible `lau_press_pow_u1` lines
at rows 33, 54, 95, 136 and 156. The supplied native 400×480 capture draws the
same lines at rows 49, 70, 95, 121 and 141. This was not a `Slp_U_00` pane
translation or font-style difference. The English message contains two blank
spacer lines, and each is entered by a group-1/type-0 start control with raw
little-endian argument `1400` (20 percent), then exited by the matching
group-1/type-0 end control. The previous generic message override removed the
controls while retaining the blank lines, so both spacers consumed a full
20.5-pixel source line advance.

`nativeMessageLineAdvanceScales` is an explicit opt-in parser for that decoded
control. It records the active percentage when each CR, LF or CRLF is consumed,
checks the token text against the decoded message text, and rejects malformed,
zero, unsupported or unbalanced scale controls. This bounded path accepts only
whitespace while a non-100-percent scale is active; scaled glyph runs fail
explicitly because their glyph-size rendering is not implemented. Other MSBT
controls are left uninterpreted. Only Power `T_Main_00` opts in; its exact
source tokens produce `[1, .2, 1, .2, 1, 1]`. Other messages retain the
previous rendering path.

The bitmap writer uses those scales only for the font-derived part of each
newline advance. The RI style's one-pixel `lineSpacing` remains unscaled, so a
20-percent newline advances `30 × .65 × .2 + 1 = 4.9` pixels. The total scaled
block height is 111.3 pixels rather than 142.5, and existing centered-block
rounding moves its first source row down 16 pixels without changing glyph
widths, pane geometry or the unscaled path. Scale count and values are checked
before drawing; invalid or mismatched arrays fail explicitly.

## Source identity

The pinned source is EUR 10.7.0-32E English HOME Menu
`0004003000009802`, version 24576, content index 0 / ID `00000082`, converted
by `ctr-native-web` 1.2.0 with CTRTool 1.3.0. The public member records omit the
content index and ID; those remain supplied by the existing private HOME source
inventory.

| Element | Manifest/member mapping | SHA-256 |
| --- | --- | --- |
| Upper pane and source metrics | `home.sleep` → `packs/home/sleep.json` → `sleep_LZ.bin/blyt/Slp_U_00.bclyt` | member `4b2d4f32afdb368996a9d9f6e5947a3b0155bfad802d4c9e9b9696b5a1344027`; delivered pack `bfe9219930b99d475b0ceb0895c086e5854442a1e91fae2f5120feab313f59ef` |
| English message and control spans | `home.messages` → `packs/home/messages-and-loose.json` → `RomFS/message/EU_English/menu_msbt_LZ.bin`, label `lau_press_pow_u1` | member `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350`; delivered pack `3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2` |
| RI message style 504 | `RomFS/message/EU_English/RI_mstl_LZ.bin`; scale `.65/.65`, line spacing `1` | `224aec428f67f35e0a23b3e7de464b2b4fe1d18dd1cf07fa9b0b53d5ad3db555` |
| Shared native font | `fonts.shared` → `fonts/shared/font.json` → shared-font title `0004009b00014002` v0, `cbf_std.bcfnt.lz` | source `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`; delivered manifest `d48b661f446e3e581abeceb62b86312a6fea6c8120cd1214ba76b298f94c9f27` |

The HOME CIA/source hash is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
its decrypted content/RomFS hash is
`c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`.

## Evidence and limits

The coordinator-supplied native PNG
`_02.10.26_11.05.45.816.png` has SHA-256
`a585889277da13c28f9b184c279c9775997859a7dbbdd64a946016dc0dfd4a3e`.
The browser-before upper PNG has SHA-256
`ce26398c660badd79e6c631e1bb1279dcf7e664942d9e5efb2b35991235c2d99`.
The row measurements above are a diagnosis of that supplied pair, not a fresh
native/browser acceptance capture.

Focused parser, adapter, renderer and bitmap-writer tests pass 80/80. They cover
the source token sequence, derived scales, unchanged unscaled coordinates,
scaled total-height alignment, source-pack immutability and explicit invalid,
mismatched and scaled-glyph failure. Type checking and `git diff --check` pass.
The full sparse-checkout suite reports 1689 passes, 36 known missing-model
fixture failures, 23 skips and one TODO. The worker did not operate Azahar or
the shared production browser and did not run the production build. The
coordinator still owns integration, browser recapture, named raw-LCD
diff/mask/report and full build. Power hold and transition clocks remain the
documented adaptation and were not changed.
