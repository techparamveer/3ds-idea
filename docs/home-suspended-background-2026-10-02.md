# Suspended HOME Background

Runtime `fc6e5983b442ff95aa703f449e4ad79a13336c4c` replaces the flat expanded
capture and compact-mode white wallpaper with the firmware BannerBG mesh,
capture mask, combiners and settled AppPause pose. This is visible progress,
not whole-scenario 1:1 acceptance.

## Source Mapping

| Visible element | Manifest key / resource | Source |
| --- | --- | --- |
| Curved capture surface and dark colour treatment | `models.homeBackground` -> `models/home-background/model.json`; `BannerBG`, `BannerBG_SceneIn`, `BannerBG_AppPause` | HOME `0004003000009802` v24576, content index0 / `00000082`, `romfs/3D/BannerBG_LZ.bin` |
| Capture edge mask | `models/home-background/texture-1.png`, `BG_CapMask_00` | Same CGFX, original A4 `256x512` texture |
| Secondary background sampler | `models/home-background/texture-0.png`, `BG_64_00` | Same CGFX, original L8 `64x64` texture |
| Dynamic app frame | `BG_DmyApp_00` sampler slot0; dummy at `models/home-background/texture-3.png` | Last complete application-owned LCD pair, not a new firmware asset |

CIA SHA-256 `2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
decrypted content `c622d1c5584d7fae6622b6c20b258e93f7924b294651d669a539da2955d9521d`;
compressed resource `27d58c2113d2c2d46e3bcc36bb2ae56c35e19d9823488287b6759df998108711`;
decoded CGFX `092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595`.
Delivered model `45b3c6a470f681a10443f90fc73aff016b97a077b977b62649465524dffd3615`,
converter `ctr-cgfx-web` 1.1.0. Per-texture delivered/source hashes and converter
wrapper/exporter hashes are in the private evidence summary. No asset was
regenerated; unchanged icon, window, HUD and font provenance remains in the
[compact-window record](home-compact-window-2026-10-02.md).

## Ownership and Adaptations

HOME borrows the existing Game Notes capture store. Only the visible foreground
application can publish its complete LCD pair. Rendering uses one separate
BannerBG instance and one owner/generation-keyed raster; repeated paints do not
read back or advance it. Leaving suspended HOME clears the cached raster and
replaces the dynamic texture with its source placeholder. A missing capture or
unsupported source causes paired recovery, not a reconstructed native fallback.
The normal background model, host clock and selected title banner are unchanged.

The source model's TEV stage0 uses texture0 for the app image and texture1 alpha
for masking. The original mask is opaque at x0..239, y57..454. The host rotates
the 400x240 capture clockwise, pads it into 256x512 at x0,y56, binds the mask
to slot1 and copies slot0's sampler to slot1. Original mesh, vertex colours,
TEV and animation curves are untouched. **Binding/padding/sampler choices are
source-backed fitted host adaptations, not a traced native transfer contract.**
In particular, authored slot1 wraps Repeat, whereas the copied slot0 specifies
ClampToBorder; the existing renderer maps that to ClampToEdge.

SceneIn20/AppPause20 is a settled presentation adaptation. The executable proves
mode1 pauses Loop and starts AppPause, but this patch does not establish its
transition predicate, epoch, AppRestart or AppQuit. Source Sleep remains frame0.
Portfolio capture content is an adaptation and currently retains its own HUD
inside the warped frame; it can duplicate the outer HOME clock. Existing caption
fits, footer policy, Settings fits/local persistence and offline content remain
adaptations. None excuses native residuals.

## Evidence

Private root:
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/suspended-background-native/`.
`summary.json` (SHA-256
`5e0c07a6365590a31e6c61943ce52e4a6682b86b5aa0d10861b467fb70b066d2`)
records SHA-tracked raw pairs, empty masks, reports, contact
sheets and source identities. `summary-retained.json` preserves the earlier
retained-native diagnostic; do not confuse its figures with fresh capture results.

Nine production pairs under `reference/scenario-matrix/v1/captures/` cover
expanded, Camera, moving Camera, switch, footer-switch, resumed, reselected,
closed and portfolio states. Prefix `suspended-background-`, suffix `-20261002`.
Each has 400x240 upper and 320x240 lower PNGs plus capture/input metadata.
Three browser sheets were opened; no page errors occurred. Desktop and 390x740
viewport screenshots were inspected, nonblank and correctly framed.

Fresh isolated Azahar own 400x480 PNGs in the sibling
`native-close-clean-20261002/screenshots/` directory:

- `_02.10.26_06.20.12.575.png`: HOME idle.
- `_02.10.26_06.22.40.247.png`: Health suspended, expanded.
- `_02.10.26_06.22.57.828.png`: Health-to-Camera switch.
- `_02.10.26_06.23.19.388.png`: Camera selected after cancelling switch.

| Fresh native pair | Prior upper pixels >2 | New upper / lower pixels >2 |
| --- | ---: | ---: |
| Expanded Health | 95,276 | 12,137 / 48,794 |
| Camera selected | 83,998 | 17,544 / 48,602 |
| Switch | 84,825 | 16,339 / 12,536 |

The unoccluded expanded backdrop strip (22,24,356,24) improves from 8,544 to 46
pixels >2; mean RGB error 145.654 to 0.345. Bottom strip (22,190,356,22) improves
from 7,832 to 44; mean 101.218 to 0.372. These are region diagnostics, not passes.
All six fresh comparison sheets were opened. Native/browser prefixes, density,
population, HUD and banner/capture phases differ; exact replay remains unproven.
Whole frames remain **fail**, and the historical private matrix is untouched.

Native PID12652/window5290 was verified on Sidecar at1810,397,1153,781;
private cwd, no user-tree symlinks, pinned executable SHA3dfdfbed..., original
hardware/EUR, synthetic Static input2, Null output1, volume0. No startup warning
was present this run. Initial held Open attempts did not launch; selection was
restored by touch, and A launched Health. Held Shift upper drag500ms returned
HOME; Camera200ms opened switch and Cancel200ms returned to selection. Thus
this is not an identical-input replay. Quit/Yes exited139, not cleanly; process
absence was verified and temporary HOME/touch mappings restored while stopped.

Full suite: 1687 pass, 0 fail, 23 skip, 1 TODO. Focused 16 checks, typecheck, build
and shader validation pass. Earlier typecheck caught a transient misplaced
assignment; it was repaired before the passing build and committed captures.
No new native audio cue was added; all playback remained muted.

Next: source upper/lower sleep highlight, modal footer hiding, HUD residuals,
then exact transition/capture epochs and matched input/motion/audio acceptance.
