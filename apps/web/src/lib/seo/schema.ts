/**
 * Habiquo Visibility — helper condivisi per generare Schema.org JSON-LD.
 * Un solo punto di verità per evitare duplicazione tra pagina agenzia,
 * pagina immobile e home marketing.
 */

/**
 * Serializes data for an inline <script type="application/ld+json">.
 *
 * Plain JSON.stringify is not safe there: a value containing "</script>"
 * (e.g. a property description) would close the tag and let the rest run
 * as HTML. Escaping <, > and & as \uXXXX keeps the output valid JSON with
 * the same data, but with no character the HTML parser can act on.
 * U+2028/U+2029 are escaped too, for older JavaScript parsers.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function jsonLdScript(data: Record<string, unknown>) {
  return {
    __html: serializeJsonLd(data),
  };
}

export function buildRealEstateAgentSchema(agency: {
  name: string;
  slug: string;
  phone: string | null;
  city: string | null;
  region: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: agency.name,
    url: `https://www.habiquo.it/${agency.slug}`,
    ...(agency.phone ? { telephone: agency.phone } : {}),
    ...(agency.city
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: agency.city,
            ...(agency.region ? { addressRegion: agency.region } : {}),
            addressCountry: "IT",
          },
        }
      : {}),
  };
}

export function buildRealEstateListingSchema(property: {
  title: string;
  description: string | null;
  price_eur: number;
  listing_type: "sale" | "rent";
  city: string;
  address: string | null;
  region: string | null;
  sqm: number | null;
  rooms: number | null;
  photos: string[];
  slug: string;
  agencySlug: string;
}) {
  const url = `https://www.habiquo.it/${property.agencySlug}/immobili/${property.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    url,
    ...(property.description ? { description: property.description } : {}),
    ...(property.photos.length ? { image: property.photos } : {}),
    about: {
      "@type": "Residence",
      ...(property.sqm
        ? { floorSize: { "@type": "QuantitativeValue", value: property.sqm, unitCode: "MTK" } }
        : {}),
      ...(property.rooms ? { numberOfRooms: property.rooms } : {}),
      address: {
        "@type": "PostalAddress",
        ...(property.address ? { streetAddress: property.address } : {}),
        addressLocality: property.city,
        ...(property.region ? { addressRegion: property.region } : {}),
        addressCountry: "IT",
      },
    },
  };
}

export function buildSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Habiquo",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://www.habiquo.it",
    description: "L'unica piattaforma di cui un'agenzia immobiliare ha bisogno.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    publisher: { "@type": "Organization", name: "Habiquo", url: "https://www.habiquo.it" },
  };
}
