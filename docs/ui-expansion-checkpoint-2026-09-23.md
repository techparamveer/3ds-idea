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
