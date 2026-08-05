import path from "node:path";
import { fileURLToPath } from "node:url";

/** Project root (repo root), not the sandbox `/workspace`. */
export function projectRoot(): string {
  // lib/export-paths.ts → repo root
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

export function normalizeSandboxPath(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Sandbox path is empty.");
  }
  const withRoot = trimmed.startsWith("/workspace")
    ? trimmed
    : path.posix.join("/workspace", trimmed.replace(/^\.?\//, ""));
  const normalized = path.posix.normalize(withRoot);
  if (normalized !== "/workspace" && !normalized.startsWith("/workspace/")) {
    throw new Error(`Sandbox path must stay under /workspace (got ${input}).`);
  }
  return normalized;
}

/**
 * Resolve a user-facing destination under the project root.
 * Relative paths are from the project root. Absolute paths must stay inside it.
 */
export function resolveHostDestination(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Destination path is empty.");
  }
  const root = projectRoot();
  const resolved = path.resolve(
    root,
    trimmed.startsWith("~")
      ? trimmed.replace(/^~(?=$|\/|\\)/, process.env.HOME ?? "")
      : trimmed,
  );
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(
      `Destination must be inside the project root (${root}). Got: ${input}`,
    );
  }
  // Block writing into framework/runtime dirs
  const top = relative.split(path.sep)[0] ?? "";
  if ([".eve", "node_modules", ".git", ".vercel"].includes(top)) {
    throw new Error(`Refusing to export into reserved directory: ${top}/`);
  }
  return resolved;
}

export function hostPathRelativeToProject(absoluteHostPath: string): string {
  return path.relative(projectRoot(), absoluteHostPath) || ".";
}
