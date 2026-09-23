# Plaintext multi-content CIA extraction

2026-09-23. The converter now handles separately identified NCCH contents instead
of rejecting every CIA with more than one content. This is an extraction and
provenance checkpoint under the [title expansion contract](native-title-expansion-contract.md),
not acceptance of native application visuals or behavior. No integration public
delivery was regenerated.

## Selection and provenance

The parser validates CIA section boundaries and alignment, the complete content
bitmap, TMD record bounds, unique IDs/indices, each declared content size and
SHA-256, plaintext flags, NCCH program identity and internal region bounds.
The selected application is the unique NCCH with executable form and application
content type. A sole data archive remains supported for the shared font.
Incomplete/ambiguous sets, prototype NCCH versions and nonstandard block sizes
are rejected explicitly. These checks do not authenticate Nintendo signatures;
no certificate, ticket or key material is exported.

The field interpretation and explicit `--ncch` index selection were checked
against installed CTRTool 1.3.0 and its pinned upstream implementation:
[CIA processing](https://github.com/3DSGuy/Project_CTR/blob/e8f5f529c54ff9b22a2491a480ffa69206bf7b19/ctrtool/src/CiaProcess.cpp),
[CIA header](https://github.com/3DSGuy/Project_CTR/blob/e8f5f529c54ff9b22a2491a480ffa69206bf7b19/ctrtool/deps/libnintendo-n3ds/include/ntd/n3ds/cia.h),
[NCCH header](https://github.com/3DSGuy/Project_CTR/blob/e8f5f529c54ff9b22a2491a480ffa69206bf7b19/ctrtool/deps/libnintendo-n3ds/include/ntd/n3ds/ncch.h).
CIA sections align to 64 bytes, contents to 16; this supported NCCH subset uses
512-byte blocks. TMD order determines file offsets; the selected content index
is not assumed to be zero or the first record.

| Real input | TMD content | Native identity | Selected |
| --- | --- | --- | --- |
| HOME v24576 | 0 / `00000082` | Executable, application | 0 |
| Keyboard v4096 | 0 / `0000000b` | Executable, application | 0 |
| Settings v9220 | 0 / `0000003d` | Executable, application | 0 |
| Settings v9220 | 1 / `00000038` | Data archive, manual | No |

Both Settings contents have program ID `0004001000022000`. Its manual's partition
ID is `000400000ff3ff00`; equating every partition ID with the application title
would incorrectly reject it. Both content hashes match their TMD records.

Source metadata adds `contents[]` and `resourceContentIndex`. The existing
`contentSha256` is the selected NCCH's SHA-256. Single-content source paths and
resource records are unchanged. The old extraction marker remains reusable when
its original fields match and the required extracted directories exist.

For Settings, private extraction and public pack/font paths carry separate
`contents/0000-0000003d/` and `contents/0001-00000038/` namespaces. Every
multi-content resource source, pack and member includes `contentIndex` and
`contentId`. The audit checks selection, content identity, extraction metadata,
pack/member agreement and content-specific source hashes; its cache keys include
the content index. Same-named resources in different contents cannot alias.

## Verification

Run the synthetic and existing container checks with SSD temporary storage:

```sh
PYTHONPATH=tests TMPDIR=/private/ssd/scratch \
  python3 -B -m unittest test_firmware_cia.CiaTests test_firmware.ContainerTests
```

The real-input checks are opt-in and write only to the provided private output:

```sh
PYTHONPATH=tests TMPDIR=/private/ssd/scratch \
FIRMWARE_CIA_SOURCE=/private/path/3ds-system-files-decrypted \
FIRMWARE_CTRTOOL=/private/path/ctrtool \
FIRMWARE_MULTICONTENT_ARTIFACTS=/private/ssd/multicontent \
  python3 -B -m unittest test_firmware_cia test_firmware.ContainerTests
```

The 20 checks cover real HOME, Keyboard and two-content Settings, source hashes,
actual extraction, legacy cache reuse, a nonzero executable index after a manual
record, content-name isolation, missing/incorrect provenance, ambiguous selection,
duplicate IDs/indices, incomplete bitmaps, malformed/truncated sections, content
hash corruption, encryption flags and NCCH identity/region failures.

The private conversion reproduces all HOME-generated files byte for byte against
the committed delivery, with unchanged HOME title metadata, pack URLs and old
source fields. HOME's extracted executable SHA-256 remains
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Only the three selected titles are converted. No browser or Azahar run is part
of this source slice.

The final private evidence directory is
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/assets/multicontent/verified/`.
It contains separate extractions, converted PNG/JSON, `metadata.json` and
`audit.json`. The full resource audit intentionally remains **failed** for the
19 unresolved binding checks below; the focused test expects that precise set
and rejects any additional failure. Passing these tests does not turn the
full audit into a successful native-title delivery.

| Frozen private artifact | SHA-256 |
| --- | --- |
| `metadata.json` | `eb39ae56f6d2b2e8077398e0dfd5f560e0a71120800cfd319538aa7c5eb5f496` |
| `audit.json` | `e7a195157ec9630ffb68b4a395e6ba684dede09ed6cfb2ef5ad09bd1169a9304` |
| `public/manifest.json` | `8adb2b04eb31ae021eecffee8ba1e82af03534244f3f2a16631d9f3a1ef8b326` |

## Unresolved resources and binding

Private conversion produces 27 HOME, 11 Keyboard and 11 Settings packs, with
4,153 private source-hash checks. Its full audit has no source/provenance errors,
but reports these 19 binding errors:

- Six Keyboard `Dlg_A_D_02` clips in `swkbd_common` have no parent layout under
  the existing same-pack filename matching rule.
- Settings `AnalogPad_D_00_Rotate_00` produces one missing group and twelve
  missing target checks under that rule. No target remapping is invented.

Other gaps stay visible in the conversion/audit reports:

- `pah1` animation sections remain unsupported (104 instances across these packs).
- Keyboard's sound archive has 15 BCWAV members and one SSEQ member not converted
  by this visual pipeline. Its message style table is also unresolved.
- Settings includes 602 opaque table members and 16 unresolved message style
  tables. Fourteen localized message members collide by basename in its combined
  archive; the retained message tables must not be assumed to be English. The
  current outer-path locale filter is insufficient for this archive.
- The separate Settings manual pack identifies 38 nested compressed `.arc`
  members without decoding them. Its original `Manual.bcma` remains private.
- The existing HOME unsupported tables/containers remain unchanged. Settings'
  broken-icon container is also unresolved.

These gaps require later resource/semantic work and native comparisons before
any strict 1:1 title acceptance. System Transfer/Update now have allowlist entries;
their packages have not been converted here. Download Play, Activity Log, Mii
Maker, StreetPass Mii Plaza, Face Raiders and AR Games remain excluded, while
Mii Selector remains included.
