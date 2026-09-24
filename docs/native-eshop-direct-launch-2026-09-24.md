# Isolated eShop direct-launch observation — 24 September 2026

The isolated EUR 10.7.0-32E Azahar profile launched the installed Nintendo
eShop title directly from its title list. After the emulator loading screen,
the first settled LCD pair was **Nintendo Network ID linking information**,
including credit-card and account-activity text, with an upper white-to-yellow
background and a system status strip. The capture is on the SSD at
`reference/native-eshop-2026-09-24/direct-launch-account-information.jpg`.
No account or network action was taken.

This profile-specific entry route is not the published `welcome_U_00` source
layout shown by the portfolio's eShop view. It therefore cannot validate the
welcome animation's pixels or activation timing. The website intentionally
excludes account linking and remote store operations; its welcome screen is a
UI-only portfolio adaptation until a native route that reaches that state is
captured and compared. The isolated Azahar config was restored after the run,
and the default profile config timestamp remained unchanged.
