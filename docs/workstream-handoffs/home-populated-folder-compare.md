# HOME populated-folder Delete notice comparison

Date: 2 October 2026

Branch: `codex/home-populated-folder-compare-20261002`

Base: `40a5d090427d05449bbda98b507f365f1e78e7aa`

## Scope and method

This is a bounded comparison-only record for Delete on a HOME folder that
contains Health & Safety Information. It changes no runtime, asset, shared
progress/map document or private scenario matrix. Native own-PNGs and browser
raw LCD captures are compared at fixed source coordinates with empty masks and
RGB threshold 2. No translation, phase, geometry, colour or mask fitting is
allowed.

The fixed notice-panel control is lower-LCD `x20/y20/280x200`. Full upper and
lower LCDs remain unmasked controls. A generic browser confirmation is a
same-action diagnostic only: because it presents the wrong message and
decision policy, it is not a native-equivalent state and cannot be treated as
a pixel baseline.

Private evidence is under
`home-populated-folder-20261002/comparison/`. The initial manifest SHA-256 is
superseded by the current intermediate manifest SHA-256
`eedaf2400c4202e1c7ec7f4117913adfe4c0fb22aa6fa2fe0fa7053cd551fd04`.

## First native observation

The coordinator successfully moved Health into a native folder, returned to
the populated root, opened Folder Settings and activated Delete. Native HOME
did not delete the folder and did not ask for confirmation. It presented the
one-button notice:

> Folders containing data
> cannot be deleted.

Activating A OK returned directly to root HOME. The folder remained present,
selected and visibly populated. This establishes the settled semantic policy
for this one native run; it does not establish exact input cadence, motion or
audio timing.

| State | Native own-PNG | SHA-256 |
| --- | --- | --- |
| open folder, Health child selected | `_02.10.26_17.33.35.088.png` | `33d6c686a6076d88e3e752d104508f44a46933cfaae461a7e7870440ced77cea` |
| populated root | `_02.10.26_17.33.46.713.png` | `4a8061dfc43275ec65d40365a9a7d7a5eee7ade15527b56ff20093f9cfee5850` |
| Folder Settings | `_02.10.26_17.34.03.053.png` | `4ad57fc5072fe6947d071575517a709e88ca6b36cba5a1539d56396be974f5d9` |
| populated Delete notice | `_02.10.26_17.34.17.605.png` | `86101a390cdb56b8b7b848f14e6a99e941ccb194b4814fbb7c39faffecb18e37` |
| A OK return, populated root intact | `_02.10.26_17.34.51.773.png` | `2a64ecc0b16214525d01edb007723de1457676dfe48ec86f07249b1604f51f93` |

Azahar packs the lower LCD at `(40,240,320,240)` in each 400x480 own-PNG.
The native notice-panel raw-RGB SHA-256 is
`cf3296ea6e9bdbb430697415f9ee60f89cd1534231179e24de16b94b55eadd55`.

## Independent native repeat

The independent repeat used touch OK and added three own-PNGs:

| State | Native own-PNG | SHA-256 |
| --- | --- | --- |
| repeat populated Delete notice | `_02.10.26_17.37.52.607.png` | `de17a0d78c5481ecbe2d33b845c4f1654b0f041449e1c5a01119170c8b5327c3` |
| touch OK return, folder selected | `_02.10.26_17.38.14.191.png` | `f2e561be21ada648993dced115e204751f1c31cea3988f234d39987389fc706f` |
| reopened folder, Health still child 2 | `_02.10.26_17.38.27.82.png` | `f9e0b43462afde32935fe82e689a5345f0f94a7adf08034636fda7394665b20e` |

The two native notice lower LCDs are byte-identical: zero pixels differ above
delta 2 and the maximum channel delta is zero. Their fixed 280x200 panels are
also byte-identical. The upper LCD differs at 51,657 pixels above delta 2,
maximum 255, because its banner/wallpaper/HUD epoch is not matched. The repeat
therefore freezes a stable native lower target without claiming an upper
animation match. Native B behavior was not tested.

## Source identification boundary

The pinned source is EUR HOME `0004003000009802` v24576, content index 0 /
ID `00000082`. The CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
decrypted `code.bin` is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Conversion is `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

The decoded English message exactly matches the capture:
`menu_msbt_LZ/lau_dlg_folder_delete_02`, index 432, style 34. The OK string is
`lau_dlg_1b_ok`, index 167, style 26. Both come from
`RomFS/message/EU_English/menu_msbt_LZ.bin`, SHA-256
`1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350`.

The one-button frame candidate is `home.dialog/Dlg_A_D_01`, sourced from
`dialog_LZ.bin/blyt/Dlg_A_D_01.bclyt`, SHA-256
`ba68d27867a30860e99089ddec91cbbdeb2149a3de7ee150250e7ac408657701`.
The archive SHA-256 is
`65675c4a6ecada83a0d7256ea20c36692190be10349bf87c32e6068376409704`;
the delivered pack SHA-256 is
`8a7b72cd0e69601da7938503f648c18286fb4bcb2bf27fc0c33839dd4e0dca17`.
Source commit `b33064aa` establishes the exact composition and runtime
bindings, including `home.dialogmask/DlgMask_D_00` and its settled FadeIn
animation. The coordinator integrated it as `2ee79ae3`. This comparison does
not infer additional ownership from visual resemblance.

## Production-before diagnostic

Production-before at `40a5d090427d05449bbda98b507f365f1e78e7aa`
successfully created folder 6, moved Health to child slot 2 with actual pointer
input, returned to root, opened Folder Settings and activated Delete. Its
generic two-button “Delete this folder?” confirmation has different content
and policy from native. It remains a same-action diagnostic, not an
equivalent-state visual pair. Escape returned to root and reopening proved the
Health child was preserved.

The browser result SHA-256 is
`24500a83f12afd649424b4951d63c43e4e8905e33f5c2549066b38a379f19ffa`;
it reports no errors. Against the native notice, the non-equivalent generic
screen differs by 75,555 lower pixels above delta 2 and 54,773 of 56,000 fixed
panel pixels. These numbers diagnose replacement scope only and are not a
valid before/after same-state improvement claim.

Native folder 1 and browser folder 6, root population, root scroll, epochs and
exact drag/input cadence differ. The folder contents and selected child center
match semantically, not by global slot number.

## First integrated after — preserved intermediate

The first integrated production capture at `2ee79ae3` uses the native notice
message and one-button panel. Touch OK returns to root, reopening preserves
Health at child slot 2, and separate physical-A and mobile controls complete
the same browser behavior. Result SHA-256
`c76ad1976b0d9969f12c292491874927ba12d2932ed1d260e34a6fa0b7814e24`
reports no errors.

The current notice comparison uses empty masks and no fitting:

| Region | Pixels >2 | Maximum | MAE | RMSE | Interpretation |
| --- | ---: | ---: | ---: | ---: | --- |
| upper 400x240 | 49,336 | 220 | 6.935868 | 20.526182 | unmatched folder/banner, wallpaper and HUD epochs/population |
| lower 320x240 | 12,596 | 115 | 1.634045 | 6.625087 | full unmasked control |
| top toolbar `x0/y0/320x20` | 0 | 2 | 0.082135 | 0.287500 | static pixel tier |
| notice panel `x20/y20/280x200` | 96 | 17 | 0.061601 | 0.324322 | symmetric bottom rounded corners only |
| left outside panel | 3,346 | 115 | 11.121500 | 19.631794 | underlying root population/scroll |
| right outside panel | 2,759 | 36 | 4.240000 | 6.336232 | underlying root population/scroll |
| y220..239 footer band | 6,395 | 78 | 9.386458 | 16.116028 | leaked Settings/Open footer; native has none |

The five fixed rectangles partition all 12,596 lower residual pixels. The 96
panel pixels occupy only x20..299/y212..219, with per-row counts
6, 6, 8, 10, 12, 14, 18 and 22. That topology matches the already documented
rounded bottom-corner residual family; it does not by itself prove a local
panel cause because those alpha edges composite over the independently
mismatched substrate.

The leaked y220..239 footer is a distinct implementation defect outside the
280x200 source panel. This capture is preserved as intermediate evidence; it
must not be overwritten or promoted as the final after state. The source lane
is correcting the panel guard and the coordinator will write final captures to
a distinct `browser-final/` directory.

## Corrected final capture

Source follow-up `4ea72347` suppresses the HOME footer while the populated
notice is active; the coordinator integrated it as runtime `43b8be55`. The
corrected browser-final notice visibly contains only the native one-button
panel over the dimmed HOME backing. The Settings/Open labels from the
intermediate capture are gone.

The final script's last persistence assertion double-activated an already
selected folder after reload, opening the folder and then Health. That is a
test-harness failure, not observed data loss. No `result.json` or final-script
exit-0 claim is used here. The named notice, touch-OK, physical-A, mobile,
B/HOME recovery, cross-target and empty-delete captures completed earlier and
are validated independently by file hash. The separate supplement remains the
appropriate place to close persistence behavior. That supplement subsequently
exited 0 with no errors and confirmed reload restores the folder view with
Health still at child slot 2. Its result SHA-256 is
`b942060ad469ab2da12e94d6869d84d267aca560eb35eb08febb6950d45e61c1`;
the validated reload lower SHA-256 is
`025ed667eb17ea6305fe98631a902015b5abd785730af9c73545d6740c58306e`.
An earlier supplement incorrectly waited for root HOME and timed out; the
successful record accepts the actual restored folder state.

The corrected fixed-coordinate comparison is:

| Region | Pixels >2 | Maximum | MAE | RMSE | Interpretation |
| --- | ---: | ---: | ---: | ---: | --- |
| upper 400x240 | 49,352 | 220 | 6.935872 | 20.526341 | unmatched folder/banner, wallpaper and HUD epochs/population |
| lower 320x240 | 12,601 | 115 | 1.110720 | 4.855748 | full unmasked control |
| top toolbar `x0/y0/320x20` | 0 | 2 | 0.082135 | 0.287500 | static pixel tier |
| notice panel `x20/y20/280x200` | 98 | 8 | 0.058780 | 0.272740 | symmetric bottom rounded corners only |
| left outside panel | 3,346 | 115 | 11.026417 | 19.588804 | underlying root population/scroll |
| right outside panel | 2,759 | 36 | 4.144917 | 6.201754 | underlying root population/scroll |
| y220..239 backing band | 6,398 | 11 | 3.250104 | 4.282705 | labels removed; remaining low-amplitude backing residual has unproven cause |

The five regions partition all 12,601 final lower residual pixels. All 98
panel pixels remain in x20..299/y212..219. Row counts are
6, 6, 8, 10, 12, 14, 18 and 24; the panel text, OK label, horizontal rules and
all non-corner window pixels are at the static tier. This is the same rounded
bottom-corner residual family already observed for Folder Settings. Because
the alpha edge composites over an independently mismatched backing, the mask
does not establish a panel-local texture, geometry or sampling correction.
No screenshot-fitted adjustment is justified.

The y220..239 count remains broad because native and browser dimmed backing
pixels differ by more than 2, but the maximum falls from 78 to 11 and MAE from
9.386458 to 3.250104 after the visible footer labels are removed. Pixel count
alone would therefore misdescribe the fix; the frozen intermediate and final
sheets preserve the visual distinction.

## Artifact identities and remaining evidence

The private analyzer SHA-256 is
`79836a4d137d8ebad471458f4c8193cd58f4c4885d0f987e34d7f143340e9222`.
Its intermediate report SHA-256 is
`4b9f8634a2c1f61763f2c9543895f6aa9fd341f4a3cd7fe2f972cad2c74fe94d`.
Inspected sheet SHA-256 values are:

- first native upper/lower: `3fee1059827df2e7e52400dc5e12656aa2be6660e18b4393b6aac513b28a55bb`;
- native repeat upper/lower: `36a4051a8422cbda7bb46cb4d34cb550d63f14f14d4ca4e3042078f21856f08c`;
- browser-before upper/lower: `249c439c3d210da939cb1a8c86a540079f7fd38c03fea4f8ae802cdc46329aae` / `ddc12ec5f8bd1764cbdb73cf7e9c34134d7ff4ecdf8980a10d5e176bb974f6ca`;
- intermediate browser-after upper/lower: `b1c1356a0142bf39fee11b67cca43d5db02a0dec26057a190f1db9ec91c5e2e0` / `ed950e60f3c95fbfc11c9a3dc06d3c7beb3fdca6a2c86ff07b9f7fdd8db7789d`.

Those manifest/analyzer/report identities are historical intermediate
versions. The in-place `native-baseline/report.json` is frozen at intermediate
report SHA `4b9f8634...`; the corrected run writes to the distinct
`comparison/final/` directory instead of overwriting it.

Current final evidence identities are:

- manifest SHA-256 `e3dd31c0739812d11fff617a8f4973eb4a03c462db9ba6114bba9e661c4a0865`;
- analyzer SHA-256 `2d66ae283842025bfe3d60bd7ddca7181664b4013e2e0214bea2010c5cc45866`;
- final report SHA-256 `44688e146e5d7d7ba2c42dbc26721ae36b9e29b9b6e310bc23705b1c65c6519c`;
- inspected final upper sheet SHA-256 `f6112f58744bd6c9e847d03a99fa951918a7bef71dffada1cf5fbc6d512d4d34`;
- inspected final lower sheet SHA-256 `8e68e0f3d85d860af6786b417c11e9cbd349a7f046bf1a9dba735ca8dc118406`.

Still required for whole-scenario acceptance: exact matched input cadence,
motion and audio reporting.

The coordinator reports integrated checks of 1,808 passing, zero failing, 23
skipped and one TODO, plus typecheck/build pass and independent focused review
74/74. Those checks do not close visual acceptance. The populated-folder
scenario remains `fail/unverified`; exact motion, input cadence and audio are
still unmatched. The notice implementation is delivered and browser-inspected,
but strict 1:1 fidelity and whole-scenario acceptance are not established.
