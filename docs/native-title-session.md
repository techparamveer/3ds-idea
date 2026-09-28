# Foreground native title asset lifetime

`createNativeTitleSession` owns the resolved resources and pending acquisition
for one foreground application view. It wraps the
[explicit native title loader](native-title-assets-validation.md). Stock screen presentation uses it per foreground owner. The presentation layer
owns its deadline, atomic screen publication and recoverable failure policy;
see [native screen readiness](native-screen-readiness.md).

The request identifies the AppInstance owner, view, title, explicit pack/layout/
animation selections and borrowed shared-font objects. Reopening the same title
under a new instance invalidates its prior completion. The session snapshots
request arrays/font bindings, coalesces unchanged requests and invalidates when
any selection or font identity changes. No Three.js or AppModule mutation occurs.

The scene must call `update(null)` when the foreground owner closes, suspends,
sleeps or loses the native view. Replacement aborts acquisition immediately and
disposes resolved resources. An older completion is disposed rather than
published, even if its loader ignores cancellation. Errors from older generations
are ignored. Current errors remain visible in the state until an explicit retry
or a changed request, avoiding a retry loop on every animation frame.

States are idle/loading/ready/error. Only the ready state's assets may be painted.
The change callback invalidates the screen; it may synchronously replace or close
the view. `dispose()` aborts/releases everything without a teardown callback.
Dispose this session before disposing the HOME/shared fonts it borrows.

Validation: seven controlled acquisition-race tests plus the35 real-resource
loader checks pass, with integration typecheck and production build. Logs are
`reference/native-title-session-tests.log` and
`reference/native-title-session-typecheck.log` and
`reference/native-title-session-build.log` under the firmware SSD artifact
root. These checks establish asynchronous ownership, not app lifecycle wiring,
keyboard visual behavior or native fidelity.
