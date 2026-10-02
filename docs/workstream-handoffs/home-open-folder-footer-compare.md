# HOME open-folder footer comparison

Date: 2 October 2026

Branch: `codex/home-open-folder-footer-compare-20261002`

Base: `d33d67a9957450081e7dca5cf77e68a2e9755895`

## Scope and method

This is a bounded comparison-only record for the footer shown while a HOME
folder is open. It changes no runtime, asset, shared progress/map document or
private scenario matrix. The worker does not operate Azahar or the shared
production browser.

Native own-PNGs and browser raw LCD captures are compared at fixed source
coordinates with RGB threshold 2. The full upper and lower LCDs are retained
as controls; the fixed lower-LCD footer region is `x0/y210/320x30`. Masks are
empty and no translation, phase, geometry, colour or crop fitting is allowed.

Private evidence is under
`home-open-folder-footer-20261002/comparison/`. Each hashed report version is
written to a distinct directory and is not expanded in place.

## Historical populated-folder control

The first frozen target uses the coordinator's observed native folder
containing Health & Safety Information at child slot 2:

- native own-PNG `_02.10.26_17.38.27.82.png`, SHA-256
  `f9e0b43462afde32935fe82e689a5345f0f94a7adf08034636fda7394665b20e`;
- native lower footer visibly has one full-width `Open` control;
- prior production runtime `43b8be55`, populated-folder
  `contents-preserved`, has split `Close` and `Open` controls;
- prior browser upper SHA-256
  `c5146c127e4f0e948de60e4fbf7c80d7d9ba129d5961b80e1f6b22293e45cae6`;
- prior browser lower SHA-256
  `65273c40839e69ffa4a825d820bdf009dafae51c6108db04d7e061d1c9ec9c57`;
- prior capture metadata SHA-256
  `146c2621e876dcae9b89b1ba7401e8203dba8e94da5af3f578af335fc68c72e0`.

This is a semantically aligned open populated-folder control, not a globally
matched state: native folder 1 and browser folder 6, surrounding population,
scroll and upper epochs differ.

The immutable `v1-prior-control` comparison gives:

| Region | Pixels >2 | Maximum | MAE | RMSE | Interpretation |
| --- | ---: | ---: | ---: | ---: | --- |
| upper 400x240 | 53,159 | 255 | 11.345715 | 34.291467 | unmatched folder/banner, wallpaper and HUD epochs |
| lower 320x240 | 8,239 | 189 | 2.693220 | 13.921081 | full unmasked control |
| footer `x0/y210/320x30` | 1,754 | 152 | 9.236528 | 30.668430 | visible one-button native versus split-button browser defect |

The footer mismatch spans the full 320x30 region. The remaining 6,485 lower
pixels are outside the footer and retain unmatched folder identity, population
and scroll differences; they do not justify masking or fitting the footer.

Private identities:

- analyzer SHA-256
  `f1134ae0d7f2459832ac193e0b0306cd33c3aeaf609345537955e0a0807009cb`;
- v1 manifest SHA-256
  `5dac5c971325ba5c3ec45378c891e7c91ca76c388943ce311bcdc758bea39525`;
- v1 report SHA-256
  `7941c22f662840210e1511459b880fa9c27ebf86fe8c00198cfa6b61473f9f66`;
- inspected upper sheet SHA-256
  `295b3bdc4796c5064548b67ac3c1257ae4a7e0f9587d2baad2210c3f9712a7d4`;
- inspected lower sheet SHA-256
  `e2b2a56d350c30d8925cbff8dfb656d2a2545f49890d7e18da17580e502eaaa4`;
- inspected footer sheet SHA-256
  `da81d58da17c85798e63bf197963a757274dd54a570549684998b52774efe0b5`.

## Pending coordinator evidence

Fresh native empty-folder and populated-folder repeats, plus fresh production
before/after captures, remain coordinator-owned and are not yet present in
this record. The source worker is separately establishing the occupied-state
footer binding. Those inputs will be frozen into new version directories;
the v1 report above will remain unchanged.

Exact input cadence, transition motion and audio are not compared. The open
folder scenario remains `fail/unverified`; this historical static comparison
does not establish strict 1:1 fidelity.
