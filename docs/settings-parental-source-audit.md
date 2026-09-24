# Settings parental setup and restrictions source audit

The native **Set** action does not open the restrictions list. For an
unconfigured system it opens an explanation, then a PIN warning, then PIN setup.
The current portfolio shortcut from Set to a generic restrictions list must be
removed. This audit establishes static routes and composition; it does not
supply a configured parental profile or permission to execute the firmware.

## Reproducible evidence

Source: EUR System Settings title `0004001000022000`, content `0000003d`,
firmware reference `10.7.0-32E`. `romfs/table_LZ.bin` SHA-256 is
`1df90f560d13eb1fbc46f0a1c33b9f743b2686ad64eb5c0f980ac75224de7794`;
`exefs/code.bin` SHA-256 is
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`.
Executable addresses below use mapped base `0x100000`.

Run `scripts/audit-settings-parental.py --content <absolute extracted content>
--converted <absolute complete converted Settings pack> --report <absolute JSON>`.
It validates those hashes, decompresses the LZ/DARC table, decodes 98 parental
scenes, resolves 134 English messages, inventories nine native layouts and reads
three static restriction label/target tables. It never executes firmware.
The private result is `runtime/parental-flow/audit.json` under the established
firmware artifact directory.

The original loader at `0x234398` copies 36 header bytes, then reads 31 fields
with a **16-byte maximum or newline delimiter** into 17-byte slots. Splitting
only on newline joins full-length adjacent fields incorrectly. Scene records
have runtime stride `0x233`; the name table has 16-byte entries and IDs start
at one. The report preserves raw-header and per-scene hashes for comparison.

## Native ordinary Settings route

| Scene / ID | Lower body | Footer labels | Footer targets |
| --- | --- | --- | --- |
| `pare_new_set` / 487 | `MessageOnly_D_00`, `par_top_comm0_n` | `base_2b_back`, `base_2b_set` | `top4btn`, `pare_explain` |
| `pare_explain` / 455 | `StartChild_D_00`, `st_start_comm` | `base_2b_back`, `base_2b_next` | `pare_new_set`, `pr_dlg_explain` |
| `pr_dlg_explain` / 516 | shared dialog, `par_dlg_pin0` | `dlg_2b_ok` | `pr_dlg_pass_set` |
| `pr_dlg_pass_set` / 539 | shared dialog, `par_dlg_pin1_n` | `dlg_1b_ok` | `pare_pass_set2` |
| `pare_pass_set2` / 493 | `Aplt_D_00`, `*Parent` applet controller | `keyboard_cancel`, `keyboard_decide` | applet-dependent; not a restrictions shortcut |

Intro and explanation share `CommonBG_U_00`, `TextBG_U_00`, `IconParental`,
`parental_title_u`, and `par_top_comm_u_n`. Their source palette byte is five;
retain the audited parental common-background state. Their footer type two
selects `Base_D_01`. Source Back and forward bounds are respectively
(0,208,120,32) and (200,208,120,32) in the 320×240 lower screen.

`StartChild_D_00` contains its own `ParentChild_00` artwork at (6,12), size
118×98, and `TextBoxTitle_00` at (0,12), size 300×95. Bind `st_start_comm` with
its message/style data: “If a child will be using this\nsystem, please set it up\nfor them.”
It has no own animation clips. Do not invent a list or form on this page.

The PIN warning says that forgetting both PIN and secret answer requires a
master key to remove restrictions. The following message says to choose a
four-digit PIN. These dialog scene records contain **no layout names**;
`dlg_2b_ok` alone does not establish a two-button layout. Common-dialog resource
selection requires its own executable trace before a painter can claim native
composition.

At `0x210a1c–0x210a80`, the executable tests bit zero in loaded parental data and
chooses `pare_change` or `pare_new_set`. `pare_change` uses `PareTop_D_01`,
`par_top_comm2`, Change and Forgot PIN. Change enters PIN authentication, whose
successful table target is `pare_menu`. The setup chain requires PIN entry and
confirmation, secret question/answer and confirmation before its final
`pr_dlg_secr_ok2` table edge to `pare_menu`. Email registration is a separate
branch; it must not be invented as mandatory from these records alone.

The routine at `0x232cdc` mutates routes for the alternate startup flow: at
`0x232ebc–0x232ee0` explanation Back becomes `dlg_start_pare0` and its label
becomes `base_2b_finish`. Its only direct call is `0x2395ec`, on the alternate
flag branch of `0x2395a8–0x2395ec`, alongside startup scenes. Do not use those
alternate Back/Finish targets for ordinary Settings navigation.

## Restrictions composition and selection

`pare_menu` / 483 uses `PareTop_D_00`. Its first native action,
`par_change`, opens `pare_fact_top` / 466. Other actions change PIN, register
email and clear settings. These are configured-state operations, not proof that
the portfolio has a PIN or saved restrictions.

`pare_fact_top` requires **`PareFact_D_00` below and `PareFact_U_00` above**,
with `CommonBG_U_00`, `IconParental`, `parental_title_u` and
`par_chan_co_u1_n` (“Touch the setting you want to adjust.”).
The upper layout contains locked/unlocked icons, legend text panes
`TextBox_01/02`, and instruction pane `TextBox_00`. Exact legend message binding
still needs a controller trace; its Japanese sample text is not a runtime label.

The lower layout has seven `N_B_PareSB_00..06` mounts at x−17, y196,137,78,19,
−40,−99,−158 under the source animated parents. These are a viewport pool,
not seven total categories. `B_PareSB` supplies 278×58 hit bounds, a native
label and locked/unlocked indicators. Preserve the 59-pixel row pitch, viewport
clipping, scrollbar and `SceneIn00/01`, `ScrollDw/Up` clips. Raw child positions
are local coordinates, not final hit rectangles.

At `0x220054–0x2202fc`, the executable chooses a label array and item count,
uses mapper `0x19625c`, and builds the list with the source mounts. At
`0x220214–0x220228`, it reads the remembered selected index and scroll offset
and initializes visible selection from their difference. At `0x221340–0x2214ac`,
activation saves scroll and absolute selection, remaps the row and writes the
selected scene target. A generic vertically stacked menu loses this behavior.

The default static arrays are labels at `0x26b3b0`, scene targets at
`0x26a71c` (20-byte entries). Before runtime filtering they are:

| Order | Label | Detail scene |
| --- | --- | --- |
| 1 | `par_rating` | `pare_fact_rating` |
| 2 | `par_browser` | `pare_fact_brows` |
| 3 | `par_shop` | `pare_fact_shop` |
| 4 | `par_3d` | `pare_fact_ulcd` |
| 5 | `par_miiverse` | `pare_fact_olive` |
| 6 | `par_photo` | `pare_fact_data` |
| 7 | `par_internet` | `pare_fact_user` |
| 8 | `par_ce` | `pare_fact_commu` |
| 9 | `par_friend` | `pare_fact_friend` |
| 10 | `par_dlplay` | `pare_fact_down` |
| 11 | `par_movie` | `pare_fact_movie` |
| 12 | `par_coppacs` | `pare_fact_coppa` |

There are separate nine- and eight-row arrays. The mode at global state
`0x297bf0 + 0xc` selects them; `0x297608 == 2` and `0x297600 == 5` further
change row mapping, and byte `0x2978ce` changes the final count. This audit does
not establish every global's region/model semantics. The English COPPA label
is empty. Do not hardcode all twelve rows or treat the current eleven-row
portfolio order as the executable order. The report retains every variant.

Most binary detail pages use `PareSelect_D_00` with `T_OnOff` mounts at
(0,22) and (0,−40), labels `par_ng` / `par_ok` (Restrict / Do not restrict),
and Back/OK returning to `pare_fact_top`. Native selection and locks depend on
restriction values; they cannot be inferred from the layout's sample state.
Miiverse uses **`PareMiive_D_00` and three choices**, at y34,−11,−56, labelled
`par_mvs_ng_p_r`, `par_mvs_ng_p`, `par_mvs_ok`. Age ratings use
**`PareRtng_D_00` / `PareRtng_U_00`** and region-specific rating data.
Some categories add confirmation/information dialogs. The full report carries
each scene's exact body, upper body, footer labels and targets.

Restrictions Back points to `pare_menu`; Done points to `pr_dlg_fact_set`
(`par_dlg_chang1_n`). A separate `pr_dlg_fact_end` branch asks about leaving
changes. These are not interchangeable with a read-only Back button.

## Portfolio route proposal and missing data

Use `parental` → `parental-explain` for Set. Explanation has Back/Next, with
left/right footer selection and Back/B restoring the intro's Set selection.
Only after shared-dialog composition is proven should Next open
`parental-pin-notice`. Stop before PIN entry; any notice dismissal that returns
to the explanation is an explicit portfolio navigation adaptation, not the
source OK transition. Do not substitute the restrictions list for this step.
Keep old restrictions code unreachable until its native entry and state are
supported.

Full native continuation would require configured status, PIN verification
and confirmation, secret-question type/free text and answer, email state,
restriction values including three-way Miiverse and regional ratings,
working-versus-saved edits, and remembered list selection/scroll. The portfolio
supplies none of those device records. This change must not fabricate credentials,
write parental settings or start a keyboard/network operation.

Verification here is static source inspection and successful report generation.
Native browser verification of any subsequently implemented screen remains a
separate requirement; this audit is not a visual-fidelity sign-off.
