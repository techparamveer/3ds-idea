# HOME Power Multiline Block Centering - 2 October 2026

Coordinator follow-up: integrated as `57c4c824` and
[production/native compared](home-power-centering-2026-10-02.md). Upper list
4331 -> 0 pixels above 2, whole upper 4334 -> 3; lower pixel tier preserved.
The remaining footer cluster and input/motion/audio gates are still open.
The source-worker acceptance boundary below describes its pre-integration
handoff, not the later comparison result.

This bounded source trace resolves the horizontal origin for the upper Power
message `Slp_U_00/T_Main_00`. It does not add the rejected multiline LCD
sampler, a fitted offset, a font, an atlas, or a coverage curve.

## Source identity

The pinned source is EUR 10.7.0-32E English HOME Menu
`0004003000009802` v24576, content index 0 / ID `00000082`. The decrypted HOME
code used for the read-only trace has SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

Relevant pinned resource identities are:

- `sleep_LZ.bin/blyt/Slp_U_00.bclyt`:
  `4b2d4f32afdb368996a9d9f6e5947a3b0155bfad802d4c9e9b9696b5a1344027`
- menu MSBT:
  `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350`
- RI style table:
  `224aec428f67f35e0a23b3e7de464b2b4fe1d18dd1cf07fa9b0b53d5ad3db555`
- decoded shared font source:
  `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`

The checked-in converted records are `sleep.json`
(`bfe9219930b99d475b0ceb0895c086e5854442a1e91fae2f5120feab313f59ef`),
`messages-and-loose.json`
(`3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`)
and `fonts/shared/font.json`
(`d48b661f446e3e581abeceb62b86312a6fea6c8120cd1214ba76b298f94c9f27`).
Conversion remains `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

The read-only exact-writer evidence is under the private
`runtime/reference/folder-text-alignment/` source directory. The relevant
annotated excerpts are `01-pane-writer-setup.asm`
(`8741db5a0273c72044b302521b9d13a6eb75f77d9ff1df655c52d2dcb16a811b`),
`04-writer-alignment.asm`
(`2a317bd23c4ae3f6bbb01e55369f97a02c85db70d0a656d485cb275c0c89befc`),
`06-measure-string.asm`
(`ee4ba5670cfcd0c7369ecbd030b0cd562e59a4bc527c42e1c39055f6458994fb`)
and `07-measure-line.asm`
(`4e745160a67824cde33b8ae1f24e486021dbdc37abfcdd9e25d951b20c6e5aa5`).
No private evidence was modified.

## Exact writer rule

`T_Main_00` decodes to pane alignment 4 and explicit line alignment 1.
`0x1a3e24` maps those fields to writer flags `0x110`:

- `alignment % 3 == 1` sets whole-string horizontal centre bit `0x10`;
- `floor(alignment / 3) == 1` sets vertical centre bit `0x100`;
- explicit line alignment 1 maps the low per-line bits to 0 (left).

At `0x2ffc90`, any block-centre flag measures the complete string through
`0x21a924 -> 0x2187b4`. Instructions `0x2ffd18..0x2ffd58` sum the measured
left and right bounds, multiply by float32 `0.5`, apply the exact ceil helper
at `0x208688`, and subtract that value from the writer origin. Low alignment
bits 0 then store the same X origin for every line at `0x2ffd98..0x2ffdb0`.
The alternative low-bit-1 branch at `0x2ffdf0..0x2ffe2c` measures and centres
each line; Power does not select that branch.

`0x2187b4` merges CWDH bearing/width glyph rectangles into the line rectangle,
then also merges the float32 cursor after each CWDH advance at
`0x218b14..0x218b40`. Thus the general rule is:

```text
blockOriginX = paneWidth / 2
             - ceil(float32(float32(blockLeft + blockRight) * 0.5f))
glyphX       = float32(currentWriterX + float32(leftBearing * scaleX))
currentWriterX = float32(currentWriterX + float32(advance * scaleX))
```

This is a measured-rectangle rule, not generally `ceil(maxAdvance / 2)`.
For this exact English Power message every line measures left 0 and right at
its final advance, so the two happen to coincide:

| Line | Float32 left | Float32 right/final advance |
| --- | ---: | ---: |
| `・ Count your steps and` | 0 | 193.04998779296875 |
| `　 collect Play Coins` | 0 | 164.44998168945312 |
| spacer | 0 | 116.9999771118164 |
| `・ Use StreetPass` | 0 | 142.99998474121094 |
| spacer | 0 | 116.9999771118164 |
| `・ Receive various content` | 0 | 211.25001525878906 |
| `　 via SpotPass` | 0 | 122.84998321533203 |

The style scale is float32 `0.6499999761581421`, character spacing is 0, and
the pane width is 380. The source result is therefore:

```text
190 - ceil(float32(211.25001525878906 * 0.5f)) = 84
```

The previous generic path used `(380 - blockWidth) / 2`, approximately
`84.375`. The source rule moves the writer geometry left by approximately
0.375 pixels without encoding a `0.375` constant. The earlier comparison-only
best sample `x + 0.375` is consistent with that direction, but is corroboration
only and did not determine the implementation.

## Bounded implementation

`multilineBlockOrigin: 'writer-0x110'` is an explicit pane override. Power sets
it only on `Slp_U_00/T_Main_00`, beside the already decoded newline advance
scales. The font writer accepts it only for multiline alpha text with alignment
4, explicit line alignment 1 and zero character spacing; other shapes fail
explicitly. It measures CWDH bearing/width/final-advance bounds and accumulates
horizontal writer coordinates with float32 arithmetic. Default callers remain
on the prior generic path. `T_Top_00`, `T_Btm_00`, both lower labels and the
lower final-LCD sampler are unchanged.

Focused verification passes 51/51 tests across `bitmap-font`,
`native-renderer` and `native-system-presentation`, followed by a passing
`npm run typecheck`. Tests pin the seven source line bounds, origin 84, shared
left block origin, unchanged vertical advances, default fractional origin,
pane-only propagation and invalid-shape rejection.

## Acceptance boundary

This worker did not operate Azahar or the production browser, change the
private scenario matrix, or perform a production build. The coordinator owns
integration, full checks and a fresh matched recapture. Until that comparison,
the upper Power screen remains a fail at the prior 4,334 pixels above 2/255;
the source-supported origin is implemented but not yet native-compared. The
lower static 0-pixel-above-2 result must be preserved. Exact coverage, the
remaining three footer pixels, motion, input epoch and audio remain open.
