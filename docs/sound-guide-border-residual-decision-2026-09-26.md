# Sound first-run guide border: source gap

This is a no-code decision for the `sound-first-run-title-blue-fit` diagnostic.
The native `sound-first-run/native/combined.png` and browser
`sound-first-run-title-blue-fit/browser/lower.png` were inspected as a raw
320×240 lower-LCD pair. Their SHA-256 values are respectively
`9dea0cc2fa7022ccd032c5a94ae59c2dbe37e6b7e800fbf8668b356fc9e5ce69`
and `b9d1093ab9641460de6e9e0490707ae12d41008085ee8f7c9995d12fd504fbb9`.
The [existing report](/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/reference/scenario-matrix/v1/captures/sound-first-run-title-blue-fit/diff/report.json)
records 6,267 lower pixels over the 2/255 threshold; its largest connected
region includes 3,955 pixels around the panel perimeter. The contact sheet was
visually inspected.

The exposed background at `(315,40)` is native `(45,56,78)` versus browser
`(89,114,156)`; at `(160,239)` it is `(24,54,107)` versus `(49,109,209)`.
Both are close to half intensity, while the guide interior at `(160,10)` is
exactly `(211,231,174)` in both images. The top, right, left and bottom edge
bands contain 1,487, 1,170, 1,200 and 2,215 over-threshold pixels respectively
(these bands overlap); the central `(20,20)..(300,220)` rectangle has 195.
The region therefore implicates the background visible through and around the
source guide panel, rather than its body text or button alone. This pair has
different HOME navigation prefixes and proves no input or animation parity.

The live frame is `sound-dialog` → `C_DlgChA`, followed by
`C_DlgGuid1BtnW`. Both are delivered from Sound title
`0004001000022500`, EUR content index 0 / content ID `0000000b`:

| Manifest resource | Original dump path | Source SHA-256 |
| --- | --- | --- |
| `C_DlgChA` | `lyt/C.LZ/Dlg/blyt/C_DlgChA.bclyt` | `4d35e4b38ae75fa7ad8c8f2d2484bd200856b562ee4c493b13adbc765c5eb8d7` |
| `C_DlgGuid1BtnW` | `lyt/C.LZ/Dlg/blyt/C_DlgGuid1BtnW.bclyt` | `aaa3aeceda6930838285e3c03f032170d9d8e23690cabca843f26405c8116773` |
| `C_NullDlg` | `lyt/C.LZ/Dlg/blyt/C_NullDlg.bclyt` | `33e40cd3b8a05bf575eb23ff51294c3637c8eded1f23b75a6d0aecfe397949e6` |

The delivered `C_DlgChA` root is 320×240, but its visible window panes are
288×230 and 20×230. `C_DlgGuid1BtnW` contains body/count/button panes, with
no backdrop pane. `C_NullDlg` is a pane-only transition object: its `Dlg`
pane is 30×40 and the source `Dlg_In` clip moves it from y=−240 to 0 over
15 frames. None of these decoded resources specifies a full-screen black
veil or a 0.5 opacity for the Sound background. The brightness relationship
is an observation, **not** a verified native blend mode or alpha.

**Decision:** leave the stock presenter unchanged. The unsupported field is
the guide owner's background attenuation/compositing operation, including its
coverage and timing. A 50% Canvas overlay fitted to this one still would be
an invented native graphic. Resolve the executable's guide compositor and
recapture a matched-input guide transition before changing this layer. The
upper Span deformation and bird scheduling remain separate source gaps
documented in [the upper residual note](sound-upper-residual-diagnostic-2026-09-26.md).
