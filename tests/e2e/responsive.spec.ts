import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablette", width: 768, height: 1024 },
  { name: "petit bureau", width: 1024, height: 900 },
  { name: "bureau", width: 1440, height: 900 },
] as const;

for (const viewport of VIEWPORTS) {
  test.describe(`Responsive ${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("l'accueil ne déborde pas horizontalement", async ({ page }) => {
      await page.goto("/");
      await expect(
        page.getByRole("heading", { level: 1, name: /Voyez la différence/ }),
      ).toBeVisible();

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
    });

    test("le catalogue reste lisible", async ({ page }) => {
      await page.goto("/catalogue");
      await expect(
        page.getByRole("heading", { level: 1, name: "La collection" }),
      ).toBeVisible();
      await expect(page.locator("article").first()).toBeVisible();

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });

    if (viewport.width < 1024) {
      test("le menu mobile s'ouvre et se ferme", async ({ page }) => {
        await page.goto("/");
        const open = page.getByRole("button", { name: "Ouvrir le menu" });
        await expect(open).toBeVisible();
        await open.click();
        const dialog = page.getByRole("dialog", { name: "Menu principal" });
        await expect(dialog).toBeVisible();
        await expect(
          dialog.getByRole("link", { name: "Femme" }).first(),
        ).toBeVisible();
        await dialog.getByRole("button", { name: "Fermer le menu" }).click();
        await expect(dialog).toBeHidden();
      });
    }
  });
}
