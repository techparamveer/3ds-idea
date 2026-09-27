# Notifications list residual source audit — 27 September 2026

Base: `8cbee36`. The paired post-fix report is
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260927-postfix/reference/scenario-matrix/v1/comparisons/notifications-list-postfix-8cbee36-20260927/report.json`.
The native lower LCD is the isolated Vulkan replay identified in
`docs/native-personal-tools.md`. Its unmasked lower comparison has mean RGB
error 15.2526 and 21,826 of 76,800 pixels over threshold 2. The upper has
mean RGB error 5.4074 and 6,200 of 96,000 pixels over threshold 2.

The contact sheet shows three prominent lower residuals: the native rows have
gray information badges where the browser shows a dark triangular mask, blue
unread dots are absent from the browser, and the browser scrollbar sits lower
than the native one. Those are observations, not source coordinates.

`NewsWndwNews_D_00` owns the row balloon, label, icon shadow and `P_Icon_00`.
Its five texture names are `IconMask`, the three balloon pieces and
`NewsIconShdw`. `P_Icon_00` has a 40 × 40 pane and two texture maps; the
layout does not carry the native gray information badge image. The current
render therefore samples a layout placeholder without its runtime icon.
`N_IconNew_00` is an empty 16 × 16 parent pane. Setting its visibility cannot
draw the native blue dot. The profile fixture contains title/read metadata,
not badge pixels. The native executable's badge and unread-marker attachment
path still needs tracing before public artwork can be selected.

`NewsTopUI_D_00/N_ElemPos_00` is at `[-160,100,0]` and measures 264 × 53;
`NewsWndwNews_D_00/N_News_00` has local `[10,-15,-10]`. Their sum supports
the first rendered row's `[-150,85,-10]` translation and 53-pixel advance.
The source contains `N_SlideBar_00` at `[141,14,0]`, but the separate
`SlideBar` layout's `N_Slider_00` starts at zero and its base window measures
16 × 132. The runtime parent/attachment and thumb calculation are not proven
by those static layout values. The existing standalone override should not be
retuned from this single screenshot alone.

A bounded ARM disassembly check used the private Notifications `exefs/code.bin`
(SHA-256 `b3993f1e4fe5ed7e5760f0f4c3926c95b42ea8de53c25bb95864499342e5b228`,
mapped at `0x100000` in this inspection). PC-relative references reach
`N_SlideBar_00` at `0x177ab4` and `0x17df98`, `P_Icon_00` at `0x17936c`,
`0x17a960`, `0x17cb24` and `0x17d564`, and `N_IconNew_00` at `0x178468`,
`0x17cea4` and `0x17d80c`. The list constructor near `0x17df98` also looks
up `N_ElemPos_00` at `0x17dfac` and has a per-row loop at `0x17dfc4`.
These references confirm that the executable handles the pane names; they do
not establish the image bytes, attached marker layout, final parent matrix or
scrollbar thumb rule. `NewsBllnTri` and `IconMask` have no literal references
in this code image; both are named by the decoded layout resource. Applying
the row translation to the child `N_News_00` currently places its balloon at
the authored parent-plus-child sum, but it leaves `B_Wndw_00` at its root
position. The executable's row mount path is still needed to prove the full
transform and clipping behavior.

No visual position or icon override is changed in this pass. Source fixture
rows remain inert and private profile bytes stay outside `public/`. The
focused source test pins these facts so a later executable trace can target
the correct runtime attachment points.

## Follow-up: ROMFS icon candidates

The pinned Notifications ROMFS contains `default.cic` and `special.cic`, each
5,760 bytes. Both have 1,152 leading zero bytes followed by 4,608 nonzero
bytes, the byte count of a 48 × 48 RGB565 image. These are candidates for
runtime icon content, not identified row badges: their format, swizzle and
selection rule have not been proved. The executable contains both filenames
at mapped addresses `0x1922d4` and `0x1922c8`, with one absolute pointer to
each at `0x1736e8` and `0x1736e4` respectively. This establishes filename
ownership only; it does not connect either file to `P_Icon_00` or the
`N_IconNew_00` attachment. The native capture's gray information badge and
blue unread dot therefore remain unresolved. No visual override is justified
by this bounded trace.

**Later resolution:** [CIC badge validation](notifications-cic-badge-validation-2026-09-27.md)
decodes `special.cic` and matches its source-layout first-row icon crop to the
isolated native capture at zero pixels over 2/255. The badge is delivered and
bound in the browser source renderer. The unread dot and the executable's icon
selection rule for other list states remain unresolved.

**Unread-marker follow-up:** [the bounded executable and ROMFS trace](notifications-unread-marker-source-trace-2026-09-27.md)
confirms a runtime object is attached to the empty `N_IconNew_00` pane, but
does not identify its artwork or read-state update. It makes no visual change.

## Scrollbar mount follow-up — 27 September 2026

The same private `code.bin` (SHA-256 above, ARM mapped at `0x100000`) narrows
the list scrollbar mount. The list setup allocates an object into `r7+0x18`
at `0x17deb0..0x17defc`, then calls `0x17ec58` with that object at
`0x17df04..0x17df0c`. That routine allocates and initializes a separate
slidebar layout/control object; at `0x17edcc..0x17edd4` it initializes a
field with float zero. At `0x17df94..0x17dfa4`, the list setup passes the
slidebar object's layout pointer (`[r7+0x18]+8`) and the literal
`N_SlideBar_00` to `0x114cfc`, with the list layout pointer (`[r7+8]`)
as the first argument. This is the executable attachment link between the
separate `SlideBar` layout and the list's `N_SlideBar_00` pane. The static
source pane is at `[141,14,0]`; the slidebar layout's `N_Slider_00` starts at
zero, `SBBaseWndw` is 16 × 132, and `N_Slide_00` starts at zero.

The trace does **not** establish the final thumb translation. The list
constructor subsequently supplies the slidebar control's `[r7+0x18]+0x10`
to another control initializer at `0x17e0cc..0x17e0e8`, alongside list and
row handles. The resulting controller's update method, count/viewport inputs,
and its write to `N_Slide_00` still need to be identified. In particular,
the browser's `N_Slide_00: [0,55,0]` is an unsupported fixed override for the
captured nine-item list. The `N_Slider_00: [141,14,0]` override approximates
the proven parent placement, but a standalone draw may differ from native
parent clipping, opacity, and transforms. A screenshot fit cannot distinguish
those effects from the thumb rule. No runtime values changed in this pass.

### Bounded controller follow-up

The object constructed by `0x139080` at `0x17e144` contains the mounted list
layout, `N_SlideBar_00`, `N_Scroll_00`, `B_Slide_00`, `SBBtn`, `SBBtnShdw`,
and `SBBtnFrame` names in its input block (`0x17e0c4..0x17e110`). Its
initializer calls `0x13a160` at `0x139130`. That method is also called from
list paths `0x179660` and `0x17acec`. The latter passes an integer in `r5`;
the former rounds a floating scroll displacement divided by the row stride at
`[r4+0x314]` before passing it as the second argument. This establishes a
scroll-dependent update path, rather than a fixed `55`-pixel pose.

In `0x13a160`, the `N_SlideBar_00` pane lookup supplies a field at `+0x4c`.
The controller stores that field and its `0.95` and `0.05` multiples at
`+0x68`, `+0x6c`, and `+0x70` (`0x1390ec..0x139124`; constants at
`0x139188` and `0x13918c`). The update subtracts the latter multiple times
`max(0, second_argument + controller[0x0c] - controller[0x08])` from the
former, then writes the capped result to field `+0x4c` of `SBBtn`,
`SBBtnShdw`, `SBBtnFrame`, and `B_Slide_00` (`0x13a180..0x13a22c`).
This is a source-backed pane-field calculation, but the field semantics and
subsequent `N_Slide_00` translation write have not been established. The
list's nine profile rows, a constructor parameter with value six, and the
current browser five draws do not directly reveal the native
count used by this method. No renderer correction is safe from this trace
alone; identify the dynamic thumb translation/write and effective row count
before replacing the browser override.
