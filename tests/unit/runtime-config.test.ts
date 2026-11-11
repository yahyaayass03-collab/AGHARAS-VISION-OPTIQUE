import { describe, expect, it } from "vitest";
import { validateRuntimeConfiguration } from "@/lib/runtime-config";

const valid = {
  NODE_ENV: "production",
  APP_ENVIRONMENT: "staging",
  NEXT_PUBLIC_SITE_URL: "https://staging.example.invalid/",
  DATABASE_URL: "mysql://app:secret@localhost:3306/agharas",
  AUTH_SECRET: "x".repeat(64),
  CRON_SECRET: "c".repeat(64),
  OWNER_EMAIL: "owner@example.invalid",
  OBJECT_STORAGE_DRIVER: "s3",
  OBJECT_STORAGE_BUCKET: "agharas-private-stage",
  OBJECT_STORAGE_REGION: "eu-west-1",
  PUBLIC_MEDIA_STORAGE_DRIVER: "mariadb",
  PUBLIC_MEDIA_MAX_TOTAL_BYTES: String(256 * 1024 * 1024),
  EMAIL_TRANSPORT: "discard",
};

describe("runtime configuration guard", () => {
  it("accepts explicit HTTPS, Hostinger MariaDB, owner and private S3 configuration", () => {
    expect(validateRuntimeConfiguration(valid)).toEqual([]);
  });

  it("rejects local HTTP origins, PostgreSQL URLs, missing owner and secrets", () => {
    const errors = validateRuntimeConfiguration({
      ...valid,
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      DATABASE_URL: "postgresql://u:p@localhost:5432/agharas",
      AUTH_SECRET: "short",
      OWNER_EMAIL: "",
    });
    expect(errors).toHaveLength(4);
    expect(errors.join(" ")).toMatch(/HTTPS/);
    expect(errors.join(" ")).toMatch(/MariaDB\/MySQL/);
    expect(errors.join(" ")).toMatch(/AUTH_SECRET/);
    expect(errors.join(" ")).toMatch(/OWNER_EMAIL/);
  });

  it("requires both absolute persistent paths for filesystem storage", () => {
    const errors = validateRuntimeConfiguration({
      ...valid,
      OBJECT_STORAGE_DRIVER: "filesystem",
      PRESCRIPTION_STORAGE_DIR: "./storage/ordonnances",
      PUBLIC_MEDIA_DIR: "",
    });
    expect(errors).toHaveLength(3);
    expect(errors.join(" ")).toMatch(/OBJECT_STORAGE_DRIVER=s3/);
    expect(errors.join(" ")).toMatch(/PRESCRIPTION_STORAGE_DIR/);
    expect(errors.join(" ")).toMatch(/PUBLIC_MEDIA_DIR/);
  });

  it("allows explicit local test runtimes without weakening staging/production validation", () => {
    expect(validateRuntimeConfiguration({ NODE_ENV: "production", APP_ENVIRONMENT: "test" })).toEqual([]);
    expect(validateRuntimeConfiguration({ NODE_ENV: "development" })).toEqual([]);
  });

  it("requires an explicitly configured SMTP transport in production", () => {
    const errors = validateRuntimeConfiguration({
      ...valid,
      APP_ENVIRONMENT: "production",
      EMAIL_TRANSPORT: "discard",
    });
    expect(errors.join(" ")).toMatch(/discard.*staging/i);
  });

  it("rejects a PostgreSQL runtime URL even if the endpoint is reachable", () => {
    const errors = validateRuntimeConfiguration({
      ...valid,
      DATABASE_URL: "postgresql://app:secret@ep-example.eu.neon.tech/shop?sslmode=require",
    });
    expect(errors.join(" ")).toMatch(/MariaDB\/MySQL/);
  });

  it("rejects demo seed credentials in hosted environments", () => {
    expect(validateRuntimeConfiguration({ ...valid, SEED_ADMIN_PASSWORD: "synthetic-only" }).join(" ")).toMatch(/SEED_\*/);
  });

  it("accepts MariaDB public media and rejects unknown public media drivers", () => {
    expect(validateRuntimeConfiguration(valid)).toEqual([]);
    expect(validateRuntimeConfiguration({ ...valid, PUBLIC_MEDIA_STORAGE_DRIVER: "filesystem" }).join(" "))
      .toMatch(/PUBLIC_MEDIA_STORAGE_DRIVER/);
    expect(validateRuntimeConfiguration({ ...valid, PUBLIC_MEDIA_MAX_TOTAL_BYTES: "unbounded" }).join(" "))
      .toMatch(/PUBLIC_MEDIA_MAX_TOTAL_BYTES/);
  });

  it("rejects the documented example secret even when it is long enough", () => {
    expect(validateRuntimeConfiguration({ ...valid, AUTH_SECRET: "remplacer-par-un-secret-de-64-caracteres-aleatoires" }).join(" ")).toMatch(/AUTH_SECRET/);
  });
});
