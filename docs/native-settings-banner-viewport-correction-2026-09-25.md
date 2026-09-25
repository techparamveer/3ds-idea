# Settings HOME banner: native target viewport correction

## Matched pair and cause

The genuine EUR 10.7.0-32E `home-settings-selected` pair is under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/home-settings-selected/`.
Its native `combined.png` contains the 400×240 upper LCD; the browser
`upper.png` is the raw 400×240 source canvas, not a page screenshot. The
unmasked report at integration `5e3ae0d` records **78,138 upper pixels** over
2/255, with a 13.948/255 mean RGB error. The contact sheet places the native
Settings model across roughly x=70–340, y=40–215, while the browser's source
3D model and 3D wallpaper occupy roughly x=0–140, y=160–240. This is a
native/browser visual comparison of the *before* build, not a passing pair.

The shared `firmware-banner.ts` renderer creates a 400×240 WebGL render target.
Three.js r186 `WebGLRenderer.setRenderTarget(target)` installs that target's
physical 400×240 viewport. The subsequent `setViewport(0,0,400,240)` call
multiplied those dimensions by the page pixel ratio, even for this offscreen
target (`node_modules/three/src/renderers/WebGLRenderer.js`, `setViewport`
and `setRenderTarget`). A fractional page ratio therefore restricted the
rendered source to the target's lower-left region. The observed footprint is
consistent with that failure. The actual page pixel ratio was not recorded in
the pair, so its numerical value remains an inference.

The correction removes the second viewport call. The target now supplies the
native viewport independently of browser DPR. The Sound room uses the same
400×240 offscreen pattern and receives the same correction. It has no native
Sound pair in this checkpoint. Focused renderer tests simulate fractional DPR
and verify the target viewport remains `[0,0,400,240]`, while the previous
render target and viewport are restored afterward. No model, texture,
animation, camera, paint order or native source asset was changed.

## Visible source identity and drift

| Element in upper pair | Public manifest key | Decrypted dump source | Remaining difference |
| --- | --- | --- | --- |
| 3D HOME wallpaper | `models.homeBackground` | HOME `0004003000009802`, `3D/BannerBG_LZ.bin` | Before build restricted to lower-left target region; recapture needed. |
| Settings bottle, icons and lettering | `models.settingsBanner` | Settings `0004001000022000`, `exefs/banner.bin` SHA-256 `5804ba5a7768d2ae9b7487e4d277923502646d89768668b19d666e3e4d30fbac` | Before build restricted to same region; model pose, yaw/frame and material pixels still need native comparison. |
| 3D stencil frame | `models.bannerFrame` | HOME `0004003000009802`, `3D/BannerFrame_LZ.bin` | Draw ordering remains source constrained; target pixels need recapture. |
| 3D projection | `models.homeCamera` | HOME `0004003000009802`, `3D/BannerCamera_LZ.bin` | Native eye/view offset and sampling cadence still unverified. |
| Upper base and status strip | `titles.0004003000009802.packs` → `packs/home/launcher.json`, `packs/home/hud.json` | HOME `launcher_LZ.bin`, `hud_LZ.bin` | Browser says “Disabled” where native says “Internet”; battery colors also differ. These are state/input differences, not corrected by the viewport change. |

The large square wallpaper visible behind the tiny 3D patch in the *before*
browser capture is the authored Canvas fallback from `src/os/screens.ts`, not
the native `BannerBG` resource. The corrected source model should cover it;
any visible remainder in the next browser capture is a separate HOME paint
defect. The eight portfolio tiles and plain portfolio content are intentional
adaptations on the lower screen. No font, sound or replacement graphic was
added in this scene slice.

## Acceptance still open

The coordinator must rebuild and restart `next start`, then repeat the same
native/browser input sequence and raw LCD capture. Re-run the unmasked diff
and inspect its contact sheet. This scene correction alone does not establish
the §5.5 pixel, motion, input or audio pass; keep every new residual region
open until it has a verified cause and correction or an accepted adaptation.
