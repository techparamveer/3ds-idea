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
