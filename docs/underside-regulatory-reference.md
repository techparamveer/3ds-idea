# Unobstructed original silver 3DS XL underside reference

Current update: this reference now informs the sourced-model [EUR artwork pass](source-eur-validation.md). The earlier authoring pause below records the procedural workflow, not the current state.

Research captured 2026-09-09. Further model-script authoring was paused when the user requested evaluation of an existing downloadable 3D model. No Blender changes were made by this audit.

## Verified photograph

The [Konsolen-Chips original silver/black 3DS XL underside photograph](https://konsolen-chips.de/media/image/product/7758/lg/nintendo-3ds-xl-konsole-silber-schwarz-gebraucht~4.jpg), from the [matching used-console listing](https://konsolen-chips.de/Nintendo-3DS-XL-Konsole-silber-schwarz-gebraucht), shows the complete four-line block without the stylus obstruction in user image5. It was visually inspected through the native Aside browser at150% and200% zoom. The temporary reference tab was closed and the portfolio preview restored afterward.

The photograph visibly identifies `SPR-001(EUR)` and `SPR-S-EUR-C0`. It is an actual silver console with wear, not a 3D reconstruction. No equivalent unobstructed European silver underside photo was found on Nintendo's own site in this bounded search. Nintendo's [original 3DS LL specifications](https://www.nintendo.co.jp/hardware/3dsseries/3dsll/index.html) remain the source for the156×93 mm envelope, rather than a source for European label wording.

An additional first-hand review photo was located at [SlashGear DSC00854](https://www.slashgear.com/img/gallery/nintendo-3ds-xl-review/DSC00854-580x385.jpg). It was not needed for the transcription below. Search-engine generated image descriptions were not treated as proof of individual characters.

## Visible text, preserving line breaks

Spaces around units are normalized here; pixel-level spacing and exact typeface have not been established. The first symbol on line4 is a **circled M**, not another copyright C. `⎓` represents the printed direct-current symbol.

```text
Patents issued and pending, see Operations Manual. RATING: 4.6V ⎓ 4.1W. POWER SUPPLY INPUT:
4.6V ⎓ 900mA. USE WAP-002 AC ADAPTER ONLY. Brevets émis et en cours, voir mode d'emploi.
PUISSANCE : 4,6V ⎓ 4,1W, ALIMENTATION : 4,6V ⎓ 900mA. UTILISER UNIQUEMENT AVEC WAP-002.
Ⓜ2010 ©2011 Nintendo PAT. PEND. SPR-001(EUR) MADE IN CHINA SPR-S-EUR-C0
```

`D-63760 Großostheim` appears separately beneath the certification row near its left-centre, not in the four-line text block. The final production-code character reads zero in `C0`; this matches the code visible in the user's image5. The tiny caption beneath the Russian-looking certification mark is not confidently resolved and should not be invented.

## Layout and difference from the current model

Compared with `renders/underside-fit-v3.png`, the real underside has four dense, left-aligned lines across approximately90–94 mm, followed by a distinct certification/logo row. The current two centred generic lines do not reproduce this structure or wording. Its plain `Nintendo CE MADE IN CHINA` line is not a substitute for the graphic symbols.

Using the156 mm body width as an approximate scale and cross-checking the user's larger underside photograph gives these trial targets: four-line block cap height roughly1.3–1.6 mm, line pitch about2.4–2.6 mm; first baseline near model Y−2 mm and fourth near Y−9.5 mm when the main50 mm wordmark remains centred at Y12. The symbol row is near Y−17 to−19 mm and the serial sticker near Y−29 mm. These estimates come from perspective photographs and are not manufacturer dimensions. A matched view is still necessary before applying them.

The certification row reads left-to-right in the underside photograph as: boxed circular/triangular test-seal and GS group; CE; a triangular tick-like mark; a separate Russian-looking mark with tiny caption; crossed-out wheeled bin with small `EU` above and a solid bar below; Nintendo oval. Their silhouettes are visible, but exact vector outlines and all microscopic seal lettering have not been acquired. Do not construct them using guessed Unicode characters. Approximate widths are20–22 mm for the first group,7–8 mm for CE, around6 mm for each of the next three groups, and19–20 mm for the Nintendo oval. These graphic gaps remain unresolved.

## Authoring state at pause

No regulatory-block repair script has been created or run. The intended implementation was a four-line, surface-conformed text mesh with explicit font-fallback metadata, preserving the actual wordmark and serial label. A font-table inspection found that the locally installed Arial/Arial Bold include `©`, `é`, and `ß`, but lack `Ⓜ` and `⎓`; Arial Unicode includes `Ⓜ` but still lacks `⎓`. Any future script must handle those missing glyphs explicitly rather than allow tofu boxes. No installed font has been verified as Nintendo's regulatory-print typeface.
