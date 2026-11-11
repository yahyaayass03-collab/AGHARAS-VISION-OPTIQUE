import { describe, expect, it } from "vitest";
import path from "node:path";
import { resolveStoredFilePath } from "@/lib/storage-path";

describe("resolveStoredFilePath", () => {
  const cwd = path.resolve("C:/agh-test/app");
  const root = path.resolve(cwd, "private/prescriptions");

  it("resolves application-relative and absolute paths under the private root", () => {
    expect(resolveStoredFilePath(root, "private/prescriptions/a.pdf", cwd)).toBe(
      path.join(root, "a.pdf"),
    );
    expect(resolveStoredFilePath(root, path.join(root, "b.pdf"), cwd)).toBe(
      path.join(root, "b.pdf"),
    );
  });

  it.each([
    "",
    "../prescriptions-escape/a.pdf",
    "private/prescriptions/../../outside.pdf",
    "https://example.invalid/prescription.pdf",
    "\\\\server\\share\\prescription.pdf",
  ])("rejects unsafe persisted path %s", (storedPath) => {
    expect(resolveStoredFilePath(root, storedPath, cwd)).toBeNull();
  });

  it("does not accept a sibling whose name merely shares the root prefix", () => {
    expect(
      resolveStoredFilePath(root, "private/prescriptions-backup/a.pdf", cwd),
    ).toBeNull();
  });
});
