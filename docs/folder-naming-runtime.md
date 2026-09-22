# Native default folder naming

Fresh folders now receive `１ (New Folder)`, then `２ (New Folder)`, and so on.
The leading digits are **fullwidth Unicode** (U+FF10…U+FF19), as stored by the
native formatter. The sequence is independent of folder count, slot position,
renamed labels and deletion. It advances through 99 and wraps to 1. This number
is a default-name sequence, not a globally unique folder ID.

## Evidence

The already converted EUR English HOME message pack supplies
`lau_2b_folder_name` (index 424), `%d (New Folder)`, and separately
`lau_2b_folder_noname` (index 425), `(No name)`. These came from the existing
HOME conversion; no additional titles or assets were converted.

Static inspection of the private HOME code for title `0004003000009802`,
version 24576, product `CTR-N-HMMP`, provides the following addresses. Code
SHA-256: `243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
No native binary or disassembly is added to git or public delivery.

| Address | Observed behavior |
| --- | --- |
| `0x1472e4`–`0x1472f8` | Initializer sets the byte at state offset `0xd85` to 1. |
| `0x1b8e70`–`0x1b8e74` | State-copy path carries that counter byte. |
| `0x1c88f0`–`0x1c8920` | Returns the old counter, increments it, and stores 1 when the new value reaches 100. It does not inspect folder count or names. |
| `0x1bfeb8`–`0x1bfedc` | Default creation calls that helper, resolves `lau_2b_folder_name`, and passes the returned number to the formatter. |
| `0x1bfee0`–`0x1bff08` | Converts the first digit and optional second digit from ASCII to fullwidth UTF-16 by subtracting `0x120` before a 16-bit store. |
| `0x1bff0c`–`0x1bff1c` | Stores the formatted name through the normal folder-name setter. |
| `0x202778`–`0x202800` | Name setter copies the label and uses its first UTF-16 unit for the undecorated folder icon. |

The shared screenshot
`reference/screenshots/_22.09.26_21.31.33.514.png` was inspected directly. Its
lower screen shows the first default label and a folder icon with numeral 1.
Static code supports the sequence and wrap behavior beyond that single visual
observation; repeated creation, rename/delete sequences and the 99→1 wrap have
not been captured natively in this task.

Private excerpts and input hashes are retained under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/runtime/folder-research/`.

## State and persistence contract

`MenuState.nextFolderNumber` starts at 1. Successful creation stores the default
name and advances this counter; opening, renaming, moving, swapping, deleting,
failed creation and application launch do not advance it. Existing folder labels
and child layouts continue to move together. Creation refuses to overlap an
occupied software slot, including portfolio entries.

Preferences use payload **version 4** (the naming counter was introduced in version 3), requiring an integer
`nextFolderNumber` in 1…99. JSON and IndexedDB round trips preserve it. The
IndexedDB database version and its preference-record envelope are unchanged.
Malformed counters reject the saved layout as a whole and keep the caller's
current state.

Legacy payloads (unversioned, 1 or 2) without the counter start a **new sequence
at 1**. This is an explicit browser migration policy, not recovered native
history: older browser saves never recorded that history. No estimate is made
from folder count, slots or label digits. Custom labels and deliberate empty
labels remain unchanged, so duplicate-looking default names are possible after
migration or sequence wrap. Existing empty names are not retroactively replaced
with either a numbered default or the separate `(No name)` display message.

The portfolio's authored Reset Layout action clears folders and restores
portfolio placement while retaining this naming history. That action is not a
claim about native HOME management-data reset behavior. Import/repair behavior
for corrupt native counters or other firmware versions is outside this change.

No renderer is changed here. Presentation receives the exact stored fullwidth
label and can derive the icon's first character from it; browser glyph rendering
and the new-folder comparison are delegated to the coordinating task. This
change also leaves the existing empty-slot activation route unchanged; it does
not infer a new A-button rule from the earlier replay.

## Verification

`tests/folder-naming.test.mjs` covers fresh footer creation, two-digit formatting,
99→1 wrap, rename/delete independence, moving folders with children, rejected
creation, portfolio preservation, settings/IndexedDB round trips, malformed
counters and preservation of old custom/empty labels. Those are runtime contract
tests, not native visual validation.

The focused runtime suite passed **83 tests** including the nine naming tests.
`npm run typecheck`, `npm run build` and the diff whitespace check also passed.
Logs are in the private `runtime/folder-research/` artifact directory. Browser
verification remains with the coordinating task; this task did not drive a
browser or Azahar.
