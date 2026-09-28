# Health installed font metrics, warning width and clipping boundary

The [key/clip-consumer continuation](health-key-clip-consumer-audit.md) now
replays Health's 0/1 held-key cadence, prescribed touch ownership and the generic
rectangle command consumer. Article-specific clip production remains open.

Continuation of the [rich-text audit](health-richtext-source-audit.md), based on
integration `40b0539`. Native setter and measurement arithmetic now support the
previous18px/3px/21px metric fixture. This remains a bounded source replay; the
resource loader, native draw/clip pass and complete input owner are not emulated.
Live pagination and article drawing are unchanged.

## Original setter installs the source body style

[replay_health_font.py](../scripts/replay_health_font.py) runs original
`0x113e6c`, reached by text assignment `0x13317c`. It receives style record2
from the English Health message pack and the decoded shared-font metadata.
Style lookup, font virtual methods and final text/capacity setters are explicit
fixtures. The style arithmetic and pane field/dirty-bit writes run original ARM.

The font is the shared `cbf_std.bcfnt` binding, decoded source SHA256
`95d5a675ae14cc22b84b5b89c8d10cc894f1e2dfaf00a1168545fe76fb1eb581`.
The report also hashes the JSON fixture and converted message pack. Font
width/height25×30, body scale float32(0.6), lineSpacing3 and characterSpacing0
produce:

| Installed field | Native replay value |
| --- | ---: |
| Text width at pane+0xe4 | 15.000000953674316 |
| Text height at pane+0xe8 | 18 |
| Line spacing at pane+0xec | 3 |
| Character spacing at pane+0xf0 | 0 |
| Line pitch from original `0x156c80` | 21 |

`0x113e6c` compares old values, writes changed values and sets bit4 in pane+0xfd.
This advances the prior audit beyond merely borrowing layout template metrics.
It does **not** claim a complete runtime font-loader replay: supplied virtual
methods return dimensions/advances from the extracted source font. Binding
selection and resource lifetime still belong to the native resource path.

## Warning-prefix width now executes the native measurement chain

Original writer initializer `0x13398c`, scale setter `0x12cdc8`, and complete
width chain **`0x13f268 → 0x12c7b8 → 0x12c160`** execute, including the original
UTF-16 iterator. The font's virtual width methods are supplied from source
metadata: U+0020 advances9 and U+25B3 advances24. Character spacing is0 and
writer scale is float32(0.6). The actual source prefix is14 spaces followed by
the triangle, with no formatting runs in these four marker prefixes.

Native accumulation gives **90.00001525878906px**, rather than an assumed
measure of spaces only. An independent float32 accumulation checks the result
and the replay asserts the exact15 font lookups. This verifies the plain prefix;
it does not establish every article's rich-text tag callback or line wrapping.

The full original icon writer **`0x156db0`** now executes through native
measurement and formatting, with only layout-name lookup supplied. It sets
visibility, clears transform-dirty bits0x30, stores the pane pointer/position in
the scene and produces:

| Cumulative parser height | Icon local X | Icon local Y |
| ---: | ---: | ---: |
| 39 (articles1/2) | −70.99998474121094 | 63 |
| 375 (article3 first warning) | −70.99998474121094 | −273 |
| 1049.7001953125 (article3 second warning) | −70.99998474121094 | −947.7001953125 |

These are the source20×20 `SafeIcon_01..05` pane origins, under `N_TextArea`,
before parent scroll and screen projection. They must not be treated as HTML
left/top coordinates or pasted directly onto an adapted eight-line page.

## What the source layout establishes about clipping

Static inspection of `SafeText_D_00` establishes hierarchy and geometry:

- `N_TextArea` is a24×30 transform pane containing all five text panes and
  five warning icons. Its size is not a measured article viewport.
- Each text template is284×105, translation[−10,92], with top-center origin.
  Original text assignment changes font/spacing and text contents; the replay
  does not establish a105px vertical clipping operation.
- `W_TextFrame_00` is a **sibling** of `N_TextArea`, with top-center origin,
  translation[0,120], size320×214 and zero frame sizes. It cannot establish an
  inherited parent clip around those text children.
- `B_Touch` is another sibling,294×180 at[−12,0], selected by `G_Touch` for
  input. A hit region is not evidence of a drawing scissor.
- The title background is a later sibling,320×28 at[0,120], with pane alpha249.
  The scrollbar background is32×183 at[160,92]. These overlay dimensions and
  draw order do not by themselves prove an opaque article crop.

The Health scene vtable's slot0x0c resolves to the no-op `0x158af8`; the article
initializer builds layout, parser, scrollbar, touch and controller through its
other virtual slots. No scene-local clip rectangle was established by those
paths. The remaining task is to trace the **generic layout/text drawing and
render-manager scissor state**, including the title/footer composition and
screen transform. Do not select the touch rectangle, text template or window
rectangle merely because one looks plausible in a browser.

## Verification and remaining work

New replay passes with private `unicorn==2.1.4`, taking absolute `--code`,
`--font`, `--pack` and `--output` paths. Private report:
`reference/health-font-clip-source/replay.json` under the firmware artifact root.
Python compilation, relative links and `git diff --check` pass. No application
or public asset changes, source screen render, browser inspection or native
frame comparison is claimed.

A live continuous article still requires the generic clip/draw pass, rich-text
rendering equivalence and shared repeat/touch ownership/cancellation. The
warning width and base line metrics are no longer guesses, but these separate
fixtures do not yet establish that combined implementation.
