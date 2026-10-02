# HOME populated-folder Delete notice comparison

Date: 2 October 2026

Branch: `codex/home-populated-folder-compare-20261002`

Base: `40a5d090427d05449bbda98b507f365f1e78e7aa`

## Scope and method

This is a bounded comparison-only record for Delete on a HOME folder that
contains Health & Safety Information. It changes no runtime, asset, shared
progress/map document or private scenario matrix. Native own-PNGs and browser
raw LCD captures are compared at fixed source coordinates with empty masks and
RGB threshold 2. No translation, phase, geometry, colour or mask fitting is
allowed.

The fixed notice-panel control is lower-LCD `x20/y20/280x200`. Full upper and
lower LCDs remain unmasked controls. A generic browser confirmation is a
same-action diagnostic only: because it presents the wrong message and
decision policy, it is not a native-equivalent state and cannot be treated as
a pixel baseline.

Private evidence is under
`home-populated-folder-20261002/comparison/`. The initial manifest SHA-256 is
`3ed6f0a05bac04be20194f548aeddd8e8fa9872ac612eeac411b6e27e4355cac`.

## First native observation

The coordinator successfully moved Health into a native folder, returned to
the populated root, opened Folder Settings and activated Delete. Native HOME
did not delete the folder and did not ask for confirmation. It presented the
one-button notice:

> Folders containing data
> cannot be deleted.

Activating A OK returned directly to root HOME. The folder remained present,
selected and visibly populated. This establishes the settled semantic policy
for this one native run; it does not establish exact input cadence, motion or
audio timing.

| State | Native own-PNG | SHA-256 |
| --- | --- | --- |
| open folder, Health child selected | `_02.10.26_17.33.35.088.png` | `33d6c686a6076d88e3e752d104508f44a46933cfaae461a7e7870440ced77cea` |
| populated root | `_02.10.26_17.33.46.713.png` | `4a8061dfc43275ec65d40365a9a7d7a5eee7ade15527b56ff20093f9cfee5850` |
| Folder Settings | `_02.10.26_17.34.03.053.png` | `4ad57fc5072fe6947d071575517a709e88ca6b36cba5a1539d56396be974f5d9` |
| populated Delete notice | `_02.10.26_17.34.17.605.png` | `86101a390cdb56b8b7b848f14e6a99e941ccb194b4814fbb7c39faffecb18e37` |
| A OK return, populated root intact | `_02.10.26_17.34.51.773.png` | `2a64ecc0b16214525d01edb007723de1457676dfe48ec86f07249b1604f51f93` |

Azahar packs the lower LCD at `(40,240,320,240)` in each 400x480 own-PNG.
The native notice-panel raw-RGB SHA-256 is
`cf3296ea6e9bdbb430697415f9ee60f89cd1534231179e24de16b94b55eadd55`.

## Source identification boundary

The pinned source is EUR HOME `0004003000009802` v24576, content index 0 /
ID `00000082`. The CIA SHA-256 is
`2863c6c4e7b1c79e4352b63cde72994fa9c3b8bdd8dfd2afd4dd4104636b1898`;
decrypted `code.bin` is
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.
Conversion is `ctr-native-web` 1.2.0 with CTRTool 1.3.0.

The decoded English message exactly matches the capture:
`menu_msbt_LZ/lau_dlg_folder_delete_02`, index 432, style 34. The OK string is
`lau_dlg_1b_ok`, index 167, style 26. Both come from
`RomFS/message/EU_English/menu_msbt_LZ.bin`, SHA-256
`1df2193c64e8d08b3b670923617ea1f0461537397b3da671d394304a664b4350`.

The one-button frame candidate is `home.dialog/Dlg_A_D_01`, sourced from
`dialog_LZ.bin/blyt/Dlg_A_D_01.bclyt`, SHA-256
`ba68d27867a30860e99089ddec91cbbdeb2149a3de7ee150250e7ac408657701`.
The archive SHA-256 is
`65675c4a6ecada83a0d7256ea20c36692190be10349bf87c32e6068376409704`;
the delivered pack SHA-256 is
`8a7b72cd0e69601da7938503f648c18286fb4bcb2bf27fc0c33839dd4e0dca17`.
These are source candidates until the implementation lane establishes the
exact composition and runtime bindings; this comparison does not infer them
from visual resemblance alone.

## Initial artifacts and pending evidence

The private analyzer SHA-256 is
`407a0a697e20977986061a0f26a5b373a1a67bdaa4f532b696a3340cf90acb65`.
Its native-only baseline report SHA-256 is
`223794bdb6ceaaa0d7d837a39680246bee58d6cf065059b8a964183b6389e0be`.
The inspected five-state upper/lower sheet SHA-256 is
`3fee1059827df2e7e52400dc5e12656aa2be6660e18b4393b6aac513b28a55bb`.

Still required before final comparison:

- an independent native repeat of notice and OK return;
- production browser-before same-action diagnostic, explicitly unpaired where
  its generic confirmation semantics differ;
- production browser-after same-state notice and OK return;
- fixed full-LCD and 280x200 notice-panel diffs with empty masks;
- separate input, motion and audio reporting.

The populated-folder scenario remains `fail/unverified`. The first native run
is behavioral and visual reference evidence, not whole-scenario acceptance.
