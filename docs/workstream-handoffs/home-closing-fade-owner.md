# HOME closing-dialog fade owner source audit

Base: `a79ce5503d8686a789124b9ae6f67f9b4f937f4c`

Branch: `codex/home-closing-fade-source-20261002`

## Outcome

The native lower `Closing software...` window is visible layout
`Dlg_A_D_00`, but HOME's source table maps layout index 0 to animation donor
index 2, `Dlg_A_D_02`. Its accepted/close exit is therefore
`Dlg_A_D_02_FadeOut00`, not a reconstructed opacity curve. The authored clip
has 21 samples over source frames 80..100: `N_Dlg_00` alpha goes 255 to 0 and
both scales go 1.0 to 1.0499999523162842 from local sample 0 to 20.

The lower parent mask uses `DlgMask_D_00_FadeOut00`. It also has 21 samples
over source frames 80..100. `P_Bg_00` alpha goes 130 to 0 from local sample 0
to 15 and remains zero through the local end at 20. Converted keys at local
frame 40 are outside this clip's 0..20 sampling interval and must not extend
the browser animation.

Both exits use the same local sample index. The source proves 20 intervals,
but not a millisecond duration: converting those samples to host time remains
a coordinator-owned timing adaptation until matched native/browser evidence
establishes the cadence.

## Source selection trace

Addresses are for pinned EUR 10.7.0-32E HOME `code.bin` loaded at `0x100000`.

The generic dialog builder at `0x233bd0` loads its layout-name table from
`0x32e980` and its animation-donor table from `0x32e9ac`. Entry 0 in the first
table is `Dlg_A_D_00`; entry 0 in the donor table is 2; entry 2 in the layout
table is `Dlg_A_D_02`. At `0x233f40..0x233fcc`, the builder combines that donor
name with the suffix table at `0x32e910`; its first suffix is
`_FadeOut00.bclan` and its second is `_FadeOut01.bclan`. This is direct source
evidence that `Dlg_A_D_00` borrows the two authored `Dlg_A_D_02` exits.

The mask constructor at `0x26ba48` loads `dialogmask_LZ.bin`, loops over the
lower and upper names starting at `0x32e8f0`, and at
`0x26bb2c..0x26bb54` constructs the animation named by the first exit suffix
at `0x32e910`. Entry 0 is `DlgMask_D_00`; the selected suffix is
`_FadeOut00.bclan`. The constructor does not select the alternate
`FadeOut01` for this parent-mask exit.

The software-close callback at `0x1e6bbc` remains the owner transition entry:
it switches the supplied HOME presentation owners to mode 0. Dialog animation
update, quiescence, and retirement are nevertheless separate mechanisms. The
dialog update path at `0x10cba4` advances the selected FadeOut controller. The
quiescence check at `0x10cd20` inspects controller/state activity and is called
at `0x103a4c`. The state/retirement path at `0x10c9b8` is separately called at
`0x1049bc`; its state-3 branch invokes an owner callback at
`0x10cb34..0x10cb74`. No bounded instruction retires the owner by comparing
the rendered alpha with zero.

Consequently, sample 20 is the last authored pose, but it is not evidence that
the browser should retire the closing owner on the same host update that first
renders sample 20. The coordinator must preserve its generation/owner guards
and choose retirement from its lifecycle evidence rather than deriving it from
the dialog or mask alpha. The exact native same-update ordering remains a
source gap.

## Delivered runtime helper

`drawHomeSoftwareClosingDialog` retains its settled call form. Its optional
fifth argument now accepts only an integer exit sample from 0 through 20. When
present, the helper applies `Dlg_A_D_02_FadeOut00` to visible
`Dlg_A_D_00` and applies `DlgMask_D_00_FadeOut00` to `DlgMask_D_00` at the
same sample. Missing source clips and out-of-range or fractional samples fail
before drawing. The helper does not read a host clock, select a duration, or
retire an owner. The coordinator owns controller wiring.

## Source identity and private output

The executable is HOME title `0004003000009802`, version 24576, content index
0 / content ID `00000082`, SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

`dialog_LZ.bin` has SHA-256
`65675c4a6ecada83a0d7256ea20c36692190be10349bf87c32e6068376409704`.
The selected member is
`anim/Dlg_A_D_02_FadeOut00.bclan`, SHA-256
`d2ac804d59218030a877cca1aaf59c6ca198534f90436fe31c61c7e929a62c81`.
The delivered dialog pack SHA-256 is
`8a7b72cd0e69601da7938503f648c18286fb4bcb2bf27fc0c33839dd4e0dca17`.

`dialogmask_LZ.bin` has SHA-256
`5add87203eb9a8adf05bc748a21fb47ee8bb8b55c6cf854e94c0007741e016d2`.
The selected member is
`anim/DlgMask_D_00_FadeOut00.bclan`, SHA-256
`ba904f4847d045d8389e33fdf440af2fa5ddd6886d3d0ef4df2cc799dbbaf50a`.
The delivered dialog-mask pack SHA-256 is
`675959c0268ed340a8d926836370a535c4a09b3acf2724b85ef9243a43348e4f`.
Both packs were delivered by `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

Run [the bounded audit script](../../scripts/firmware/home_closing_fade_owner.py)
with absolute paths. Its hash-checked `audit.json` and clipped `audit.asm` are
under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/home-closing-fade/source/`.
No firmware is copied into the repository.

The two coordinator captures used only as state/ordering context remain:
settled native
`native-close-clean-20261002/screenshots/_02.10.26_08.20.50.671.png`
(SHA-256
`a33cdb74b96f8456ba430be27e840977d8c6de71707bd5d3cdc47506eeb74afa`)
and partial exit
`native-close-clean-20261002/screenshots/_02.10.26_08.20.51.091.png`
(SHA-256
`4dda7f4eb031869bbe771415c7c2636805aeb32fff4052315a268b5aa1438e3c`).
This worker does not edit that evidence. Neither image establishes cadence or
exact retirement, and measured projection/opacity ratios from it are not
literal authored alpha values.

## Verification and remaining work

The focused helper test covers settled compatibility, all exit endpoints,
exact decoded tracks, member provenance, validation, and missing-resource
failure. It passes 5/5. `npm run typecheck` passes, and the full `npm test`
passes 1,756 tests with 23 skipped and one todo. The audit script rerun passed
all input-hash, table, clip, and direct-call assertions. A production build is
explicitly outside this worker slice.

This worker did not operate a GUI, Azahar, the shared production browser, or
the private scenario matrix. The coordinator must wire the sample index into
the existing transition controller, label the host cadence and retirement
choice as adaptations unless later source resolves them, then perform the
matched native/browser recapture loop.
