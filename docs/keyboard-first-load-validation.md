# Keyboard input on first load

The scene previously listened for key events on the console host but focused it
only after a pointer press. A fresh page therefore ignored keyboard commands.
After registering its listeners, the scene now focuses the host if the document
body still has focus. An already focused control is preserved, and focusing the
console does not scroll the page.

Verified in the live browser on 2026-09-10 after reloading without any pointer
interaction: the ready console gained focus; Space closed the hinge to 0° and
reopened it to 155°; E selected item 2; A opened its folder; H returned to HOME.
VGPU reported ready and the browser warning/error log was empty. TypeScript and
the production build passed. This interaction repair does not establish hardware
visual fidelity or authentic HOME Menu assets.
