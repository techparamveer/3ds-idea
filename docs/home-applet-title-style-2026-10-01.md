# HOME applet title style - 1 October 2026

Runtime commit `13cdd13b`, on `codex/home-fidelity-20261001`. Continues the
[footer checkpoint](home-applet-footer-2026-10-01.md). Whole scenarios remain
**fail**, not 1:1. No native assets or shader code changed.

## Source and implementation

The five applet labels previously passed literal English text through the
folder label helper, retaining the layout's 15.5 x 18.6 metrics. Native uses
a separate instance of the same `BnrDsTitle_00` layout, not a different layout:
`0x24bf28` stores the folder surface at owner +0x88 and `0x24bf78` the applet
surface at +0x8c. Both initialization calls select 256x64 and the same layout.
The native selection at `0x1e1070` through `0x1e10ac` pairs categories
5/4/6/7/8 with `lau_title_memo_u`, `lau_title_fri_u`, `lau_title_news_u`,
`lau_title_web_u`, `lau_title_mvs_u`. These messages carry style index 1,
whose X/Y font scales are float32 0.82. The applet activation at `0x1f89ec`
copies the selected message pointer; `0x1f8b0c` calls the message-aware setter
`0x22a470`, then `0x1f8b48` renders the surface and binds `mt_Text`.

`appletBannerLabel` now uses existing `nativeMessageOverride` so the source
message style reaches the existing font renderer. Folder fitting is unchanged.
The shared two-entry cache distinguishes folder and applet keys. A missing
selected applet message explicitly fails; no literal fallback is substituted.

Element mapping: HOME `0004003000009802`, version 24576, content index 0 /
`00000082`, EUR English. Manifest `home.banner` selects
`packs/home/banner.json`, `BnrDsTitle_00/T_Title_00`; `home.messages` selects
`packs/home/messages-and-loose.json`, `menu_msbt_LZ` upper labels and
`message/EU_English/RI_mstl_LZ.bin` style 1. Converter `ctr-native-web` 1.2.0,
CTRTool 1.3.0. Source paths and SHA-256:

| CIA-internal source | SHA-256 |
| --- | --- |
| `romfs/banner_LZ.bin` | `5ed6d1edc6daed5decdf1425832be8567e54e809f9b81278b1275381d86e2fc3` |
| `romfs/message/EU_English/menu_msbt_LZ.bin` | `f83bc1173ea83c6a426782e3e74a3dee60774aaeb28178ed20dca44abf658b87` |
| `romfs/message/EU_English/RI_mstl_LZ.bin` | `599e284531b21c353ee14b23b8ebf61d8d6da16692db8be380edeaedce09b12c` |
| decrypted `exefs/code.bin`, load base 0x100000 | `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9` |

Delivered banner pack SHA `44622f5f4607489a9ab7788d528faa63bb093bd80a8785411c4bcdc7835357aa`;
message pack SHA `3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`.
Existing `fonts.shared` maps to `fonts/shared/font.json`, SHA
`d48b661f446e3e581abeceb62b86312a6fea6c8120cd1214ba76b298f94c9f27`,
from title `0004009b00014002` v0 `romfs/cbf_std.bcfnt.lz`, SHA
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`.
That older font manifest does not identify its content index; this field
remains unsupported here rather than invented.

## Production comparison

Private root `R` is `/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001`.
New production captures are under
`R/captures/reference/scenario-matrix/v1/captures/{notes,friends}-title-style-after/browser/`.
Reports and both inspected LCD contact sheets are under
`R/comparisons/{notes,friends}-title-style-after/`. Reports include full hashes.
Empty mask SHA `dc4b320b16c2dd2d560b4bae62d9d061b0d93c83496c3c0902df1e3233b36e95`;
threshold >2/255. No differences are masked.

| Pair | Retained Azahar PNG | Upper / lower residual | Browser upper SHA-256 |
| --- | --- | --- | --- |
| Notes | `_01.10.26_20.48.59.746.png` | 53,417 / 19,454 | `64cdbdf02afd3cf4f68e976517363bf49ac9be4a90c4aed98a30c3f99919b10b` |
| Friend | `_01.10.26_20.47.52.66.png` | 50,881 / 19,537 | `21574739ca9e01e5df0e7e7331ee41a4999acdb1c3f874c0e54d4a8f0a2d153f` |

Native identities are unchanged from the preceding footer record. Within the
title area `(90,170,230,44)`, Notes improves 1,588 to 580 pixels, mean RGB error
8.5831 to 0.8525; Friend 1,384 to 582, mean 8.0304 to 0.8981. This rectangle
also includes unmatched wallpaper at the plate edges. The tighter text region
`(140,180,120,24)` retains 5 pixels / max delta 3 for Notes and 33 / max 34 for
Friend. These residuals are not a pass claim.

Browser sampling remains 12,000 ms and displayed 20:43/20:42; native captures
are retained, not fresh synchronized replays. Browser input was focused canvas
M (mute), ArrowUp, X density cycles, and ArrowRight for Friend. Rapid X events
gave asynchronous observations; no capture was accepted until rows=1 and the
correct toolbar focus were verified. Lower cursor phases differ from the
preceding browser run, so lower totals do not measure a label regression.
Matched input/motion and fresh native recapture remain required. Only Notes
and Friend were visually compared; all five message bindings have regression
coverage, not native comparison coverage.

The browser was placed and read back at `(1810,397,1150,780)` on verified iPad
Sidecar before navigation to the app. Launch used `--mute-audio`, then the
app's own mute state was verified true. The user's separate 3011 browser tab
was observed already muted and was not changed. No Azahar process was active;
the isolated profile remains volume=0. Test browser and server were closed.

## Checks and remaining work

28 focused tests pass, full suite 1,528 pass / 0 fail / 23 skipped / 1 TODO;
typecheck and production build pass. Full log: `R/applet-label-tests.log`.
Regression covers all five upper message styles, missing-message failure,
folder isolation, cache bound, surface disposal and no source mutation.

Remaining native residuals: title antialiasing/plate edges, banner yaw/phase,
wallpaper/HUD/cursor phase, footer raster, exact input/motion/audio. Portfolio
tile content/population and offline policy remain intentional adaptations.
All 3DS audio must stay muted per user; audio acceptance is unverified.
Two user-requested worktree agents audit footer residuals and input replay;
only the coordinator operates GUI sessions. No push, merge or deployment.
