# Camera browse message colours

The native/browser browse diagnostic shows grey Slideshow, Shoot and Settings
labels while the browser used black. The Camera adapter now binds each label's
own delivered RI.mstl colour word before evaluating the existing browse pose.
It does not change materials, other text panes or shared source resources.

The pinned EUR Camera title is `0004001000022400`, content index 0 /
`0000001a`. Manifest-backed `packs/camera/contents/0000-0000001a/msg-EU_English.json`
contains P/Brws_02, P/Brws_03 and P/setting with styles 45, 51 and 19.
All three RI.mstl records have +8 word `0xff394045`, little-endian RGBA
`[69,64,57,255]`. This applies the existing decoded Sound guide message-colour
rule to the Camera messages, rather than deriving a colour from screenshots.
The layout's initial text vertex colours are black; its browse clip has no
text colour track. The public resources and converter metadata are unchanged.

Source paths and SHA-256:

- `msg/EU_English.LZ/P.msbt`: `c7c8333e0d051725c45a27bac7f239a6e36699044053b5013cd4edd4cc80be05`
- `msg/EU_English.LZ/RI.mstl`: `f2505d2077a5c90de9ba222d1e12d82d23168f44216f3e21dfdc1e005570ef1a`

A separate bounded executable inspection verified Camera code SHA-256
`3a3c4152ebcc74443ed245a0e9840d31219bbd2559295364cc8dab9497e4492c`.
The menu table at `0x4408b0` identifies the browse archive, layout and button
mount names, but that inspection did not establish the generic text writer.
The correction relies on the already decoded message-style rule; it is not a
new executable replay or proof of native enabled/disabled control scheduling.

Validation: 17 Camera presentation tests and typecheck pass. The regression
checks the delivered records, all three bound top/bottom vertex colours and
source-pack immutability. Coordinator production build and matched recapture
remain required. No browser/native pass is claimed. Existing portfolio media,
orange background fit, timing and inert native controls remain adaptations.
