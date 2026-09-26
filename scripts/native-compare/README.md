# Native LCD comparison

Compare a coordinator-captured Azahar PNG against browser LCD render-target PNGs:

```sh
node scripts/native-compare/compare.mjs \
  --native /absolute/path/to/native \
  --browser /absolute/path/to/browser \
  --mask scripts/native-compare/empty-mask.json \
  --out /absolute/artifact/output/directory \
  --scenario home-idle \
  --commit FULL_GIT_SHA
```

Each input may be a **400×480** PNG (Azahar's combined layout) or a directory
with `upper.png` (**400×240**) and `lower.png` (**320×240**). The combined PNG
is cropped at upper `(0,0)` and lower `(40,240)` without scaling. Input
dimensions outside those forms fail. All inputs are converted to sRGB RGB
before comparison; raw file SHA-256 values are recorded in `report.json`.

The output contains `report.json`, one heatmap and one native/browser/heatmap
contact sheet for each LCD. RGB error is the mean absolute channel difference
over unmasked pixels, on a 0–255 scale. A pixel is flagged when **any** channel
differs by more than 2. Difference regions use four-neighbour connectivity and
are sorted by pixel count. A zero flagged count yields `pixel-threshold-pass`,
which checks only settled pixels; it does not establish matched input, motion,
audio or visual inspection. The CLI exits 0 for that result, 2 for residuals,
and 1 for malformed inputs.

Mask JSON has a `regions` array. Each rectangle needs `screen` (`upper` or
`lower`), integer `x`, `y`, `width`, `height`, a `category`, and a meaningful
`reason`. Allowed categories are `live-clock-battery`, `portfolio-content`,
`camera-footer`, `inert-ok`, and `feature-map-adaptation`. The last category
also requires `featureMapRef` pointing to the documented adaptation. Masked
pixels are excluded from metrics and appear black in the heatmap. Inspect the
contact sheet and review every mask against the feature map before recording a
scenario result. Do not mask unexplained residuals.

```json
{
  "regions": [
    {
      "screen": "upper", "x": 0, "y": 0, "width": 30, "height": 12,
      "category": "live-clock-battery", "reason": "Native clock was not fixed for this capture"
    }
  ]
}
```

Run fixture tests with `node --test scripts/native-compare/compare.test.mjs`.

The source-derived `camera-guide-feed-mask.json` is restricted to settled
Camera Welcome pages 3–5. It excludes only strictly unobscured live feed and
preserves partially transparent borders and HUD areas. See
[`docs/camera-guide-feed-mask.md`](../../docs/camera-guide-feed-mask.md) for
provenance, regeneration, and the remaining capture residuals. Run its source
regression with `node --test scripts/native-compare/camera-guide-feed-mask.test.mjs`.
