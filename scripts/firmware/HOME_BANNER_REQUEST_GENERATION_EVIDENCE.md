# Ordinary HOME banner request generation

2026-09-23. Ordinary selection input changes the selected slot and cursor
state without immediately resolving the selected banner. The lower idle
update calls the resolver after the ordinary upper manager pass. Entering
idle on motion completion also calls it, including before mode3 replays a
pending move. A resolver call is an observation opportunity, not proof that
a new request was accepted: the native setter deduplicates requested keys,
types and options independently of selected-slot changes.

This extends [host ordering](HOME_HOST_ORDER_EVIDENCE.md),
[acceleration and replay](CURSOR_ACCELERATION_EVIDENCE.md), and
[direction and toolbar navigation](HOME_DIRECTION_MASK_EVIDENCE.md).
It adds source evidence only. Existing banner lifecycle/target and folder
close evidence remain authoritative for their separately executed services.
No runtime, public asset, browser, emulator or earlier evidence file changes
are included.

## Source and reproduction

Owner-supplied EUR HOME `0004003000009802`, version24576, mapped at
`0x100000`. Executable SHA-256:
`243a728e0abb04cb587e89a0bfa671c554ec7e9a347efc3c9c2739dbecd61ca9`.

Run [home_banner_request_generation.py](home_banner_request_generation.py)
with Unicorn2.1.4 and Capstone5:

```sh
python scripts/firmware/home_banner_request_generation.py \
  --code /private/path/exefs/code.bin \
  --output /private/path/native-banner-requests/verified
```

The script rejects any other executable hash. It executes original ARM
instructions with supplied mature objects and explicit service/visual
endpoints. Numeric results, firmware and25 source excerpts remain private:
`/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E/audio/native-banner-requests/verified/`.
The report hashes original source bytes and rendered excerpts separately.

| Artifact | SHA-256 |
| --- | --- |
| Fixture | `7b1be990ca14d0a5b650f8260647d64c4682e02a793f0fb8bbcfa597fb5d6b23` |
| `checked.json` | `d686fa7d223fbb9ec505d831d5dbc148d7cb17bbedadfbad248b88afda94cdb4` |

All13 ordinary request cases,6 gate cases,10 transition cases and8 toolbar
category cases pass. The inherited bounded registration check also passes.
Report groups are `scenarios`, `gates`, `transitions` and `toolbar`; each
contains events, supplied-state results and encountered endpoint records.
Pass indices start at zero. Direct function and fragment cases are labeled
and must not be treated as full host passes.

## Ordinary input and the later lower observation

`0x2968fc` executes successful grid event4/6 movement for root and child
folder contexts. The tested input calls do not enter resolver`0x1e0f44`,
category dispatcher`0x1d71c0`, request setter`0x1ed6ec`, or banner
manager`0x24c0ac`. The outgoing cursor effect`0x1de858` calls`0x2660a0`
and alternates its effect index. The presentation worker separately proved
that callee's visibility, position, Scale and DisAppear work; it does not
issue a banner request. This fixture treats that visual effect as an endpoint.

For an in-view move0→1, the next original host pass enters the upper manager
with the previous requested type1/key, then runs lower idle`0x2960ec`.
The call at`0x296468` resolves slot1 and reaches the setter. A vacant slot
under the supplied ready/default-theme state requests type7 with the
canonical empty key. The first changed request writes pending1, type7 and
wait0. Root and child folder2, each with event4 and event6, all produce
that ordering.

An edge move2→3 enters mode3. With the supplied acceleration counter5,
the real entry chooses duration5. Each of the five subsequent host passes
runs the upper manager first. Only the fifth lower pass enters idle and
resolves slot3. The fixture does not advance the manager's wait state:
manager entry is deliberately a recording endpoint here.

Tile widget callback1 through`0x2a3db8` behaves similarly. Selecting an
in-view tile1 changes selection during input and resolves at the later
idle-update call. Selecting off-view tile4 enters mode3 and resolves at its
completion. These cases execute the widget callback, not touch hit testing.

The selected slot is read through the pointer supplied on the resolver's
stack, verified as`S+0x1178`. It is not inferred from a post-pass snapshot.
The resolver also reads toolbar state and focus, described below.

## Idle calls, completion and replay

Lower idle`0x2960ec` compares selected`S+0x1178` with`S+0x3c34` and
focus`S+0x3c8c` with`S+0x3c36`. A difference sets dirty byte`S+0x3c38`.
That comparison does not gate resolver call`0x296468`: eligible ordinary
idle updates call it even when selection and focus have not changed.

Mode3 lower branch`0x2b709c` ticks`0x2a1bbc`. On completion it calls
mode setter`0x1e8f38(0)` at`0x2b70b8`. That executes idle entry`0x29a184`
and resolver call`0x29a4dc`. Only after entry returns does the lower branch
replay pending movement through`0x2968fc` at`0x2b70e4` or`0x2b7128`.

The executed counterexample starts2→3, queues another right event while
busy, and advances five host passes. The completion resolves **slot3**,
then replay changes selection to4 and starts another mode3 at elapsed0.
There is no second resolver call for slot4 in that pass. Resolving the final
selected snapshot would request the wrong slot at this boundary.

Ordinary page and density completion also enter idle:

| Mature motion | Actual completion path | Result |
| --- | --- | --- |
| Mode2/page | `0x29bc40` → tick`0x2a1c04` → ordinary setter site`0x29c2c0` | Idle resolver`0x29a4dc` |
| Mode3/scroll | Tick`0x2a1bbc` → setter site`0x2b70b8` | Idle resolver, then pending replay |
| Mode5/density | Tick`0x1d2fac` → `0x2b72f0` → setter site`0x2b72f8` | Idle resolver`0x29a4dc` |

Mode2/5 cases supply duration10 and elapsed0 or9. The actual tick advances
elapsed0→1 without a resolver; elapsed9→10 enters idle and resolves slot1
after that host pass's upper manager. Their initiation and duration choice
are outside this check. Page special-action flags, dragging and overlay
branches can choose different exits; this is not proof that every motion
endpoint in every mode resolves the banner.

## Toolbar focus and gates

The resolver reads toolbar-active byte`S+0x3ca8`, then signed focus at
`S+0x3c8c`. An observation must therefore preserve context, selected slot,
toolbar-active state and current focus at the call boundary. A selected slot
alone cannot classify toolbar requests. The ordinary grid cases have focus−1.

All eight toolbar focuses execute the native idle-update and resolver up to
the category dispatcher. Their dispatcher is an endpoint, so toolbar title
lookup and the resulting request types are not newly proved here.

| Focus | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Category | 2 | 5 | 4 | 6 | 7 | 8 | 2 | 2 |

The selected-slot pointer still exists on this route. Category selection
uses toolbar focus; it is not evidence that the selected grid tile changed.

Executed gates preserve the previous requested type1 and wait99:

| Gate | Resolver entered? | Setter entered? |
| --- | --- | --- |
| Upper ready byte`upper+0x2fc=0` | Yes | No |
| Vacant tile before initialization`init+0xe3=0` | Yes | No |
| Manager initialization`M+0xe=0` | Yes, category dispatch also reached | No |
| Lower task lifecycle ineligible | No | No |
| Full lower dispatch overlay`S+0x3fe0` | No | No |
| Idle-update boundary overlay`S+0x3fd0` | No | No |

The last case calls`0x2960ec` directly with the overlay present and its
preceding overlay setup flags supplied. This is distinct from a full host
pass: earlier full-HOME processing can change an overlay's state. In the
separate direct mode0-entry case, the same`S+0x3fd0` pointer does **not**
suppress`0x29a4dc`. Idle entry skips an earlier transition query, converges
on the resolver, and requests type7. An `idleOverlayActive` input must refer
to state at the idle-update boundary; this audit does not emulate overlay
construction, lifetime or service behavior.

Additional static resolver gates require task lookups1/5, upper readiness,
and either `0x232250()==5` or both bits`0x2` and`0x100` at the nested
status object's`+0x1eaa`. This fixture supplies the lookup objects and return5;
it does not newly exercise those alternate missing-task/status-bit cases.

## Resolver calls versus accepted request writes

`M=0x32ebf4`; the requested key is stored at`0x34c250`. Category dispatcher
`0x1d71c0` first checks manager initialization. Its ordinary default/clear
path calls the setter at`0x1d7664`.

Executed classifications cover two deliberately narrow states:

- Vacant record, canonical empty key, initialization ready: category2 → type7.
- Present record with available-bit clear: category3 → clear type13, also
  using the canonical empty key.

The available-application/folder metadata matrix belongs to the earlier
banner-target evidence. This new fixture does not replace it.

Setter`0x1ed6ec` compares the requested key's low/high/medium components,
requested type`M+6`, option bytes`M+7/+8`, and force field`M+0x10`.
Matching ordinary fields return at`0x1ed944`. It performs metadata stores
at`M+0xb8/+0xbc` before that comparison, so “deduplicated” does not mean
no memory writes whatsoever. The fixture records pending/type/wait writes.

For the tested changed key/type with a nonzero previous type, the original
setter writes pending`M+4=1` at`0x1ed7ec`, copies the requested key, writes
type`M+6` at`0x1ed7f8`, copies options, and resets wait`M+0xc8=0` at
`0x1ed870`. The following label-format branch is explicitly omitted by
jumping from`0x1ed874` to`0x1ed920`; key/type/pending/wait logic remains
original. Unusual type8, force, option-only and metadata bookkeeping paths
are not exhaustively exercised and should not be generalized from this case.

After one vacant-slot request, the dedup case explicitly supplies pending0
and wait9. The next unchanged idle update and a subsequent move to another
vacant slot each call the resolver and setter. Neither writes pending/type/
wait, and wait remains9. This proves both that an unchanged selected slot
can produce a resolver call and that a changed selected slot need not produce
a new accepted request. Navigation should report resolver boundaries; the
banner service owns classification, deduplication and request acceptance.

The upper manager sees previous **requested state** before a later lower
write in the ordinary cases. This fixture does not inspect an active banner
instance or reproduce manager teardown/loading/presentation. Existing
lifecycle evidence must determine when an old instance remains presented.

## Folder close and root-ready boundaries

The bounded normal-close subsection`0x1de4c8..0x1de550`, with its expected
prefix registers supplied, directly constructs an empty-key category3 request
and reaches clear type13. It does not go through the selected resolver and
does not call the manager. With lower update disabled afterward, the next
upper manager entry sees type13. Combined with the earlier close-input proof,
this supplies a distinct input-before-manager clear path; it does not prove
that the entire close prefix ran inside this fixture.

For root-ready completion, actual lower`0x29f0a4` runs in a host pass with
root context/history already supplied. Whole restoration`0x2b021c` is an
endpoint. With left edge3:

- Restored selected3 is visible: the same lower pass enters idle and resolves3
  after the upper manager.
- Restored selected2 or6 is outside the viewport: that pass starts mode3 and
  does not resolve. With the supplied acceleration state, resolution occurs
  on the fifth later lower update, report pass5.

Normal folder open is bounded more tightly: only completion branch
`0x29bb54..0x29bb60` runs, with child context2 and selected1 already supplied.
It enters mode0 and resolves1 through`0x29a4dc`. Folder asset creation and
the preceding controller/completion predicate are outside this fragment.

## Direct manager invocation and scope limits

The static direct ARM branch scan finds manager`0x24c0ac` only at wrapper
site`0x2857e0`. Wrapper`0x28574c` has direct references at normal upper
update`0x286f30` and upper initialization`0x287840`. No ordinary tested
selection, idle or mode3 completion path calls the manager from lower work.
The request setter changes requested state; it does not itself run the manager.

There is an explicit separate task-update route: helper`0x1e1988` calls the
lower task's vtable`+0x20` at`0x1e19d8`, performs mode11 setup, calls the
resolver at`0x1e1a34`, and tail-calls the stored upper task's vtable`+0x20`
at`0x1e1a60` when present. That upper call can reach its manager subject to
upper gates. It is static evidence of an additional invocation opportunity,
not an executed ordinary grid/tile/mode3 route in this audit. Direct branch
search cannot exclude indirect calls or prove one manager call universally.

Objects, keys, records, ready flags and service returns here are supplied
fixtures, not captured hardware state. The synthetic map provides records
for tested root/child slots; it does not reconstruct the real database or
validate all folder extents. Constructor, renderer, text, metadata, overlay
and platform-service endpoints are explicit in the script/report. Full
service initialization or a broad special-state audit would exceed this
bounded request-timing question and remains outside the evidence.
