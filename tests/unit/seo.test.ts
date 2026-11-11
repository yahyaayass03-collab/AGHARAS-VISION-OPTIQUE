import { describe, expect, it } from "vitest";
import { withoutBrandTitleSuffix } from "@/lib/seo";

describe("withoutBrandTitleSuffix", () => {
  it("removes the historical public-name suffix before the CMS title template", () => {
    expect(withoutBrandTitleSuffix("Monture | AGHARAS VISION OPTIQUE", "AGHARAS VISION"))
      .toBe("Monture");
  });

  it("removes duplicate instances of the current CMS brand suffix", () => {
    expect(withoutBrandTitleSuffix("Monture | AGHARAS VISION | AGHARAS VISION", "AGHARAS VISION"))
      .toBe("Monture");
  });

  it("leaves an unbranded title unchanged", () => {
    expect(withoutBrandTitleSuffix("Monture — Titane", "AGHARAS VISION"))
      .toBe("Monture — Titane");
  });
});
