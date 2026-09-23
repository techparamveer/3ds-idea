# Settings English message selection

2026-09-23. Converter 1.3.1 selects Settings' English message and style members
before assigning bank keys. The previous private multi-content checkpoint kept
the first alphabetically encountered `hud`/`mset` basename (Dutch) and reported
the remaining languages as collisions. That old checkpoint stays frozen as
historical evidence; it is not a usable English message delivery.

This change is limited to the native Settings `message_EU_LZ.bin` archive and
its declared member paths. It does not repair animation binding, `pah1`, native
control behavior or the other unconverted application resources. Integration's
public delivery was not rewritten.

## Exact selection

Settings is title `0004001000022000`, version 9220. The message archive is in
executable content 0, ID `0000003d`. Its stored archive SHA-256 is
`5589462029ef4063a08e316d6761214c06ecf9190056aec2e24bdee173af3fef`.

| Selected original member | Decoded member SHA-256 |
| --- | --- |
| `message_hud/EU_English/hud.msbt` | `a8860fb731e1a2065d28809c1184617db7f24f907531333c2bf1b0a4fa3a9c6d` |
| `message_hud/EU_English/RI.mstl` | `1e3d39608ce338b89fc0f6554d216f6f354e42b9e2ceacfccef488df27dacd3e` |
| `message_mset/EU_English/mset.msbt` | `fc91dc60b6db7fe7e2eb4d510ca6c63864eacf150bd72dc02d5541444233cbae` |
| `message_mset/EU_English/RI.mstl` | `ed972145483634e3a9b8205ff3d17afb7b7c1adc84bf1de47c499fc1a1139d9f` |

The archive has 32 members. The other 28 are rejected from conversion by their
explicit locale directory: `EU_Dutch`, `EU_French`, `EU_German`, `EU_Italian`,
`EU_Portuguese`, `EU_Russian` and `EU_Spanish`. For each locale, their paths are
`message_hud/LOCALE/hud.msbt`, `message_hud/LOCALE/RI.mstl`,
`message_mset/LOCALE/mset.msbt` and `message_mset/LOCALE/RI.mstl`.
Every exact rejected path and SHA-256 is retained in `localeSelection.rejected`
and the private `selection.json`; no source packages or members are deleted.

Selection requires the whole directory component `EU_English`; `US_English`
does not qualify. Missing or multiple locale components, absent English banks,
invalid selected records, absent sibling styles and any same-locale basename
collision are hard errors. No other language or directory supplies a fallback.
Unexpected Settings message/style bindings are rejected rather than inferred.

## Consumer contract and audit

The private pack remains:
`packs/settings/contents/0000-0000003d/message_EU.json`.

- `messages.hud` contains 59 messages and points to
  `styles["message_hud/EU_English/RI.mstl"]` (7 style records).
- `messages.mset` contains 1,267 messages and points to
  `styles["message_mset/EU_English/RI.mstl"]` (599 style records).
- `resourceSources` retains original archive/member paths and SHA-256 plus
  `contentIndex: 0` and `contentId: "0000003d"` for every selected member.
- Only this affected pack adds `localeSelection`: `locale`, `selected` and
  `rejected`. Each row contains the source identity/path/hash and its locale.

Consumers keep using `hud`/`mset` bank keys. In `mset`, `keyboard_cancel` is
index 20 with text `Cancel`; `keyboard_decide` is index 19 with text `OK`.
Both use style index 93 from the English mset table.

The audit verifies all selected and rejected member hashes against the private
archive. It checks exact locale disposition, selected/converted provenance,
content identity, explicit sibling style path and style-index bounds. Pairing a
bank with another bank's English style table is an error even when indices fit.
Dropping selection provenance from this known archive is also an error.

## Bounded native style evidence

The Settings executable SHA-256 is
`1f9351cd921d3f3d54afbc28de093c2411cf07a38470c14d5ed74e98f54d45b5`,
mapped at `0x100000`. Its getter at `0x131700..0x131774` addresses locale/bank
tables, reads TSY1, returns null for −1 and otherwise uses `base + 4 + 44*index`.
Settings' 192-byte application block at `0x1c8754..0x1c8814` is byte-identical
to the already-established HOME block `0x11e634..0x11e6f4`, SHA-256
`b2a4d54f6a3bfdb1993e20aea4c512818d700eed65efb5ca0190b21c5fde6d1c`.
It applies the Y/X font scales and line/character spacing with the same field
destinations. The other seven words remain unnamed; equal record width alone
was not used to assign semantics.

Two disassembly excerpts and `style-evidence.json` are private under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/localized-messages/source/`.
This is static source evidence, not execution or a native visual comparison.

## Verification and limits

Run the focused suite with the frozen multi-content extraction and separate SSD
output:

```sh
PYTHONPATH=tests TMPDIR=/private/ssd/scratch \
FIRMWARE_MULTICONTENT_ARTIFACTS=/private/ssd/multicontent/verified \
FIRMWARE_LOCALE_OUTPUT=/private/ssd/localized-messages/verified/public \
FIRMWARE_CTRTOOL=/private/path/ctrtool \
  python3 -B -m unittest test_firmware_locale test_firmware_cia.CiaTests test_firmware.ContainerTests
```

The 24 focused checks cover real Settings paths/hashes, exact English selection,
style pairing, collisions, missing/ambiguous locale, malformed selected records,
tampered audit provenance, existing CIA boundary cases and HOME resource-byte
preservation. Existing private HOME/Keyboard/Settings extractions are read;
the conversion writes only new private PNG/JSON and reports.

The full private resource audit still **fails the same 19 animation-binding
checks** documented in [multi-content validation](firmware-multicontent-validation.md).
It now verifies 4,187 private source hashes, including all locale dispositions.
The two Settings style tables decode with explicit unresolved-word warnings;
the locale collision warnings are gone. `pah1` and all unrelated gaps remain.
No native application has gained strict 1:1 acceptance from this converter pass.

Final private output is under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/localized-messages/verified/`,
including `public/`, `selection.json` and `audit.json`. HOME's generated files,
bank keys, resource paths and title metadata remain byte-for-byte compatible
with the committed delivery.

| Frozen private artifact | SHA-256 |
| --- | --- |
| `audit.json` | `6dca4fbc94cce90e9b8be6eceb5a50761577bf2d115e810f245223fe7b0385af` |
| `selection.json` | `8518f238f5d5fda86891dc554000548b73390c95e356f4747f59f835fa4c0651` |
| `public/manifest.json` | `5a0d43433531ae05d2591ed47d142ab77e73e588efcd84f45465dfce443c37af` |
| Settings `message_EU.json` | `23410b654a43aa4f3bf7b8310bf21194101b57fe687839baeaa1bafada574686` |
