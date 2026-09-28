# Isolated eShop direct-launch observation — 24 September 2026

The isolated EUR 10.7.0-32E Azahar profile launched the installed Nintendo
eShop title directly from its title list. After the emulator loading screen,
the first settled LCD pair was **Nintendo Network ID linking information**,
including credit-card and account-activity text, with an upper white-to-yellow
background and a system status strip. The capture is on the SSD at
`reference/native-eshop-2026-09-24/direct-launch-account-information.jpg`.
No account or network action was taken.

Its blue Internet/status strip matches the one visible in the isolated native
Settings capture, indicating a shared upper status presentation in these two
observed title routes. The website's eShop welcome instead shows the HOME
`Disabled` strip through its transparent top margin. The two eShop screens are
different route states, so this observation establishes a status mismatch but
does not identify the exact overlay asset or welcome timing.

This profile-specific entry route is not the published `welcome_U_00` source
layout shown by the portfolio's eShop view. It therefore cannot validate the
welcome animation's pixels or activation timing. The website intentionally
excludes account linking and remote store operations; its welcome screen is a
UI-only portfolio adaptation until a native route that reaches that state is
captured and compared. The isolated Azahar config was restored after the run,
and the default profile config timestamp remained unchanged.

## Repeat route check — 25 September 2026

An independent pass searched the private `reference/` artifact tree for a real
EUR 10.7.0-32E eShop welcome or offline LCD capture. The only genuine eShop
capture found was this route's `direct-launch-account-information.jpg`
(1229 × 768, SHA-256
`12a5fa34e0c0295c3e5cc35752313ac834385cf9485b1d54e6f38c55d46c2905`).
The `eshop-welcome-pass-*.png` files under `reference/integration-eshop-*`
and `reference/eshop-idle-source/render/` are browser/source renders. For
example, `reference/integration-eshop-hud-render/eshop-welcome-pass-069.png`
is a 400 × 480 source-rendered pair (SHA-256
`4b4b93fe517cd84a7afa2810610a89bb74838481f47067aa625759160c364962`).

The pinned isolated Azahar copy was launched again from `reference/` with its
own `user/` tree. The executable hash was
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`,
`use_custom_storage=false`, and that tree contained no symlinks. Direct launch
of the installed European `0000006b.app` again settled on the Nintendo Network
ID information page at 30 app FPS. A B press left it there; three Down presses
scrolled the notice but did not reveal welcome or offline UI. The title was
stopped and Azahar quit without account linking, network/store navigation or a
transaction. The default profile config mtime remained `1790257897` seconds.
No new welcome screenshot was captured.

The native information page shows a blue **Internet** badge and orange battery;
the source-rendered welcome pair shows a gray **Disabled** badge and blue
battery. These are visible differences in the title-owned 20-pixel HUD, but
the pages and runtime status states differ. The executable's HUD update has
separate `r7==2` Internet and `r7==7` Disabled branches, while the browser
intentionally paints the latter with a fixed sufficient-charge battery
([source audit](eshop-welcome-hud-source-audit.md)). This repeat run does not
establish which branch native welcome would show, and no pixel error or
welcome-fidelity improvement can be measured from these unmatched frames.
