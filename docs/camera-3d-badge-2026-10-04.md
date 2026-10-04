# Camera HNI 3D/2D finder badge — 4 October 2026

Stock/Camera worker on `codex/camera-3d-badge-20261004` from fidelity
`176d112f`. Visible source-backed bind: replace the `14d92d9` capture-fit
forced `2DView` with Camera selector `0x2fdc6c`. No Azahar. No preview 3021.
No CDP 9320. No recapture. No cover-fit, MPO crop, Rate or date-orange
retune. Capture stays inert.

This is not a 1:1 claim. Tests, source renders and this note do not close
pixels, input, motion or audio. Coordinator recapture remains the
acceptance gate.

## Assigned defect

`05d9ac6` bound `'3DView':{visible:stereoPhoto}`. The frozen HNI still is
3D-off, so native shows the dark `2DView` cube (material constant
`(100,100,100)`). The browser showed white `3DView` (constant 0 /
`(255,255,255)`). `14d92d9` already forced `2DView` on HEAD as a capture
fit. Stereo HNI could still regress to `stereoPhoto`. This retry lands the
firmware selector so that cannot happen.

## Source identity

EUR Camera `0004001000022400`, version 4097, content index 0 / ID
`0000001a`. Image base `0x100000`. Converter **ctr-native-web 1.2.0**,
extractor CTRTool 1.3.0
(`e4bae2eb1b254af5f4849d5807c92b3caff768fab5d5ead5f50ca0fe4ac7ff81`).
Private executable:
`/Users/paramveer/.codex/3ds-artifact-overflow/assets/stock-ui/reader-extracted/camera/contents/0000-0000001a/exefs/code.bin`.

| Element | Manifest / pack | Dump source | SHA-256 |
| --- | --- | --- | --- |
| Camera `exefs/code.bin` | title `0004001000022400` v4097 | `contents/0000-0000001a/exefs/code.bin` | `3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c` |
| Finder archive | `packs/camera/contents/0000-0000001a/lyt-P_Finder_U-arc-LZ.json` | `lyt/P_Finder_U.arc.LZ` | `5c75b6dc90e688adbf6b986833d6dc126b4c66b5eef2f7d6919c8e19a206cbb5` |
| Published pack | same URL | converted archive | `49aa8a88e6f01206551cbea5e7ee931c98a4e8c9ff448aee3efeddc8ee661bea` |
| `P_FinderVS_U` | pack `resourceSources.layouts.P_FinderVS_U` | `lyt/P_Finder_U.arc.LZ/blyt/P_FinderVS_U.bclyt` | `4e8555e4e65b45de6965ed6c8e44f95d793d2ecc4ee09d759759cf7a8e9ac16f` |
| `P_Finder_U` (Welcome) | pack `resourceSources.layouts.P_Finder_U` | `lyt/P_Finder_U.arc.LZ/blyt/P_Finder_U.bclyt` | `49746852aac6835d7666872460b621b028098f14de694ff2af7e9f139d01d71e` |
| Cube texture | pack `resourceSources.textures.P_IconOth_3D.bclim` | `lyt/P_Finder_U.arc.LZ/timg/P_IconOth_3D.bclim` | `66a737ff765feec32ec5777e19734906c0ed4775a6ef1fa074c7de39ed01d045` |

`P_FinderVS_U/ViewInfo` sits at `[183,103]`, size 32×32, origin 4. Children
`3DView` (material 18, constant 0 white) and `2DView` (material 19,
`[100,100,100,255]`) share texture index 21 / `P_IconOth_3D.bclim`. Welcome
`P_Finder_U` has the same pane names at the same translation.

## Selector `0x2fdc6c`

Verified against the hash-pinned `code.bin`. Table `0x4404cc` offset
`0x158` is `"3DView"` (`0x423892`); offset `0x15c` is `"2DView"`
(`0x42388b`). The helper looks those names up, then writes pane `+0xb7`
bit 0:

- `3DView` visible bit = incoming `r1`
- `2DView` visible bit = `r1 XOR 1` (`eor r1, r4, #1` at `0x2fdd30`)

One ARM `BL` targets `0x2fdc6c`: **`0x2a7278`**. Immediately before that
call, `0x2a7274` does `uxtb r1, r6` and `r2 = 0`. `r6` starts as the
`0x3141dc` getter (`ldrh` at finder `+0x3dc`) and can be overwritten from
a signed `+0x28` byte on the 3D-slider path. It is not the stereo/MPO
flag used by photo fit `0x210230`. Frozen HNI is 3D-off, so
`cameraBrowseFinder3dEnabled = false`.

## Change

`src/os/stock-native-camera.ts` exports:

```ts
export const cameraBrowseFinder3dEnabled = false;
export function cameraFinderViewBadgeOverrides(threeDEnabled: boolean): PaneOverrides {
  return { '3DView': { visible: !!threeDEnabled }, '2DView': { visible: !threeDEnabled } };
}
```

`drawNativeCameraFrame` spreads
`cameraFinderViewBadgeOverrides(cameraBrowseFinder3dEnabled)`. Welcome
spreads `cameraFinderViewBadgeOverrides(false)` on `P_Finder_U`. Stereo
HNI still uses the source stereo image fit and hidden `Edge0`–`Edge3`;
those stays are not the badge selector. No snap, CSS, colour, font, lcd
or `azahar-12p4-fit` guess.

## Measured pair (reused, not recaptured)

Frozen native
`reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png`
SHA-256 `cae793c3…`. Empty mask `dc4b320b…`. Threshold any RGB channel
>2/255. Independent recount of the hashed 28 September browser uppers:

| Still | Whole upper | Official `regions[2]` `[371,3,25,27]` | Box recount of that rect | Cube centre `(383,17)` |
| --- | ---: | ---: | ---: | --- |
| White `3DView` (`05d9ac6` / edge-badge-variant) | **33,997** | component **434** | **481** | native `(100,100,100)` / browser `(255,255,255)` |
| Grey `2DView` (`14d92d9`) | **33,522** | **7** | **7** | both `(100,100,100)` |

The 434-pixel cube component is gone after `2DView`. Grey leftover 7 in
the official box is max-delta 4 photo-edge AA, not the white cube. Grey
pair lower is **12,872** on that still (date/thumbs/Rate); this slice
does not retune lower. Whole-scenario still fails (photo crop and
date-group orange remain).

This helper is the same 2DView bind as `14d92d9` for the frozen 3D-off
still. Offline tools cannot re-render the HNI LCD without preview 3021,
so after-counts versus a new browser capture await the coordinator.

## Remaining

Photo crop, date-group orange, paging, Parakeet, Rate fit and whole
`camera-readonly-view-photos-page1` stay open. Live 3D-slider on is not
replayed; `cameraBrowseFinder3dEnabled` stays false with the frozen HNI
3D-off still. Not 1:1.

## Coordinator recapture

After a landed bind, run
[`docs/workstream-handoffs/camera.md`](workstream-handoffs/camera.md)
`camera-readonly-view-photos-page1` with `?cameraFixture=hni`. Empty mask
`scripts/native-compare/empty-mask.json` (`dc4b320b…`). Compare with
`scripts/native-compare/compare.mjs` against frozen native
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/camera-populated-browse-global/native/combined.png`
(`cae793c3…`). Inspect official `regions[2]` and the `[371,3,396,30)`
badge box. Do not treat tests or this note as a pass.
