# Dark Card Collection — Request & Token Efficiency

OpenCode free tier = ~200 model requests / 5h shared across all free models.
Every orchestrator step, subagent, and user pause is one request. Budget matters.

- Work directly with the **main agent** (big-pickle) for most tasks: it reuses
  the prompt cache (~97% hit) and costs far fewer requests than delegation.
- Use `@orchestrator` only for genuinely large, multi-phase changes, and give it
  a complete spec so it can delegate in 1-2 big batches.
- Verify with `pnpm lint` and `pnpm test` before closing a task.
