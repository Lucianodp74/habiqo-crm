/**
 * Habiquo XML Feed — Immobiliare.it formatter
 */

import { getImmobiliareBuildingType, getImmobiliareTransactionType } from "./mapping";
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

function formatDateTime(iso: string): string {
  return iso.replace(/\.\d+Z$/, "").replace("Z", "");
}

function buildPropertyXml(p: NormalizedProperty, agency: NormalizedAgency): string {
  const transactionType = getImmobiliareTransactionType(p.listingType);
  const buildingIDType = getImmobiliareBuildingType(p.propertyType);
  const dateUpdated = formatDateTime(p.updatedAt || p.createdAt);
  const publishedOn = formatDateTime(p.createdAt);
  const agentEmail = agency.email ?? `info@${agency.slug}.it`;

  const pictures = p.photos
    .slice(0, 20)
    .map(
      (path, idx) =>
        `      <picture>
        <uri>${esc(getPhotoUrl(path))}</uri>
        ${idx === 0 ? "<main>true</main>" : "<main>false</main>"}
      </picture>`
    )
    .join("\n");

  return `    <property operation="write">
      <unique-id>${cdata(p.id)}</unique-id>
      <published-on>${publishedOn}</published-on>
      <date-updated>${dateUpdated}</date-updated>

      <agent>
        <office-name>${cdata(agency.name)}</office-name>
        <email>${esc(agentEmail)}</email>
      </agent>

      <publish>
        <portal id="immobiliare.it" status="true" />
      </publish>

      <transactions>
        <transaction type="${transactionType}">
          <price currency="EUR" reserved="false">${p.price}</price>
        </transaction>
      </transactions>

      <building IDType="${buildingIDType}">
        ${p.energyClass ? `<energy-class>${esc(p.energyClass)}</energy-class>` : ""}
      </building>

      <features>
        ${p.surfaceSqm ? `<area unit="mq">${p.surfaceSqm}</area>` : ""}
        ${p.bedrooms !== null && p.bedrooms !== undefined ? `<rooms>${p.bedrooms}</rooms>` : ""}
        ${p.bathrooms !== null && p.bathrooms !== undefined ? `<bathrooms>${p.bathrooms}</bathrooms>` : ""}
        ${p.floor !== null && p.floor !== undefined ? `<floor>${p.floor}</floor>` : ""}
        ${p.hasElevator ? "<elevator>true</elevator>" : ""}
        ${p.hasGarage ? "<garage>true</garage>" : ""}
      </features>

      <location>
        <city>${cdata(p.city)}</city>
        ${p.address ? `<street>${cdata(p.address)}</street>` : ""}
        ${p.postalCode ? `<cap>${esc(p.postalCode)}</cap>` : ""}
        ${p.region ? `<province>${cdata(p.region)}</province>` : ""}
      </location>

      <descriptions>
        <description language="it">
          <title>${cdata(p.title)}</title>
          ${p.description ? `<content>${cdata(p.description)}</content>` : ""}
        </description>
      </descriptions>

      <pictures>
${pictures}
      </pictures>
    </property>`;
}

export function generateImmobiliareXml(
  properties: NormalizedProperty[],
  agency: NormalizedAgency
): string {
  const withPhotos = properties.filter((p) => p.photos.length > 0);
  const propertiesXml = withPhotos.map((p) => buildPropertyXml(p, agency)).join("\n\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed>
  <properties>
${propertiesXml}
  </properties>
</feed>`;
}
