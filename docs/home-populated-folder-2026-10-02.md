# HOME populated-folder Delete notice — native capture and bounded implementation

This slice replaces the portfolio's authored two-button folder-delete
confirmation for populated folders. On the isolated EUR 10.7.0-32E HOME
Menu, activating **Delete** in Folder Settings while the selected folder
contained Health and Safety Information opened a one-button notice:

> Folders containing data<br>
> cannot be deleted.

Activating **A OK** returned directly to root HOME with the same folder
selected. The folder and its Health child remained intact; the native route did
not return to Folder Settings. Empty-folder Delete remains the independently
captured immediate-deletion path. Rename remains inert because Software
Keyboard is excluded.

## Native evidence

All captures are Azahar's own 400×480 PNGs under the private
`native-close-clean-20261002/screenshots/` directory:

| State | Capture | SHA-256 |
| --- | --- | --- |
| Open folder, Health at child slot 2 | `_02.10.26_17.33.35.088.png` | `33d6c686a6076d88e3e752d104508f44a46933cfaae461a7e7870440ced77cea` |
| Populated folder selected on root | `_02.10.26_17.33.46.713.png` | `4a8061dfc43275ec65d40365a9a7d7a5eee7ade15527b56ff20093f9cfee5850` |
| Folder Settings | `_02.10.26_17.34.03.053.png` | `4ad57fc5072fe6947d071575517a709e88ca6b36cba5a1539d56396be974f5d9` |
| Populated-folder notice | `_02.10.26_17.34.17.605.png` | `86101a390cdb56b8b7b848f14e6a99e941ccb194b4814fbb7c39faffecb18e37` |
| Root HOME after A OK | `_02.10.26_17.34.51.773.png` | `2a64ecc0b16214525d01edb007723de1457676dfe48ec86f07249b1604f51f93` |
| Repeat populated-folder notice | `_02.10.26_17.37.52.607.png` | `de17a0d78c5481ecbe2d33b845c4f1654b0f041449e1c5a01119170c8b5327c3` |
| Repeat root HOME after touch OK | `_02.10.26_17.38.14.191.png` | `f2e561be21ada648993dced115e204751f1c31cea3988f234d39987389fc706f` |
| Repeat reopen, Health still at child slot 2 | `_02.10.26_17.38.27.82.png` | `f9e0b43462afde32935fe82e689a5345f0f94a7adf08034636fda7394665b20e` |

The notice capture establishes the settled lower composition and retained
upper populated-folder banner. The sequence establishes the A/OK result and
data preservation. The repeat touch-OK run independently confirms root return
and that reopening the folder preserves Health at child slot 2. Exact
transition frames, touch cadence and audio remain unverified. The slow
population gesture was setup evidence, not timing acceptance.

## Source identity and binding

The pinned source is HOME title `0004003000009802`, version 24576, content
index 0 / content ID `00000082`. Its CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
decrypted `code.bin` is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Conversion is `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

The bounded executable trace resolves the caller's two message bindings:

- `0x1db0a8` loads `lau_dlg_folder_delete_02`, then resolves it through the
  native message lookup;
- `0x1db0bc` loads `lau_dlg_1b_ok` for the one-button caller.

The decoded notice is message index 432, style 34. `lau_dlg_1b_ok` is index
167, style 26, and contains the native A glyph followed by `OK`.

| Visible element | Manifest resource and decrypted source | SHA-256 |
| --- | --- | --- |
| Notice text and A OK label | `home.messages` → `menu_msbt_LZ/lau_dlg_folder_delete_02` and `lau_dlg_1b_ok` → `RomFS/message/EU_English/menu_msbt_LZ.bin` | `1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350` |
| One-button panel | `home.dialog` → `Dlg_A_D_01` → `dialog_LZ.bin/blyt/Dlg_A_D_01.bclyt` | `ba68d27867a30860e99089ddec91cbbdeb2149a3de7ee150250e7ac408657701` |
| Dimmed lower backing | `home.dialogmask` → `DlgMask_D_00` → `dialogmask_LZ.bin/blyt/DlgMask_D_00.bclyt` | `45ffaa6a0379423844784ffd3e450b5f3e2bf46e1724484a234b40ca73afbc86` |
| Settled mask binding | `home.dialogmask` → `DlgMask_D_00_FadeIn` → `dialogmask_LZ.bin/anim/DlgMask_D_00_FadeIn.bclan` | `400bd1588c04d175c54104110c004f32dc96dd82d0a7cd9d9f0b8da8b2734fe4` |

Delivered pack SHA-256 values are
`8a7b72cd0e69601da7938503f648c18286fb4bcb2bf27fc0c33839dd4e0dca17`
for `home.dialog`,
`675959c0268ed340a8d926836370a535c4a09b3acf2724b85ef9243a43348e4f`
for `home.dialogmask`, and
`3df11ee9ad6b57e4c043da636c4b606f52e41fbf0a57022cc2696f8b895817d2`
for `home.messages`.

## Runtime contract

- Folder Settings tests occupancy before acting. Empty folders still use the
  direct deletion transaction; populated folders enter `folder-not-empty`.
- The notice presenter requires all selected native resources. A missing
  message, layout, animation or failed draw becomes the paired native-screen
  recovery surface; no generic notice is substituted.
- `Dlg_A_D_01/Bounding_00` supplies the half-open touch rectangle
  `x=20..299`, `y=180..219`. Touch activation requires down and up on that same
  source target. Cancelled, cross-target and stale releases are inert.
- Touch OK and physical A return directly to root HOME with the same selected
  folder, identity and contents. The selected-folder upper banner remains
  present while the notice is shown, while the underlying Settings/Open lower
  footer is suppressed as in the native capture.
- Native B behavior was not captured. The browser lets B close the notice to
  root as an explicit recovery adaptation; HOME does the same through the
  existing global HOME-panel escape. Loading/error recovery releases held
  input before either escape.

No generic painter, parallel app state or native-resource fallback is added.
Folder placement, identity, persistence and empty deletion continue through
their existing pure state contracts.

## Verification boundary

Focused state, input, presenter, paint, identity, naming and navigation suites
pass 130/130. Typecheck passes. The full suite reaches 1,783 tests: 1,723 pass,
23 skip and one is todo; all 36 failures are `ENOENT` for intentionally absent
`model/candidates/joshua-xl/` fixtures in this continuation worktree. This
worker did not operate Azahar or a browser and did not run a production build.
The coordinator completed the independent native repeat and still owns the
integrated browser capture, raw two-LCD comparison, regression captures and
build. Until those comparisons exist, the whole scenario remains `fail`, not a
1:1 fidelity pass.

## Coordinator integration

Source `b33064aa` integrated as `2ee79ae3`; visible footer ownership correction
`4ea72347` as `43b8be55`. Full integrated1,808 tests, typecheck and production
build pass, superseding the worker's missing-model fixture failures. Actual
desktop/mobile touchOK, physicalA, cross-target rejection, adapted B/HOME,
empty-delete and reload-content controls are recorded in the
[comparison handoff](workstream-handoffs/home-populated-folder-compare.md).
The final harness's last persistence double-activation and HOME-only retry
were corrected in a separate successful persistence supplement, not concealed.

The inspected native/production final notice has98 panel pixels above delta2,
max8, all at symmetric bottom corners. Text/button interior meets tolerance.
Full upper49,352/lower12,601 remains fail. Removing the leaked footer lowers
its band's maximum error78 ->11, but6398 pixels remain above2; its background
shade is an unresolved source gap, not explained by root population/scroll.
No speculative palette, glyph or alpha correction is introduced. Exact
press/fade/input/audio and native B/HOME remain unverified. Five lower stock
controls and both Settings upper controls remain byte-identical.
