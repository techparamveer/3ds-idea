# One counted HOME navigation pass

`stepHomeNavigationPass` composes the existing native input producer, direction
consumer, one lower scene update and the later primary Loop submission. The
caller supplies one already sampled poll and a pure cursor-eligibility function
evaluated after lower work. It returns the producer/scroll state, the intermediate
state after input, key events and observations labeled `input` or `lower`.

This prevents two ordering errors: an input-entered mode3 must spend its first
lower update in the same pass, and a completion replay that changes Loop step
must affect that same pass's later cursor submission. A replay starts its new
motion at elapsed0; it does not spend a second lower update immediately.

The banner manager and attached3D pass remain external. Feed input observations
before the manager and lower observations after it through `stepHomeBannerHost`.
Use `resolveHomeBannerHostObservation`, which retains the pre-replay slot, rather
than resolving the final navigation snapshot. Cue delivery and the new retained
cursor Scale/effect controllers also consume the ordered observations externally.

This unit does not own elapsed time, the source sampler, raw touch acceptance,
folder-close ownership, non-direction commands, DOM input, rendering or audio.
The host must supply actual layout eligibility; viewport culling is not a native
visibility rule. Unsupported input or lower routes atomically return the original
state and no observations for another owner. That rollback is an adapter handoff
policy, not a claim that native firmware rewinds a partially executed pass.

Tests compare all78 original main-loop polls, including selected slots, repeat
counters, scroll progress/counts and submitted/current Loop frames, plus the
separate original baseline and accelerated press. Expectations come from
`audio/native-host-order/verified/checked.json`, SHA
`44f50ab920d2e78c22bd14c4bc6f014b22eaefd7f5f7b0f314530d2fc81fd733`.
The committed numeric fixture has SHA
`9804bfc1d144a47330a905a1023806ddc3f88a108c37edc861b1b50bb2142371`.
The private `reference/export-navigation-pass.py` copies those source observations
and pins its own hash. No firmware or executable bytes are committed.

Additional joint checks cover completion replay's banner slot and step3 submission,
overlay-gated replay with an independently hidden cursor, and atomic unsupported
handoff. The focused pass, consumer, producer, sampler and Loop suite passes111
tests, no skips; typecheck passes. Logs are
`reference/native-navigation-pass-{tests,typecheck}.log` under the firmware SSD
artifact root. This pure pass is ready for live host integration; the scene still
uses the previous generic input scheduler.
