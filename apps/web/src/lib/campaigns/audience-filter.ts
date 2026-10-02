/**
 * Shape of the audience-selection criteria for a WhatsApp campaign.
 * Kept intentionally small and serializable (stored as-is in
 * `campaigns.audience_filter` for later reference/audit — not
 * re-executed, since recipients are snapshotted at creation time).
 */
export type CampaignAudienceFilter = {
  /** Lead matches if it has ANY of these tags (OR match). Empty = no tag filter. */
  tags: string[];
  /** Optional exact match on leads.status. */
  status?: string | null;
  /** Optional case-insensitive partial match on city/preferred_city. */
  city?: string | null;
};

export function isEmptyAudienceFilter(filter: CampaignAudienceFilter): boolean {
  return filter.tags.length === 0 && !filter.status && !filter.city?.trim();
}
