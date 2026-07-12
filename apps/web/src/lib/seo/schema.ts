/**
 * Habiquo Visibility — helper condivisi per generare Schema.org JSON-LD.
 * Un solo punto di verità per evitare duplicazione tra pagina agenzia,
 * pagina immobile e home marketing.
 */

export function jsonLdScript(data: Record<string, unknown>) {
  return {
    __html: JSON.stringify(data),
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
