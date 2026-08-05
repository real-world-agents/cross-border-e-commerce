import { defineTool } from "eve/tools";
import { z } from "zod";
import { normalizeSandboxPath } from "../../lib/export-paths";

export default defineTool({
  description:
    "List files under a sandbox path (default /workspace) so you can choose what to export to a user-visible host folder.",
  inputSchema: z.object({
    path: z
      .string()
      .optional()
      .describe("Sandbox directory to list, e.g. /workspace/reports. Defaults to /workspace."),
  }),
  async execute({ path: rawPath }, ctx) {
    const sandbox = await ctx.getSandbox();
    const dir = normalizeSandboxPath(rawPath ?? "/workspace");

    const listed = await sandbox.run({
      command: `if [ ! -e ${shellQuote(dir)} ]; then echo "__MISSING__"; exit 0; fi; find ${shellQuote(dir)} -type f -print | sort`,
    });

    const stdout = (listed.stdout ?? "").trim();
    if (stdout === "__MISSING__") {
      return { path: dir, exists: false, files: [] as string[] };
    }
    if ((listed.exitCode ?? 0) !== 0) {
      return {
        path: dir,
        exists: false,
        files: [] as string[],
        error: ((listed.stderr ?? stdout) || "find failed").trim(),
      };
    }

    const files = stdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return { path: dir, exists: true, files, count: files.length };
  },
});

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
