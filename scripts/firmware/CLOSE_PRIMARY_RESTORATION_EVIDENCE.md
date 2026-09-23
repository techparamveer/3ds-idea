# Primary cursor on normal folder-close restoration

2026-09-23. Ordinary root restoration shows the primary cursor on the
restoration pass, including when the restored selection requires mode3
scrolling. The checked restoration retains the child's previous primary root
position. Mode3 keeps that position until its completion enters mode0; only
then does the ordinary footer position the primary at the restored selection.
The later banner-ready boundary must not suppress primary visibility or Loop.

This resolves the boundary between the earlier
[close hide proof](FOLDER_CLOSE_OVERLAY_EVIDENCE.md) and
[ordinary mode3 primary proof](PRIMARY_CURSOR_BOUNDARY_EVIDENCE.md).
Neither earlier proof alone ran the complete combination. The earlier close
and banner-request fixtures treated the whole restoration helper as an
endpoint. This fixture executes its body and the original history/grid work.
No application, runtime, public asset, browser or emulator is changed.

## Source and reproduction

Owner-supplied EUR HOME `0004003000009802`, version24576, executable mapped
at `0x100000`. SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

Run [home_close_primary_restoration.py](home_close_primary_restoration.py)
with Unicorn2.1.4 and Capstone5:

```sh
python scripts/firmware/home_close_primary_restoration.py \
  --code /private/path/exefs/code.bin \
  --output /private/path/native-close-primary/verified
```

The fixture requires its adjacent frozen setup file
`home_primary_cursor_boundaries.py`, SHA-256
`c1d11e146e3fd3413acce21114474d7e6b18f5e8592171c8cd8c7f5d7b6ac62c`.
It executes only that file's setup prefix, extends its named-pane endpoint for
two root background panes, and leaves the file and earlier reports unchanged.

Six combined cases and the inherited registration check pass. The private
report and14 hashed source excerpts are under:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-close-primary/verified/`.

| Artifact | SHA-256 |
| --- | --- |
| Fixture | `b20ca9d340487f8b6c3716fbeab60cdb7ea7a6e0db539a3fca55a8b6c0936174` |
| `checked.json` | `8a134af4355fe670fac5727a60c7479975ca6a0ccfacfa17ff0f8ca971e1e0de` |

## Source order and flags

Let `S` be HOME, `C=*(S+0x820)` the primary layout, and `P=*(C+0x38)`
its root pane. Request is `S+0x3a88`, HOME shown is `S+0x3a4e`, actual
layout visibility is `C+0x60`, and root position is `P+0x28/+0x2c/+0x30`.

1. Normal close setup writes request2 at `0x1de58c` when `S+0x3ca8==0`.
   While mode44's controller remains active, the common footer consumes that
   request: `0x2b8560` clears HOME shown and `0x2b8568` calls the actual
   visibility setter `0x232234(C,0)`. The later2D pass skips the hidden cursor.
2. Mode44 update `0x29f0a4` sees controller `*(S+0xe30)+0x14` outside1/2,
   and calls restoration `0x2b021c(S,0)` at `0x29f12c`.
3. Restoration resets the **folder** pane at `0x2b0248`, saves child history
   with `0x21b044` at `0x2b0278`, and copies root history with `0x1d9ea0`
   at `0x2b0288`. The history helper copies left/target-left, selection,
   relative selection and density fields. It does not write the primary root.
   Restoration sets folder context to−1 at `0x2b0294`.
4. The remaining body calls widget dispatch at `0x2b029c`, footer exit at
   `0x2b02a8`, context-map switch at `0x2b02c0`, root/icon presentation work,
   original grid refresh `0x1d7eac` at `0x2b03b4`, and derives current scroll
   at `0x2b03b8..3dc`. Original icon-update control flow `0x1e2180` executes
   at `0x2b03e4`, followed by the footer-layout endpoint at `0x2b03f0`.
   In the checked ordinary cases, return still has mode44/request2/hidden0
   and the prior primary root position. No primary-position helper ran here.
5. Back in close update, a visible restored selection enters mode0 at
   `0x29f260`. Off-left enters mode3 at `0x29f2b4`; off-right at `0x29f314`.
   Mode0 entry writes request0 at `0x29a204`; mode3 entry writes request0
   at `0x2a3678`. Neither waits for a banner-ready flag to request showing.
6. The same lower pass reaches the ordinary common footer. With both overlay
   pointers null and mode outside185/186, `0x2b8500` writes HOME shown1,
   calls `0x232234(C,1)`, and invokes `0x1d914c` at `0x2b8524`.
   In mode0 the helper writes selected-grid X minus scroll, selected-grid Y,
   and Z0. In mode3 it preserves the primary root. The later2D pass submits
   the retained Loop phase and advances it in either case.
7. Offscreen mode3 completion enters mode0 and resolves the restored banner
   target before the common footer. That footer now writes the primary root.
   The cursor was already shown during the intervening mode3 passes.

The mode44 widget-dispatch table entry points to `0x1df708`; its ordinary
branch does not call the explicit primary show/position helper. The direct
primary-position helper call sites remain the common footer, standalone
visibility policy and explicit-show helper. Restoration does not directly
call those other two paths. The executed trace distinguishes primary-root
writes from the folder/icon pane setters within restoration.

## Combined results

All cases start with child context2, density index2, selected slot1 and a
natively generated primary root `[-108,−43,0]`. Root history has density
index0 and left3. The primary begins shown with Loop current17.25. One
supplied active-controller mode44 pass really hides it and preserves phase;
the next pass receives controller status0 and runs restoration.

Let **R** denote that restoration pass. This audit supplies the controller
boundary; it does not re-derive the preceding animation duration. With the
existing close timing mapping **R=C+18**, the ordinary results are:

| Restored slot | Counter | At R | Root positioning and banner resolution |
| --- | --- | --- | --- |
| 3, visible | 0 or5 | Mode0, shown; root `[-84,−41,0]` | R, corresponding to C+18 |
| 2, off-left | 0 | Mode3 elapsed0, shown; prior root retained | R+10, corresponding to C+28; root `[-84,−41,0]` |
| 2, off-left | 5 | Mode3 elapsed0, shown; prior root retained | R+5, corresponding to C+23; root `[-84,−41,0]` |
| 6, off-right | 0 | Mode3 elapsed0, shown; prior root retained | R+10, corresponding to C+28; root `[84,−41,0]` |
| 6, off-right | 5 | Mode3 elapsed0, shown; prior root retained | R+5, corresponding to C+23; root `[84,−41,0]` |

At R the source already sets shown/layout-visible1 and advances Loop. Slow
mode3 submits17.25 and advances to18.25; fast mode3's entry sets step3,
submits17.25 and advances to20.25. Every subsequent eligible mode3 pass
continues Loop. Completion only changes position in this ordinary path; it
does not make the previously hidden primary eligible for the first time.

The assertions check restoration return state, native child-history save,
mode0/3 branch and duration, every intervening position/visibility/Loop value,
exact pass of all primary-root writes, and the single restored banner resolver.
There are no primary-root writes before completion in the offscreen cases.

## Scope and integration

Keep retained primary position, shown/request flags, viewport state and banner
readiness separate. Ordinary close requests hiding during44. On root
restoration, apply the native mode entry and common footer immediately. If
that entry is mode3, use the retained primary position until idle positioning
runs. Do not derive the native primary's visibility from selected-slot culling
or defer its Loop until `rootSelectionReady`.

The fixture executes actual `0x29f0a4`, restoration body `0x2b021c`, history
save/copy, widget dispatch, footer-exit body, grid generation and scroll math,
icon-update `0x1e2180` control flow, mode entries/ticks, common primary footer,
and the later2D Loop. Root capacity300, context-map switching and hidden
secondary-layout queries are supplied. Icon reparenting `0x2a1854`, widget
and icon service leaves, final footer layout `0x1d61d4`, resource lookups and
the inherited platform/render/audio services remain explicit endpoints.
`W_Plt_00/W_Shdw_00` are inert supplied background panes; original
`N_IconPos_00` localY0 retains the earlier resource provenance.

This is bounded ordinary source execution with valid histories, no overlay,
no toolbar/pickup/special-close state and hidden departed effects. It does not
prove a complete native UI session, every density/history, omitted resource
or widget lifecycle, pixel visibility, clipping, alpha, occlusion or fixedHz.
The retained-position finding applies to the executed ordinary restoration
path with these stated endpoints; it is not an assertion about arbitrary
side effects in unexecuted services.
