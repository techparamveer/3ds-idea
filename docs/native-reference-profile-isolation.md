# Azahar reference profile isolation — 24 September 2026

Native comparison must use the versioned artifact profile, not the machine's
default Azahar profile. The pinned Azahar 2126.1.2 macOS frontend changes its
working directory to the parent of its `.app` bundle before it discovers
`user/` ([source](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/citra_qt/citra_qt.cpp#L4522)).
`CITRA_USER_DIR` is a saved-path token, not an environment variable for that
discovery ([source](https://github.com/azahar-emu/azahar/blob/9e6f523a57fac9564ac0bf8286db3c3702d301ec/src/common/file_util.cpp#L935)).
Launching `/Applications/Azahar.app` with a changed shell working directory
therefore still uses the default macOS profile. An earlier attempt updated
default-profile runtime state, including config/log and title caches. No
repository or delivered website files were changed by that attempt; do not
restore the default profile from an older backup over possible user changes.

The safe arrangement is a real copy of `Azahar.app` alongside the cloned
`reference/user/` directory under the private firmware artifact root. Before
launch, verify that the copied executable has SHA-256
`3dfdfbed147cfb420f224385e832191833d07b0951d4b86326ab193e2deb3b21`,
`reference/user/` has no symlinks, and `use_custom_storage=false` in
`reference/user/config/qt-config.ini`. Start the copied absolute
`Azahar.app/Contents/MacOS/azahar` executable directly. Azahar warns that a
direct executable launch may lack camera emulation; that mode is suitable for
UI reference only and is not Camera hardware evidence.

A guarded startup and System Settings launch confirmed the copied process had
`reference/` as its working directory and opened log, NAND and shader files
exclusively beneath `reference/user/`. The default macOS profile's config
timestamp stayed unchanged at `1790215510747504750` ns; the isolated config
timestamp advanced. The native Settings main page appeared and the process
stopped cleanly. The computer-use coordinate mapping prevented reliable touch
navigation beyond that page, so this session contributes an isolation smoke
check, **not** a matched native page comparison. Do not call the current site
1:1 on this evidence.
