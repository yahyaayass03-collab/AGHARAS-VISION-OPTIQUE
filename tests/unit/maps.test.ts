import { describe, expect, it } from "vitest";
import { googleMapsAddressHref } from "@/lib/maps";

describe("googleMapsAddressHref", () => {
  it("builds an encoded address search without guessed coordinates", () => {
    const address = "N° 13 Imm 08 , Lot 4 Al kheir,Cité Essalam,AGADIR";
    const href = googleMapsAddressHref(address, "Agadir");
    const url = new URL(href);

    expect(url.origin + url.pathname).toBe("https://www.google.com/maps/search/");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("query")).toBe(`${address}, Agadir, Maroc`);
    expect(url.searchParams.get("query")).not.toMatch(/-?\d+\.\d+\s*,\s*-?\d+\.\d+/);
  });
});
