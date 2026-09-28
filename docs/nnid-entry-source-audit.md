# NNID unsigned-in entry: missing source body

The requested replacement of the authored NNID availability cards is blocked by
missing original entry-page content. The supplied firmware establishes native
background/header/toolbar/dialog components, but not the unsigned-in Create/Link
page or its English body text. No NNID renderer or runtime behavior is changed
by this audit. The existing cards remain an acknowledged adaptation, not native
entry UI. Settings/helper return behavior is untouched.

## Supplied evidence

Title `000400100002c100`, content `00000009`, version3072, product `CTR-N-HAFP`:

- CIA SHA-256: `53e10e94c3d62f77449a799c8f34b92d78acc5897a5d3f21e9581dbce95cfd04`.
- Content SHA-256: `39ad77dd31b6b8babfc6b9bb8a223934feb06b81d1e2765e155244a9d1bc135d`.
- EU English `cave.msbt` SHA-256: `ed52366f92bb1ddc919e24921a0e8bb88c18a05d9e512ce3e7734ac5a15c81b5`.

The extracted RomFS has193 files. All145 `.arc` archives decode successfully to
849 members:147 `.bclyt` layouts,263 `.bclan` animations and439 `.bclim` textures.
There are no HTML/HTM/XHTML/CSS/JS/MHTML page files or archive members.

The full converted English `cave` bank has283 messages. It includes shared
`Button_Regist` (“Link ID”), `Button_Return`, connection notices and account
close/error messages. It does not supply an original unsigned-in Create/Link
message pair or the entry page's content. Shared browser and Miiverse messages
in this title are not evidence that they belong on NNID's initial screen.

`browser/UserCss.dat` is308 bytes of base64-encoded generic `:focus`, `keygen`
and `select` CSS, not a page. Its SHA-256 is
`b5a986363b637351a5e9b032f461977c36dcbb8da1592adbaa92db35c821b508`.
`browser/Skin.dat` is49,312 bytes of binary browser skin data, SHA-256
`0dbd6f510aa6733fe765da471de9a4787026ea154dcee40f73310aba9f799df2`.
The assets worker independently found no HTML/body markup in the archive members
or skin, and no NNID page/snapshot among the firmware artifact tree's
HTML/HTM/XHTML/HAR/WARC/MHTML filenames.

`Root` supplies `AccountHeaderPos` (0,120), `ToolBarPos` (0,-226), `MenuPos`
and `DialogPos` (0,-120), and `DialogHeaderPos` (0,120). `browse/Canvas` supplies
a dynamic512×512 `ContentRct`; it does not contain the account-page body.
The header's Japanese sample text and generic dialog sample panes do not supply
an English entry composition. Placing generic buttons beneath that header would
be another inferred layout rather than the requested original screen.

## Reproduction and next dependency

Run `python3 scripts/audit-nnid-entry.py` with absolute `--romfs`,
`--converted-root`, and `--report` paths. The audit only reads and decompresses
resources; it neither executes firmware nor connects to a service. New page or
message candidates are reported for inspection rather than asserting that
absence is a desired invariant.

The completed private report is
`runtime/nnid-entry/source-audit.json` beneath the firmware SSD artifact root.
Inputs were `assets/stock-ui/extracted/nnid-settings/romfs` and
`assets/stock-ui/nnid-settings-native14`. Independent asset-worker evidence is
`assets/stock-ui/nnid-local-page-audit.json` under that root.

An original local page/HTML capture with assets, or a matched unsigned-in screen
reference and its English text, is needed before replacing the cards faithfully.
This inventory supports absence in the supplied data; it does not prove the
native executable's server behavior or startup sequence. No initial-state render
pair or live-browser fidelity claim is made. Existing source component renders
cannot validate the missing page. No application rebuild is required for this
read-only audit and documentation change.
