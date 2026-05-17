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
  phone?:    string;     // contact phone number
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
  slug:          string;   // URL-safe identifier, use for product page routes
  sku:           string;   // stock-keeping unit
  category:      string;
  price:         number;
  originalPrice: number | null;  // if set, show as crossed-out price
  stock:         number;
  sold:          number;
  status:        "Active" | "Draft" | "Out of Stock";
  tag:           string;   // e.g. "Bestseller", "New", "Low Stock"
  warranty:      string;   // e.g. "30" (days as a string — parse with parseInt)
  rating:        string;   // e.g. "4.8" (as a string — parse with parseFloat)
  reviews:       string;   // e.g. "124" (review count as a string — parse with parseInt)
  views:         string;   // page view count as a string
  shortDesc:     string;   // brief description for cards and previews
  fullDesc:      string;   // full product description, may contain HTML-like formatting
  images:        string[]; // array of image URLs, first is the primary image
  features:      string[]; // array of bullet-point feature strings
  specs:         { key: string; value: string }[];      // specification table rows
  offers:        string[];                              // promotional offer strings
  customerReviews: {
    name:   string;
    rating: string;  // numeric string, parse with parseFloat
    text:   string;
  }[];
};
```

### Usage rules

- **Only show `status: "Active"` products** on listing pages by default. Use `?status=Active` in the query.
- `status: "Out of Stock"` products may be shown with an "Out of stock" badge and the add-to-cart button disabled — your choice.
- `status: "Draft"` products must never appear on the storefront.
- `slug` is the canonical identifier for product pages. Build routes as `/products/:slug`.
- `images[0]` is the primary image. Always guard against an empty array.
- `originalPrice` being higher than `price` means the product is on sale. Show the discount.
- `rating`, `reviews`, `warranty` are stored as strings — always parse before using mathematically.
- For pagination: use `skip` and `limit` together. Total pages = `Math.ceil(total / limit)`.

### Example

```ts
// Fetch first page of active products
const res = await fetch(
  `${CRM_BASE_URL}/api/stores/${STORE_ID}/products?status=Active&limit=24&skip=0`
);
const { products, total } = await res.json();
```

---

### `GET /api/stores/:storeId/products/:productId`

Fetch a single product by its **ObjectId** or its **slug**.

**No authentication required.**

```ts
// By slug (recommended — keep URLs clean)
GET /api/stores/:storeId/products/blue-sneakers

// By ObjectId
GET /api/stores/:storeId/products/664abc123def456789012345
```

Returns a single `Product` object (same shape as above), or `404` if not found.

### Usage rules

- Use the slug in URLs, not the ObjectId.
- A `404` response means the product was deleted or never existed — show a "product not found" page.
- Check `status` on the individual product too — a direct URL hit could return a `"Draft"` product if the slug is known. Redirect or show 404 if status is not `"Active"`.

---

## 3. Orders

### `POST /api/stores/:storeId/orders`

Submit a new order. Called at checkout after the customer confirms their details.

**Requires Bearer token authentication.**

### Request body

```ts
type CreateOrderBody = {
  // Required
  orderNumber:  string;  // unique order reference you generate, e.g. "ORD-20240512-001"
  customerName: string;
  items:        OrderItem[];
  total:        number;  // final amount charged

  // Optional
  customerPhone:   string;  // customer's phone number
  customerAddress: string;  // full delivery address
  subtotal:        number;  // total before discounts (defaults to total if omitted)
  savings:         number;  // discount amount (defaults to 0)
  paymentMethod:   string;  // e.g. "cash", "card", "bank_transfer"
  status:          OrderStatus;  // defaults to "pending"
};

type OrderItem = {
  productId:     string;  // Product ObjectId
  productSlug:   string;
  productName:   string;
  productImage:  string;  // primary image URL
  price:         number;  // final unit price
  originalPrice: number;  // pre-discount unit price
  quantity:      number;
  subtotal:      number;  // price × quantity
};

type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
```

### Response

```ts
// 201 Created
{ id: string }  // the new order's MongoDB ObjectId

// 400 Bad Request
{ error: "orderNumber, customerName, items and total are required" }

// 401 Unauthorized
{ error: "Unauthorized" }
```

### Order number generation

The `orderNumber` must be unique per store. A safe pattern:

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
  const subtotal = cart.reduce((sum, i) => sum + ((i.product.originalPrice ?? i.product.price) * i.quantity), 0);
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

Orders move through these statuses, updated by the store owner in the CRM:

```
pending → confirmed → shipped → delivered
                   ↘ cancelled
```

The storefront creates orders as `"pending"`. All subsequent status changes happen in the CRM — the storefront does not update order status.

---

## 4. Page sections (CMS)

Section data comes from the store info response (`GET /api/stores/:storeId`) inside the `pages` field. Each key in `pages` corresponds to a storefront route.

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
  id:      string;   // unique instance ID
  type:    string;   // section type key — see catalogue below
  enabled: boolean;  // if false, do not render
  content: Record<string, unknown>;  // field values
};
```

### Rendering rules

1. **Skip disabled sections.** If `enabled === false`, skip entirely — no empty divs.
2. **Respect array order.** Render sections in the order they appear in the array.
3. **Tolerate missing fields.** A field may be an empty string or absent. Render nothing for that element rather than crashing.
4. **Tolerate missing pages.** If `pages.about` is undefined, render the page with no CMS sections.
5. **Skip unknown types.** If `section.type` is not in the catalogue, skip it silently — new types may be added to the CRM in future.

### Rendering skeleton

```tsx
// components/sections/index.tsx
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

// app/page.tsx
export default async function HomePage() {
  const store    = await getStore();
  const sections = (store.pages?.home ?? []).filter(s => s.enabled);
  return <main>{sections.map(renderSection)}</main>;
}
```

---

### Section type catalogue

#### `hero`

| Field | Type | Notes |
|---|---|---|
| `headline` | `string` | Primary heading |
| `subheadline` | `string` | Supporting paragraph |
| `ctaText` | `string` | Button label — skip button if empty |
| `ctaUrl` | `string` | Button link — may be relative (`/products`) or absolute |
| `imageUrl` | `string` | Hero or background image — fall back to design default if empty |

---

#### `announcement`

Slim strip, render above the navigation bar.

| Field | Type | Notes |
|---|---|---|
| `text` | `string` | Message — skip entire section if empty |
| `linkText` | `string` | Inline link label |
| `linkUrl` | `string` | Inline link target |
| `bgColor` | `string` | Hex — apply as inline `background-color` style |
| `textColor` | `string` | Hex — apply as inline `color` style |

---

#### `features`

| Field | Type | Notes |
|---|---|---|
| `title` | `string` | Section heading |
| `items` | `{ icon: string; title: string; text: string }[]` | Skip section if empty |

- `icon` is always an emoji — render as text, not `<img>`.

---

#### `testimonials`

| Field | Type | Notes |
|---|---|---|
| `title` | `string` | Section heading |
| `items` | `{ name: string; role: string; text: string; rating: string }[]` | Skip section if empty |

- `rating` is a numeric string — parse with `parseInt(item.rating, 10)`. Default to 0 if invalid.

---

#### `faq`

| Field | Type | Notes |
|---|---|---|
| `title` | `string` | Section heading |
| `items` | `{ question: string; answer: string }[]` | Skip section if empty |

- Render as an accordion or flat list — storefront decides.

---

#### `newsletter`

| Field | Type | Notes |
|---|---|---|
| `headline` | `string` | Section heading |
| `subtext` | `string` | Supporting paragraph |
| `placeholder` | `string` | Email input placeholder text |
| `buttonText` | `string` | Submit button label — default to "Subscribe" if empty |

- The CRM manages copy only. Form submission logic (email service, validation, API call) is handled entirely by the storefront.

---

## 5. Tracking pixels

The store owner configures pixel IDs in the CRM under **Settings → Pixels**. The `pixels` field in the store info response tells the storefront which pixels to fire and their IDs.

```ts
store.pixels?.tiktok?.enabled   // boolean
store.pixels?.tiktok?.id        // the TikTok Pixel ID string
store.pixels?.facebook?.enabled
store.pixels?.facebook?.id
store.pixels?.snapchat?.enabled
store.pixels?.snapchat?.id
store.pixels?.google?.enabled
store.pixels?.google?.id
```

### Rules

- Only initialize a pixel if its `enabled` flag is `true`.
- If `pixels` is absent or a key is missing, skip that pixel silently.
- Load pixel scripts in the root layout so they fire on every page.

```tsx
// app/layout.tsx
const store = await getStore();

{store.pixels?.tiktok?.enabled && store.pixels.tiktok.id && (
  <TikTokPixel id={store.pixels.tiktok.id} />
)}
```

---

## 6. Caching strategy

| Data | Suggested revalidation | Reason |
|---|---|---|
| Store info + sections | 60 seconds | Config changes infrequently |
| Product listing | 30 seconds | Stock and status can change |
| Individual product | 30 seconds | Price and stock can change |
| Store info at checkout | No cache / real-time | Always use fresh API key |

For Next.js App Router:

```ts
// Static data — revalidate every 60s
fetch(url, { next: { revalidate: 60 } });

// Real-time (checkout, order submission)
fetch(url, { cache: "no-store" });
```

---

## 7. Error handling

| HTTP status | Meaning | What to do |
|---|---|---|
| `200` | Success | Render normally |
| `201` | Order created | Show confirmation |
| `400` | Bad request | Show validation error to user |
| `401` | Unauthorized | API key is wrong or missing — check env vars |
| `404` | Not found | Show 404 page / "product not found" |
| `500` | Server error | Show generic error, log details |

All error responses follow this shape:

```ts
{ error: string }
```

---

## 8. Adding new section types

When a new section type is added to the CRM (`lib/sections.ts` in this repo), the storefront needs:

1. A new `case` in the `renderSection` switch
2. A new component that reads `content` fields and renders them

Check `lib/sections.ts` in this repo first — it is the source of truth for what fields each type exposes and what they mean.
