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

An isolated follow-up tested Azahar's source-supported `touch_from_button`
keyboard mapping, which can map a key to lower-LCD coordinates without a
macOS mouse click. The copied process again used only `reference/user/`, and
the default config timestamp stayed unchanged. However, the computer-use
window capture went black after the mapped key; no resulting native page or
Azahar screenshot was available to verify whether the tap landed. The title
was stopped, Azahar quit, and the isolated config was restored from its
pre-test backup. This workaround remains **unverified**. Do not use its
attempted input as native comparison evidence.

On 24 September, a fresh isolated trial resolved that mapping ambiguity. The
Qt config requires both `profiles\\1\\use_touch_from_button=true` **and**
`profiles\\1\\use_touch_from_button\\default=false`; leaving the latter true
causes Azahar to load the default false value and rewrite the file on exit.
An entry with `code:85,engine:keyboard,x:240,y:170` bound U to the centre of
Other Settings on the lower LCD. With the isolated renderer set to OpenGL,
pressing U visibly highlighted that button and opened Other Settings page 1.
The pair was captured under `reference/native-settings-2026-09-24/` beside the
private firmware artifacts; see [the comparison](native-settings-live-comparison-2026-09-24.md).
The isolated config was restored after the trial; the default profile config
timestamp remained `1790215510` seconds. This verifies this single touch route,
not arbitrary coordinate input, native timing or whole-screen fidelity.

On 26 September, after the user freed Sandisk SSD storage, the current
isolated Camera replay was copied to a growable APFS sparsebundle at
`/Volumes/Sandisk1/Codex3DS-Isolated.sparsebundle`, mounted as
`/Volumes/Codex3DSIsolated`. Sandisk itself is ExFAT, so the APFS layer
preserves the app bundle's links and metadata. `diff -qr` found no file-content
differences immediately after the copy. Azahar launched from the mounted
copy, opened the EUR Camera title, and its screenshot directory was changed
in Azahar Preferences to that mounted copy's `screenshots/` directory. Its
own Capture Screenshot action wrote a genuine 400×480 PNG there:
`Nintendo 3DS Camera_26.09.26_20.51.48.104.png`, SHA-256
`6293cb00c578e5a5e7f8b29784d96a211477b84c8bd4efe88a4f03fa86376feb`.
The prior DeveloperStorage copy and the user's original reference were left
intact. Mount the sparsebundle before opening the SSD copy in later sessions.
The same mounted copy booted EUR HOME, dismissed a native notification and
selected Health in one-row density. Azahar saved
`screenshots/_26.09.26_21.04.22.044.png` at 400×480, SHA-256
`e4a016bd3b8f89b022cbb0032ae8e03b6b7469f5ef1b9c913907ed49c07c37fc`.
This is a native reference capture, not a whole-scenario fidelity claim.

The same Sandisk-backed copy launched the EUR System Settings title through
Azahar's **File → Recent Files** menu and saved
`screenshots/System Settings_26.09.26_21.15.48.805.png` at 400×480,
SHA-256 `68e48e0e742aae834b3e7e600221ed8e80c1b567edf5e4d4ac91d41d8a145d3f`.
This direct-title launch is recorded separately from a HOME-to-Settings route;
it does not prove matched launch input or motion.

After a fresh launch from the SSD copy's game list, mapped lower-screen touch
U opened Other Settings page 1. Azahar saved
`screenshots/System Settings_26.09.26_21.33.43.361.png` at 400×480,
SHA-256 `fb1a9fb404082e68fa06928aac77a4604c1340e91ecebf9a06d9e28d9f5470f7`.
The subsequent production-browser pair matches settled pixels on both LCDs,
but the native title-list entry still differs from browser HOME entry.
