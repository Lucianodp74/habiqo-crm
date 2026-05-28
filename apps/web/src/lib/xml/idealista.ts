/**
 * Habiquo XML Feed — Idealista IT formatter
 *
 * Generates a valid XML feed for Idealista Italy.
 * Format: Idealista standard for partner gestionali (batch import).
 *
 * NOTE: Idealista provides format documentation only to partner gestionali.
 * This implementation follows the standard Italian market conventions.
 * If Idealista requires specific field adjustments, modify only this file.
 */

import { getIdealistaPropertyType, getIdealistaOperation } from "./mapping";
import type { NormalizedAgency, NormalizedProperty } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const PHOTO_BUCKET = "property-photos";

function getPhotoUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}

function esc(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(value: string | null | undefined): string {
  if (!value) return "";
  return `<![CDATA[${(value ?? "").replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function buildPropertyXml(p: NormalizedProperty, agency: NormalizedAgency): string {
  const operation = getIdealistaOperation(p.listingType);
  const propertyType = getIdealistaPropertyType(p.propertyType);

  const pictures = p.photos
    .slice(0, 30) // Idealista supports up to 30 photos
    .map((path) => `        <picture>${esc(getPhotoUrl(path))}</picture>`)
    .join("\n");

  return `    <property>
      <!-- Identificativo univoco nel gestionale Habiquo -->
      <id>${esc(p.id)}</id>
      <operation>${operation}</operation>
      <type>${propertyType}</type>

      <price>${p.price}</price>
      ${p.surfaceSqm ? `<surface>${p.surfaceSqm}</surface>` : ""}
      ${p.bedrooms !== null && p.bedrooms !== undefined ? `<rooms>${p.bedrooms}</rooms>` : ""}
      ${p.bathrooms !== null && p.bathrooms !== undefined ? `<bathrooms>${p.bathrooms}</bathrooms>` : ""}
      ${p.floor !== null && p.floor !== undefined ? `<floor>${p.floor}</floor>` : ""}
      ${p.hasElevator ? "<lift>true</lift>" : ""}
      ${p.hasGarage ? "<garage>true</garage>" : ""}
      ${p.energyClass ? `<energyRating>${esc(p.energyClass)}</energyRating>` : ""}

      <title>${cdata(p.title)}</title>
      ${p.description ? `<description>${cdata(p.description)}</description>` : ""}

      <location>
        <city>${cdata(p.city)}</city>
        ${p.region ? `<province>${cdata(p.region)}</province>` : ""}
        ${p.postalCode ? `<postalCode>${esc(p.postalCode)}</postalCode>` : ""}
        ${p.address ? `<address>${cdata(p.address)}</address>` : ""}
      </location>

      <agency>
        <name>${cdata(agency.name)}</name>
        ${agency.phone ? `<phone>${esc(agency.phone)}</phone>` : ""}
      </agency>

      ${
        p.photos.length > 0
          ? `<pictures>\n${pictures}\n      </pictures>`
          : ""
      }
    </property>`;
}

export function generateIdealistaXml(
  properties: NormalizedProperty[],
  agency: NormalizedAgency
): string {
  // Only properties with at least one photo
  const withPhotos = properties.filter((p) => p.photos.length > 0);

  const propertiesXml = withPhotos
    .map((p) => buildPropertyXml(p, agency))
    .join("\n\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Habiquo XML Feed — Idealista Italy
  Agency: ${agency.name} (${agency.slug})
  Generated: ${new Date().toISOString()}
  Properties: ${withPhotos.length}
-->
<feed version="1.0">
  <properties>
${propertiesXml}
  </properties>
</feed>`;
}
