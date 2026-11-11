import path from "node:path";

/** Resolve a persisted filesystem key only when it remains under its storage root. */
export function resolveStoredFilePath(
  storageRoot: string,
  storedPath: string,
  cwd = process.cwd(),
): string | null {
  const isWindowsDrivePath = /^[a-z]:[\\/]/i.test(storedPath);
  if (!storedPath || (!isWindowsDrivePath && /^(?:[a-z]+:|\\\\)/i.test(storedPath))) return null;

  const root = path.resolve(storageRoot);
  const candidate = path.resolve(
    path.isAbsolute(storedPath) ? storedPath : path.resolve(cwd, storedPath),
  );
  const relative = path.relative(root, candidate);

  if (!relative || relative === "." || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return null;
  }

  return candidate;
}
