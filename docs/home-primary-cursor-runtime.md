# Retained primary HOME cursor footer

2026-09-23. `home-primary-cursor.ts` implements the bounded primary request,
visibility and position fields of the common lower footer. System, navigation,
Loop, Scale/effects, painting and scene lifecycle remain separate owners.

## API

`createHomePrimaryCursor(initial)` requires every initial field explicitly:
`request: 0 | 1 | 2`, HOME's `shown` flag, actual `layoutVisible`, and an LCD
`center: { x, y }`. The result and copied center are frozen. These are supplied
mature values, not a claimed native initialization sequence.

`setHomePrimaryCursorRequest(state, request)` changes only the request. It
neither shows/hides nor positions the cursor. Requests remain retained after
the footer; there is no implicit reset or acknowledgment value.

`updateHomePrimaryCursorFooter(state, input)` accepts:

- `overlayActive` and `secondaryOverlayActive`: presence of S+3fd0 and S+3fd4
  at this footer boundary, not a prediction of their full host lifecycle.
- `mode`: the current source mode, after lower completion and deferred replay.
- `position`: either `{ kind: 'toolbar', focus }` or
  `{ kind: 'grid', selectedCenter }`. The grid center is already current native
  geometry in LCD coordinates, including the caller's scroll subtraction.

The frozen result contains `state`, `positionRoute` and `visibilityWrite`.
The route is `'grid'`, `'toolbar'`, `'mode3-effects'`, or null. It identifies
the executed helper branch even when the resulting primary center is
numerically unchanged. `visibilityWrite` is true/false for an actual show/hide
call, or null for none; it does not merely compare old and new actual flags.

`sampleHomePrimaryCursor(state)` returns the same immutable state. There are no
timestamps, accumulated counts, animation phases or hidden-time catch-up here.

## Source behavior and composition

Either overlay pointer or mode185/186 skips the whole footer and preserves all
retained fields. Otherwise:

| Request | Visibility branch | Position branch |
| --- | --- | --- |
| 0 | Show only if HOME's shown flag is false | Invoke positioning |
| 1 | Show only if HOME's shown flag is false | None |
| 2 | Hide only if HOME's shown flag is true | None |

Shown and actual visibility are independent. For example, request0 with
shown=true/actual=false positions the cursor while leaving actual visibility
false. Request2 with shown=false/actual=true does not hide it. These supplied
mismatches follow the actual source conditions rather than being normalized.

Positioning checks toolbar focus first, including in mode3, and uses the
verified named-pane center through `getHomeToolbarCursorAnchor`. Ordinary grid
positioning adopts the supplied selected center. Grid mode3 retains the
primary root and returns `'mode3-effects'`; the host may then run the separately
retained effects' slot-following update. A null route must not trigger an
effect follow. No position branch seeks or advances Loop or Scale.

The host must apply this footer **after** completion and pending replay. Idle
entry can request0 and resolve banner slot3, then replay selects slot4 and
re-enters mode3. The footer sees final mode3 and retains the primary root. An
overlay can leave request0 pending with actual visibility false. The later2D
owner uses actual visibility together with its independent eligibility and
controller-status gates. Selected-slot viewport culling is not one of these
native visibility rules.

No geometry table, rounding, interpolation or screen-bound clipping is added.
Finite centers outside the LCD remain valid inputs. The host owns initialization,
context changes, other visibility helpers, the footer's selection-manager work,
and any lifecycle policy beyond this bounded branch.

## Evidence and verification

This follows `docs/native-primary-cursor-contract.md`,
`scripts/firmware/PRIMARY_CURSOR_BOUNDARY_EVIDENCE.md` and the prior toolbar
cursor audit. EUR HOME executable SHA-256 is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

[The committed numeric fixture](../tests/fixtures/home-primary-cursor.json)
copies four original entry-through-completion sequences, eight mature
completion cases, the earlier24 request/visibility cases and eight toolbar
anchors. Source current grid coordinates and scroll are supplied directly;
the tests do not generate their expected positions using browser interpolation.
The host traces distinguish retained roots from equal-value position writes.

Pinned primary fixture:
`c1d11e146e3fd3413acce21114474d7e6b18f5e8592171c8cd8c7f5d7b6ac62c`.
Pinned primary result:
`d46f07f0b5a0ed2bcf5317d004a2f17da554bf46876b5c463fd46b1ae262a45a`.
The prior toolbar result is
`05b378c0534019c8ea8d22a966d23ea3bdfd1ac265d8b70d07fc21308f6eaa86`.
All20 primary and16 toolbar excerpt hashes were verified.

An additional private check directly executes original footer
`0x2b8490..0x2b856c` with supplied mature registers/flags and the actual
position/visibility helpers. Its84 cases cover all request0/1/2 and shown/actual
flag combinations under ordinary grid, grid mode3, toolbar mode3, either
overlay and modes185/186. It records actual helper/visibility calls and verifies
Loop and Scale are unchanged. This is a footer check, not a full overlay or
visibility lifecycle.

Private files are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-primary-footer/`:

- `check.py`: `1e33ca843116a77485c70b45520305d37131d64bb02102e8f644f4fcd8aa05ae`.
- `checked.json`: `8cee2d4e013d808f1dee0c8e5fcda544548a447551199333f83a6f2848f626c8`.
- `export-fixture.py` pins the source results and its own hash while copying
  numeric observations. Tests need neither firmware nor Unicorn.

The new8 test groups and existing retained-effect/Loop tests pass30 tests,
0 failures,0 skips. Type checking passed. Additional assertions cover immutable
initialization, request-only mutation, skipped geometry reads, equal-coordinate
branch metadata, explicit flag mismatches and no viewport culling. A bounded
composition test advances the separate existing Loop only after the footer,
matching the original native host snapshots; this module never owns that clock.

No System, scene, navigation, painter, existing controller or public asset file
is changed. Browser/Azahar acceptance and live composition remain the integration
task's responsibility.
