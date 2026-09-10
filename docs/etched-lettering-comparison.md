# MIC and POWER relief comparison — 10 September 2026

The later [smooth fitted stencil checkpoint](source-etched-validation.md) supersedes these rejected trials.

This is a native Blender experiment, **not a promoted model revision**. The
homepage and saved rig remain the verified `silver-legends` checkpoint.

## Evidence that changes the next edit

[Pocket Gamer's hands-on original-XL report](https://www.pocketgamer.com/features/first-impressions-of-nintendos-3ds-xl/)
describes the microphone location as etched into the plastic. Its
[control photograph](https://media.pocketgamer.com/FCKEditorFiles/3dsxl-first-impressions-3ds-6%281%29.jpg)
was downloaded and inspected; at 450 × 338 it supports the overall treatment,
but does not resolve exact glyph outlines or engraving depth. This contradicts
applying the lower-key dark-print treatment indiscriminately to MIC.

The already inspected [TechRadar front photograph](https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg)
resolves MIC and POWER more clearly. Their edges and contrast differ from the
model's strongly doubled, bright outline. Lighting is different, so that alone
cannot establish an exact normal-map strength or whether every bright edge is
physically wrong. POWER's manufacturing treatment is not independently verified
by the Pocket Gamer statement about MIC.

## Controlled native trial

`scripts/inspect_etched_legends.py` copies the active material temporarily and
attenuates the two words' normal deviation toward adjacent glyph-free columns,
retaining 35% of the original signal. It does not edit geometry, base colour,
roughness, font shapes or the power button symbol. It renders a matched overhead
before/after pair, then restores and removes the temporary material. No file is
saved or exported by this script.

![Original relief](../model/candidates/joshua-xl/etched-before-right-keys.png)

![35 percent relief trial](../model/candidates/joshua-xl/etched-trial-right-keys.png)

The trial reduces doubled highlight edges, but the thin outlined strokes still
do not establish a photographic match. Simple amplitude reduction is therefore
insufficient evidence for replacing the live asset. The next material pass must
compare actual glyph profiles and recess polarity, rather than treating the
less shiny trial as finished.

## Region isolation

The first MIC rectangle sampled part of the surrounding bevel. The corrected
rectangle is PNG pixels `[623,475,653,518]`; POWER uses `[373,124,428,284]`.
Both use the 4096² normal atlas's top-left origin and a two-pixel feather.
`scripts/audit_etched_regions.py` independently decodes the actual GLB UVs and
source normal pixels. Its `etched-region-audit.json` confirms all 1,290 MIC and
8,800 POWER region pixels belong only to the chassis, and the two baseline
columns have normal blue 255 throughout. The former bevel-contaminated baseline
reached blue 195. The amended trial was rendered and inspected again.

This audit proves isolation of the experiment, not exact engraving depth or
factory glyphs. Existing source attribution and photographic-reference limits
continue to apply. The application was not modified; no application rebuild or
new interaction test was needed for this reversible native experiment.

## Photographic glyph projection experiment

A subsequent `main(photographic=True)` trial replaces the two normal-map glyph
signals with a recessed stencil derived from the TechRadar photo. It swaps and
reverses the photograph axes according to the actual chassis UV triangles, then
computes finite-difference slopes in physical millimetres. The independent audit
now verifies the UV-to-position transform and pixel pitch as well as coverage.
The projected crop footprints are 10.398 × 2.920 mm for POWER and
4.214 × 2.527 mm for MIC; these include crop margins and are not published glyph
dimensions. Exact crops, thresholds, transforms and pitches are recorded in
`etched-region-audit.json`.

The first 0.025 mm depth trial was too faint. The saved comparison below uses a
0.05 mm estimated recess and a 0.6 colour multiplier for cavity shading. This is
an authored approximation, not measured depth or a physically baked occlusion
solution. No change to the actual mesh surface is implied.

![Rejected photographic recess trial](../model/candidates/joshua-xl/etched-photo-trial-right-keys.png)

**Do not promote this shader.** Its strokes show jagged highlights and noisy
interiors because the low-resolution photograph's intensity also contains JPEG
and lighting variation. Amplifying those variations into a normal signal does
not recover clean factory engraving. MIC remains weak and uneven. Neither this
trial nor the earlier amplitude-only version is a verified correction.

The [SlashGear right-control close-up](https://www.slashgear.com/img/gallery/nintendo-3ds-xl-review/DSC00846-580x385.jpg)
was also fetched and inspected. It shows the markings on a real silver/black XL,
but its 580 × 385 resolution, viewing angle and shallow focus do not supply a
clean replacement stencil. The unscaled filename returned 404. The iFixit
original-XL device and microphone guide were inspected for further source
imagery; the guide mainly shows the rear and internals, so it does not resolve
these exterior glyph profiles. None of those additional images was installed as
a model texture.

The production GLB remains SHA-256
`580093f70a82dc7fdf7af2a11cc26171fb7ae66cbe5d1852079f780446b8de66`.
The native trial restores the original material and does not save or export.
Further lettering work needs cleaner outline evidence or a deliberately fitted
smooth reconstruction; raw photo gradients are now a tested, rejected approach.
