# Miiverse local interior: source gap

On 26 September 2026 the coordinator observed production `8f0eb39` showing
“No content is available in this portfolio.” inside a Miiverse Communities
notice. That sentence and the separately drawn section heading had no firmware
message mapping. The notice composition was authored despite using native
DialogBaseNormal and DialogNotice parts.

## Bounded decision

Remove that dialog, sentence and section heading from both initial and detail
views. Keep the existing decoded BG, Miiverse title and toolbar. The interior
is deliberately unpopulated pending relevant source content. This is a local
portfolio adaptation with an explicit **source-gap**, not a claimed native
empty/offline screen. The toolbar selection and local Back/HOME behavior remain
as before. No network attempt or account state is simulated.

The delivered English `cave` bank contains `ErrorMsg_AC_Connection_Failed`,
`ErrorMsg_HTTP_Cannot_Get_Page`, `ErrorMsg_Brs_Normal_Conn`, recovery messages,
`dlg_top_internet_flw` (asks to enable wireless) and `dlg_top_net_off_flw`
(Back). None establishes a native empty community/feed state. Substituting one
would assert a connection/error state the local module never enters. This audit
covers the delivered selection, not a proof that no suitable resource exists
anywhere in the complete dump or remote service.

## Source identity

Manifest: `public/os/firmware/10.7.0-32E/manifest.json`; title
`000400300000be02`, version `4096`, content index `0`, content ID `00000006`.
Converter: `ctr-native-web` `1.2.0`; exact script hashes remain in the manifest.

| Retained element | Manifest pack / resource |
| --- | --- |
| Both LCD backgrounds | `packs/miiverse/layout-BG.json` → `BG` |
| Upper title | `packs/miiverse/messages-and-loose.json` → `cave/lau_title_olive` |
| Four toolbar icons | `packs/miiverse/layout-toolbar-{CommunityButton,ActivityButton,MyMenuButton,NotificationButton}.json` → matching layout and ActiveOnOff/FocusedOnOff clips |
| Back icon | `packs/miiverse/layout-toolbar-OliveBack.json` → `OliveBack` and FocusedOnOff |

The message source is `RomFS/message/EU_English/cave.msbt`, SHA-256
`ed52366f92bb1ddc919e24921a0e8bb88c18a05d9e512ce3e7734ac5a15c81b5`.
The BG archive is `layout/BG.arc`, SHA-256
`f0047f5e92beeafc7871882afef3329738324ace6a1090425a799f4cc4bbe09d`;
its delivered pack is `2a2f5c2086d9fc625ad9c4f8ad06ab32b067cacf1f76f1763e96303e4e66a25b`.
Each toolbar pack retains its archive/resource hashes under `resourceSources`,
with dependency hashes and title identity in the manifest. No asset pipeline
or public resource changed in this slice.

## Limits and verification

The upper title's manually selected position, source BG crop, toolbar mounts,
selection bindings and suppressed toolbar text are existing presentation
adaptations. The removed section labels still name local navigation rows in
state; they no longer paint a made-up page heading. No native capture pair was
available: the coordinator reports isolated Azahar game input is currently
blocked. Workers did not operate Azahar or the browser. Production inspection
of this change and matched native comparison remain coordinator-owned; this
slice cannot establish pixel, animation, input or audio fidelity.

Worker checks: `npm run typecheck`, `npm run build` and the stock-apps,
stock-screen-layout and stock-screen-preparation suites passed (82 focused
checks). Full `npm test` ran 1,372 checks: 1,309 passed, 39 failed, 23 skipped,
one todo. Failures are model/source-geometry suites with absent private GLB
fixtures in this lane; full output is in the private artifact root at
`miiverse-empty-interior-tests.log`. No shader/material code changed.
