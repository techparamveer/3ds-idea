@AGENTS.md

`AGENTS.md` is the shared authoritative repository guidance. Read its linked
scope and subsystem documents before editing; do not duplicate project rules here.

Start with `GOAL.md`, `docs/portfolio-ui-scope.md`,
`docs/progress-2026-09-24.md` and `docs/feature-map.md`. The progress record
separates code, browser checks and native comparisons; use its evidence links
before describing a feature as complete. For implementation, follow the
matching document in `docs/architecture/README.md` and work only in your
assigned worktree.

The five long-lived lanes, ownership and staging rules are in `AGENTS.md`.
Follow [the native verification loop](docs/architecture/verification.md):
only the coordinator drives isolated Azahar and the integrated production
browser, captures raw LCD pairs, diffs them and inspects the contact sheet.
Report your commit, checks, firmware asset list, evidence tier, target capture
pair and unresolved differences. Tests, source renders and browser operation
alone do not close a fidelity claim.
