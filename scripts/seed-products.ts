import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

const STORE_ID = "69fce8c3500a2de9b1f1e79c";
const URI      = process.env.DATABASE_URL!;

const products = [
  {
    name: "ATXX Sculpting Body Cream",
    slug: "atxx-sculpting-body-cream",
    sku: "ATXX-001",
    category: "Body Care",
    price: 349,
    originalPrice: 449,
    stock: 85,
    sold: 312,
    status: "Active",
    tag: "Bestseller",
    warranty: "30",
    rating: "4.8",
    reviews: "214",
    views: "5820",
    shortDesc: "Intensive sculpting cream that firms and tightens skin in 4 weeks.",
    fullDesc: "Our flagship sculpting cream combines caffeine, retinol, and hyaluronic acid to visibly firm and contour your body. Lightweight, fast-absorbing formula leaves skin smooth and hydrated without greasiness.",
    images: [],
    features: [
      "Visible firming in 4 weeks",
      "Contains 2% caffeine complex",
      "Dermatologically tested",
      "Suitable for all skin types",
      "Paraben-free formula",
    ],
    specs: [
      { key: "Size", value: "200ml" },
      { key: "Skin Type", value: "All skin types" },
      { key: "Key Ingredients", value: "Caffeine, Retinol, Hyaluronic Acid" },
      { key: "Fragrance", value: "Light citrus" },
    ],
    offers: [
      "Buy 2 get 10% off",
      "Free shipping on orders over 500 MAD",
    ],
    customerReviews: [
      { name: "Salma R.", rating: "5", text: "Incredible results in just 3 weeks, my skin feels so much firmer!" },
      { name: "Nadia B.", rating: "5", text: "Best body cream I've ever used. The texture is amazing." },
      { name: "Youssef K.", rating: "4", text: "Great product, noticed a difference after 2 weeks of daily use." },
    ],
  },
  {
    name: "ATXX Collagen Glow Serum",
    slug: "atxx-collagen-glow-serum",
    sku: "ATXX-002",
    category: "Face Care",
    price: 299,
    originalPrice: 399,
    stock: 52,
    sold: 187,
    status: "Active",
    tag: "Top Bundle",
    warranty: "30",
    rating: "4.7",
    reviews: "143",
    views: "3940",
    shortDesc: "Brightening serum with marine collagen for a radiant, youthful glow.",
    fullDesc: "Formulated with marine collagen peptides and vitamin C, this serum boosts skin elasticity and delivers a visible glow from the first application. Lightweight dropper bottle for precise dosing.",
    images: [],
    features: [
      "Marine collagen peptides",
      "20% Vitamin C complex",
      "Reduces dark spots in 2 weeks",
      "Boosts skin elasticity",
      "Vegan & cruelty-free",
    ],
    specs: [
      { key: "Size", value: "30ml" },
      { key: "Skin Type", value: "All skin types" },
      { key: "Key Ingredients", value: "Marine Collagen, Vitamin C, Niacinamide" },
      { key: "Application", value: "Morning & evening" },
    ],
    offers: [
      "Bundle with Sculpting Cream for 15% off",
    ],
    customerReviews: [
      { name: "Meryem H.", rating: "5", text: "My skin has never looked this bright. Absolutely love it!" },
      { name: "Fatima Z.", rating: "4", text: "Great serum, a little goes a long way. Will repurchase." },
    ],
  },
  {
    name: "ATXX Slimming Gel",
    slug: "atxx-slimming-gel",
    sku: "ATXX-003",
    category: "Body Care",
    price: 279,
    originalPrice: 349,
    stock: 0,
    sold: 428,
    status: "Out of Stock",
    tag: "Low Stock",
    warranty: "30",
    rating: "4.6",
    reviews: "309",
    views: "7100",
    shortDesc: "Cooling anti-cellulite gel with menthol for a slimmer silhouette.",
    fullDesc: "Powered by a triple-action complex of menthol, guarana extract, and green tea, our slimming gel penetrates deep to break down fat deposits and reduce the appearance of cellulite. Use twice daily for best results.",
    images: [],
    features: [
      "Triple-action slimming complex",
      "Cooling menthol sensation",
      "Reduces cellulite appearance",
      "Fast-absorbing gel formula",
      "No greasy residue",
    ],
    specs: [
      { key: "Size", value: "150ml" },
      { key: "Skin Type", value: "All skin types" },
      { key: "Key Ingredients", value: "Menthol, Guarana Extract, Green Tea" },
      { key: "Usage", value: "Twice daily with massage" },
    ],
    offers: [
      "Buy 2 save 50 MAD",
    ],
    customerReviews: [
      { name: "Khadija M.", rating: "5", text: "The cooling effect is amazing. I use it every morning and evening." },
      { name: "Aicha L.", rating: "5", text: "Visible results after 3 weeks. My favorite ATXX product!" },
      { name: "Omar S.", rating: "4", text: "Works well but stock runs out fast. Hope they restock soon." },
    ],
  },
  {
    name: "ATXX Hair Growth Oil",
    slug: "atxx-hair-growth-oil",
    sku: "ATXX-004",
    category: "Hair Care",
    price: 199,
    originalPrice: 249,
    stock: 120,
    sold: 95,
    status: "Active",
    tag: "New",
    warranty: "30",
    rating: "4.5",
    reviews: "67",
    views: "2200",
    shortDesc: "Nourishing scalp oil with castor and argan to stimulate hair growth.",
    fullDesc: "A luxurious blend of cold-pressed castor oil, Moroccan argan oil, and rosemary extract that strengthens hair follicles, reduces breakage, and promotes thicker, longer hair growth.",
    images: [],
    features: [
      "Stimulates follicle activity",
      "Reduces hair breakage by 60%",
      "Cold-pressed oils only",
      "No sulfates or silicones",
      "Suitable for all hair types",
    ],
    specs: [
      { key: "Size", value: "60ml" },
      { key: "Hair Type", value: "All hair types" },
      { key: "Key Ingredients", value: "Castor Oil, Argan Oil, Rosemary Extract" },
      { key: "Usage", value: "2-3 times per week on scalp" },
    ],
    offers: [],
    customerReviews: [
      { name: "Zineb A.", rating: "5", text: "My hair is so much thicker after one month of use!" },
      { name: "Houda T.", rating: "4", text: "Love the scent and texture. Already seeing baby hairs." },
    ],
  },
  {
    name: "ATXX Complete Body Bundle",
    slug: "atxx-complete-body-bundle",
    sku: "ATXX-005",
    category: "Bundles",
    price: 549,
    originalPrice: 798,
    stock: 30,
    sold: 74,
    status: "Active",
    tag: "Bestseller",
    warranty: "30",
    rating: "4.9",
    reviews: "58",
    views: "4300",
    shortDesc: "The ultimate sculpting routine — Sculpting Cream + Slimming Gel + Collagen Serum.",
    fullDesc: "Get the full ATXX body transformation experience with our three hero products bundled together at a 31% discount. Designed to be used together as a complete morning and evening routine for maximum results.",
    images: [],
    features: [
      "Save 249 MAD vs. buying separately",
      "Complete AM/PM routine included",
      "Beginner-friendly usage guide",
      "Comes in ATXX gift box",
      "30-day money-back guarantee",
    ],
    specs: [
      { key: "Contents", value: "Sculpting Cream 200ml + Slimming Gel 150ml + Glow Serum 30ml" },
      { key: "Routine Duration", value: "8 weeks recommended" },
    ],
    offers: [
      "Best value — 31% off",
      "Free express shipping",
      "Includes free usage guide",
    ],
    customerReviews: [
      { name: "Layla B.", rating: "5", text: "Best purchase I've made this year. The combo works like magic." },
      { name: "Sara M.", rating: "5", text: "Bought as a gift and she loved it. Beautiful packaging too." },
      { name: "Imane O.", rating: "5", text: "The results after 2 months are unbelievable. 10/10!" },
    ],
  },
];

async function main() {
  const client = new MongoClient(URI);
  await client.connect();
  const db  = client.db();
  const col = db.collection("Product");
  const storeOid = new ObjectId(STORE_ID);
  const now = new Date();

  let inserted = 0;
  let skipped  = 0;

  for (const p of products) {
    const existing = await col.findOne({ storeId: storeOid, slug: p.slug });
    if (existing) { console.log(`  skip  ${p.slug}`); skipped++; continue; }

    const newId = new ObjectId();
    await col.insertOne({ _id: newId, storeId: storeOid, ...p, createdAt: now, updatedAt: now });
    console.log(`  added ${p.slug}`);
    inserted++;
  }

  // Bump store product count
  if (inserted > 0) {
    await db.collection("Store").updateOne(
      { _id: storeOid },
      { $inc: { products: inserted } }
    );
  }

  console.log(`\nDone — ${inserted} inserted, ${skipped} skipped.`);
  await client.close();
}

main().catch(e => { console.error(e); process.exit(1); });
