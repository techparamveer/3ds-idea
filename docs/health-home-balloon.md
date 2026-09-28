# Health selected HOME balloon

The genuine native Health-selected capture `_26.09.26_20.20.16.353.png`
in `camera-guide-replay-20260926/screenshots` shows one-row HOME with the
lower title/publisher balloon. The supplied production capture
`home-health-replay-paired-20260926/browser` shows two rows and no balloon.
Those density states must be matched before a pixel claim.

Health now uses the existing source `LncBlln_00` layout, its Appear/DisAppear
clips and the existing native horizontal anchor calculation at settled one-row
density. Selection departure retains its text during DisAppear. Other densities,
toolbar selection, app/panel state and active gestures suppress this entry.

Text is selected from both manifest SMDH fields only when their provenance
matches the Health icon. Independent reading of private
`health-and-safety/exefs/icon.bin` confirms SHA-256
`ab6cfc9da9089bb7209bee980ff79b365638e84eacb663e1a792fed58e7a9055`,
English long description `Health and Safety Information` and publisher
`Nintendo`. Both fields are already published for title `0004001000022300`,
version 3077. No new asset or invented text was needed. Missing or mismatched
metadata suppresses the balloon instead of substituting descriptor text.

Validation: six focused balloon tests pass, including Health source validation,
wrong-title provenance rejection, painter binding, missing text, retarget and
density suppression. Typecheck and diff whitespace checks pass. Coordinator
must rebuild, replay one-row selection and compare both LCDs; no native match
or motion timing claim is made by this implementation slice.
