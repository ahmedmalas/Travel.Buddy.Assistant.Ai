/**
 * Slice 84 — Affiliate and attribution platform (demo-safe).
 * No fake conversion data. No public partnership claims before approval.
 */

export interface PartnerRecord {
  partnerId: string;
  displayName: string;
  approved: boolean;
  disclosureText: string;
  defaultCampaignId: string;
  attributionWindowHours: number;
}

export interface AffiliateClick {
  clickId: string;
  partnerId: string;
  campaignId: string;
  offerId: string;
  searchedAt: string | null;
  clickedAt: string;
  deepLink: string;
}

export interface ConversionCallbackPayload {
  clickId: string;
  partnerId: string;
  bookingReference: string;
  bookingValue: number;
  currency: string;
  status: 'booked' | 'cancelled' | 'refunded';
  occurredAt: string;
}

export interface AttributionEvent {
  id: string;
  type: 'click' | 'conversion_callback' | 'refund_adjustment';
  clickId: string;
  partnerId: string;
  amount: number | null;
  currency: string | null;
  occurredAt: string;
  notes: string;
}

export interface RevenueReportRow {
  partnerId: string;
  clicks: number;
  conversions: number;
  bookingValue: number;
  estimatedCommission: number;
  currency: string;
  note: string;
}

const PARTNERS: PartnerRecord[] = [
  {
    partnerId: 'demo-sky',
    displayName: 'Demo Sky Search',
    approved: false,
    disclosureText:
      'Demo only: Travel Buddy may earn a commission from approved partners after commercial agreement. Ranking is commission-independent.',
    defaultCampaignId: 'tb-demo-sky',
    attributionWindowHours: 24 * 30,
  },
  {
    partnerId: 'demo-stay',
    displayName: 'Demo Stay Market',
    approved: false,
    disclosureText:
      'Demo only: no live OTA partnership. Disclosure shown for readiness testing.',
    defaultCampaignId: 'tb-demo-stay',
    attributionWindowHours: 24 * 30,
  },
];

export function listPartnerIds(): PartnerRecord[] {
  return PARTNERS.map((partner) => ({ ...partner }));
}

export function getPartner(partnerId: string): PartnerRecord | undefined {
  return PARTNERS.find((partner) => partner.partnerId === partnerId);
}

export function generateDeepLink(input: {
  partnerId: string;
  offerId: string;
  campaignId?: string;
  clickId?: string;
}): { deepLink: string; clickId: string; campaignId: string; disclosureText: string } {
  const partner = getPartner(input.partnerId);
  const campaignId = input.campaignId ?? partner?.defaultCampaignId ?? 'tb-unassigned';
  const clickId = input.clickId ?? `clk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const deepLink = `https://demo.travelbuddy.local/out/${encodeURIComponent(input.partnerId)}?offer=${encodeURIComponent(input.offerId)}&campaign=${encodeURIComponent(campaignId)}&click=${encodeURIComponent(clickId)}`;
  return {
    deepLink,
    clickId,
    campaignId,
    disclosureText:
      partner?.disclosureText ??
      'Affiliate disclosure: Travel Buddy may earn a commission from approved booking partners.',
  };
}

export function recordClick(
  events: AttributionEvent[],
  click: AffiliateClick,
): AttributionEvent[] {
  return [
    ...events,
    {
      id: `evt-${click.clickId}`,
      type: 'click',
      clickId: click.clickId,
      partnerId: click.partnerId,
      amount: null,
      currency: null,
      occurredAt: click.clickedAt,
      notes: `Search-to-click funnel hop for offer ${click.offerId}`,
    },
  ];
}

/**
 * Conversion callback interface — accepts partner postbacks when integrated.
 * Does not invent conversions; only records explicit payloads.
 */
export function applyConversionCallback(
  events: AttributionEvent[],
  payload: ConversionCallbackPayload,
): AttributionEvent[] {
  const type =
    payload.status === 'booked' ? 'conversion_callback' : 'refund_adjustment';
  return [
    ...events,
    {
      id: `evt-conv-${payload.clickId}-${payload.occurredAt}`,
      type,
      clickId: payload.clickId,
      partnerId: payload.partnerId,
      amount: payload.bookingValue,
      currency: payload.currency,
      occurredAt: payload.occurredAt,
      notes: `${payload.status} ref ${payload.bookingReference}`,
    },
  ];
}

export function buildRevenueReport(events: AttributionEvent[]): RevenueReportRow[] {
  const byPartner = new Map<string, RevenueReportRow>();
  for (const event of events) {
    const row = byPartner.get(event.partnerId) ?? {
      partnerId: event.partnerId,
      clicks: 0,
      conversions: 0,
      bookingValue: 0,
      estimatedCommission: 0,
      currency: event.currency ?? 'GBP',
      note: 'Figures only include explicitly recorded callbacks — no simulated conversions.',
    };
    if (event.type === 'click') row.clicks += 1;
    if (event.type === 'conversion_callback' && event.amount != null) {
      row.conversions += 1;
      row.bookingValue += event.amount;
      row.currency = event.currency ?? row.currency;
    }
    if (event.type === 'refund_adjustment' && event.amount != null) {
      row.bookingValue -= event.amount;
    }
    byPartner.set(event.partnerId, row);
  }
  return [...byPartner.values()];
}

export function isWithinAttributionWindow(
  clickedAt: string,
  occurredAt: string,
  windowHours: number,
): boolean {
  const delta = new Date(occurredAt).getTime() - new Date(clickedAt).getTime();
  return delta >= 0 && delta <= windowHours * 60 * 60 * 1000;
}
