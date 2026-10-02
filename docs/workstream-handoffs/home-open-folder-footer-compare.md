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

## Fresh production-before comparison

The fresh production-before run used runtime `43b8be55` at coordinator HEAD
`d33d67a9`. Actual pointer input created empty folder 8 at root slot 34,
opened it, returned and deleted it; then it selected existing folder 6 at root
slot 19 and captured the occupied/vacant/occupied child sequence. No state was
injected. Result SHA-256
`3829d1cfcfbbac17ef7b611961cda84a4ece4ad5ecdbd4ee7772cbdfe89d29b6`
reports exit 0 and no errors.

Empty-mask, no-fit results are:

| State | Upper >2 | Lower >2 | Footer >2 | Footer maximum | Footer MAE | Interpretation |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| empty folder, vacant child 0 | 59,168 | 7,538 | 2,135 | 35 | 1.157708 | both have no button; backing shade differs |
| populated folder, Health child 2 | 59,520 | 8,667 | 1,754 | 152 | 9.236528 | native full-width Open versus browser Close/Open |
| populated folder, vacant child 0 | 59,774 | 9,704 | 2,135 | 35 | 1.157708 | both have no button; backing shade differs |
| populated folder, Health child 2 repeat | 22,475 | 7,629 | 1,754 | 152 | 9.236528 | repeated full-width Open versus Close/Open defect |

Coordinator visual inspection corrected the initial interpretation after the
v3 artifacts were frozen: the browser empty-folder and vacant-child images
already contain no footer buttons. Their 2,135-pixel residual is the striped
backing/substrate shade, not absent, hidden or extra controls. The earlier v3
manifest's `split Close/Open footer` descriptions for those two browser states
are therefore wrong and are superseded by this inspected record. The immutable
manifest/report identities remain preserved; their measured pixels are still
valid.

The two browser occupied-child footer crops are byte-identical, as are their
two native targets. The two vacant-child backing-shade mismatch signatures are
also identical. The occupied footer signature exactly repeats the historical v1
signature: 1,754 pixels above delta 2, maximum 152 and absolute-RGB difference
SHA-256 `02a0559035c60a08b61ec100b575b2b0ba166d7d4c1ec8759c162e4c58d398f0`.

A 50ms tap at lower `50,226` then activates the browser's left `Close` half
and returns to root HOME, while the same native tap opens Health. The resulting
screens differ at 95,353 upper and 76,019 lower pixels above delta 2. This is
a same-input, non-equivalent-result diagnostic, not a valid pixel-improvement
baseline. The browser-only successful empty-folder deletion capture is retained
as a regression control without a fresh native pair.

Browser and native folder labels, root population and upper epochs differ;
child centers align semantically. Those differences explain why the full LCDs
remain controls, but they do not explain or excuse the fixed footer defects.

Immutable v3 identities:

- pair analyzer SHA-256
  `ddbf7e5ebc151f49b62410bd2be4f7627f67c4a34e4064ce02088e3dfafba729`;
- v3 manifest SHA-256
  `df0c768aebd5274780260122b5b99d7ef98042a33fe78798fe4043f60cadb0f1`;
- v3 report SHA-256
  `914ae7c638d50ec602653a9c391ead682bd99f33015e556e897d9d2225931601`;
- inspected upper/lower/footer sheets SHA-256
  `1f8b69eb13000bb8301cdce5e3b42ccf9182425096de72ca533c4e98e298ffb0`,
  `f2ec2fb3413b05225fc7ba508d083a592842cbe87e36a81f90396dbb2844bf50`
  and `92b35ca3347d2235c94f33418a9ebb363553b3186a57ea2d057c24915381e28a`.

## Source-bound correction

Source commit `54e0757b` and regression follow-up `9c46c86d` implement the
captured no-suspended-software contract. The coordinator integrated them into
runtime `5b82c896`.

The correction reuses the existing decoded one-button hierarchy
`home.launcher/layouts.LncBtmBtn_02` and settled
`LncBtmBtn_02_SceneIn` frame 15. It binds exact message
`menu_msbt_LZ/lau_2b_folder_open`, index 423 / style 193 / text `Open`,
and keeps direct LCD text sampling. No new asset, geometry, palette, font,
raster mode or screenshot fit was added.

The occupied idle-folder state now derives `{ two: false, left: null,
right: 'open' }`; a vacant selected child derives no footer. The full source
button rectangle is `x0..319/y212..239`, with same-action down/up ownership.
Header Back and physical/keyboard B still use the folder-close controller.
Open-folder states involving suspended software were not captured and retain
their previous split policy as an explicit evidence boundary.

Pinned source identity is EUR HOME `0004003000009802` v24576, content index 0
/ ID `00000082`; CIA SHA-256
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`
and decrypted `code.bin` SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Conversion remains `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

Visible native element mappings are:

| Element | Manifest/member | SHA-256 |
| --- | --- | --- |
| footer archive | `home.launcher` → `RomFS/launcher_LZ.bin` | `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834` |
| one-button layout | `layouts.LncBtmBtn_02` → `blyt/LncBtmBtn_02.bclyt` | `1be988eda6f3d2374d8445d0773688fa1c6dd118590cb986d526c0dc4f326a44` |
| settled pose | `animations.LncBtmBtn_02_SceneIn` → `anim/LncBtmBtn_02_SceneIn.bclan` | `9b19c054cbb84c89a4b0c8669a2c05566f386dc7fd681410864065b8dee44a4e` |
| press feedback | `animations.LncBtmBtn_02_Select` → `anim/LncBtmBtn_02_Select.bclan` | `b039ae54719725321c32b904f142d684d3980122e11a164191b2740d86542b20` |
| Open text | `home.messages/menu_msbt_LZ/lau_2b_folder_open` → `message/EU_English/menu_msbt_LZ.bin` | `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350` |
| style 193 | `styles[message/EU_English/RI_mstl_LZ.bin][193]` | `224aec428f67f35e0a23b3e7de464b2b4fe1d18dd1cf07fa9b0b53d5ad3db555` |
| shared font | `manifest.fonts.shared` → `cbf_std.bcfnt.lz` | `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581` |

Delivered launcher and message pack SHA-256 values are
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`
and `3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`.
The source worker reports focused action, touch, folder-input, route, menu and
presentation suites passing 92/92, plus typecheck and whitespace checks.

## Integrated production-after comparison

The final run contains exactly 12 named raw upper/lower pairs. Runtime
`5b82c896`, mode `after`, result SHA-256
`60ceb361d6554538b2e2926ec859c1dd03544cdc6aa92784f6db5de8412ac5e1`
reports exit 0 and no errors. No state was injected.

Primary empty-mask, no-fit comparisons are:

| State | Upper >2 | Lower >2 | Footer >2 | Footer maximum | Footer MAE | Interpretation |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| empty folder, vacant child 0 | 59,210 | 7,566 | 2,135 | 35 | 1.157708 | both have no button; unchanged backing-shade residual |
| populated folder, Health child 2 | 40,014 | 7,359 | 470 | 35 | 0.424896 | full-width Open delivered; residual confined to y210..219 |
| populated folder, vacant child 0 | 42,469 | 9,884 | 2,135 | 35 | 1.157708 | both have no button; unchanged backing-shade residual |
| populated folder, Health child 2 repeat | 57,856 | 7,091 | 470 | 35 | 0.424896 | repeated full-width Open result |

For each occupied capture, the footer improves from 1,754 pixels above delta 2
/ maximum 152 / MAE 9.236528 / RMSE 30.668430 to 470 / maximum 35 /
MAE 0.424896 / RMSE 1.596035. The remaining 470 pixels occupy only
`y210..219`, with row counts 320, 44, 38, 33, 12, 9, 8, 0, 4 and 2. The
visible `Open` label and button body no longer carry the split-control defect,
but the top-edge/backing residual remains unexplained and is not masked or fit.

The empty and vacant browser footer crops are byte-identical before versus
after. Their 2,135-pixel residual was not changed by this correction because
they already had no buttons. It spans the backing band and remains a separate
source gap; pixel counts must not be used to infer hidden controls.

The matched native/browser 50ms touch at lower `50,226` now reaches Health
main in both environments. The lower Health screen is at the static pixel tier:
zero pixels above delta 2, maximum 2. Its upper differs at 17,101 pixels above
delta 2 because the animated upper epoch is not aligned. Mobile physical A also
launches Health and produces the same lower pixels, but native physical-A input
was not captured and is not called an input match.

Additional final controls confirm:

- touches in empty and vacant footer regions remain inert, with footer bytes
  unchanged before/after the touches;
- desktop and mobile occupied/vacant footer crops are byte-identical;
- occupied footer bytes survive reload with Health still selected;
- empty-folder deletion still succeeds as a browser-only regression control.

Immutable v4 identities:

- final analyzer SHA-256
  `b652113304e53aa5ca731332a0b1688b743b121f6915f42cc1c7a8e4183d1aa7`;
- v4 manifest SHA-256
  `fe8d937558f9d9408d55d7b200763fe4d7f3a802c34be3944efd5d683c1c100e`;
- v4 report SHA-256
  `c4cc3edf330171f8d0370e9a72ebba01d59df215ec75d81799547f248869f40b`;
- inspected primary upper/lower/footer sheet SHA-256
  `5836c9beced4c3ce55a768b50f964e668ac720ed533a471369d3121c7dd04050`,
  `ecd131da0f8f6a876271f047a3fe74cbe9347a6b12da3d69284799b6db062885`
  and `014edc06d7398712bc256901e503fdbb3c18f89057f59c87cd16d0a9a06f59e6`;
- inspected action upper/lower sheet SHA-256
  `d7d156e7482bd4871b8d57161c5bf5682d8a0e2f174fb1e25624ae67c083e322`
  and `79985ccdf7938ec2c5d69b45857b4f5d103a806d1af42eef62c85dd31ef2206b`;
- inspected all-coverage lower sheet SHA-256
  `c81ab7648a1457d013e0c27a4cce4acfc659299f62149b2a6bf269baba7cb664`.

## Status and remaining evidence

The occupied idle-folder footer semantics are source-bound, implemented,
tested, browser-inspected and native-compared. The visible split Close/Open
defect is removed and the matched left-side touch now launches Health.

The whole scenario remains `fail/unverified`. The occupied footer retains 470
unexplained top-edge/backing pixels, while the vacant backing retains 2,135.
Folder label/population, panel/gutter, upper epochs, exact press animation,
transition timing and audio are unmatched. Suspended-software open-folder
states lack a native reference. Native folder contents also did not persist
across the coordinator's cold boot, so its recreation and 12000ms drag are
setup only. No mask or screenshot-fitted correction was used, and strict 1:1
fidelity is not established.

Coordinator verification reports 1,813 passing tests, zero failures, 23
skipped and one TODO, plus build and post-build typecheck pass. Five stock
lower-LCD regressions and both Settings upper-LCD regressions are byte-exact.
The dedicated muted Chrome process and exact private native process each exited
0; preview 3021 remains ready. These checks support implementation stability
but do not close the visual, motion or audio gaps above.
