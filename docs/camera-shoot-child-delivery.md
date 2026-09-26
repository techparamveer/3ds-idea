# Camera shoot button child resources

The missing `-L-BtnIOcam` is an instance anchor, not an archive or layout name.
The native `P_Shoot_D` pane's `LYT` metadata names `P_Shoot_D/P_CamBtn`.
That layout's `-L-CamIcon` anchor in turn names `P_Shoot_D/P_CamIcon`.
Both child layouts were present in the private conversion but omitted from the
public selection. This delivery adds them and their four clips to the existing
manifest pack:

`packs/camera/contents/0000-0000001a/lyt-P_Shoot_D-arc-LZ.json`

The source is EUR Camera title `0004001000022400`, version 4097, content index
0, content ID `0000001a`, archive `lyt/P_Shoot_D.arc.LZ`. Its compressed SHA-256
is `a5aa9ae10eb59d400160a85f8aa919a274f6f13d480d041d7f95b91eef0dd41e`;
its decompressed archive SHA-256 is
`6610e8621e2870facf9a9ea2cd0f4ba3e7ec046b0cc586210001993a5645e515`.

| Archive member | Original member SHA-256 |
| --- | --- |
| `blyt/P_CamBtn.bclyt` | `af471925343dab648422e7793264b99f1ebd7267cc48bd01cfc644c72acb1e2f` |
| `blyt/P_CamIcon.bclyt` | `2e70e74d1d877be77179b5bbed79cf73131101c3fbbc58b105b90b284a524da2` |
| `anim/P_CamBtn_Default.bclan` | `1b6eb9ca041fb18f774dfa2ad70ed29699290aaf581203f5b7f5596b65aa88e3` |
| `anim/P_CamBtn_Disable.bclan` | `fca988ca9b69e888f84dab56b5793a34486a04194e27c6c0c549027b2aada25e` |
| `anim/P_CamBtn_Push.bclan` | `39ccb1c78085dac2c75026e4cc280e573ce78698753b8e963f026bb5d0c2760e` |
| `anim/P_CamIcon_IconPtrn.bclan` | `8ce8d08b7dab82be08642f8e4a27f3b89a4cf9f35ae7b8c99bfc005638b97e7d` |

The publisher copies the three dependency PNGs for `P_BtnUW_43x44.bclim`,
`P_IconNrl_Icam.bclim` and `P_IconNrl_Ocam.bclim`, preserving converted pixels
and source provenance. The original archive and member bytes remain private
and unchanged. Public source paths, hashes and content identity are retained
in `resourceSources` and the manifest resource records.

## Reproduction and checks

Run the existing publisher against the private `camera-native14` conversion:

```sh
python3 -B scripts/firmware/stock_ui.py \
  --source /path/to/stock-ui/camera-native14 \
  --output public/os/firmware/10.7.0-32E \
  --plan scripts/firmware/stock-ui-camera-shoot-children.json --additive
python3 -B -m unittest discover -s tests -p test_stock_ui.py
```

All 13 publisher tests pass, including the nested `LYT` closure, member
provenance and dependency integrity check. Direct inspection of the original
archive verified all six member hashes; fresh decoding matched the delivered
layout/animation values. A fresh publication from the `271ddc9` manifest and
shoot pack reproduced all five output files byte for byte (manifest, pack and
three PNGs). `git diff --check` passes. No runtime files changed, so no app
rebuild was required.

## Integration limits

The parent anchor translates by `[-55,100,0]`, the CamBase picture is 46×50,
and its nested icon anchor translates by `[0,-2,0]`. The icon's source metadata
sets `ANM_IconPtrn` to `[0]`; local clip frame 0 selects Icam and frame 1 selects
Ocam. These are source facts, not proof of the settled Welcome controller state.
The `Disable` clip also carries alpha keys with duplicate terminal frames;
preserve them rather than simplifying the source animation.

The runtime still needs to instantiate both child layouts at the native
anchors, select the appropriate source clips and compare the resulting LCD
pixels. This publication does not establish visual acceptance or the current
camera selection. No browser or Azahar instance was driven in this lane.
