import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  hostPathRelativeToProject,
  normalizeSandboxPath,
  resolveHostDestination,
} from "../../lib/export-paths";

export default defineTool({
  description:
    "Copy sandbox artifacts to a user-visible folder on the host project (e.g. exports/ or reports/). Sandbox /workspace is not visible in the IDE — this bridges files out. Prefer after asking the user for a destination with ask_question.",
  inputSchema: z.object({
    sources: z
      .array(z.string().min(1))
      .min(1)
      .describe("Sandbox file paths to export, e.g. /workspace/reports/brief.md"),
    destination: z
      .string()
      .min(1)
      .describe(
        "Host destination directory relative to the project root (or absolute inside the project), e.g. exports or reports/korea",
      ),
  }),
  async execute({ sources, destination }, ctx) {
    const sandbox = await ctx.getSandbox();
    const destDir = resolveHostDestination(destination);
    await mkdir(destDir, { recursive: true });

    const exported: Array<{
      source: string;
      hostPath: string;
      relativePath: string;
      bytes: number;
    }> = [];
    const errors: Array<{ source: string; error: string }> = [];

    for (const raw of sources) {
      let source: string;
      try {
        source = normalizeSandboxPath(raw);
      } catch (error) {
        errors.push({
          source: raw,
          error: error instanceof Error ? error.message : String(error),
        });
        continue;
      }

      const bytes = await sandbox.readBinaryFile({ path: source });
      if (bytes == null) {
        errors.push({ source, error: "File not found in sandbox." });
        continue;
      }

      const baseName = path.posix.basename(source);
      if (!baseName || baseName === "." || baseName === "..") {
        errors.push({ source, error: "Invalid file name." });
        continue;
      }

      const hostPath = path.join(destDir, baseName);
      await writeFile(hostPath, Buffer.from(bytes));
      exported.push({
        source,
        hostPath,
        relativePath: hostPathRelativeToProject(hostPath),
        bytes: bytes.byteLength,
      });
    }

    return {
      destination: destDir,
      destinationRelative: hostPathRelativeToProject(destDir),
      exported,
      errors,
      ok: errors.length === 0 && exported.length > 0,
    };
  },
});
