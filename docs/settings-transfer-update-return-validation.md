# Settings Transfer and Update return verification

At `16b0cef`, both helper return routes already preserve the original Settings
instance. This pass adds regression coverage and fresh source renders; it does
not change runtime behavior or claim native cross-title lifecycle equivalence.

## Existing behavior verified

`startSettingsHelper` suspends the current Settings parent and creates its helper
with that parent as caller. Main-screen Back emits the module's `home` effect;
`returnFromSettingsHelper` removes that helper and resumes the same parent. The
parent's entire state survives, including the Other Settings page and selection:

| Helper | Restored Settings state |
| --- | --- |
| System Transfer | Other Settings page 3, System Transfer (row 2) |
| System Update | Other Settings page 4, System Update (row 1) |

HOME suspends/resumes the helper without returning to Settings. Transfer's two
read-only detail screens return to Transfer's main screen first, then Settings.
The restored Settings selection opens the same helper again with A. No network,
update, transfer, account, media or storage operation is added or emitted by
these tested routes.

The old module test title claiming “Settings-launched … HOME behavior” was
misleading. Its assertion correctly checks that a standalone pure module emits
`home`; the host interprets that effect using the caller relation. It is now
named “Helper module main Back delegates navigation to its host”. The full
route tests establish the actual parent return.

## Source evidence and limits

The original Settings scene-table records already inspected in
[Settings source validation](settings-main-source-validation.md) put `trans` as
the third item in `basic_top3` and `update` as the second in `basic_top4`. Record
hashes are respectively
`8ab7716c598d679d279e6301f54eb23674ff4347a39c5fdeee3c39e8556cdda6` and
`8c2abb57560eb1a9682bca32abfd5d3ff665e6cf76731707789fa351e212eeff`.
Their raw fields are recorded under the firmware artifact root at
`presentation/settings-source-audit/subpage-scenes.json`.

These source records do **not** establish the website's direct helper-launch
or retained-parent lifecycle: Transfer's source target is `dlg_no_trans`, while
Update names `@update`. The local direct helper route remains a documented
portfolio navigation adapter. Native branch predicates, cross-title return
arguments and native timing have not been established by these tests.

Both published helpers independently supply a lower-left 120 × 32 Back control:

- Updater `base.json / Base_D_00 / Bounding_00`: translation (−160,−104),
  size (120,32), origin 3, on the 320 × 240 LCD → (0,208,120,32).
- Transfer `returnBtn_D_00 / B_returnBtn_00`: size (120,32), origin 3. Its
  parent `position_D_00` and settled `inOut_00` mount place the drawn footer at
  the same (0,208,120,32), as consumed by the existing helper painter.

The runtime and presentation target APIs match that rectangle. The source
resource renders visibly place Back at the lower left; the rest of the footer
has no action. The current authored availability bodies and Updater Legacy
background are unchanged by this return-focused verification. They are not
native fidelity acceptance.

## Verification

New tests in `tests/settings-helper-return.test.mjs` cover both helper titles
with touch and physical Back after HOME/resume; exclude x=120 and y=207 from
the footer; accept the inside edge x=119,y=239; compare the whole restored parent
state; ensure the child is removed; reopen with A and return by the other input;
and exercise both Transfer choices through lower-LCD touch. Shared data remains
unchanged and no storage/capability/music/invoke effect appears.

- 36 focused helper/layout/host tests pass, including six new return cases.
- The renamed module-level delegation test passes separately.
- TypeScript checking passes.
- `verify-stock-helpers.mjs` renders all 11 helper pairs with immutable source
  resources, bounded targets and no diagnostics. The Transfer and Updater lower
  images were visually inspected at 320 × 240.

Artifacts:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/settings-transfer-update-return/`
contains `tests.log`, `typecheck.log` and `render/verification.json` plus PNGs.
The isolated worktree uses the integration checkout's existing hydrated public
assets as read-only render inputs. Application source and delivery are unchanged,
so no production rebuild is needed for this test/documentation change.

The coordinator owns live browser checks. This worker did not operate the browser
or emulator and did not capture matched native LCD evidence. Strict 1:1 remains
open.
