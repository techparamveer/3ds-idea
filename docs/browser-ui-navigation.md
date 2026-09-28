# Read-only Browser interiors

`stock-browser-navigation.ts` supplies the Browser menu rows, bounded data
projection, headings, explanatory text and nested Back state used by
`stock-apps.ts`. Shared presentation owns the source dialogs and hit rectangles.

Browser `settings` rows match the English source `spider` message bank delivered
in assets0580618. Their IDs and labels are:

| ID | Source label |
| --- | --- |
| auto-wrap | Text Wrap |
| search-engine | Search Engine |
| delete-cookies | Delete Cookies |
| clear-history | Delete History |
| network | Network Information |
| proxy | Proxy Settings |
| version | Version Info |
| reset | Clear All Save Data |

The eight rows use the existing four-row paging convention. `data.page` is
`floor(selection / 4)` and `data.pageCount` is 2. Up/Down moves through the bounded
list. A choice opens `screen: detail` with `data.field` and `data.parent: settings`.
Back restores the selected settings row, including the second page. These are
read-only information views: destructive-sounding source labels do not cause
cookie deletion, history clearing, reset, preference writes or confirmation flows.

Main IDs remain search/bookmarks/add-bookmark/settings/page-info/address.
Each interior has a specific heading and nonempty text when it has no rows.
Existing bookmarks/history supply row labels and URL values. Opening one yields
`screen: page`, the original list in `data.parent`, and a projected `data.entry`
containing only its saved title/URL. Back restores that list and row. It neither
loads the address nor changes the retained `data.url` or saved collections.
Search/address entry and adding bookmarks remain unavailable; no keyboard,
network, URL navigation, account or backend operation is introduced.

Missing pages, settings, version and connection information remain explicitly
absent. Saved URLs are shown as plain text. The native painter can bind supplied
source explanations instead of the portfolio fallback descriptions without
changing this runtime contract.

Focused tests cover every settings leaf and page, restored selection/parents,
empty interiors, supplied bookmark/history context, unchanged saved URL/data and
inert text/submission events. Strict runtime type checking passes. Native dialog
rendering and browser verification remain the presentation/integration checks.
