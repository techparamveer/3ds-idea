# Camera capacity width and cursor advances

The horizontal symbol gap is now resolved to original Camera executable
behavior. The capacity adapter installs the message style's width and retains
its signed horizontal-advance controls. This supersedes the untraced-semantic
limit in [the earlier symbol diagnostic](camera-capacity-symbol-source-gap.md).
A new integrated browser capture is still required to accept rendered pixels.

## Original consumers

Pinned EUR Camera title `0004001000022400`, content `0000-0000001a`, ARM image
base `0x100000`, executable SHA-256:
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.

| Original instructions | Established effect |
| --- | --- |
| `0x21d95c–0x21d970` | Owner retains the supplied style pointer and calls the installer on its pane at owner+0x3c |
| `0x21f7ec–0x21f808` | Reads style+0 as uint32, converts to float32, stores pane width at pane+0x48 |
| `0x21f80c–0x21f828` | Selects the font from style+0xc; selection is a supplied endpoint in the replay |
| `0x21f858–0x21f8e0` | Multiplies source font width/height by style scales into pane font size |
| `0x21f8e4–0x21f93c` | Installs character and line spacing |
| `0x2717e8–0x271804` | Draw tag group switch routes group2 to `0x271924` |
| `0x27193c–0x271958` | Group2/type0 reads argument16, sign-extends it, adds float32 argument directly to writer cursor X at writer+0x2c |
| `0x271b98–0x271bcc` | The measurement counterpart advances cursor X identically and stores ordered old/new endpoints in the measured rectangle |

The cursor advance is in writer units. It is not multiplied by glyph scale.
Neither a glyph bearing replacement nor a Camera-symbol translation is involved.

`scripts/replay_camera_capacity_text.py` executes the original owner setter,
style installer and draw/measurement tag handlers in Unicorn. Only font
selection and the source font width/height virtual results are supplied leaves.
It verifies width176 from style110, independent width172/200 probes, and cursor
arguments2,−2,0,32767,−32768. Starting at X22, both draw and measurement produce
X24 for the original argument2. Positive/negative measurement endpoints are
also checked. The hash-gated executable is immutable.

This is a bounded consumer replay, not a full scene replay: resource loading,
message-name lookup, complete numeric substitution, GPU drawing, input and
scene scheduling are not executed. The original message's style index110 and
control sequence come from the delivered source pack. The numeric value3000
continues to be the established emulated-camera fixture.

## Resulting source geometry

Source message `P/Finder_Pho_00_00` consists of U+E01E, group2/type0 argument2,
group3/type39 numeric substitution0, then group2/type0 argument2. Style110
width176 replaces authored width172. With unchanged center-origin translation,
the pane's left edge moves from X5 to X3. The first control restores the two
pixels before the digits:

| Glyph | Local X with controls | LCD X |
| --- | ---: | ---: |
| U+E01E | 0 | 3 |
| 3 | 20 | 23 |
| 0 | 33 | 36 |
| 0 | 46 | 49 |
| 0 | 59 | 62 |

The previous numeric LCD positions already matched and remain identical. The
second control is retained at the end of the substituted text; it has no glyph
following it in this single left-aligned run. Glyph Y, atlas pixels, source
advances, materials and the existing vertical-overhang correction remain intact.

The adapter alone opts into this Camera width/control handling. Parsed text
carries `cursorAdvances` at UTF-16 boundaries through the existing pane override
and raster cache. The bitmap writer accepts them only on the verified one-line,
zero-spacing, middle-left explicit-alignment LA path, rejecting invalid indices,
arguments or unsupported text configurations. The separate Settings title-width
measurement rejects these controlled runs; this work does not generalize rich
text measurement or Camera styles to HOME/other applications.

## Validation and remaining gate

The original-ARM replay passes. Private report:
`/Users/paramveer/.codex/3ds-artifact-overflow/presentation/camera-capacity-symbol-source-gap/arm-replay.json`.
The 46 focused bitmap-font, renderer and Camera composition tests pass, as do
typecheck and production build. Tests include substitution-dependent UTF-16
indices, negative arguments, unchanged device-unit advances under double glyph
scale, unsupported-control rejection, pane override propagation, renderer
forwarding and the final five source glyph origins.

The complete suite reports 1,391 passes, 23 skips, one todo and 36 failures.
All failures are ENOENT for model GLBs omitted from this sparse worktree,
including historical source-model and compact-delivery checks.

The preserved prior diagnostic showed that the source glyph at `(3,1)` and
a symbol-only −2px diagnostic both eliminate all 258 upper pixels over2. That
image diagnostic is supporting evidence, not a fresh browser result for this
implementation. The coordinator owns recapture and whole-scenario acceptance.
