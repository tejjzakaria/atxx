# Product Data Guide — ATXX Moroccan Perfume Storefront

Feed this file to Claude Code whenever populating or updating product data for this store. It defines the exact conventions for every field that drives storefront features.

---

## SPECS — Fragrance notes + occasion guide

The `specs` array on each product must contain these keys **in this exact order**. All labels and values must be in French (or Darija-friendly French as used across the store).

```ts
specs: [
  { key: "Top Notes",   value: "e.g. Bergamote, Poivre Rose, Citron" },
  { key: "Heart Notes", value: "e.g. Rose, Jasmin, Iris" },
  { key: "Base Notes",  value: "e.g. Santal, Oud, Musc Blanc" },
  { key: "Best For",    value: "one or two of: Journée / Soirée / Formel / Casual / Été / Hiver" },
  { key: "Longevity",   value: "one of: 4h / 6h / 8h / 12h+" },
  { key: "Sillage",     value: "one of: Léger / Modéré / Fort" },
]
```

**Rules:**
- Never leave a value empty — omit the entire key if the information is unknown.
- `Best For` accepts one or two comma-separated values from the allowed list, e.g. `"Soirée, Formel"`.
- `Longevity` and `Sillage` must use exactly the values listed — no variations.
- Note values are comma-separated ingredient names in French, e.g. `"Bergamote, Poivre Rose, Citron"`.

---

## OFFERS — Inline product FAQ

The `offers` array on each product stores Q&A pairs as strings using a `"QUESTION||ANSWER"` delimiter. The storefront splits on `||` to render an inline FAQ section on the product page.

Add **4–5 strings** per product. All text in French.

```ts
offers: [
  "Le parfum est-il original ?||Oui, tous nos parfums sont 100% authentiques et importés directement.",
  "Livraison dans tout le Maroc ?||Oui — Casablanca & Rabat sous 24h, autres villes sous 2–4 jours.",
  "Comment passer commande ?||Remplissez le formulaire sur la page produit ou contactez-nous sur WhatsApp.",
  "Puis-je retourner le produit ?||Oui, sous 30 jours si le flacon est non ouvert.",
  "Quel est le mode de paiement ?||Paiement à la livraison (Cash on Delivery) uniquement.",
]
```

**Rules:**
- Always use `||` as the separator — no spaces around it.
- The question should end with ` ?` (space before the question mark, French convention).
- Keep answers concise — one or two sentences maximum.
- The 5 questions above are the standard set and apply to all products unless a product has specific exceptions (e.g. a different return window). Customise per product only when needed.

---

## STOCK & SOLD — Urgency badges

These two fields drive the "Only X left" and "X sold" badges on the product page automatically. No extra setup needed.

```ts
stock: <integer>  // current units available
sold:  <integer>  // total units sold to date
```

**Rules:**
- Both must be realistic integers — do not use placeholder values like `0` or `999`.
- If `stock` reaches `0`, the product status is automatically set to `"Out of Stock"` by the API.
- `sold` is cumulative and should only increase over time.

---

## STORE SETTINGS — One-time setup

In **ATXX CRM → Settings → General → Contact Details**, set:

```
phone: "+212XXXXXXXXX"   // WhatsApp number in international format
```

This number powers the WhatsApp order button on every product page. It is not per-product — set it once and it applies globally.

---

## Other product fields — quick reference

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | Full product name as displayed, e.g. "Oud Satin Mood 100ml" |
| `slug` | `string` | Auto-generated from name if not provided. Use for product page URLs. |
| `sku` | `string` | Auto-generated if not provided |
| `category` | `string` | One of the store's categories, e.g. "Hommes", "Femmes", "Unisexe", "Oud" |
| `price` | `number` | Current selling price in MAD |
| `originalPrice` | `number \| null` | Pre-discount price — set this to trigger the sale badge |
| `tag` | `string` | One of: `"Bestseller"` / `"New"` / `"Top Bundle"` / `"Low Stock"` — leave empty if none apply |
| `warranty` | `string` | Return window in days as a string, e.g. `"30"` |
| `rating` | `string` | Average rating as a string, e.g. `"4.8"` |
| `reviews` | `string` | Total review count as a string, e.g. `"124"` |
| `shortDesc` | `string` | 1–2 sentence teaser shown on product cards |
| `fullDesc` | `string` | Full description shown on the product page — can include line breaks |
| `images` | `string[]` | Image URLs — first element is the primary image |
| `features` | `string[]` | Bullet-point selling points, e.g. `["Tenue longue durée", "Inspiré des grandes maisons"]` |
| `customerReviews` | `{ name, rating, text }[]` | User-submitted reviews — `rating` is a numeric string e.g. `"5"` |
