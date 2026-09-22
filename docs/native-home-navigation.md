# Native HOME viewport placement

HOME code for EUR title 0004003000009802/v24576 keeps the current left column
until directional selection crosses a visible edge. Six RIGHT presses from the
first slot in either one- or two-row mode produce horizontal centers
76, 160, 244, 244, 244, 244, 244. Reversing direction then moves through the
visible columns before scrolling left. Creating a folder keeps that viewport.
The previous browser reset its viewport before every directional event and
centered the selection; that discarded native navigation history.

The shared reducer now retains the viewport, and both rendering and touch use
source top-level grid tables. Legacy saved `columns` values remain unchanged as
density tokens, while native visible-column counts are 3,3,5,7,9,10. Horizontal
pitch is 84,84,54,40,32,28; icon sizes are 72,72,50,36,28,24. A partial preceding
column is drawn when it intersects the display.

Touch density changes search the valid new left columns in ascending order and
choose the one whose selected icon's X is nearest its previous X. Equal squared
distances retain the smaller left column; arithmetic uses float32 at the native
comparison steps. In the six-RIGHT example, changing one row to two retains
x244 and changes left slot4 to left slot2 (left column1).

The private source report and executable extraction of the literal tables are
`runtime/reference/navigation-scroll/report.md`, `analyse.py`, `evidence.json`
and `tables.json` under the configured firmware artifacts directory. Native
routines: RIGHT0x1d8468, LEFT0x1d85f8, density placement0x2ebb00 and maximum-left
calculation0x217c9c. No private firmware code is included in the repository.

This bounded change covers top-level settled placement and the common input
path. Higher-density visual checkpoints, interpolated scroll timing, toolbar
focus, folder-inside row counts/entry/return and gesture timing still require
separate verification. Existing folder interior geometry is retained for that
follow-up; this document does not accept it as native. Standalone legacy menu
states without the System runtime have no viewport-history store.
