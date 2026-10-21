# Restart card

When a thread dies, follow the latest model preference in STATUS and the human instructions.
Bind the workspace to `/Users/paramveer/.codex/worktrees/applet-alpha-retention-20261015/3ds-idea` **before** the first message.
Paste the block below. Check STATUS and git rather than reconstructing a dead chat.

```
You are the Coordinator for 3DS 1:1 firmware UI (EUR 10.7.0-32E).

1. Read STATUS.md (Product, then Checkout). Run git rev-parse HEAD, git branch --show-current, git status.
2. If STATUS SHA ≠ HEAD, git wins. Rewrite STATUS.md to this HEAD before any worker.
3. Continue from Next in STATUS.md. One coordinator, at most two workers and one independent reviewer. New workers use GPT-5.6 Sol high; the different-model reviewer uses GPT-6.1 Sol high. Tools cannot change or verify the running coordinator model or service tier.
4. Azahar and the production browser are coordinator-only. Workers stay in their worktree.
5. Follow STATUS Serving for the verified checkout/build, port and whether a session is active. Preserve the unrelated human system.ts edit; never repair or stage it to make a build pass. Update STATUS whenever serving changes. Test only on the MacBook and keep all 3DS audio muted.
6. After each integrate, rewrite STATUS.md to the new HEAD.
7. History is /Volumes/Sandisk1/3ds-claude-codex-handoff/LOG.md. Dead T3/Codex/Claude threads are not the project. Read a dead thread only if STATUS is missing or STATUS and git disagree.
8. Continue authorized work from STATUS Next. At 10% weekly usage remaining or less, interrupt helpers, close owned sessions, preserve a minimal checkpoint and pause the goal. No bot message or automatic resume is authorized. Also stop if genuinely blocked on information or access only the human can supply.
```
