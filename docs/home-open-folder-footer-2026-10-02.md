# HOME open-folder footer — native evidence and bounded correction

Later checkpoint: [selected suspended Health inside a folder](home-folder-software-close-2026-10-02.md)
is now captured and corrected at `a40d597e`: native black X Close/Resume,
software retirement, same-folder return. The uncaptured-policy statements
below describe this note's earlier checkpoint; unrelated suspended-child
selections remain unverified.

This slice corrects the captured occupied-folder/no-suspended-software state.
Native HOME shows one full-width **Open** button for the selected Health child;
the browser previously showed **Close / Open**. A native tap at the left side of
that full-width button launched Health rather than closing the folder.

The correction does not remove either native folder exit path: the source Back
control in the folder header and physical/keyboard B still close the folder.
Open-folder states involving suspended software were not captured and retain
their prior two-button policy. Root HOME's selected suspended-software
Close Software / Resume behavior is unchanged.

## Native and browser evidence

All native inputs are Azahar's own 400×480 PNGs in the coordinator's exact
private profile `native-close-clean-20261002/screenshots/`:

| State | Capture | SHA-256 | Footer result |
| --- | --- | --- | --- |
| Earlier occupied folder, Health child 2 | `_02.10.26_17.38.27.82.png` | `f9e0b43462afde32935fe82e689a5345f0f94a7adf08034636fda7394665b20e` | One full-width Open |
| Fresh empty folder, selected child 0 | `_02.10.26_17.57.37.155.png` | `e025547e016a48f78d59b709a99c2603eccf72bc927a8b7d576eef7bfa8c7597` | No footer |
| Fresh occupied folder, Health child 2 | `_02.10.26_17.58.24.817.png` | `682af5c25f6d80f2c29df83747fa616361bad4cceb4b57a59a21b0ee50696063` | One full-width Open |
| Fresh populated folder, vacant child 0 | `_02.10.26_17.58.36.329.png` | `a087ddcb3c9fb4ce56299078de1bf5719d68be1fa3c9e2b71251d3de8029b406` | No footer |

After the fresh occupied capture, a 50 ms tap at approximate raw lower-LCD
`(50,226)` launched Health. That establishes full-width activation semantics,
not just settled pixels. The same run confirms that footer absence follows the
selected vacant child, even when another child in the folder is occupied.

The production-before lower LCD is
`home-populated-folder-20261002/browser-final/contents-preserved/lower.png`,
SHA-256
`65273c40839e69ffa4a825d820bdf009dafae51c6108db04d7e061d1c9ec9c57`.
It visibly contains the incorrect Close/Open split. The native and browser
folder numbers, population and background epochs are not matched, so this is a
captured behavioral/region defect rather than whole-screen acceptance evidence.

## Source and delivery binding

The pinned source is HOME title `0004003000009802`, version 24576, content
index 0 / content ID `00000082`. Its CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
decrypted `code.bin` is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Conversion remains `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

The decoded `menu_msbt_LZ/lau_2b_folder_open` entry is message index 423,
style 193, exact text `Open`. `LncBtmBtn_02` contains the one-button
`N_BtnW_C_01` / `G_BtnW_C_01` hierarchy and three centre text layers. The
existing presenter already selects that hierarchy whenever its derived footer
has one action, binds settled `LncBtmBtn_02_SceneIn` frame 15 and uses direct
LCD text sampling. No new asset, geometry, palette, font or fitted raster mode
is introduced.

The pinned executable embeds `G_BtnW_C_01`, `N_BtnW_C_01`,
`LncBtmBtn_02` and `lau_2b_folder_open` at code-file offsets `0x226505`,
`0x226511`, `0x22653e` and `0x22671c`. Its pointer tables contain the layout
at `0x33c6bc`, centre groups at `0x33c6dc` / `0x33c6e4`, centre pane table at
`0x33c7cc` and Open message pointer at `0x33cc14`. Constructor code at
`0x257d88` loads the layout pointer and group table; the pane update path at
`0x257b64` loads the pane table. These facts bind the decoded resources but do
not independently reconstruct the native state predicate; the captures above
establish the selected idle-folder state.

| Visible element | Manifest key and decrypted member | SHA-256 |
| --- | --- | --- |
| Footer archive | `home.launcher` → `RomFS/launcher_LZ.bin` | `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834` |
| One-button layout | `home.launcher/layouts.LncBtmBtn_02` → `launcher_LZ.bin/blyt/LncBtmBtn_02.bclyt` | `1be988eda6f3d2374d8445d0773688fa1c6dd118590cb986d526c0dc4f326a44` |
| Settled pose | `animations.LncBtmBtn_02_SceneIn` → `launcher_LZ.bin/anim/LncBtmBtn_02_SceneIn.bclan` | `9b19c054cbb84c89a4b0c8669a2c05566f386dc7fd681410864065b8dee44a4e` |
| Press feedback | `animations.LncBtmBtn_02_Select` → `launcher_LZ.bin/anim/LncBtmBtn_02_Select.bclan` | `b039ae54719725321c32b904f142d684d3980122e11a164191b2740d86542b20` |
| Open text | `home.messages/menu_msbt_LZ/lau_2b_folder_open` → `RomFS/message/EU_English/menu_msbt_LZ.bin` | `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350` |
| Style 193 | `styles[message/EU_English/RI_mstl_LZ.bin][193]` | `224aec428f67f35e0a23b3e7de464b2b4fe1d18dd1cf07fa9b0b53d5ad3db555` |
| Shared font atlas | `manifest.fonts.shared` → system-font `cbf_std.bcfnt.lz` | `95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581` |

Delivered launcher and message pack SHA-256 values are
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`
and `3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`.

## Runtime and input contract

- An open folder with a selected occupied child and no suspended application
  derives `{ two: false, left: null, right: 'open' }`.
- An empty selected child derives no footer, whether the folder itself is empty
  or contains another child.
- The one-button footer owns the complete source rectangle
  `x=0..319, y=212..239`. Down and up must retain the same semantic button;
  cancel, scroll and navigation transfer remain inert.
- Legacy one-shot touch uses the same projected action. It cannot reinterpret
  the left part of the full-width Open button as Close.
- Header Back and physical/keyboard B retain the folder-close controller and
  stored root/folder views.
- Uncaptured open-folder states with suspended software retain their existing
  split policy. This is an explicit evidence boundary, not a claim that those
  states match native. Root selected-software Close Software / Resume remains
  source-backed and unchanged.

## Verification boundary

Focused action, touch, folder-input, completion-route, menu and native-
presentation suites pass 92/92. Typecheck and whitespace checks pass. This
worker did not operate Azahar or the production browser and does not run the
coordinator's build or full suite. The coordinator owns integration, fresh
production capture, the raw fixed-coordinate comparison and regression
captures.

The worker result above was integrated as `5b82c896`. The coordinator then
captured twelve production-after raw pairs, inspected desktop/mobile views and
the fixed-coordinate native comparison sheets. Actual left-footer touch and
mobile physical A launch Health; vacant footer taps remain inert. Header Back,
empty deletion and reload contents are checked. No injected state was used.

The occupied footer improves 1,754 -> 470 pixels above delta2, maximum152
->35. Empty/vacant bands remain unchanged at2,135 above2; both were already
button-free before this change. Full occupied pair remains40,014/7,359 above2,
and launch-result Health lower has zero above2 while upper animation epochs
remain unmatched. [Comparison and identities](workstream-handoffs/home-open-folder-footer-compare.md).

Test-only follow-up `21079a0d` corrects the old footer-close expectation while
retaining the true Back/B routes. Full suite:1,813 pass, zero fail,23 skipped,
one TODO; production build and post-build typecheck pass. Five stock lower and
both Settings upper regression LCDs are byte-identical. Exact press animation,
launch timing and muted audio remain unverified; whole scenario remains `fail`,
not strict1:1. Footer palette, backing shade and gutter gaps remain explicit.
