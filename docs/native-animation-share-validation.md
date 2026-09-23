# Native CTR animation sharing

The four original QWERTY clips now decode and bind their `pah1` records. The
strict title loader can accept those resources without discarding an unsupported
section. This is a resource binding result, not native initial composition,
controller timing, browser acceptance or a 1:1 keyboard claim.

## Schema and evidence

`scripts/firmware/animation_hierarchy.py` decodes one complete little-endian
section into `shares: {sourcePane, targetGroup}[]`. `decode_animation` calls the
helper, preserves each `pai1` content's target/binding in `contents`, and records
its index on each track. Empty content entries remain significant: native share
lookup chooses the first matching content, even when it contains no tracks.

| Section-relative offset | Meaning |
| --- | --- |
| `0x00` | `pah1` signature |
| `0x04` | Complete section size |
| `0x08` | Section-relative record-array offset |
| `0x0c` | Unsigned 16-bit record count |
| `0x0e` | Two reserved bytes |
| array + `36*i` | Source pane name, 17 bytes including terminator |
| array + `36*i + 17` | Target group name, 17 bytes including terminator |
| array + `36*i + 34` | Two reserved bytes |

The bounded decoder rejects invalid sizes, offsets, truncated records,
unterminated/empty names, non-ASCII names, nonzero unused bytes and duplicate
sections. The binder rejects missing/ambiguous pane/group/material references,
unverified pane kinds and competing shared/direct channels. Window material-slot
ordering and competing-controller update ordering are deliberately unsupported.
Clips without `shares` keep their previous binding behavior.

Primary implementation review included
[Switch-Toolbox's pinned CTR BCLAN reader](https://github.com/KillzXGaming/Switch-Toolbox/blob/9fe41401d246d31c99fcbfdd0a7fe4253a95b31f/File_Format_Library/FileFormats/Layout/CTR/BCLAN.cs).
It handles `pat1` and `pai1` but preserves other sections as unknown; it does not
establish sharing semantics. The supplied keyboard executable supplies the
positive runtime evidence. Its SHA-256 is
`a0b78005b0a99116ca703bc9b7625ce1b0f2d4cc45f66fc6fb9ab8a34244d4f0`.
Addresses below are executable VAs, based at `0x100000`.

- `0x152424–0x1524bc`: CLAN section dispatch. The negated tag constant at
  `0x1524c8` identifies `pah1`; its address is retained at resource `+0x0c`.
- `0x195e30–0x195e50`: record count and section-relative array getters.
- `0x177d98–0x177df0`: 36-byte stride, recursive source-pane lookup, group
  lookup from record `+0x11`.
- `0x1795f8–0x1797ac`: source pane's first matching pane-content index and
  each of its own material slots' first matching material-content indices.
  This does not collect the source pane's descendants.
- `0x177e10–0x177f38`: source itself is skipped. Destination members must be
  selected by `pat1` groups, or descend from a selected pane when child binding
  is enabled. An ungrouped clip admits all destination members. Child binding
  does not expand the share group's membership.
- `0x197358–0x1974e4`: binds source pane content to the destination pane;
  material content maps by slot ordinal up to the lesser material count.
  No parent/hierarchy reassignment occurs.

## Original resources and native replay

All four clips contain the same two records:
`P_key_01 → G_keyBase`, `T_key_00 → G_keyText`. Each section is 88 bytes,
with its two records at section offsets `0x10` and `0x34`.
The original layout SHA-256 is
`f3efa2fd457c65b5bf9aefe6ba350fabd8d63edf0edef82a77ae14ed17252569`.

| Original clip | SHA-256 | `pah1` file offset | Native additional bindings |
| --- | --- | --- | --- |
| `Keytop_qwerty_i0.bclan` | `418c3ecba17934b3c13a0c9dca5a6a980c6b4e4c1ae48e41b1fd325c955c7d17` | `0x138` | 156 |
| `Keytop_qwerty_n0s1.bclan` | `a7a2bc7d2140ad81a66dede3edfad14f3bf3ff0918f0fd30541bbf8d8018b625` | `0x18c` | 156 |
| `Keytop_qwerty_s1t0.bclan` | `96d7aa0762c52e169a670ba30f3fe1d6c769f115529ee2460192a585100c2f68` | `0x74` | 0 |
| `Keytop_qwerty_t0s1.bclan` | `e9e6db4801990a99e9fe356305ed7c8d3be2f63759f50ef098f241ecc5a088ed` | `0x60` | 0 |

Original ARM replay executes the CLAN parser, share-record traversal, group
selection, source-content capture and shared-link construction. Host endpoints
provide pane lookup/material enumeration and allocation; ordinary initial
binding allocation is stubbed, and link insertion endpoints record native
outputs. This is not a full process or native LCD capture. The committed fixture
contains the native content-index/destination identities, not binary firmware.

The 156 links comprise 38 copied key-base pane links plus 38 material links,
and 40 text-pane links plus 40 material links. The latter two clips' selected
groups exclude all share destinations. Controlled native probes produce four
links for direct `G_key_02`, none for `G_key_00`, and 156 for an ungrouped clip.
A probe group containing only the layout root produces zero with direct binding
and 156 with descendant binding.

## Verification and limits

`tests/native-animation-share.test.mjs` checks source selection outside active
groups, destination filtering, unchanged hierarchy/assets, material mapping,
empty first content, unsupported conflicts and invalid references. With
`FIRMWARE_KEYBOARD_MEMBERS` pointing to the private original `members` directory,
it verifies hashes, decodes all four resources through the real converter,
compares every expanded binding against original ARM outputs, and samples the
resulting curves at beginning/midpoint/end. Python tests cover malformed section
bounds and the actual converter dispatch.

Private artifacts are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/animation-hierarchy/`:
`replay.py`, `native-replay.json`, `binding-inventory.json`, `loader-render.json`,
source excerpts and test logs. The inventory contains ordinary plus shared
resource bindings; it does not claim controller allocation or timing.

The actual strict title loader accepted all four freshly decoded clips, fetched
39 distinct texture images, and rendered each at resource frame zero with the
real shared font, PNG decoder and Canvas renderer. All four draws returned true
with no diagnostics. The `i0` image was inspected: authored root positions,
placeholder key text and overlapping language controls remain. These specimens
are not the native initialized keyboard and are not public delivery assets.

The final focused binding/override suite passes 17 tests with no skips. The
broader native suite passes 220 tests with six optional environment-dependent
skips; firmware Python checks pass 36 with eight private-resource skips. Type
checking passes. Broad tests are limited by this worktree's missing `fake-indexeddb` and
Git LFS model pointers. The default build is blocked by Turbopack rejecting this
worktree's `node_modules` symlink outside its filesystem root. These environment
limitations require integration-checkout verification; they do not establish
application acceptance. No browser was controlled in this worker task.

The coordinator-requested `PaneOverrides.lineSpacing` writes text-pane spacing.
`vertexColors` clones every supplied color array into picture/window content; it
does not alter text top/bottom colors. The focused tests cover both additions.
Integration must include `firmware/animation_hierarchy.py` in `build.py`'s converter
provenance script list; the coordinator owns that remaining one-line glue.
