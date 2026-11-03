# OxHack portfolio apps and banners

The user asked for one new app with two logo variations to compare. Both sit on
HOME as separate titles after Hack LDN 2025 so they can be selected side by
side. Keep one and remove the other once the user chooses. Both are portfolio
adaptations with no firmware manifest key. They change no native scenario status.

| Title | App id | Source logo | Frame | Intro + idle | Draw at |
| --- | --- | --- | --- | --- | --- |
| OxHack | `oxhack` | Compact, Blue Outline | 208x172 | 104 + 96 | 96,34 |
| OxHack 26 | `oxhack-wordmark` | Wordmark, No Glowing Year | 340x160 | 120 + 96 | 30,40 |

Both play at 30000/1001 fps from 8-column atlases, with soft alpha so the glass
panel, glow and motion blur survive packing. The last intro frame is the
reduced-motion still. Source hashes and per-frame timelines are in each
`provenance.json` under `public/portfolio/oxhack-compact/` and
`public/portfolio/oxhack-wordmark/`.

The app text is a placeholder: "The project write-up is still to come." No facts
about the event have been supplied, and none should be invented.

## Motion

- **Compact:** the whole logo spins about a tilted axis, decaying from 6.6 rev/s
  through 6.6 revolutions. Letters rise out of the glass on the last turn, it
  lands face-on at frame 84, then a pulse runs around the frame and traces and a
  sheen turns the letters white.
- **Wordmark:** the triangle spins alone through 5 turns from 5.8 rev/s and glides
  left. K, C and A fire out of its tip and run straight to their slots; H, x and O
  hop over the row. 2 and 6 pop in last, then a faint navy glow and a sheen arrive.
  The glow runs at .28 strength because the user found the source's full glow too
  heavy on the LCD. At zero the white faces and 26 fade into the light screen.

## Runtime

[Banner renderer](../src/os/oxhack-banner.ts) follows the Hack LDN banner with one
change: the atlases load on first draw instead of joining the portfolio `ready`
promise, because they are large. They decode to about 28 MB and 47 MB and stay in
memory until disposal. The title's icon shows until the decode finishes, and the
intro clock starts on the first painted frame. A failed or wrong-sized atlas keeps
the icon.

The idle LCD cadence (`screenFps`: 24, 18 or 12 by quality tier) is below these
30 fps atlases, so it skipped frames. `frameDue` repaints the LCD whenever an
on-screen OxHack banner reaches a new atlas frame. A muted raw LCD capture at
quality tier high then drew 30.1 fps with no skipped frames, worst gap 49 ms. No
stock title changes cadence. NVIDIA and Hack LDN keep the old cap.

`restoreHomeLayout` accepts saves without these titles, so existing layouts keep
their positions and the new titles enter free slots.

## Rebuild

The two SVGs are not in the repository. Copies are in the private artifact root
at `/Volumes/Sandisk1/3ds-fidelity-artifacts/oxhack-20261101/source/`.

1. `python3 scripts/blender/extract-oxhack-logo.py ABS_COMPACT.svg ABS_WORDMARK.svg ABS/scripts/blender/oxhack-logo-contours.json`
2. Through Blender MCP, run `scripts/blender/build-oxhack-compact.py` or
   `build-oxhack-wordmark.py` with absolute `ROOT` and `OUTPUT`. Both use
   `scripts/blender/oxhack_rig.py`. `oxhack-wordmark-tools.mjs` holds the wordmark
   glow rasterizer and border check.
3. Render the saved scene headless:
   `Blender -b ABS.blend -S "OxHack Compact" -a`, or `"OxHack Wordmark"`.
4. `node scripts/blender/pack-nvidia-transform.mjs ABS_FRAMES ABS_OUTPUT 200 208x172 soft`,
   or `216 340x160 soft` for the wordmark.

Editable sources are `assets/blender/oxhack-compact.blend` and
`assets/blender/oxhack-wordmark.blend`.

## Known limits

- The compact shader is unlit: surfaces emit colours measured from the reference,
  because the source's `mix-blend-mode:color` overlays are not in the contours.
- Wordmark letters are faint on the light LCD, most of all from about frames 70-105
  before the glow arrives.
- Atlases are 1.5 MB and 2.0 MB, two to three times the size of the other banners.
- A HOME capture that includes slots 8 or 9 now shows these titles. Label that as
  an adaptation, not a native regression.
- `scripts/reference/populated-folder-seed.mjs` already asserted nine apps before
  this work, so the seeded-folder path of `verify-animation-flow.mjs` still fails.
