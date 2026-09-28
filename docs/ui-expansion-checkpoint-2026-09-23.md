# UI expansion checkpoint — 23 September 2026

This checkpoint adds visible stock screens within the portfolio UI-only scope.
It is not final 1:1 firmware acceptance.

Integrated screens:

- Settings: Internet, Parental introduction, Data Management, Nintendo 3DS
  data, four Other Settings pages, Profile, Connection Settings, Date & Time,
  restrictions and read-only detail surfaces. Sound and date/birthday/time
  details use source controls with editing omitted.
- Friend List: own-card profile with existing saved values and a source Back
  footer. Game Notes: selected paper and source toolbar, read-only saved strokes.
- Browser: Settings, bookmarks, page information, read-only entry panels and
  detail notices. Miiverse: local destination panels and its original toolbar.
- eShop: native welcome balloon, bag and OK. Nintendo Zone: original English
  offline/Info bitmaps, source upper banner and local Back navigation.
- NNID and System Update: source entry chrome with explicit local read-only
  notices and Back only. No account, network or update operation is performed.

The coordinator inspected actual localhost console renders of Settings main and
Data Management, eShop, Zone offline and Info, Friend profile, selected Notes and
Browser Settings. Early Fast Refresh retained old imperative scene code; a full
reload showed the integrated menus. Production preview is used for the combined
checkpoint. Accessible controls must be focused and activated with Enter; pointer
clicking their visually hidden DOM locations can instead hit the canvas. The
ordinary software-switch confirmation still requires A to close suspended software.

Source-pixel paired renders and test/build logs are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/`:
`expanded-stock-screens`, `service-helper-ui`, `expanded-helper-full-tests.log`,
`expanded-helper-build.log`, and `helper-integration-tests.log`.
The final combined run passed 1,097 tests with 17 skips and no failures.
Type checking and the final production build also passed.

Remaining differences include matched native reference validation, several
adapted information panels and timings, native transfer/manual/selector/Circle
Pad screens, unsupported amiibo layout conversion, exact EU language choice
layout, helper return to the Settings parent, Zone perspective/viewport placement,
and absent remote account/service content. Actual favourite songs are still
user-supplied. No software keyboard or excluded apps were restored.


## 2026-09-24 native helper integration

Integrated original Manual chrome around the supplied Portfolio Guide, and
native Mii/photo/sound selector resources with Back-only touch regions and
visibly disabled source Confirm controls. Internal helpers retain their existing
entrypoint policy; no extra HOME tiles were invented. Read-only selector text
and neutral bodies retain the explicit differences in `native-selector-screens.md`.

Combined validation: 1,106 tests pass, 17 skip, zero fail; type checking and
production build pass. Eleven helper LCD pairs and nine selector pairs render
without diagnostics. Manual main/Controls and photo/sound contact sheets were
visually inspected. Artifacts and logs are under the SSD reference directory:
`manual-integration`, `selectors-integration`, `native-expansion-tests.log`, and
`native-expansion-build.log`. This is implementation verification, not evidence
of strict 1:1 reference matching.

Remaining confirmed issues: generic stock fallback appears while native assets
load and after failed loads; app input is not yet tied to screen readiness.
The runtime task is implementing that correction from integration d93b269.
Settings currently selects SceneIn_Legacy, whose dark material is source-authored,
but selection of that variant for this entry state is not yet source-verified.
Presentation is tracing the choice. Amiibo portal part composition/material
support remains incomplete. Full visual acceptance and PR delivery remain open.
