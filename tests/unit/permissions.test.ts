import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  canGrantPermissions,
  hasAnyPermission,
  hasPermission,
} from "@/lib/permissions";

describe("hasPermission", () => {
  it("refuse par défaut", () => {
    expect(hasPermission(null, "orders.view")).toBe(false);
    expect(hasPermission({ isSuperAdmin: false, permissions: [] }, "orders.view")).toBe(
      false,
    );
  });

  it("accorde au super-administrateur", () => {
    expect(
      hasPermission({ isSuperAdmin: true, permissions: [] }, "roles.manage"),
    ).toBe(true);
  });

  it("respecte les permissions explicites", () => {
    const subject = { isSuperAdmin: false, permissions: ["orders.view"] };
    expect(hasPermission(subject, "orders.view")).toBe(true);
    expect(hasPermission(subject, "orders.update")).toBe(false);
  });

  it("évalue les jokers de module", () => {
    const subject = { isSuperAdmin: false, permissions: ["products.*"] };
    expect(hasPermission(subject, "products.view")).toBe(true);
    expect(hasPermission(subject, "products.delete")).toBe(true);
    expect(hasPermission(subject, "inventory.view")).toBe(false);
  });

  it("accepte le joker global", () => {
    expect(
      hasPermission({ isSuperAdmin: false, permissions: ["*"] }, "settings.manage"),
    ).toBe(true);
  });
});

describe("hasAnyPermission", () => {
  it("vrai si au moins une permission correspond", () => {
    const subject = { isSuperAdmin: false, permissions: ["orders.view"] };
    expect(hasAnyPermission(subject, ["orders.update", "orders.view"])).toBe(true);
    expect(hasAnyPermission(subject, ["orders.update", "orders.cancel"])).toBe(false);
  });
});

describe("canGrantPermissions", () => {
  it("un super-administrateur peut tout accorder", () => {
    expect(
      canGrantPermissions({ isSuperAdmin: true, permissions: [] }, ["roles.manage"]),
    ).toBe(true);
  });

  it("interdit d'accorder une permission que l'on ne possède pas", () => {
    const subject = { isSuperAdmin: false, permissions: ["products.*"] };
    expect(canGrantPermissions(subject, ["products.update"])).toBe(true);
    expect(canGrantPermissions(subject, ["orders.view"])).toBe(false);
  });

  it("interdit d'accorder un rôle plus large que ses propres jokers", () => {
    const subject = { isSuperAdmin: false, permissions: ["products.view"] };
    expect(canGrantPermissions(subject, ["products.*"])).toBe(false);
  });

  it("refuse un sujet absent", () => {
    expect(canGrantPermissions(null, [])).toBe(false);
  });
});

describe("catalogue de permissions", () => {
  it("expose des groupes cohérents avec la liste globale", () => {
    const grouped = PERMISSION_GROUPS.flatMap((group) =>
      group.permissions.map((permission) => permission.code),
    );
    expect(new Set(grouped).size).toBe(grouped.length);
    expect([...grouped].sort()).toEqual([...ALL_PERMISSIONS].sort());
  });

  it("suit la convention module.action", () => {
    for (const code of ALL_PERMISSIONS) {
      expect(code).toMatch(/^[a-z]+\.[a-z]+$/);
    }
  });
});
