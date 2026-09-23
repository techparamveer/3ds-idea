# Native nickname QWERTY local presentation

`nativeNicknameQwertyPresentation` implements the corrected English page-zero
initialization for the existing-profile Settings nickname request. It consumes
the original decoded `Keytop_qwerty` layout, animations and English message
resource. It preserves the source hierarchy, material styles and input assets.
See `native-keyboard-keys-contract.md` and
`native-keyboard-invocation-contract.md` for ownership and invocation boundaries.

The returned `layout` contains local property writes and eight immediate,
retained submissions. Five later controller submissions are returned separately
as `firstLocalControllerSubmissions`. The caller must explicitly apply them with
`applyNativeQwertyPaneSubmissions`; this module chooses no global pass count or
first-frame time. Controller construction alone does not justify sampling a
clip onto all character keys.

The local frame-zero controller descriptors are not a claim about the global
first captured frame. Later task-manager passes may advance these controllers;
the runtime composition must supply its independently established frame values.

## Property and animation evidence

The frozen corrected `qwerty-first-paint.json` has SHA-256
`73c70973467dfd5dd1a0e5dc034baa0d46da210bed64d7b336ea4c4e8481fec2`.
Its pane snapshot records initialization writes, while its animation sink
records submissions without sampling their channels. The runner compares the
snapshot against property writes alone, then checks the exact ordered
submissions separately.

The 45 character labels come from `qwerty_keytop`, the dictionary label from
`qwerty_dic_en`, and the hidden conversion label from `qwerty_conv`. Native
initialization directly clears seven text panes: Space, Backspace-JP, Caps,
Shift and Roman 00–02. These clears do not perform message lookups. Roman
picture/text/bounds panes are hidden, the Japanese backspace icon has zero
alpha, and the English dictionary panes are visible. The no-prediction branch
at `0x17e6d0..0x17e704` supplies root translation `[0, 8, 0]`.

| Stage | Pane order | Clip | Frame |
| --- | --- | --- | --- |
| Immediate | `P_key_Cps`, `P_key_CpsIcon`, `T_Key_Cps`, `P_key_Sft`, `P_key_SftIcon`, `T_Key_Sft` | `Keytop_qwerty_n0s1` | 0 |
| Immediate | `P_romanKey_00`, `T_romanKey_00` | `Keytop_qwerty_s1t0` | 1 |
| Explicit local controller pass | `P_key_Ent`, `P_Key_EntIcon`, `P_dictionary`, `P_dictionaryIcon`, `T_dictionary` | `Keytop_qwerty_i0` | 0 |

The existing animation binder expands resource shares first. Each submission
then applies only channels belonging to the named pane and its own materials,
in recorded order. It does not apply the entire clip group or descendants.
Unsupported window material enumeration fails explicitly.

Message-style transfer remains unresolved for `qwerty_conv` style 220 and
`qwerty_dic_en` style 171. The helper reports those indices as metadata and
preserves authored native text/material styling. It assigns no invented style
to directly cleared panes.

## Reproducible resource verification

The runner requires absolute paths and writes compiled modules, PNGs and its
report only below the supplied SSD artifact directory:

```sh
node scripts/verify-native-keyboard-keys.mjs \
  --artifact-dir "$NATIVE_KEYBOARD_KEYS_ARTIFACT_DIR" \
  --reference-root "$NATIVE_KEYBOARD_REFERENCE_ROOT" \
  --pack "$NATIVE_KEYBOARD_KEYS_PACK" \
  --messages "$NATIVE_KEYBOARD_MESSAGES" \
  --font-manifest "$NATIVE_KEYBOARD_FONT_MANIFEST" \
  --canvas-module "$NATIVE_CANVAS_MODULE"
```

The reference root is the private `runtime/keyboard-native` directory. The pack
is a converted QWERTY pack with texture URLs relative to its location. Messages
come from `decoded/extracted/romfs/message/EU_English/swkbd_msbt_LZ.json`.
The font manifest is the shared `font.json` with adjacent sheets; the Canvas
module is an absolute `@napi-rs/canvas/index.js` path. Python 3 runs the repository
decoder directly against original layout and animation members.

Checks include original member hashes and fresh decoding, corrected journal
identity, indexed fixture and controller-constructor evidence, all 232 captured
pane values, exact 8+5 submission order, retained pane/material scope, all 45
unsubmitted character pictures/materials, source immutability, required font
glyphs and actual rendering with 39 native textures. An independent restriction
check samples the whole source clip and copies only the recorded pane's own
fields/materials; it does not reuse the helper's track filter.

Four separate immutable renderer banks exercise property-only, initialized,
explicitly submitted and changed-label states. Alternating repeated draws must
preserve pixel hashes without diagnostics. The changed-label state uses 45
`X` characters to test resource propagation; it is not a native keyboard mode.
This does not validate replacing an existing renderer bank in place.

`tests/native-keyboard-keys-render.test.mjs` uses the six corresponding
environment variables. It skips without private inputs; the standalone runner
requires them and fails on absent or invalid data. The always-on helper suite
checks scope, order, resource labels, retained source styles, immutability and
explicit errors.

## Observed result and remaining acceptance

The initialized and explicitly submitted 320×240 component PNGs were inspected.
English character keys remain unchanged while the submitted Enter and
dictionary controls become visibly gray. Roman controls remain hidden; Caps
and Shift icons remain visible. No renderer diagnostics were emitted.
All six focused tests, including the real-resource render test, pass with no
skips. The binding/share/text/renderer regression selection passes 21 checks
with six private-fixture cases skipped; TypeScript and runner syntax checks pass.

Artifacts are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/keyboard-keys/`.
`verification.json` records code/resource hashes, texture identities, submission
order, style gaps and render hashes. No firmware data is added to the repository.

These are component renders, not native LCD golden images. Global prepare/update
counts, layout ordering, footer/mode-selector composition, keyboard input,
browser verification and matched native LCD acceptance remain separate work.
