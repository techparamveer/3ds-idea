# Read-only Settings navigation

The runtime now supplies nonempty Internet and Parental pages and native-labelled
Data, Other, Profile and Date & Time branches. `stock-settings-navigation.ts`
owns their pure menu tree, headings, page state, leaf text and return paths;
`stock-apps.ts` keeps dispatch and the existing NNID/Transfer/Update launch effects.
Shared presentation owns the matching native components and touch rectangles.

| Screen | Row IDs, in order |
| --- | --- |
| internet | connections, spotpass, ds-connections, internet-info |
| connections | connection-1, connection-2, connection-3, new-connection |
| parental | next, back |
| restrictions | rating, browser, shopping, 3d, sharing, interaction, friend-registration, download-play, streetpass-restriction, videos, miiverse |
| data | data-3ds, data-dsi, streetpass, blocked-users |
| data-3ds | software, extra-data, add-on-content, backup |
| profile | nickname, birthday, region, ds-profile |
| clock | date, time |

Other Settings uses `data.page` 0–3 and `data.pageCount` 4. The three choices per
page are exported as `settingsOtherPages`: Profile/Date & Time/Touch Screen;
Sound/Mic Test/3D Calibration; Outer Cameras/Circle Pad/System Transfer;
Language/System Update/Format System Memory. `settings-next` and
`settings-previous`, also mapped to Right/Left, clamp at either end. Up/Down
select within the page. Data Management directions follow the source pair of
upper tiles, then its two full-width choices. Existing main directions remain.

Labels were read from the extracted EU English `mset` bank in
`packs/settings/contents/0000-0000003d/message_EU.json`. Three-slot Other Settings
layout and corresponding original-model icon children are present in the source.
The ordered three-item grouping is a portfolio navigation adaptation; resource
names do not prove native firmware page/task order. Source-backed native
composition belongs to the presentation worker's Settings subpage change.

Parental Controls opens an informational preview. Next shows the categories;
no configured status, PIN, email address or saved restrictions are invented.
In particular, source `PareTop_D_01` uses an already-configured change question
and must not be represented as evidence for an unconfigured initial screen.
The presentation contract uses source introductory MessageOnly/Btn2Text instead.

A leaf has `screen: detail`, `data.field`, `data.parent`, optional Other page,
a specific heading and nonempty text. Supplied profile/sound/language/date/time
values are displayed unchanged; absent values remain explicitly absent.
Hardware calibration and software/network screens are informational previews.
No settings edits, device permission, account, network, format/reset, transfer or
update operation executes. The existing launch actions only open their read-only
title UIs. Text/applet/device-result events still cannot mutate shared settings.
Back restores the immediate parent, page and selected entry; main Back goes HOME.

Validation covers the complete reachable menu graph, every Other page and edge,
parent/selection restoration, populated and absent preferences, readable leaves,
Parental preview without setup state and unchanged shared data. Focused runtime,
input, layout and lifecycle suites pass with strict standalone runtime type
checking. Combined source-layout browser checks remain the coordinator's step.
