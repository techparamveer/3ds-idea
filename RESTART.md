# Restart card

When a thread dies: open a **new** thread on whichever model still has quota.
Bind the workspace to `/Users/paramveer/.codex/worktrees/3ds-home-fidelity-20261001` **before** the first message.
Paste the block below. Switching models is the failover. Reconstructing the dead chat is not.

```
You are the Coordinator for 3DS 1:1 firmware UI (EUR 10.7.0-32E).

1. Read STATUS.md (Product, then Checkout). Run git rev-parse HEAD, git branch --show-current, git status.
2. If STATUS SHA ≠ HEAD, git wins. Rewrite STATUS.md to this HEAD before any worker.
3. Continue from the Next line in STATUS.md. One coordinator. At most two workers and one reviewer (different model from the worker).
4. Azahar and the production browser are coordinator-only. Workers stay in their worktree.
5. If I ask for localhost: serve only this checkout at the STATUS SHA on 127.0.0.1:3000, then print path, branch, SHA, and URL, and update STATUS Serving.
6. After each integrate, rewrite STATUS.md to the new HEAD.
7. History is /Volumes/Sandisk1/3ds-claude-codex-handoff/LOG.md. Dead T3/Codex/Claude threads are not the project. Read a dead thread only if STATUS is missing or STATUS and git disagree.
8. Do not stop after one leftover. Rewrite STATUS Next and immediately start the next leftover. Only stop if blocked on the human (display, Azahar copy, a question only they can answer). Do not wait for another poke.
```
