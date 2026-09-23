# Native keyboard sound resources and events

The keyboard uses its own `swkbd_bcwav_LZ.bin` resources. Do not substitute HOME
cues or assume the HOME-only synthesis profile applies to this title.

Assets owns an isolated offline keyboard sound decoder/exporter and focused
tests, plus source event-mapping evidence. Inventory the supplied archive's
15 BCWAV members and SSEQ member with original title/version/member hashes.
Use an established primary decoder implementation as a cross-check; record
encoding, channels, sample rate, samples and loop boundaries. Keep unsupported
sequence/resource semantics explicit, without fabricated replacement audio.

Trace which resource IDs native keyboard events actually request: ordinary
character keys, modifier keys, backspace, button decisions, cancellation and
invalid input where reachable. Separate callback phase/event identity from
resource identity, and distinguish source-verified behavior from filename hints.
Use bounded original-code fixtures when feasible. Runtime currently owns the
first lower-screen initialization trace; avoid editing its artifacts or app
modules. Presentation owns animation hierarchy decoding/binding.

New decoder/exporter modules and tests may be committed; source executables,
complete archives and replay scratch remain on the private SSD. Parameterize
paths. Do not regenerate public HOME/audio delivery or wire speculative keyboard
cue timing into the scene. The coordinator will integrate a resource-only pack
and event transport once native keyboard actions and provenance are established.
