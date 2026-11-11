import "server-only";

import { randomUUID } from "node:crypto";

/** Emits a minimal JSON diagnostic without serializing an error or request data. */
export function logOperationalFailure(event: string, error: unknown): string {
  const operationId = randomUUID();
  const value = error && typeof error === "object"
    ? error as { name?: unknown; code?: unknown }
    : null;
  const record = {
    level: "error",
    event,
    operationId,
    errorName: typeof value?.name === "string" ? value.name.slice(0, 80) : "UnknownError",
    ...(typeof value?.code === "string" || typeof value?.code === "number"
      ? { errorCode: String(value.code).slice(0, 40) }
      : {}),
    timestamp: new Date().toISOString(),
  };
  console.error(JSON.stringify(record));
  return operationId;
}
