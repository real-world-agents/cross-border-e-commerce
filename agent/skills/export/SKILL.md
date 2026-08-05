---
description: Use after generating reports or other sandbox artifacts, or when the user asks to save/export/download files from /workspace to a folder they can open in the IDE.
---

# Export artifacts to a user-visible location

Sandbox files under `/workspace` are **not** visible in the project tree. When
you have finished generating something worth keeping (briefs, reports, CSV,
etc.), offer to export a copy onto the host project disk.

## When to run

- After you write deliverables under `/workspace` (e.g. `/workspace/reports/…`)
- When the user asks to save, export, download, or “put this in my repo”
- Skip if they already declined, or there are no files to export

## Workflow

1. **Discover** — `list_sandbox_artifacts` on the folder you wrote (often
   `/workspace/reports` or `/workspace`). Confirm the file paths.
2. **Ask destination** — use `ask_question` with freeform enabled:

```
ask_question({
  prompt: "Where should I save these files on your machine (project-relative path)?",
  options: [
    { id: "exports", label: "exports/ (recommended)" },
    { id: "reports", label: "reports/" },
    { id: "skip", label: "Don't export — keep only in this chat" }
  ],
  allowFreeform: true
})
```

   If they type a custom path (`exports/korea`, `reports/2026-08`, …), use that.
   Paths must stay **inside the project root** — the tool enforces this.

3. **Copy** — `export_artifacts` with:
   - `sources`: the sandbox file paths from step 1
   - `destination`: their chosen host folder (`exports`, `reports`, …)

4. **Confirm** — tell them the returned `relativePath` values so they can open
   the files in the IDE. Do not invent paths.

## Rules

- Always ask before exporting (unless they already gave a destination).
- Prefer exporting the final deliverables only, not intermediate scratch files.
- If `list_sandbox_artifacts` returns no files, say so — do not claim an export.
- If `export_artifacts` returns `errors`, report them and retry only after fixing
  sources/destination.
- Never tell the user that `/workspace/...` is a Finder/IDE path; the host
  `relativePath` from the tool is what they can open.
