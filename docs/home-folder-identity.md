# Live HOME folder identity

`home-folder-identity.ts` supplies authored, session-local instance keys for the
banner service. These are application identities, not recovered Nintendo IDs.
`System.homeFolderIdentities` stores a `HomeFolderIdentities` record with readonly
`bySlot` and `nextAllocation` fields. `getHomeFolderIdentity(state, slot)` returns
an opaque `HomeFolderIdentity` for a live root folder, or `undefined`. Callers
must not parse keys or use their numeric spelling as a slot or folder name.

Creation allocates deterministically from the record's counter; no randomness,
time or global state is involved. Rename, opening, selection and empty/nonempty
transitions retain the key. Moves carry it with the label, contents and view
history; folder swaps exchange both keys. Deletion removes the slot mapping,
and recreating the same name in the same slot allocates a different key.
Rejected operations do not consume allocations. Layout reset clears the map
but preserves the counter, so retired identities stay retired in that session.
The independent saved 1…99 default-name counter does not determine identity.

Preferences remain schema 4 and contain no identity map or allocation counter.
Restore first validates the saved layout and then calls
`createHomeFolderIdentities(folders)`; unknown saved identity fields are ignored.
Corrupt layouts retain the current state. New Systems and successful restores
start fresh identity records, so keys may repeat across sessions. **Pair every
key/cache entry with the banner service generation, and create a new generation
after System creation or successful restore.** Restore also resets the shared
HOME clock. Changing a folder's empty/nonempty native type still creates a new
banner activation as described in [the service contract](home-banner-service.md).

For isolated menu consumers, optional `MenuState.homeFolderIdentities` owns the
same record. `getHomeFolderIdentities` can derive missing keys for older states
without mutating them; each supported folder mutation stores the reconciled
record before changing membership. Direct external edits to folder maps cannot
express deletion/recreation history; callers should use the reducers. Legacy
System fixtures receive the same reconciliation. Settings restore requires a
complete System and leaves isolated menu state unchanged. Unsupported isolated
placement/reset actions retain their existing no-op behavior.

`tests/home-folder-identity.test.mjs` checks deterministic allocation, immutable
reducers, rename/name wrapping, moves/swaps with equal labels, app displacement,
delete/recreate, empty/nonempty transitions, rejection, reset retirement,
schema 4/legacy restore, forged saved records and isolated/legacy callers.
No presentation, navigation geometry or scene wiring changes are included.
