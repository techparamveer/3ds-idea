# Health HOME balloon source audit — 2 October 2026

## Result

The visible horizontal difference between the Health title balloons in
`home-closing-fade/comparisons/after-sheet.png` is explained by the unmatched
selected-tile anchors. It does not support a balloon-body, title-placement or
text correction.

The native capture selects Health on the left side of the one-row viewport.
The browser capture retains the required portfolio-first population and selects
Health on the right side. The executed HOME routine places the body centre at
`-8` for an anchor left of the interior interval and at `+8` for an anchor to
the right. Those two valid source poses differ by exactly **16 lower-LCD
pixels**. A read-only translation search on the raw lower captures found the
same result: the balloon region's best alignment is browser `x + 16`, `y + 0`.

No runtime file changed in this slice. Moving the browser body or title to the
native screenshot coordinate would break the decoded anchor rule and would fit
one unmatched inventory rather than fix a source-backed defect.

## Capture evidence and limit

The inspected sheet is:

- `after-sheet.png`, SHA-256
  `db5256394dfc3eaac9686cfc92616251b78d875a0c226a86ad5a0bf9434b9f94`.
- Native lower extraction `native-lower.png`, SHA-256
  `dcd4f4d7b65893f320ce88e99ab68b5e7b2192e8069c0ff3d06b83f41f0e81a1`.
- Browser lower `after/captures/health-close-10/lower.png`, SHA-256
  `aa92b8f846469eae348d89083783734bc7974a2f8805f9e60dd403e539822044`.
- Comparison report, SHA-256
  `5ca9e9eed394d58a23e5fd908f54e6dbd11ba20f71683d14517db72b5bed5579`.

All are under the private root
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-closing-fade/`.
The report explicitly marks input and epoch unmatched and describes this as a
lower exit-shape diagnostic. It therefore cannot establish settled whole-screen
or motion acceptance.

For the position check, native rectangle `(x=24..279, y=30..95)` was compared
against integer browser translations `x=-24..24`, `y=-3..3`. The unique best
horizontal result was `(+16, 0)` with mean absolute RGB error `3.7369003`. A
tighter body rectangle `(x=46..257, y=35..88)` independently chose `(+16, 0)`
with mean error `3.3563068`. These values are diagnostic only: translucent
source materials composite over different neighboring tiles and wallpaper, so
the remaining pixels are not a balloon-only acceptance result.

## Decoded source contract

The pinned EUR HOME executable is title `0004003000009802`, version `24576`.
Its `code.bin` SHA-256 is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Original instructions `0x1e6758..0x1e67c8`, executed through Unicorn 2.1.4,
produce:

```text
a = slotX - scroll
childX = a
if a - 128 < -136: childX = -8 - a
else if a + 128 > 136: childX = 8 - a
bodyX = a + childX
```

Thus an ordinary left anchor composes to `bodyX=-8`; an ordinary right anchor
composes to `bodyX=+8`. The execution record
`presentation/folder-balloon/native-position.json`, SHA-256
`16965caf801e6d4c0bbefa8a68c7e7b4841f80de034e6afa66cf9cfcd789b511`,
includes representative `a=-84 -> -8` and `a=84 -> +8` results. The complete
trace and boundary discontinuities are recorded in
[Native lower folder balloon](native-folder-balloon.md).

The current presentation follows that contract:

- `nativeFolderBalloonPosition` preserves float32 operations and returns the
  executed `baseX` and child offset.
- `getNativeHealthTitleBalloon` derives the anchor from the selected runtime
  tile centre, not from a Health-specific screenshot offset.
- `folderBalloon` writes `baseX` to `N_Base_00` and the child offset to
  `N_LR_00`, retaining the authored `-6` Y translation.

The delivered manifest maps `packs/home/launcher.json` to HOME RomFS
`launcher_LZ.bin`, SHA-256
`826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834`.
The converted pack is SHA-256
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`
and records converter `ctr-native-web` version `1.2.0` with CTRTool `1.3.0`.
Its `LncBlln_00` hierarchy retains the source body halves, shadows and pointer.
`T_Blln_00` remains a centred `248 x 56` pane at authored translation
`(0,46,0)`, source font size approximately `15 x 18`, zero character/line
spacing and source alpha `240`. Runtime code overrides only its string.

## Health text provenance

The balloon string is exactly:

```text
Health and Safety Information
Nintendo
```

Both lines come from the English SMDH fields for Health title
`0004001000022300`, version `3077`, content index `0`, internal path
`ExeFS/icon`, SHA-256
`ab6cfc9da9089bb7209bee980ff79b365638e84eacb663e1a792fed58e7a9055`.
The published conversion records are `smdh-notes-english-description` version
1 at field offset `0x288` and `smdh-english-publisher` version 1 at `0x388`.
`selectHomeHealthBalloonText` rejects mismatched source hashes, title identity,
locale, field conversions or icon provenance instead of inventing fallback
text. This is the same provenance recorded in
[Health selected HOME balloon](health-home-balloon.md).

## Handoff

Treat this sheet's balloon displacement as **selection-anchor/population**, not
as a balloon renderer defect. A decisive balloon pixel comparison still needs
the coordinator to capture native and browser with Health at the same selected
lower-LCD anchor, density, input outcome and animation pose. Until then, shape,
text raster and motion remain unaccepted even though no contradictory source
fact was found here.
