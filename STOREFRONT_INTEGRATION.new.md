# ATXX Storefront Integration Guide

This is the single authoritative reference for building a storefront that consumes data from the ATXX CRM. It covers every API endpoint the storefront uses, every data type, every field, and the rules for rendering and handling each piece of data.

Read this file before writing any storefront code. When something is unclear, check the CRM source first — this document reflects the actual API implementation.

---

## Architecture overview

```
┌─────────────────────┐        REST API        ┌──────────────────────┐
│   ATXX CRM          │ ◄────────────────────► │   Storefront         │
│  (this repo)        │                        │  (separate repo)     │
│                     │                        │                      │
│  - Store config     │  GET  /api/stores/:id  │  - Renders pages     │
│  - Products         │  GET  /api/stores/:id/ │  - Shows products    │
│  - Orders           │        products        │  - Submits orders    │
│  - Page sections    │  POST /api/stores/:id/ │  - Reads CMS content │
│  - Settings         │        orders          │                      │
└─────────────────────┘                        └──────────────────────┘
```

The CRM manages all data. The storefront only reads and submits — it never writes products or modifies store config.

---

## Environment variables

Set these in the storefront's `.env`:

```env
# The MongoDB ObjectId of the store — found in the CRM dashboard URL: /stores/:storeId
STORE_ID=<mongodb-objectid>

# The store's API key — found in CRM > Settings > API tab
# Required only for submitting orders
CRM_API_KEY=<api-key>

# Base URL of the CRM deployment
CRM_BASE_URL=https://your-crm-domain.com
```

---

## Authentication

Most read endpoints are **public** — no authentication needed. The only endpoint the storefront calls that requires authentication is **creating an order**.

For order creation, pass the API key as a Bearer token:

```
Authorization: Bearer <CRM_API_KEY>
```

The API key is generated and rotated in the CRM under **Settings → API**.

---

## 1. Store information

### `GET /api/stores/:storeId`

Fetch store metadata, settings, and CMS section configuration. Call this once per page build (or on each request if using SSR).

**No authentication required.**

### Response

```ts
type StoreInfo = {
  _id:       string;
  name:      string;
  status:    "Active" | "Paused" | "Disconnected";
  desc?:     string;     // short store description
  email?:    string;     // contact email
  phone?:    string;     // contact phone — powers the WhatsApp order button (international format e.g. "+212612345678")
  country?:  string;     // e.g. "Morocco"
  currency?: string;     // e.g. "MAD – Moroccan Dirham"
  color:     string;     // brand hex color, e.g. "#0d9488"
  initials:  string;     // 2-letter store initials, e.g. "LB"

  // Tracking pixels — see Pixels section below
  pixels?: {
    tiktok?:   { id: string; enabled: boolean };
    facebook?: { id: string; enabled: boolean };
    snapchat?: { id: string; enabled: boolean };
    google?:   { id: string; enabled: boolean };
  };

  // CMS page sections — see Sections section below
  pages?: {
    home?:    SectionInstance[];
    shop?:    SectionInstance[];
    about?:   SectionInstance[];
    contact?: SectionInstance[];
  };
};
```

### Usage rules

- If `status` is `"Paused"` or `"Disconnected"`, consider showing a maintenance page.
- `color` can be used as the brand accent color in the storefront design.
- `currency` is a display string, not a code — use it for labels only.
- `phone` powers the WhatsApp order button. Build the link as `https://wa.me/${phone.replace(/\+/, "")}`.
- All optional fields may be absent; never assume they exist.

---

## 2. Products

### `GET /api/stores/:storeId/products`

Fetch the product catalogue. Supports filtering and pagination.

**No authentication required.**

### Query parameters

| Param | Type | Description |
|---|---|---|
| `category` | `string` | Filter by category name (exact match) |
| `search` | `string` | Search by product name (case-insensitive, partial match) |
| `status` | `string` | Filter by status: `"Active"`, `"Draft"`, `"Out of Stock"` |
| `tag` | `string` | Filter by tag (exact match) |
| `limit` | `number` | Max results to return. Default `100`, max `500` |
| `skip` | `number` | Offset for pagination. Default `0` |

### Response

```ts
type ProductListResponse = {
  products: Product[];
  total:    number;  // total matching products (ignoring limit/skip)
  skip:     number;
  limit:    number;
};
```

### Product type

```ts
type Product = {
  id:            string;
  name:          string;
  slug:          string;   // URL-safe identifier — use for product page routes
  sku:           string;
  category:      string;
  price:         number;
  originalPrice: number | null;  // if set and higher than price, show as crossed-out sale price
  stock:         number;         // drives "Only X left" urgency badge
  sold:          number;         // drives "X sold" social-proof badge
  status:        "Active" | "Draft" | "Out of Stock";
  tag:           string;   // e.g. "Bestseller", "New", "Top Bundle", "Low Stock"
  warranty:      string;   // return window in days as a string — parse with parseInt
  rating:        string;   // average rating as a string — parse with parseFloat
  reviews:       string;   // review count as a string — parse with parseInt
  views:         string;   // page view count as a string
  shortDesc:     string;   // 1–2 sentence teaser for cards and previews
  fullDesc:      string;   // full description for product page
  images:        string[]; // image URLs — first element is the primary image
  features:      string[]; // bullet-point selling points
  specs:         { key: string; value: string }[];  // see Specs below
  offers:        string[];                          // see Offers (inline FAQ) below
  customerReviews: {
    name:   string;
    rating: string;  // numeric string — parse with parseFloat
    text:   string;
  }[];
};
```

---

### Specs — fragrance notes and occasion guide

The `specs` array is rendered as a two-column table or definition list on the product page. Render specs in array order. Skip any entry whose value is an empty string.

For this store the standard keys are, in order:

| Key | Example value | Notes |
|---|---|---|
| `Top Notes` | `"Bergamote, Poivre Rose, Citron"` | Comma-separated ingredient names in French |
| `Heart Notes` | `"Rose, Jasmin, Iris"` | |
| `Base Notes` | `"Santal, Oud, Musc Blanc"` | |
| `Best For` | `"Soirée, Formel"` | One or two of: Journée / Soirée / Formel / Casual / Été / Hiver |
| `Longevity` | `"8h"` | Exactly one of: 4h / 6h / 8h / 12h+ |
| `Sillage` | `"Modéré"` | Exactly one of: Léger / Modéré / Fort |

---

### Offers — inline product FAQ

Each string in the `offers` array encodes a Q&A pair using a `"QUESTION||ANSWER"` delimiter. Split on `||` to render an inline FAQ accordion on the product page.

```ts
const faqs = product.offers.map(o => {
  const [question, answer] = o.split("||");
  return { question, answer };
});
```

A product typically has 4–5 entries covering: authenticity, delivery times, how to order, return policy, and payment method. Render as an accordion or flat Q&A list.

---

### Usage rules

- **Only show `status: "Active"` products** on listing pages. Use `?status=Active` in the query.
- `status: "Out of Stock"` products may be shown with a badge and the add-to-cart button disabled.
- `status: "Draft"` products must never appear on the storefront.
- `slug` is the canonical identifier — build routes as `/products/:slug`.
- `images[0]` is the primary image. Always guard against an empty array.
- `originalPrice` higher than `price` means the product is on sale — show the discount.
- `stock` drives the "Only X left" urgency badge. Suggested threshold: show badge when `stock <= 5`.
- `sold` drives the "X sold" social-proof badge. Show when `sold > 0`.
- `rating`, `reviews`, `warranty` are stored as strings — parse before using mathematically.
- For pagination: `Math.ceil(total / limit)` gives total pages.

### Example

```ts
// First page of active products
const res = await fetch(
  `${CRM_BASE_URL}/api/stores/${STORE_ID}/products?status=Active&limit=24&skip=0`
);
const { products, total } = await res.json();
```

---

### `GET /api/stores/:storeId/products/:productId`

Fetch a single product by its **ObjectId** or **slug**.

**No authentication required.**

```
GET /api/stores/:storeId/products/oud-satin-mood-100ml      ← by slug (recommended)
GET /api/stores/:storeId/products/664abc123def456789012345  ← by ObjectId
```

Returns a single `Product` object or `404` if not found.

**Rules:**
- Use the slug in URLs, not the ObjectId.
- Always re-check `status` on the individual product — a direct URL could expose a `"Draft"`. Show 404 if status is not `"Active"`.

---

## 3. Orders

### `POST /api/stores/:storeId/orders`

Submit a new order at checkout.

**Requires Bearer token authentication.**

### Request body

```ts
type CreateOrderBody = {
  // Required
  orderNumber:  string;  // unique reference you generate, e.g. "ORD-20240512-A3F9"
  customerName: string;
  items:        OrderItem[];
  total:        number;

  // Optional
  customerPhone:   string;
  customerAddress: string;
  subtotal:        number;       // before discounts — defaults to total
  savings:         number;       // discount amount — defaults to 0
  paymentMethod:   string;       // e.g. "cash", "card", "bank_transfer"
  status:          OrderStatus;  // defaults to "pending"
};

type OrderItem = {
  productId:     string;
  productSlug:   string;
  productName:   string;
  productImage:  string;
  price:         number;   // final unit price
  originalPrice: number;   // pre-discount unit price
  quantity:      number;
  subtotal:      number;   // price × quantity
};

type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
```

### Response

```ts
// 201 Created
{ id: string }

// 400 Bad Request
{ error: "orderNumber, customerName, items and total are required" }

// 401 Unauthorized
{ error: "Unauthorized" }
```

### Order number generation

```ts
function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${date}-${rand}`;  // e.g. "ORD-20240512-A3F9"
}
```

### Full checkout example

```ts
async function submitOrder(cart: CartItem[], customer: CustomerDetails) {
  const orderNumber = generateOrderNumber();

  const items: OrderItem[] = cart.map(item => ({
    productId:     item.product.id,
    productSlug:   item.product.slug,
    productName:   item.product.name,
    productImage:  item.product.images[0] ?? "",
    price:         item.product.price,
    originalPrice: item.product.originalPrice ?? item.product.price,
    quantity:      item.quantity,
    subtotal:      item.product.price * item.quantity,
  }));

  const total    = items.reduce((sum, i) => sum + i.subtotal, 0);
  const subtotal = cart.reduce((sum, i) =>
    sum + ((i.product.originalPrice ?? i.product.price) * i.quantity), 0);
  const savings  = subtotal - total;

  const res = await fetch(`${CRM_BASE_URL}/api/stores/${STORE_ID}/orders`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${CRM_API_KEY}`,
    },
    body: JSON.stringify({
      orderNumber,
      customerName:    customer.name,
      customerPhone:   customer.phone,
      customerAddress: customer.address,
      items,
      subtotal,
      savings,
      total,
      paymentMethod: customer.paymentMethod,
      status: "pending",
    }),
  });

  if (!res.ok) throw new Error("Order submission failed");
  const { id } = await res.json();
  return { orderId: id, orderNumber };
}
```

### Order status lifecycle

Orders are created as `"pending"`. All subsequent status changes happen in the CRM — the storefront never updates order status.

```
pending → confirmed → shipped → delivered
                   ↘ cancelled
```

---

## 4. Page sections (CMS)

Section data comes from the store info response inside the `pages` field.

### Page → route mapping

| `pages` key | Storefront route |
|---|---|
| `home` | `/` |
| `shop` | `/shop` or `/products` |
| `about` | `/about` |
| `contact` | `/contact` |

### Section type

```ts
type SectionInstance = {
  id:      string;
  type:    string;
  enabled: boolean;
  content: Record<string, unknown>;
};
```

### Rendering rules

1. **Skip disabled sections.** If `enabled === false`, skip entirely.
2. **Respect array order.**
3. **Tolerate missing fields.** Render nothing for empty strings rather than crashing.
4. **Tolerate missing pages.** Treat absent page keys as empty arrays.
5. **Skip unknown types** silently — new types may be added to the CRM in future.

### Rendering skeleton

```tsx
export function renderSection(section: SectionInstance) {
  switch (section.type) {
    case "hero":         return <HeroSection         key={section.id} content={section.content} />;
    case "announcement": return <AnnouncementSection key={section.id} content={section.content} />;
    case "features":     return <FeaturesSection     key={section.id} content={section.content} />;
    case "testimonials": return <TestimonialsSection  key={section.id} content={section.content} />;
    case "faq":          return <FaqSection           key={section.id} content={section.content} />;
    case "newsletter":   return <NewsletterSection    key={section.id} content={section.content} />;
    default:             return null;
  }
}
```

### Section type catalogue

#### `hero`
| Field | Type | Notes |
|---|---|---|
| `headline` | `string` | Primary heading |
| `subheadline` | `string` | Supporting paragraph |
| `ctaText` | `string` | Button label — skip button if empty |
| `ctaUrl` | `string` | Button link — may be relative or absolute |
| `imageUrl` | `string` | Hero image — fall back to design default if empty |

#### `announcement`
Render above the navigation bar.

| Field | Type | Notes |
|---|---|---|
| `text` | `string` | Message — skip entire section if empty |
| `linkText` | `string` | Inline link label |
| `linkUrl` | `string` | Inline link target |
| `bgColor` | `string` | Hex — apply as inline `background-color` |
| `textColor` | `string` | Hex — apply as inline `color` |

#### `features`
| Field | Type | Notes |
|---|---|---|
| `title` | `string` | Section heading |
| `items` | `{ icon: string; title: string; text: string }[]` | Skip if empty. `icon` is an emoji — render as text, not `<img>` |

#### `testimonials`
| Field | Type | Notes |
|---|---|---|
| `title` | `string` | Section heading |
| `items` | `{ name: string; role: string; text: string; rating: string }[]` | Skip if empty. Parse `rating` with `parseInt` — default to 0 if invalid |

#### `faq`
| Field | Type | Notes |
|---|---|---|
| `title` | `string` | Section heading |
| `items` | `{ question: string; answer: string }[]` | Skip if empty. Render as accordion or flat list |

#### `newsletter`
| Field | Type | Notes |
|---|---|---|
| `headline` | `string` | Section heading |
| `subtext` | `string` | Supporting paragraph |
| `placeholder` | `string` | Email input placeholder |
| `buttonText` | `string` | Submit label — default to "Subscribe" if empty |

Form submission logic is handled entirely by the storefront.

---

## 5. Tracking pixels

```ts
store.pixels?.tiktok?.enabled   // boolean
store.pixels?.tiktok?.id        // pixel ID string
store.pixels?.facebook?.enabled
store.pixels?.facebook?.id
store.pixels?.snapchat?.enabled
store.pixels?.snapchat?.id
store.pixels?.google?.enabled
store.pixels?.google?.id
```

Only initialise a pixel if `enabled === true`. Load pixel scripts in the root layout so they fire on every page.

```tsx
{store.pixels?.tiktok?.enabled && store.pixels.tiktok.id && (
  <TikTokPixel id={store.pixels.tiktok.id} />
)}
```

---

## 6. Caching strategy

| Data | Revalidation | Reason |
|---|---|---|
| Store info + sections | 60s | Config changes infrequently |
| Product listing | 30s | Stock and status can change |
| Individual product | 30s | Price and stock can change |
| Order submission | No cache | Always real-time |

```ts
// Static-ish data
fetch(url, { next: { revalidate: 60 } });

// Real-time
fetch(url, { cache: "no-store" });
```

---

## 7. Error handling

| Status | Meaning | Action |
|---|---|---|
| `200` | Success | Render normally |
| `201` | Order created | Show confirmation |
| `400` | Bad request | Show validation error to user |
| `401` | Unauthorized | API key wrong or missing — check env vars |
| `404` | Not found | Show 404 / "product not found" |
| `500` | Server error | Show generic error, log details |

All error responses: `{ error: string }`

---

## 8. Adding new section types

When a new section type is added to the CRM (`lib/sections.ts` in this repo), the storefront needs:

1. A new `case` in the `renderSection` switch
2. A new component that reads `content` fields

Check `lib/sections.ts` in this repo first — it is the source of truth for what fields each type exposes.
