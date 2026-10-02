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

## Fresh native selected-child contract

The coordinator then captured five fresh states from the exact private
isolated executable, PID 11082 / window 11019:

| State | Native own-PNG | SHA-256 | Footer observation |
| --- | --- | --- | --- |
| empty folder, vacant child 0 | `_02.10.26_17.57.37.155.png` | `e025547e016a48f78d59b709a99c2603eccf72bc927a8b7d576eef7bfa8c7597` | no button |
| populated folder, Health child 2 | `_02.10.26_17.58.24.817.png` | `682af5c25f6d80f2c29df83747fa616361bad4cceb4b57a59a21b0ee50696063` | one full-width Open |
| same populated folder, vacant child 0 | `_02.10.26_17.58.36.329.png` | `a087ddcb3c9fb4ce56299078de1bf5719d68be1fa3c9e2b71251d3de8029b406` | no button |
| same populated folder, Health child 2 reselected | `_02.10.26_17.58.54.068.png` | `b3968463de5900fd791c662628d0a5446c2ee9b57d7d1377d8f874d549805f3c` | one full-width Open |
| 50ms footer tap at lower `50,226` | `_02.10.26_17.59.19.368.png` | `dbda081d7363bf5b20d0e894fe43ef36e07f7ed00ff1589d794be9e87412f424` | Health main opens |

The fixed 320x30 native footer is byte-identical across the empty-folder
vacant-child and populated-folder vacant-child captures: zero pixels differ,
maximum zero. It is also byte-identical across the two fresh selected-Health
captures and the earlier independent selected-Health capture: zero pixels
differ, maximum zero. The full lower LCDs are not byte-identical because the
selected-child poses and surrounding state differ; those controls are not
masked or fitted.

This establishes a selected-child contract rather than a folder-population
contract: vacant child positions expose no footer action; an occupied child
exposes one full-width Open action. The captured 50ms tap opens Health, so the
control cannot be treated as Close. The folder and 12000ms Health move were
recreated after cold boot because native folder contents do not persist across
that boot; setup timing is not acceptance evidence. No suspended-software
reference was captured in this slice.

The coordinator verified original hardware / EUR region / Static 2 / Null 1 /
volume 0 before and after, selected Quit Yes, observed Azahar exit 0 and no
remaining windows. Audio acceptance therefore remains open.

Immutable v2 identities:

- native-state analyzer SHA-256
  `f6fb878b9a80b4f6aa9abffd7c4c5194156c5c506411cf1e278e30da532307e9`;
- v2 manifest SHA-256
  `9a48497d39a82e9a2e0f57d9e51f0c4f752288bbaaa9bbafda5f2e0f776e7d41`;
- v2 report SHA-256
  `d92156230787af568c9a934ceeac04c0cf6b9a76e536017537146601fadc631e`;
- inspected native lower/footer sheet SHA-256
  `8c6de457e27a7038ac02efcb23044defad5553c27bdcac7f64fdc8a500a06495`.

## Pending coordinator evidence

Fresh production before/after captures remain coordinator-owned and are not
yet present in this record. The source worker is separately establishing the
occupied-state footer binding. Those inputs will be frozen into new version
directories; the v1 and v2 reports above will remain unchanged.

Exact input cadence, transition motion and audio are not compared. The open
folder scenario remains `fail/unverified`; this historical static comparison
does not establish strict 1:1 fidelity.
