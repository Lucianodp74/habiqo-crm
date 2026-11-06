import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildRealEstateListingSchema, jsonLdScript, serializeJsonLd } from "./schema";

const PAYLOADS = [
  "</script><script>alert(1)</script>",
  "</SCRIPT><script>alert(1)</script>",
  "</ScRiPt ><img src=x onerror=alert(1)>",
  "<!--<script>alert(1)</script>-->",
  "Bilocale & box auto",
  "fine riga \u2028 paragrafo \u2029 fine",
  "Città, perché, è già più: «terrazzo» e balcone",
  "]]><![CDATA[",
];

/** Renders the script tag exactly as the pages do. */
function renderJsonLdTag(data: Record<string, unknown>): string {
  return renderToStaticMarkup(
    createElement("script", {
      type: "application/ld+json",
      // biome-ignore lint/security/noDangerouslySetInnerHtml: the test reproduces the exact markup used by the pages
      dangerouslySetInnerHTML: jsonLdScript(data),
    }),
  );
}

describe("serializeJsonLd", () => {
  it.each(PAYLOADS)("round-trips the original data: %s", (payload) => {
    const data = { name: payload, nested: { description: payload, list: [payload] } };
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });

  it.each(PAYLOADS)("emits no raw <, >, & or line separators: %s", (payload) => {
    const out = serializeJsonLd({ description: payload });
    expect(out).not.toMatch(/[<>&\u2028\u2029]/);
  });

  it("keeps accented characters readable", () => {
    expect(serializeJsonLd({ city: "Città" })).toBe('{"city":"Città"}');
  });
});

describe("jsonLdScript rendered markup", () => {
  it.each(PAYLOADS)("contains exactly one script tag: %s", (payload) => {
    const html = renderJsonLdTag({
      "@type": "RealEstateListing",
      name: payload,
      description: payload,
    });
    expect(html.match(/<script/gi)).toHaveLength(1);
    expect(html.match(/<\/script/gi)).toHaveLength(1);
    expect(html.endsWith("</script>")).toBe(true);
  });

  it("the script body parses back to the original listing schema", () => {
    const schema = buildRealEstateListingSchema({
      title: "</script><script>alert(1)</script>",
      description: "Trilocale <b>luminoso</b> & terrazzo — Città",
      price_eur: 250000,
      listing_type: "sale",
      city: "Taranto",
      address: "Via Roma 1",
      region: "Puglia",
      sqm: 90,
      rooms: 3,
      photos: ["https://example.test/a.webp"],
      slug: "trilocale-test",
      agencySlug: "agenzia-test",
    });
    const html = renderJsonLdTag(schema);
    const body = html.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    expect(JSON.parse(body)).toEqual(schema);
  });

  it("the previous serialization was unsafe (regression guard)", () => {
    const unsafe = renderToStaticMarkup(
      createElement("script", {
        // biome-ignore lint/security/noDangerouslySetInnerHtml: the test reproduces the exact markup used by the pages
        dangerouslySetInnerHTML: { __html: JSON.stringify({ name: PAYLOADS[0] }) },
      }),
    );
    expect((unsafe.match(/<\/script/gi) ?? []).length).toBeGreaterThan(1);
  });
});
