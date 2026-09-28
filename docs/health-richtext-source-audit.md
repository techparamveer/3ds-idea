# Health article rich text and overlapping buffers

The [font/clip continuation](health-font-clip-source-audit.md) now executes the
source style setter, line pitch, warning-prefix measurement and icon writer
with decoded font metadata. Generic clipping and input ownership remain open.

This continues the [scroll-controller audit](health-scroll-source-audit.md) from
integration `aa9f242`. Original article parsing, buffer copying and pane switching
now have executable replay evidence. The live bounded-pagination adaptation is
unchanged: font measurement/installation, clipping and complete control ownership
are still outside the verified sequence.

## Replay boundary

[replay_health_article.py](../scripts/replay_health_article.py) runs the same
hash-pinned Camera-independent Health executable as the earlier audit. It takes
absolute `--code`, `--pack` and `--output` arguments. The pack is the converted
`health-and-safety/messages-and-loose.json`; the report records its SHA256 and
reconstructs the English UTF-16 control runs from preserved MSBT tokens.

Original `0x157724` parses the article; original virtual callback `0x1570f4`
writes the five text buffers. Explicit service fixtures supply message lookup,
allocation/free, memory copy/clear, layout lookup and final text assignment.
Warning-icon measurement is intercepted and its exact prefix/height arguments
recorded. The source `SafeText_D_00` template supplies font height18 and line
spacing3; the replay supplies pitch21. **Style installation and native font
measurement are not executed**, so resulting metrics remain conditional on that
pane state rather than a native-frame fidelity claim.

## Rich text changes the document extent

The parser allocates the article and five equally sized buffers, prepending one
newline and appending two. It begins cumulative height at the pane font height.
On each newline it adds current line height and pane line spacing. Inline
control14 with a two-byte argument sets current height to
`paneFontHeight × (argument × float32(0.01))`; control15 resets the height to the
pane font height. The parser's test is argument length, not a fresh group/type
check. The source English bank uses these runs for font size and four-byte
arguments for colors. Preserve the actual controls rather than applying this
rule indiscriminately to arbitrary message formats.

All arithmetic runs in original ARM float32 instructions. An independent token
walk checks the resulting metric row count and warning heights:

| Source article | Newlines including added padding | Cumulative height with fixture | Metric rows | Text panes assigned |
| --- | ---: | ---: | ---: | ---: |
| `article_1` | 95 | 1991.399658 | 95 | 1 |
| `article_2` | 348 | 7004.700195 | 334 | 5 |
| `article_3` | 213 | 4366.798828 | 208 | 5 |

Metric rows are `trunc(cumulativeHeight / pitch)+1`, not the number of literal
newlines. These source messages contain both enlarged and reduced size runs;
counting lines or assigning every line a fixed height changes maximum scroll.

## Buffers preserve the common document origin

At newline number `n` (one-based, including the prepended newline), buffer `j`
is active when unsigned32 `n+50−200j ≤300`. Thus the retained plain-line windows
are 1–250, 150–450, 350–650, 550–850 and 750–1050. These are overlapping windows,
not five independent 200-line pages.

The full `0x1570f4` callback:

- Copies the entire current line when its buffer is active **or** the line
  contains a control run.
- Otherwise writes one newline into that buffer.
- Advances each buffer's own UTF-16 output count.

All formatting lines are retained in all buffers, maintaining size/color state.
Omitted plain lines remain blank lines; the buffers keep the same document
origin. The replay independently checks the window flags, complete output
bytes and output lengths for all15 article/buffer combinations. It records
buffer hashes, without committing the article text or firmware bytes.

Original running update `0x157c88` is replayed separately with only controller
advancement intercepted, leaving an explicitly supplied parent Y unchanged.
It chooses `trunc(trunc(parentY/pitch)/200)`, hides the old pane and shows the
selected pane while preserving unrelated flags. At pitch21, Y4199 selects0,
4200 selects1,8399 selects1,8400 selects2; later windows and a jump back to0
also pass. This is pane-switch evidence, not a complete scheduled input frame.
No per-buffer origin translation occurs in this switch path.

## Warning placement needs the source measurement path

Before replacing a U+25B3 marker with U+3000, the parser passes a copied line
prefix to the icon callback. The replay establishes that the prefix **includes
the triangle marker itself**, not just preceding spaces. All four markers in
the three English articles have14 spaces followed by the triangle. Cumulative
height arguments are39 for articles1/2, and375 and1049.700195 for article3.

Static trace of callback `0x156db0` configures a native text writer from the
text pane's font, scale, character/line spacing and width. It measures that
prefix through `0x13f268`, resolves `SafeIcon_01` onward, and writes:

- `x = measuredWidth −161`;
- `y = 102 − cumulativeHeight`;
- visible bit set, transform-dirty bits `0x30` cleared, original icon position
  retained in the scene's icon records.

These coordinates are local pane coordinates. Exact horizontal positions remain
unknown until `0x13f268` is replayed with the installed font/tag state or matched
to the browser font renderer. Measuring spaces alone, using generic Canvas
metrics, or substituting a guessed triangle width is unsupported. The icon
writer itself is static evidence here; the replay intercepts its entry.

## Validation and next boundary

The parser/buffer/switch replay passes under `unicorn==2.1.4`; private report is
`reference/health-richtext-source/replay.json` under the firmware artifact root.
Python compilation, relative links and `git diff --check` pass. No runtime or
public assets changed. No source render, application build, browser inspection
or native screenshot comparison is claimed.

Before replacing pagination, resolve **message-style installation and native
font measurement (including control runs), article frame clipping, and physical
repeat/touch ownership/cancellation in one scene update sequence**. The earlier
controller replay plus this parser replay are separate fixtures; combining their
outputs without resolving those boundaries would still be an adaptation.
