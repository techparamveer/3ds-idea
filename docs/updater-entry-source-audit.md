# System Update static confirmation source audit

The portfolio now presents the original `update` scene's question, orange title,
source background state and Cancel/OK footer. Previously it forced the dark
Legacy background endpoint, selected the pink title clip, and replaced the lower
layout with an authored notice over a scaled upper-screen panel.

This is a read-only adaptation: OK remains visible but has no hit target or
runtime operation. Cancel and physical Back restore the retained caller through
the existing helper-return path. No EULA, connection, download or update scene is
entered. This does not establish strict native LCD parity or the initial screen
for every native launch argument.

## Evidence

EUR title `0004001000022f00`, content `00000003`, version 2050, product
`CTR-N-HSHP`. The decompressed executable is mapped at `0x100000`, SHA-256
`1c5427729c7b6d9b0449fe8b74e9bf1419e7437579e4a47fceb5807295267a14`.
Original archives are under the private extracted `system-updater/romfs` path;
none of the executable is published.

- `table_LZ.bin/update.bin` has footer kind 2 at byte 0 and state 1 at byte
  `0x23`. It selects `MessageOnly_D_00`, `CommonBG_U_00`, `TextBG_U_00`,
  `IconUpdate`, `update_title`, `update_comm_u` and `update_comm`. Its source
  action labels are `base_2b_cancel` and `base_2b_ok`; native destinations are
  `basic_top4` and `update_eula`.
- The executable footer-name table at `0x2603e0`, index 2, resolves to
  `Base_D_01`. The loader at `0x183cc4–0x183dcc` fills its two text/shadow pairs.
  Their lower-screen bounds are Cancel `(0,208,120,32)` and OK
  `(200,208,120,32)`. Only Cancel is actionable in this portfolio.
- `0x1845fc` reads record byte `0x23`. `0x184600` reads the
  `SceneIn_%2.2d.bclan` format through `0x2615b8`; only state 2 maps to 0.
  State 1 therefore selects `CommonBG_U_00_SceneIn_01` with the orange title
  endpoint, rather than the previous `_00` pink endpoint.
- The background constructor at `0x184364` initializes state 0 (instructions
  `0x184368` and `0x184384`). The record setter `0x184218–0x184248` passes byte
  `0x23` to `0x18390c`. The transition `0x18390c–0x1839b0` starts Legacy for
  1→2 and reverses it for 2→1; 0→1 retains the source layout defaults.
  Consequently the static update scene no longer forces Legacy's final frame.
- The English message bank supplies “Connect to the internet\nand update the
  system?”, “Update your Nintendo 3DS system.”, Cancel and OK. Original message
  styles are retained; no font-size, translation or text-box override is added.
- `MessageOnly_D_00_SceneIn_00` and `_01` have the same settled position/alpha.
  The normal `_00` endpoint is used here. Native entry timing and clip variant
  under all APT arguments remain unverified.

`scripts/audit_updater_entry.py` checks the pinned executable, record fields,
source message text and delivered layouts/animations against original archives,
and emits code-range/source-member hashes. Run with absolute `--romfs`, `--code`,
`--published` and `--report` paths. The publisher source is the retained
`system-updater-native14` conversion; republishing the old selection first
reproduced all five existing title packs byte for byte. The new selection adds
only `Base_D_01` and the OK label to those packs.

## Verification and remaining boundary

Focused runtime, return, layout and updater tests: **74 passed**. Type checking
passed. The helper verifier rendered **11 LCD pairs** with no diagnostics,
immutable resources and bounded targets. All 20 other helper images are
byte-identical before/after; only the updater's two images changed. Both updater
images were visually inspected. The pale source backgrounds, orange header,
original question and two source footer controls render legibly.

Artifacts are in
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/updater-first-screen-source/`:
`source-audit.json`, `before/verification.json`, `after/verification.json`, and
paired PNGs. These are source renders, not emulator or live-browser captures.
Integration owns the combined build and live QA. Native initial routing may
select other records (`update_aj`/`update1`) according to APT arguments; this
adapter explicitly chooses the static `update` confirmation scene. Native pixel
comparison and transition fidelity remain open.
