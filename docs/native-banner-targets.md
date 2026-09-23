# Native primary banner targets

For settled selection under the default theme, a **vacant HOME slot requests
type 7 (`BannerDef`)**, while an ordinary available app normally requests type 1.
The same mapping applies to the selected child of an opened folder. Type 13
clears the primary; it is used for a present but unavailable entry and at normal
folder-close start. It must not replace the settled vacant-slot target.

This corrects the preliminary interpretation that record flag bit 1 meant slot
occupancy. Bit 0 distinguishes an existing entry; bit 1 distinguishes its
availability on the investigated selection path. The exact predicates below
are authoritative. Source addresses use virtual base `0x100000` in HOME
10.7.0-32E `code.bin`, SHA-256
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Private scripts and disassembly are in
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/banner-targets/`.
Checked numeric output is [native-banner-targets.json](evidence/native-banner-targets.json).

## Caller mapping

`0x1e0f44` refreshes the selected banner; idle setup calls it at `0x29a4dc`.
For database `D`, the current slot map is the pointer at `D+0x44508`, containing
signed 16-bit record indices. Records have stride `0x230` (560), with their base
at `D+0x398f8`. Helpers `0x1e89f8` and `0x1e6b44` read bits 0 and 1 of the
record's 16-bit flags at `+0x36` through that map.

| Selected record / caller condition | Caller category | Native primary target |
| --- | --- | --- |
| Bit 0 clear, title words both `0xffffffff`, initialization gate set | 2 at `0x1e18e0..18f0` | 7 under the default theme |
| Same vacancy before the initialization gate is set | No request; return at `0x1e1894` | Caller leaves existing manager request untouched |
| Bit 0 set, bit 1 clear, ordinary selection path | 3 at `0x1e1338..1348` | 13, canonical empty key, eventual null primary |
| Both bits set, ordinary available non-folder app | 0 at `0x1e1844..1854` | Normally 1; media/title-class exceptions below |
| Normal folder-close start | 3 at `0x1de544..54c` | 13 before the restored root selection is requested |

The vacant branch at `0x1e1884..18f0` tests initialization object `+0xe3` via
`0x21ba4c`, then checks the two title words. A nonempty key on this branch also
returns without a request. The initialization constructor clears `+0xe3` at
`0x1c39d8`; the uncancelled initialization sequence sets it at `0x1c32c0`, using
the value 1 established at `0x1c31b8`. Non-cartridge record cleanup
`0x201b08..1c98` clears both record bits and writes the empty key, confirming
that this differs from the bit-0-set / bit-1-clear path.

The jump table starts at **`0x1d7278`**: category 0 targets `0x1d72a4`, category 2
targets `0x1d74d8`, and category 3 targets `0x1d7574`. The old private lifecycle
report incorrectly associated close-start category 3 with type 7/0 because it
indexed that table one entry early; that report is corrected. Category 3 always
supplies type 13 and key `(low=-1, high=-1, medium=0)` at `0x1d7574..7594`.

Category 2 selects type 7 at `0x1d74fc..7514`. The separate theme predicate
(`0x217a90()` result's `+0x14` child has `+0x1f1 != 0` and `+4 == 3`) instead
requests type 0 and performs additional theme/pane work at `0x1d7518..7570`.
Type 0 is therefore not a general blank target or a substitute for type 13.

For ordinary category 0, gift, folder and special-banner options are tested
first. With those absent, `0x1d7400..7494` selects:

| Key medium / title-high condition | Native type |
| --- | --- |
| Medium 2, `titleHigh >>> 14 != 0x12` | 2 |
| Medium 2, `titleHigh >>> 14 == 0x12` | 3 |
| Medium 0, `titleHigh >>> 14 == 0x12` | 4 |
| Otherwise | 1 |

The dispatcher prefix copies the key into upper-scene `+0x330` at
`0x1d71f8..7200`; the later `+0x334/+0x338` reads use that same high word/medium.
Suspended-app, cartridge-status, toolbar, gift and special-icon paths are outside
the ordinary-app mapping. A missing app render asset does not turn its native
target into the default banner or an empty slot.

## Opened folders and identity

Folder opening calls `0x217ec4(context, folderID)` at `0x2a3260`, after committing
the folder ID at `0x2a3224`, and restores child selection at `0x2a327c`.
`0x217ec4..7ee8` writes the active context and sets:

```text
D.currentSlotMap = D + 0x39bd0 + signedFolderID * 0x2d2
```

Open completion returns to idle at `0x29bb54..5c` (with a direct refresh variant
at `0x29bb38`). The same predicates and key getter `0x1fec08` then resolve the
child through the new map. Root context -1 gives offset `0x398fe`; folder 2 gives
`0x3a174`. Moving the same app between these contexts preserves its title key;
slot, folder name and selection index are not banner identity. Vacant/default
and explicit-clear requests can share the empty key but have different types.

## Visibility and completion contract

A changed request goes through setter `0x1ed6ec`, pending consumption in manager
state 6 (`0x24c184..1a4`), and hide request `0x1f9068`. State 2 waits for actual
primary visibility `+0x3c` to clear (`0x24c128..144`), then state 1 handles the
load gate and releases the primary. Requested-hidden alone is insufficient.

Type 7 has a concrete object: `0x24ac3c..acb0` calls `0x1f9324(7)`, resets
manager `+0x58`, requests its visibility, installs it at primary `+0x50`, copies
the requested key and enters state 6. The type-7 resource branch at
`0x1f9388..9470` loads `BannerDef` / `BannerDef_anim00` (with a regional variant).
The host therefore needs successful default-banner resource readiness to
complete a faithful settled vacancy. Keeping a former folder visible, silently
leaving its request active, or marking a null render as loaded does not reproduce
this path.

Type 13 takes a different completion branch at `0x24af44..af7c`: primary becomes
null, current key becomes `(-1,-1,0)`, and state becomes 6. No blank model is
constructed. Types 6/13 bypass the ordinary wait counter and global block byte
at `0x249e9c..eac`; types 1/7 use the counter check at `0x249ec4..ed4` (five
increments, then a subsequent eligible call passes it). Previous-worker and
load-worker gates still apply (`0x249ef0..9f54`, `0x24a7d0..a81c`). This is not a
fixed delay or permission to skip the hide/detach handshake. Full asynchronous
loader scheduling is outside this contract.

## Verification limits

`execute-targets.py` executes original ARM in Unicorn 2.1.4 with synthetic
records. Assertions cover category dispatch, root/folder mapping, caller gates,
record cleanup, ordinary media variants, retained visibility, type-7 primary
installation, and type-13 completion. It stubs singleton lookups, suspended-app
status, icon cleanup, default resource construction and its virtual reset;
ordinary app metadata construction is an explicitly omitted gap. The dispatcher
prefix key copy is fixture setup. OS workers, asset loading and GPU rendering
are not executed. This is source and numeric evidence, not native UI or browser
equivalence. No application code, asset conversion, browser or Azahar changes
are included; documentation-only work does not require an application rebuild.
