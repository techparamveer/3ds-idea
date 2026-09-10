# Front comparison after the speaker revision

Inspected on 2026-09-10 against the silver original-XL photograph saved at
`.local/references/front/techradar-original.jpg`, sourced from
https://cdn.mos.cms.futurecdn.net/0584727e6f39c0e334d6e9537772f9fa.jpg.

The ordinary Blender render includes the downloaded boot artwork, which the
website hides. It is unsuitable for judging active screen margins. Re-ran
`audit_sourced_front.py` against the current `silver-speakers.blend` with temporary
plain active display planes and the boot artwork hidden. The script restores the
scene and does not save those planes into the model.

Evidence:

- `model/candidates/joshua-xl/current-display-audit-live-front.png`
- `model/candidates/joshua-xl/current-display-audit-planar.png`
- `model/candidates/joshua-xl/current-display-audit-aperture.json`

The current upper visible glass span remains 112 mm horizontally and approximately
71.4 mm vertically at its centre lines. The active display is 106.2 × 63.72 mm.
The lower active display remains 84.96 × 63.72 mm. These centre-line measurements
do not establish the correctness of the corners or depth profile.

The plain-screen views confirm an existing lower black border on the upper
display; the boot-artwork view made that border difficult to distinguish. Do not
expand or shrink the LCD based on that earlier dark render alone. The photograph
and these renders differ in perspective, so their projected body heights are not
direct measurements.

The inner camera is the next visible material-detail discrepancy: it reads as a
nearly featureless black disk in both inspection views, whereas the photograph
shows a surrounding dark ring and an optical centre. Inspect its source atlas and
normal/roughness channels at close range before changing geometry or inventing
lens detail. This audit does not establish full visual fidelity.
