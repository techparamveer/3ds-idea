# Nintendo Zone common banner: segment playback boundary

The [full Zone source fixture](evidence/zone-common-banner-animation.json)
proves that the hash-pinned common CGFX contains 37 nonconstant curve groups,
159 segments and 687 keys. This follow-up compares representative raw CGFX
segment records directly with the decoded JSON and with the current browser
curve sampler. The [comparison fixture](evidence/zone-common-banner-playback-boundary.json)
contains derived values only; CGFX and converted textures remain in private
artifact storage.

The independent raw reader follows each self-relative pointer, reads the
segment header and decodes the observed constant, Hermite128,
UnifiedHermite96 and StepLinear64 keys. All selected key values, slopes and
segment-local frame offsets match the exporter within float precision. A key
at local frame `0` in the `0x6a44` segment starting at frame `80` therefore
lands at frame `80`; its local frames `200`, `400` and `520` land at `280`,
`480` and `600`. Source-format interpolation uses the segment's own flag.

| Source curve | Compared frame | Segment interpretation | Source-format value | Current flattened browser value |
| --- | ---: | --- | ---: | ---: |
| Skeletal `COMMON2` RotationX (`0x4e84`) | 300 | UnifiedHermite96 | 1.570795 | 1.570795 |
| Material `COMMON6` texture X (`0x5258`) | 119.5 | Step bridge | 1 | 15.5 |
| Material `COOMON7` texture Y (`0x6a44`) | 280.5 | Step segment | 0.113 | 0.113 |
| Material `COOMON7` texture X (`0x7128`) | 279.5 | Step bridge | 5 | 77.5 |

The mismatch follows from two source-level conversion limits. SPICA's
`GfxAnimation.CopyKeyFrames` puts every segment's keys in one H3D curve and
assigns one `InterpolationType` to the entire curve. The browser's
`sampleCgfxCurve` applies that one type between all adjacent keys, including
the native step bridges. Also, SPICA's scalar
`GfxAnimVector.SetVector(BinaryDeserializer, GfxFloatKeyFrameGroup)` assigns
the decoded group to a local parameter. Four source groups at `0x5054`,
`0x50a8`, `0x5154` and `0x51a8` (eight keys) are consequently absent from
the H3D/browser curves. The converted source retains all four in
`sourceCurveGroups`.

These numbers describe source-format evaluation and current browser code,
not observed Nintendo LCD pixels. Exact boundary tie-breaking, HOME's title
worker timing, camera, materials and native pose still require an executed
reference and matched capture. The Zone banner remains unpublished, and both
common and selected CGFX are blocked from manifest registration.

Reproduce with absolute private paths:

```sh
python3 scripts/firmware-cgfx/audit_zone_playback.py \
  --source /private/zone/common.bcres \
  --converted /private/zone/full-converted/model.json \
  --output /private/zone/playback-boundary.json
```

The script requires the pinned common CGFX hash, checks each selected raw
segment against the decoded keys, and pins both matching and divergent sample
values. The opt-in Python test is `tests/test_zone_common_banner.py`.
`tests/zone-banner-playback.test.mjs` also samples the actual browser
`sampleCgfxCurve` implementation against those pinned browser values. Set
`CGFX_ZONE_PRIVATE` to the private conversion directory for either test.
