import { describe, expect, it } from "vitest";
import {
  PROPERTY_SLUG_MAX_LENGTH,
  generateUniqueSlug,
  isValidPropertySlug,
  randomSlugSuffix,
  slugify,
} from "./property-slug";

// Same regex as the DB constraint properties_slug_format_chk (0012),
// written out again on purpose so a change to the module is caught here.
const DB_SLUG_CHECK = /^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])?$/;

function expectDbCompatible(slug: string) {
  expect(slug.length).toBeLessThanOrEqual(60);
  expect(slug).toMatch(DB_SLUG_CHECK);
  expect(slug).not.toMatch(/--/);
  expect(isValidPropertySlug(slug)).toBe(true);
}

describe("slugify", () => {
  it("removes accents and lowercases", () => {
    expect(slugify("Città, Perché è Già Più Bella")).toBe("citta-perche-e-gia-piu-bella");
  });

  it("turns emoji, symbols and punctuation into single hyphens", () => {
    expect(slugify("🏡 Villa — piscina & giardino!!! 50% 🌊")).toBe("villa-piscina-giardino-50");
  });

  it("returns an empty string when nothing usable is left", () => {
    expect(slugify("")).toBe("");
    expect(slugify("🏠🏠 — !!! ")).toBe("");
  });
});

describe("randomSlugSuffix", () => {
  it("is always 5 characters from [a-z0-9]", () => {
    for (let i = 0; i < 500; i++) expect(randomSlugSuffix()).toMatch(/^[a-z0-9]{5}$/);
  });
});

describe("generateUniqueSlug", () => {
  it("keeps short titles readable", () => {
    expect(generateUniqueSlug("Trilocale con balcone", "ab12c")).toBe(
      "trilocale-con-balcone-ab12c",
    );
  });

  it("cuts long titles so the slug is at most 60 characters", () => {
    const title = "Appartamento luminoso con doppi servizi vicino al lungomare"; // 59 chars: failed before
    const slug = generateUniqueSlug(title, "u923e");
    expect(slug).toBe("appartamento-luminoso-con-doppi-servizi-vicino-al-lung-u923e");
    expect(slug).toHaveLength(PROPERTY_SLUG_MAX_LENGTH);
    expectDbCompatible(slug);
  });

  it("never leaves a double hyphen where the cut lands on a separator", () => {
    // base cut at 54 chars ends right after "a": no trailing "-" before the suffix
    const slug = generateUniqueSlug(`${"a".repeat(53)} bcdef ghijk`, "zz999");
    expect(slug).toBe(`${"a".repeat(53)}-zz999`);
    expectDbCompatible(slug);
  });

  it("handles accents, emoji and special characters", () => {
    const slug = generateUniqueSlug(
      "🏡 Villa «Perla» – vista mare & piscina, Città Vecchia ★★★★★",
      "x1y2z",
    );
    expect(slug).toBe("villa-perla-vista-mare-piscina-citta-vecchia-x1y2z");
    expectDbCompatible(slug);
  });

  it("falls back to 'immobile' for an empty or symbols-only title", () => {
    expect(generateUniqueSlug("", "aaaaa")).toBe("immobile-aaaaa");
    expect(generateUniqueSlug("   ", "aaaaa")).toBe("immobile-aaaaa");
    expect(generateUniqueSlug("🏠✨🔑", "aaaaa")).toBe("immobile-aaaaa");
  });

  it("sanitises an unexpected suffix instead of producing an invalid slug", () => {
    expectDbCompatible(generateUniqueSlug("Casa", "AB-?"));
    expectDbCompatible(generateUniqueSlug("Casa", ""));
  });

  it("does not change the title it is given", () => {
    const title = "Elegante attico con terrazzo panoramico vista mare a Taranto";
    const copy = `${title}`;
    generateUniqueSlug(title);
    expect(title).toBe(copy);
  });

  it("is always DB-compatible over 2000 random titles", () => {
    const pool = "abcdefghijklmnopqrstuvwxyzàèéìòùÀÈÉ0123456789 -_.,;:!?'\"«»–—/&%€$()[]🏡🌊★✨ß";
    const chars = Array.from(pool);
    for (let i = 0; i < 2000; i++) {
      const len = Math.floor(Math.random() * 120);
      let title = "";
      for (let j = 0; j < len; j++) title += chars[Math.floor(Math.random() * chars.length)];
      expectDbCompatible(generateUniqueSlug(title));
    }
  });
});
