# Remaining helper runtime audit

`stock-helper-views.ts` now supplies explicit read-only content for the helper
views below. `stock-apps.ts` retains dispatch and shared-data ownership. No shared
layout or host file changes are included in this batch.

| Helper | Previous gap | Runtime result |
| --- | --- | --- |
| Nintendo Network ID Settings | Sign-in/create choices opened empty details; new native initial screen has no matching action targets | Back-only main, explicit unavailable account-services message, no hidden actions |
| System Update | Information opened an empty detail; native initial screen is Back-only | Back-only main, explicitly no update checked/installed |
| System Transfer | Both source choices opened empty details | Existing source choices have read-only information; no connected-console data is invented |
| amiibo Settings | Registration/delete/reset opened empty details | Explicit information for each choice; no NFC scan, registration, deletion or reset |
| Circle Pad Pro | Information opened an empty detail | Read-only accessory notice; no readiness claim or calibration |
| Instruction Manual | All document pages were empty | Bounded local portfolio guide for Contents, Controls and Support Information |
| Mii / photo / sound selectors | Empty collections produced no message; saved items opened empty details | Explicit empty state, or existing name/title/ID projection with no generated image/audio/Mii or selection result |

NNID and updater `main` have `rows: []`, no right-footer action, nonempty `text`
and `data.readOnly: true`. This matches the presentation worker's native initial
helper contract. Their old sign-in/create/information actions are now inert.
Transfer retains IDs `3ds` and `dsi`, with source English labels “Transfer from a
Nintendo 3DS System” / “Transfer from a Nintendo DSi System”. Other helper IDs
and screen names remain unchanged. One-step helper Back restores the main row.
All helper main/detail/document views expose `data.readOnly: true`.

The selectors still read only the existing shared `miis`, `photos` and `sounds`
collections. A detail exposes `data.entry` containing only supplied string
`id`, `name` and `title` fields, or null if the saved item is unavailable. It
never dereferences media URLs, returns a selected-item result or changes data.
The manual body is authored portfolio help, not extracted Nintendo manual text.

Remaining gaps:

- Application helper main Back still returns HOME. Returning to the precise
  Settings parent requires host support; a launch effect would trigger switching
  behavior, so this batch intentionally preserves the existing route.
- Native NNID account content is remote and absent. The native renderer provides
  source chrome around an explicit local read-only notice, not account setup.
- System Update has no checked version or update status. A native source message
  asking to connect/update must not be treated as an implemented operation.
- Native transfer, Circle Pad Pro, manual and selector interiors are not supplied
  by this runtime change. Their text fixes do not constitute native visual QA.
- amiibo's source FLYT/FLAN/FLIM assets remain unsupported by the current native
  converter; a readable runtime view does not resolve that rendering dependency.
- Saved-item media/Mii rendering and the original application manual bodies are
  still unavailable. No replacements were fabricated.

Validation covers every initial and existing one-step choice, nonempty content,
row restoration, inert unavailable/confirmation/text actions, retained main Back
behavior, empty/supplied/missing saved items and unchanged shared data. The
focused runtime/lifecycle/layout suites and strict standalone runtime type check
pass. Native helper renders and browser verification remain integration-owned.
