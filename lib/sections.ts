export type SimpleFieldType = "text" | "textarea" | "url" | "color";
export type FieldType = SimpleFieldType | "items";

export interface SubFieldDef {
  id: string;
  label: string;
  type: SimpleFieldType;
  placeholder?: string;
}

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  hint?: string;
  itemFields?: SubFieldDef[];
}

export interface SectionTypeDef {
  type: string;
  label: string;
  description: string;
  iconKey: string;
  fields: FieldDef[];
  defaultContent: Record<string, unknown>;
}

export interface SectionInstance {
  id: string;
  type: string;
  enabled: boolean;
  content: Record<string, unknown>;
}

export const SECTION_TYPES: SectionTypeDef[] = [
  {
    type: "hero",
    label: "Hero",
    description: "Main banner at the top of your page",
    iconKey: "hero",
    fields: [
      { id: "headline",    label: "Headline",              type: "text",     placeholder: "Your powerful headline" },
      { id: "subheadline", label: "Subheadline",           type: "textarea", placeholder: "Supporting text below the headline" },
      { id: "ctaText",     label: "Button text",           type: "text",     placeholder: "Shop now" },
      { id: "ctaUrl",      label: "Button URL",            type: "url",      placeholder: "/products" },
      { id: "imageUrl",    label: "Background image URL",  type: "url",      placeholder: "https://..." },
    ],
    defaultContent: { headline: "", subheadline: "", ctaText: "Shop now", ctaUrl: "/products", imageUrl: "" },
  },
  {
    type: "announcement",
    label: "Announcement Bar",
    description: "A slim promotional strip at the top",
    iconKey: "announcement",
    fields: [
      { id: "text",      label: "Message",          type: "text", placeholder: "Free shipping on orders over 500 MAD" },
      { id: "linkText",  label: "Link text",        type: "text", placeholder: "Shop now" },
      { id: "linkUrl",   label: "Link URL",         type: "url",  placeholder: "/products" },
      { id: "bgColor",   label: "Background color", type: "color" },
      { id: "textColor", label: "Text color",       type: "color" },
    ],
    defaultContent: { text: "", linkText: "", linkUrl: "", bgColor: "#0d3d38", textColor: "#ffffff" },
  },
  {
    type: "features",
    label: "Features / Benefits",
    description: "Highlight key selling points of your products",
    iconKey: "features",
    fields: [
      { id: "title", label: "Section title", type: "text", placeholder: "Why choose us" },
      {
        id: "items",
        label: "Features",
        type: "items",
        hint: "Add the benefits you want to highlight",
        itemFields: [
          { id: "icon",  label: "Emoji icon",   type: "text",     placeholder: "✨" },
          { id: "title", label: "Title",         type: "text",     placeholder: "Feature name" },
          { id: "text",  label: "Description",   type: "textarea", placeholder: "Short description" },
        ],
      },
    ],
    defaultContent: { title: "Why choose us", items: [] },
  },
  {
    type: "testimonials",
    label: "Testimonials",
    description: "Customer reviews and social proof",
    iconKey: "testimonials",
    fields: [
      { id: "title", label: "Section title", type: "text", placeholder: "What customers say" },
      {
        id: "items",
        label: "Reviews",
        type: "items",
        hint: "Add customer testimonials",
        itemFields: [
          { id: "name",   label: "Customer name",   type: "text",     placeholder: "Sarah M." },
          { id: "role",   label: "Role / location", type: "text",     placeholder: "Verified buyer" },
          { id: "text",   label: "Review text",     type: "textarea", placeholder: "Amazing product..." },
          { id: "rating", label: "Rating (1–5)",    type: "text",     placeholder: "5" },
        ],
      },
    ],
    defaultContent: { title: "What customers say", items: [] },
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Frequently asked questions",
    iconKey: "faq",
    fields: [
      { id: "title", label: "Section title", type: "text", placeholder: "Frequently asked questions" },
      {
        id: "items",
        label: "Questions",
        type: "items",
        hint: "Add your Q&A pairs",
        itemFields: [
          { id: "question", label: "Question", type: "text",     placeholder: "What is your return policy?" },
          { id: "answer",   label: "Answer",   type: "textarea", placeholder: "We offer a 30-day return..." },
        ],
      },
    ],
    defaultContent: { title: "Frequently asked questions", items: [] },
  },
  {
    type: "newsletter",
    label: "Newsletter",
    description: "Email capture section",
    iconKey: "newsletter",
    fields: [
      { id: "headline",    label: "Headline",         type: "text",     placeholder: "Stay in the loop" },
      { id: "subtext",     label: "Subtext",          type: "textarea", placeholder: "Subscribe for exclusive deals and early access" },
      { id: "placeholder", label: "Input placeholder",type: "text",     placeholder: "Your email address" },
      { id: "buttonText",  label: "Button text",      type: "text",     placeholder: "Subscribe" },
    ],
    defaultContent: { headline: "Stay in the loop", subtext: "", placeholder: "Your email address", buttonText: "Subscribe" },
  },
];

export const SECTION_MAP = Object.fromEntries(SECTION_TYPES.map(s => [s.type, s]));

export interface PageDef {
  key: string;
  label: string;
  description: string;
}

export const PAGE_TYPES: PageDef[] = [
  { key: "home",    label: "Home",    description: "Main landing page" },
  { key: "shop",    label: "Shop",    description: "Product catalog page" },
  { key: "about",   label: "About",   description: "About us page" },
  { key: "contact", label: "Contact", description: "Contact page" },
];
