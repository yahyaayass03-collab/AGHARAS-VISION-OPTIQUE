import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { db } from "./helpers";
import {
  OFFICIAL_WHATSAPP_DIGITS,
  whatsappDigits,
} from "../../src/lib/whatsapp";

const ADMIN_STATE = path.join(import.meta.dirname, ".auth", "admin.json");

async function expectWhatsAppLinks(
  page: Page,
  expectedDigits: string,
  minimum = 1,
): Promise<void> {
  const links = page.locator('a[href*="wa.me/"]');
  const hrefs = await links.evaluateAll((entries) =>
    entries.map((entry) => (entry as HTMLAnchorElement).href),
  );
  expect(
    hrefs.length,
    `aucun lien WhatsApp sur ${new URL(page.url()).pathname}`,
  ).toBeGreaterThanOrEqual(minimum);
  for (const href of hrefs) {
    const url = new URL(href);
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toBe("wa.me");
    expect(url.pathname).toBe(`/${expectedDigits}`);
    expect(href).not.toContain("+");
  }
}

test.describe("WhatsApp public", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("le numéro configuré est le numéro officiel et tous les liens sont cohérents", async ({
    page,
  }) => {
    const setting = await db.setting.findUnique({
      where: { key: "store.whatsapp" },
    });
    expect(setting?.value).toBe("+212 628-889950");
    const expectedDigits = whatsappDigits(setting!.value);
    expect(expectedDigits).toBe(OFFICIAL_WHATSAPP_DIGITS);

    const pages = [
      "/",
      "/contact",
      "/faq",
      "/boutiques",
      "/livraison",
      "/produit/le-marais-n04-or-pur",
      "/configurateur/le-marais-n04-or-pur",
    ];
    for (const route of pages) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await expectWhatsAppLinks(page, expectedDigits);
      const hrefs = await page
        .locator('a[href*="wa.me/"]')
        .evaluateAll((entries) =>
          entries.map((entry) => (entry as HTMLAnchorElement).href),
        );
      for (const href of hrefs) {
        expect(href, "ancien numéro WhatsApp encore présent").not.toContain(
          "212522000000",
        );
        const text = new URL(href).searchParams.get("text");
        if (text) {
          expect(text).not.toMatch(
            /ordonnance\s*:|sph[èe]re|cylindre|\baxe\b|addition/i,
          );
        }
      }
    }

    await page.goto("/produit/etui-cuir-agharas");
    await page.getByRole("button", { name: "Ajouter au panier" }).click();
    await page.waitForURL("**/panier");
    await expectWhatsAppLinks(page, expectedDigits);
    await page.goto("/commande");
    await expectWhatsAppLinks(page, expectedDigits);
  });
});

test.describe("WhatsApp propriétaire", () => {
  test.use({ storageState: ADMIN_STATE });

  test("le propriétaire met à jour le numéro et la vitrine le reflète", async ({
    page,
  }) => {
    const original = await db.setting.findUnique({
      where: { key: "store.whatsapp" },
    });
    expect(original?.value).toBe("+212 628-889950");
    const updatedNumber = "+212 600 112233";
    const updatedDigits = "212600112233";

    try {
      await page.goto("/admin/parametres");
      await page.locator('input[name="store.whatsapp"]').fill(updatedNumber);
      await page.getByRole("button", { name: "Enregistrer les réglages" }).click();
      await expect(
        page.getByRole("status").filter({ hasText: "Réglages enregistrés" }),
      ).toBeVisible();

      expect(
        (await db.setting.findUniqueOrThrow({
          where: { key: "store.whatsapp" },
        })).value,
      ).toBe(updatedNumber);

      for (const route of ["/", "/contact", "/produit/le-marais-n04-or-pur"]) {
        await page.goto(route);
        await expectWhatsAppLinks(page, updatedDigits);
      }
    } finally {
      if (original) {
        await db.setting.update({
          where: { key: "store.whatsapp" },
          data: { value: original.value },
        });
      }
    }
  });

  test("un numéro WhatsApp manifestement invalide est refusé côté serveur", async ({
    page,
  }) => {
    const original = await db.setting.findUniqueOrThrow({
      where: { key: "store.whatsapp" },
    });

    await page.goto("/admin/parametres");
    await page.locator('input[name="store.whatsapp"]').fill("pas-un-numero");
    await page.getByRole("button", { name: "Enregistrer les réglages" }).click();
    await expect(
      page
        .locator('form:has(input[name="store.whatsapp"]) p[role="alert"]')
        .first(),
    ).toContainText("Le numéro WhatsApp est invalide");

    expect(
      (await db.setting.findUniqueOrThrow({
        where: { key: "store.whatsapp" },
      })).value,
    ).toBe(original.value);
  });
});
