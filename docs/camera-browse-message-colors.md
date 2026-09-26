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

Validation: 17 Camera presentation tests, typecheck and the production build
pass. The regression checks the delivered records, all three bound top/bottom
vertex colours and source-pack immutability.

The coordinator opened Camera → View Photos/Videos in the production browser
at integration commit `61e2e6f`, captured the raw 400×240 and 320×240 render
targets, and inspected the native/browser contact sheet. The new capture and
empty-mask report are under
`/Users/paramveer/.codex/3ds-artifact-overflow/captures-20260926/reference/scenario-matrix/v1/captures/camera-browse-message-color-61e2e6f-20260926/`.
Against the preserved native populated-browse screenshot, lower pixels with a
channel difference above 2/255 fall from **23,499 to 22,856**; lower RGB MAE
falls from 24.5402 to 23.8087. The broad Shoot-label rectangle
`[92,210,88,30]` falls from **475 to 0** differing pixels. The Slideshow
rectangle `[92,0,138,30]` falls from 983 to 837, and Settings
`[238,210,82,30]` from 962 to 940. These diagnostic rectangles include
surrounding chrome; they are not acceptance masks. Upper residuals remain
large because native stereo photos and browser portfolio JPEGs, selection and
entry histories differ. The new raw comparison is **95,350 upper / 22,856
lower** differing pixels; the whole scenario still fails. Existing portfolio
media, orange background fit, timing and inert native controls remain
adaptations.
