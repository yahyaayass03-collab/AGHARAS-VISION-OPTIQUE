import { assertRuntimeConfiguration } from "@/lib/runtime-config";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") assertRuntimeConfiguration();
}
