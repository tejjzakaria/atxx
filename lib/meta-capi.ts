import { createHash } from "crypto";

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

// Meta hashes phone numbers as digits-only (no leading +, spaces, or dashes) for matching.
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

type MetaPurchaseParams = {
  pixelId:        string;
  accessToken:    string;
  testEventCode?: string;
  eventId:        string;
  eventSourceUrl?: string;
  value:          number;
  currency:       string;
  orderNumber:    string;
  customerPhone?: string;
  clientIp?:      string;
  userAgent?:     string;
  fbp?:           string;
  fbc?:           string;
};

// Server-side counterpart to the browser's fbq('track','Purchase', ..., {eventID}) call —
// same event_id on both sides lets Meta dedupe them into a single conversion.
export async function sendMetaPurchaseEvent(params: MetaPurchaseParams): Promise<void> {
  const {
    pixelId, accessToken, testEventCode, eventId, eventSourceUrl,
    value, currency, orderNumber, customerPhone, clientIp, userAgent, fbp, fbc,
  } = params;

  const userData: Record<string, unknown> = {};
  if (customerPhone) {
    const digits = normalizePhone(customerPhone);
    if (digits) userData.ph = [sha256(digits)];
  }
  if (clientIp)  userData.client_ip_address = clientIp;
  if (userAgent) userData.client_user_agent = userAgent;
  if (fbp)       userData.fbp = fbp;
  if (fbc)       userData.fbc = fbc;

  const payload: Record<string, unknown> = {
    data: [{
      event_name:       "Purchase",
      event_time:        Math.floor(Date.now() / 1000),
      event_id:          eventId,
      action_source:     "website",
      event_source_url:  eventSourceUrl,
      user_data:         userData,
      custom_data: {
        currency,
        value,
        order_id: orderNumber,
      },
    }],
  };
  if (testEventCode) payload.test_event_code = testEventCode;

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Meta CAPI request failed (${res.status}): ${text}`);
  }
}
