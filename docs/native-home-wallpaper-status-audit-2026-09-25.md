# HOME Settings upper wallpaper and status audit

This is a read-only follow-up to the genuine EUR 10.7.0-32E
`home-settings-selected` native capture. The integrated `3a9b1cf` browser
source-pose samples at Settings `COMMON` frames 150 and 450 differ from that
native upper LCD by 39,425 and 39,009 unmasked pixels over 2/255,
respectively. Frame 450 is slightly closer in the whole-LCD count and gives a
similar narrow wrench silhouette. Neither source-pose sample is a matched
native timing checkpoint. The native HOME and `BannerBG_Loop` frame counters
were not captured.

## Wallpaper evidence

The browser's large rounded cells initially resembled the handcrafted
`src/os/screens.ts` fallback, which is drawn before the scene's source
`BannerBG`. That resemblance does not establish fallback bleed. The delivered
HOME `BG_64_00` texture itself is a rounded cell, and the native source audit
at `runtime/reference/banner-background/report.md` records a native replay
with large cells. The authored default path restores `BG_64_00` to both pattern
samplers; no theme-driven UV rescale or neutral-white material recolor was
found. The 600-frame `BannerBG_Loop` translates coordinate 1 from
`(-0.357778, 0)` to `(-0.6911, 0.1666)` while coordinate 2 remains fixed.
Different relative pattern phases can change the apparent cell density.

The frame-450 browser sample uses `lcdElapsedMs=12000`, which asks the scene
renderer for `BannerBG_Loop` frame 120 modulo 600. That is independent of the
verification-only Settings `COMMON` frame 450. In the two wallpaper margins
`x=0..61` and `x=338..399`, `y=35..209`, **9,732 of 21,700 RGB pixels are
identical** between native and browser; 7,485 exceed 2/255, with mean RGB
error 2.437/255. These exact matches disprove a blanket incorrect palette or
viewport scale diagnosis. The remaining pixels cannot be assigned to clip
phase, 2D slide background, alpha composition or texture filtering from one
unmatched still pair.

The source pass trace places `LncBgSlide_U_00` (priority 5001) before 3D
`BannerBG`, then the upper base and `HudMenu_00` after 3D. The bounded
constructor trace finds the slide object enabled, but does not establish its
settled white HOME activation or pane/animation state. The browser currently
uses the fallback Canvas background before BannerBG instead of a source slide
presenter. Removing its cells, rescaling the source UVs, changing sampler
filters or tinting material constants from this contact sheet would be a
capture fit without source support. A matched native background phase and a
source-verified slide eligibility/pose are needed before a visible correction.

## Status strip evidence

The native capture says “Internet” with an orange battery; the browser says
“Disabled” with a blue battery. `src/os/firmware-presentation.ts` requests the
source `HudMenu_00` layout but fixes `NetMode` frame 4, `NetAtn` frame 8,
`Bat` frame 3 and text `lau_connect4` (“Disabled”). The text/icon/color drift
therefore has an explicit state/input cause in the OS presenter; a scene
palette edit would not correct it. Native network and battery telemetry and
their HUD frame/message mapping remain to be captured and traced.

| Visible element | Public manifest key | Decrypted source | Evidence and open cause |
| --- | --- | --- | --- |
| Rounded wallpaper and shading | `models.homeBackground` | HOME `0004003000009802`, `3D/BannerBG_LZ.bin`; decoded SHA-256 `092c8682d0cfabf0a1823a8e3a2c12556515c437afba2aa6f6ac7fc4d5e34595` | Model/texture and source Loop are present; unmatched loop phase and alpha/pre3D composition remain open. |
| 2D slide below 3D | `home.launcher` → `packs/home/launcher.json` | HOME `launcher_LZ.bin`, `LncBgSlide_U_00` | Source layout exists; settled eligibility/pose is not yet established or presented in browser. |
| Upper HUD | `home.hud` → `packs/home/hud.json` | HOME `hud_LZ.bin`, `HudMenu_00` and `hud_msbt_LZ` | Source art/text present, but browser uses fixed Disabled/blue-battery pose rather than native telemetry. |
| Settings title silhouette | `models.settingsBanner` | Settings `0004001000022000`, `exefs/banner.bin` | Synthetic frame 450 brackets a narrow pose; native phase still unknown. |

No visual or audio asset, model transform, UV, material, filter, font, live
animation timing or HUD state was changed in this audit. It is source and
paired-image evidence, not a passing whole-LCD comparison. The lower LCD's
portfolio versus stock differences remain outside this wallpaper/status
diagnosis.
