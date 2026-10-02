# Azahar reference profile isolation — 24 September 2026

## Current Silent Reference - 2 October 2026

Use the verified private `native-close-clean-20261002` clone under
`/Users/paramveer/.codex/3ds-artifact-overflow/home-fidelity-20261001/` for the
next HOME reference continuation. Its working audio fixture is **Static input2,
Null output1, volume0**, each with `default=false`. Null input1 returned no
samples and two tested profiles stalled at black HOME LCDs; the synthetic input
configuration restored HOME and Health. Do not revert to Auto microphone/output
or change system/Spotify audio. [Recovery evidence](native-silent-reference-2026-10-02.md)
records hashes and limitations. The later [held-HOME replay](native-home-return-2026-10-02.md)
establishes Health -> suspended HOME with temporary Shift binding; that binding
was restored to B after the emulator exited. Preserve this distinction when
replaying the successful measured host gesture.
Recheck process state, identity, config, paths and Sidecar geometry before use.
List all windows, including hidden startup warnings, before driving HOME. In
the [switch replay](home-switch-footer-2026-10-02.md), unchanged held Open input
worked immediately after dismissing the direct-executable warning. An animated
main window does not prove input is unblocked. Quit/Yes may still exit139;
verify PID absence before restoring temporary bindings and report the exit code.
The older locations below are historical, not permission to launch the default
profile. Static microphone data is a reference adaptation, not captured audio.

## Isolation Contract

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

For Other Settings page 2, the SSD copy was stopped and closed before adding
one lower-LCD touch mapping: I (`code:73`) at `(140,20)`. The previous config
was backed up as `qt-config.before-page2-20260926-213917.ini` (SHA-256
`9bcc469cfd66ac4c9046c40e3547776b04df66337fb88cc3fc47e92a7df6fef0`);
the edited config SHA-256 was
`ae8a9fe21810e1537c6d20ccca5e0847bcb64c740d84b0770eb656606e316619`.
After relaunch, U opened Other Settings and 24 I key events visibly selected
page 2. Azahar's own screenshot command saved
`screenshots/System Settings_26.09.26_21.40.05.978.png` at 400×480, SHA-256
`f645cedc1dedcd380972114e5d98da5428f8110cbcc253468baf25bbc792da7f`.
The paired browser lower LCD differs in the left page arrow; see
[the page-2 comparison](progress-2026-09-24.md#sandisk-other-settings-page-2-production-pair--26-september-2026).

The SSD copy was closed again before J (`code:74`, `(180,20)`) and K
(`code:75`, `(220,20)`) page-dot mappings were added. The prior config backup
is `qt-config.before-page34-20260926-214431.ini`, and the edited config
SHA-256 is `ad23851ebcfd285d8b606ef7568022724e7e41e77fcaaca418116ccc844f3526`.
After a Recent Files launch, U entered Other Settings; 24 J and K key events
visibly selected pages 3 and 4. Azahar saved genuine 400×480 screenshots
`System Settings_26.09.26_21.45.42.533.png` (SHA-256
`76ff09145c2883225368be33d32986322e3cb3d733556d81bb994292a7b4daac`)
and `System Settings_26.09.26_21.46.07.466.png` (SHA-256
`3250974938fec12396178767df9f526d314c524978c962a3584a80a4d92d15d3`).
See [the page-3/4 comparison](progress-2026-09-24.md#sandisk-other-settings-pages-3-and-4-production-pairs--26-september-2026).
