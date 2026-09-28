# Native nickname QWERTY local presentation

`nativeNicknameQwertyPresentation` implements the corrected English page-zero
initialization for the existing-profile Settings nickname request. It consumes
the original decoded `Keytop_qwerty` layout, animations and English message
resource. It preserves the source hierarchy, material styles and input assets.
See `native-keyboard-keys-contract.md` and
`native-keyboard-invocation-contract.md` for ownership and invocation boundaries.

The fourth argument supplies the decoded `RI_mstl` styles and the bound font's
width/height. `initializationLayout` contains complete property state, including
resolved text metrics. `initializationOverrides` contains the label, visibility
and root writes; it is not the complete text-style state.

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

## Resolved message-style boundary

The original caller at `0x17e6c8` sends `qwerty_conv` through named wrapper
`0x155e38`, then style/text setter `0x116bdc`. Native getter `0x12c0fc`
reads the message's actual `TSY1` index and addresses `RI_mstl` as
`base + 4 + index * 44`. For style 220, `0x116c68..0x116d1c` applies only font
size, line spacing and character spacing. The helper resolves these fields
using float32 products and returns `messageStyleApplications` for this one pane.
Other style-table words, text colors, alignment and materials are not applied
by that setter.

Dictionary label `qwerty_dic_en` (resource style 171) and the 45 individual
`qwerty_keytop` UTF-16 units take text-only paths through `0x154e74` and their
widget setters. They never invoke the named style setter in this request.
Their incoming pane styles are retained, as are those of the seven directly
cleared labels. A resource style index does not by itself trigger application.

`scripts/verify-native-keyboard-key-styles.py` executes the original caller,
named wrapper, style arithmetic, TXT2 lookup, style/text setter, capacity setter
`0x157264` and UTF-16 setter `0x178b60`. Parsed label-index/TSY1 section lookup,
decoded layout/group construction and font metrics are explicit endpoints.
The source text buffers are preallocated to their resource capacities. It
imports the immutable local fixture and writes only a new sibling report.

The actual style has scales `[0.6000000238418579, 0.6000000238418579]` and zero
spacing. With font metrics 25×30, native `T_key_Tra` size is
`[15.000000953674316, 18]`, already equal to its authored values. Thus the
baseline performs no metric changes. A second probe gives all text panes
incoming size `[11.25, 12.5]`, line spacing -3.25 and character spacing 2.75,
with font metrics 31×37. Only conversion becomes
`[18.600000381469727, 22.200000762939453]` with zero spacing; every other text
pane retains its incoming metrics. Native writes are recorded at `0x116cc0`,
`0x116cc4`, `0x116cf0` and `0x116d1c`. Both cases preserve all 232 frozen local
pane alpha/visibility/text rows exactly. The probe is not a native mode.
The resource runner compares all 54 text panes in each native case. All four
component pixel hashes remain identical to the pre-style implementation,
including the changed-label probe.

Run the original-code fixture with the private Python environment containing
Unicorn (2.1.4 in the verified run):

```sh
"$NATIVE_RESEARCH_PYTHON" scripts/verify-native-keyboard-key-styles.py \
  --reference-root "$NATIVE_KEYBOARD_REFERENCE_ROOT" \
  --artifact-dir "$NATIVE_KEYBOARD_STYLE_ARTIFACT_DIR"
```

Set `NATIVE_KEYBOARD_STYLE_EVIDENCE` to that directory's `verification.json`.
The renderer runner verifies the current fixture hash and source identities,
then compares helper output against every native text metric in both cases.
The sibling evidence directory is `presentation/keyboard-key-styles/` below
the same private firmware artifact root. Frozen journals are unchanged.

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
  --canvas-module "$NATIVE_CANVAS_MODULE" \
  --style-evidence "$NATIVE_KEYBOARD_STYLE_EVIDENCE"
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

`tests/native-keyboard-keys-render.test.mjs` uses the seven corresponding
environment variables. It skips without private inputs; the standalone runner
requires them and fails on absent or invalid data. The always-on helper suite
checks scope, order, resource labels, retained source styles, immutability and
explicit errors.

## Observed result and remaining acceptance

The initialized and explicitly submitted 320×240 component PNGs were inspected.
English character keys remain unchanged while the submitted Enter and
dictionary controls become visibly gray. Roman controls remain hidden; Caps
and Shift icons remain visible. No renderer diagnostics were emitted.
All seven focused tests, including the real-resource render test, pass with no
skips. The binding/share/text/renderer regression selection passes 21 checks
with six private-fixture cases skipped; TypeScript and runner syntax checks pass.

Artifacts are under
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/presentation/keyboard-keys/`.
`verification.json` records code/resource hashes, texture identities, submission
order, resolved style applications and render hashes. No firmware data is added to the repository.

These are component renders, not native LCD golden images. Global prepare/update
counts, layout ordering, footer/mode-selector composition, keyboard input,
browser verification and matched native LCD acceptance remain separate work.
