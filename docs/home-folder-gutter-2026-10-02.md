# HOME open-folder left gutter — bounded source audit

## Outcome

No rendering change is justified by the captured pair. The apparent root-icon
sliver at the opened folder's left edge came from comparing different retained
root viewports: the browser root was scrolled one 28-pixel column, while the
fresh native root was at its left origin. Repeating the production browser flow
at root scroll zero removes the sliver without changing the runtime.

This closes the proposed mask/clip change as a **source gap**, not a visual fix
or an adaptation. A native open-folder capture whose retained root is also
scrolled one column is still required before changing visibility of the
captured root. In particular, the legitimate root strip above the folder must
not be hidden; it retains source icons such as the eShop entry behind the Back
tab.

## Capture evidence

The original production run used commit `5b82c896`. Its root-before capture
selects browser slot 19 at `(90,82)`. The retained cursor evidence records an
earlier root target with `scrollPixels: 28`, and the lower LCD visibly places
the preceding column at centre X=6. Opening the folder therefore retains that
column in the fresh root capture, leaving only its X=0…9 edge visible outside
the 300-pixel folder panel.

| Production state | Lower PNG SHA-256 | Capture JSON SHA-256 |
| --- | --- | --- |
| Original root-before, 28px root scroll | `f8895ecb8f7a8cffa1bfe49250e4b0e4b744beb84c7d73436853e30ab72efb04` | `657f9d53baabb1f132b0235943e1e063fedb1e4fa211ccdbae84d8c23296ed2e` |
| Original occupied folder | `b6015a9c5f396e13fd8fd333a2ea7e1bb731e0ec2dca09a6560001c902344cb8` | `dec6ebb0eb254e801b83d87e68ac7b10994c5aa817354763fa342b2a5fbefddf` |
| Root-zero root-before | `ac97dfbbd106267eedb836da9767359ec5c8624ce6e50b54e1a766f443a6c907` | `44db1b5297bce982281234f62e91a0b54b56e4c30ceeecea7eca5c7963be75af` |
| Root-zero occupied folder | `cabc871cbac344b5da0be15f680f09ac5c5a39f5db4464f046b3cd03765663c9` | `e18f187fa6c9c6d4baf764c1c5c2fec85a4cec670207212cd92e7bd9520c91c6` |
| Root-zero vacant child | `60339dbdf86344184a7264c781536d07c19fd6df074fb9f3e4cbec7854dba24a` | `2ea71d00f8643d48da9c775b28f1373d219ef4aa99011cb669b4256d126ab895` |

The root-zero flow used actual projected touch input: raw lower-LCD `(10,137)`
returned the root to its left origin, `(118,82)` selected the same browser
folder, and the existing Open/Back/child controls drove the remaining states.
No state was injected. Root-zero aligns only the viewport origin; browser and
native folder number, slot identity, population and content layout still
differ, so it is not a whole-screen matched pair.

The coordinator's immutable v4 comparison uses the predeclared raw lower-LCD
gutter `x=0, y=64, width=10, height=146`, with empty masks and no fit,
translation, crop, geometry, colour or phase adjustment. At unchanged runtime
`5b82c896`, actual input changes the original colorful result as follows:

| Gutter comparison | Pixels above delta 2 / 1,460 | Maximum channel delta | Mean absolute RGB-channel delta |
| --- | ---: | ---: | ---: |
| Original unmatched root viewport | 1,460 | 189 | 28.223516 |
| Root-zero occupied/vacant/reopened/repeat | 816 | 4 | 1.536758 |
| Root-zero root control | 0 | 1 | 0.076941 |

The four open-folder root-zero states have byte-identical gutter residuals, as
do their native counterparts. This removes the colorful icon discrepancy and
leaves a small, state-invariant backing-shade residual; it does not make the
whole lower LCD a pixel-tier match. The v4 manifest SHA-256 is
`0326b0c34f6a6023d879fba59c225856a150dd4798ba4ed2cd5657db71bb907b`
and report SHA-256 is
`e92c2bf931095e292eee9bd393b2db6592ddba50505e321dd4bb8aaa280497ed`.
The inspected open-folder gutter and no-code diagnostic sheet SHA-256 values
are `b2877486a1164298e39df600ca9075d7d7a712a0d4394388a2e442db228bc3e5`
and `1fb115121af6c8f38b47c7296e0f102c50a4ef33ad45de77e270c020e608f2ee`.
The immutable inputs, report and sheets are under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-folder-gutter-20261002/comparison/v4-root-zero/`.

Fresh native captures come from the coordinator's isolated 10.7.0-32E Azahar
profile:

| Native state | Azahar PNG | SHA-256 |
| --- | --- | --- |
| Occupied Health child 2 | `_02.10.26_18.13.47.281.png` | `5dce33081e08115db3b139d0204740d0638bd0cc3bba94fca21206eb7c47118e` |
| Populated folder, vacant child 0 | `_02.10.26_18.14.20.746.png` | `2f8733aee94b79fafd7e0be418e77e7be5eb6e6fdf4d414971294de7dfe15059` |
| Root after Back | `_02.10.26_18.14.32.956.png` | `22b8f2e6167bdf4c6f597f6d22b54bf7101a90fd9b17e4dab78186b89d6fdc34` |
| Reopened vacant child 0 | `_02.10.26_18.14.46.303.png` | `490e572c0f33137cfb713a949829805df3ac336a48eadde183752bc2c2f0e1ec` |
| Occupied Health child 2 repeat | `_02.10.26_18.14.57.413.png` | `e780b1b1de8dd13f41f07f34453b87c5e47e28ebcea4f062eea0fbdf7605b3e0` |

These fresh captures also show that the native folder and Health child persisted
across this cold boot. That corrects the earlier run-specific observation; it
does not establish universal persistence behavior.

## Source and runtime trace

The pinned source remains EUR HOME title `0004003000009802`, version 24576,
content index 0 / content ID `00000082`. Its CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
decrypted `code.bin` is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Conversion remains `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

| Visible/source role | Manifest key and decrypted member | SHA-256 |
| --- | --- | --- |
| HOME launcher archive | `home.launcher` → `RomFS/launcher_LZ.bin` | `826e92ec59b98aaf20fab4014a5dccc1dbaa634aaa4f95498bcf3d7944795834` |
| Retained root plate | `layouts.LncPlt_00` → `launcher_LZ.bin/blyt/LncPlt_00.bclyt` | `e4875783c38f0fde3656ed9c1964110fb9210765400ba2cfca49480998e9874b` |
| Root plate settled palette pose | `animations.LncPlt_00_PaletteOut` → `launcher_LZ.bin/anim/LncPlt_00_PaletteOut.bclan` | `8b0a99c062aeac2cf891c519cd66019e6f5f1e3348bc95e05d5d7d3d9c430a44` |
| Folder capture composite | `layouts.LncFolderCapture_00` → `launcher_LZ.bin/blyt/LncFolderCapture_00.bclyt` | `da89e81a94b843f0423cd57c58244d8b28313ef30e137bb8d75c23f216281d86` |
| Settled capture fade | `animations.LncFolderCapture_00_Fade` → `launcher_LZ.bin/anim/LncFolderCapture_00_Fade.bclan` | `a340868b91e6bde04ac212cc1e6b03acdd25325290b59694b84c0137a01b8f60` |
| Capture backing/pick-up pose | `animations.LncFolderCapture_00_PicUp` → `launcher_LZ.bin/anim/LncFolderCapture_00_PicUp.bclan` | `d35235569528d14632b302dc0c7bb03020db6307684ab98e05641b0d5ee3fd32` |
| Open folder panel and Back tab | `layouts.LncFolder_00` → `launcher_LZ.bin/blyt/LncFolder_00.bclyt` | `9581b9f24f79646159ee161e589fd62b92edd7b55dd5e0e2b2f1db6980fb6a24` |
| Settled folder pose | `animations.LncFolder_00_FadeIn` → `launcher_LZ.bin/anim/LncFolder_00_FadeIn.bclan` | `0cc21b182087829e94470dbd171a2c0af5d61118668eeb9a550b70e74cdecfda` |

The delivered launcher pack SHA-256 is
`f251db1a92bed36da178099640fadcc9a6a53ba3e7e5410a7b3ddd7dfc02a044`.

`screens.ts` already follows the source-backed assembly: on folder entry it
uses `leaveHomeFolder`, redraws the retained root toolbar, `LncPlt_00` plate and
root grid into the canonical rows 34…239 capture, then supplies those pixels to
`LncFolderCapture_00` at settled Fade 8 / PicUp 0. The folder panel is painted
after that capture. The navigation source tables use 28-pixel pitch at density
5, and the browser's saved root view deliberately retains its scroll across
folder entry and Back.

The existing [selected-folder source trace](native-folder-capture.md)
explicitly establishes that the opening capture preserves root content outside
the later folder panel and does not establish a panel-edge crop. Therefore
neither a hard X=10 mask nor hiding the entire root capture is source-supported.
The root-zero production capture shows that neither is needed to remove the
reported sliver.

## Verification boundary and remaining work

This worker did not operate Azahar or the production browser and made no
runtime, presenter, painter, asset or test change. The coordinator supplied and
visually inspected both actual-input capture runs. Documentation-only checks
are `git diff --check` and relative-link validation; no build or full test run
is required for this source-gap result.

The captured colorful left-gutter discrepancy is not a valid active mismatch
because the retained root viewports were different. The remaining maximum-4
backing shade is real but is not yet attributed to a renderer node, material or
asset. Native behavior with a nonzero retained root scroll remains unobserved.
A future comparison must place the same root slot/content at the same scroll
position on both systems before classifying that state as `pass`, `adaptation`,
or `fail`.

Whole open-folder scenarios remain `fail/unverified`: folder identity/content,
panel/backing shade, cursor epoch, opening/closing motion, input timing and
audio are not matched. The browser portfolio icons are intentional portfolio
content; they remain non-native even when their retained-root visibility is
correct. This audit establishes no strict 1:1 fidelity claim.
