/** Company types and which of the 12 agents usually help them most. */
export interface Industry {
  id: string;
  label: string;
  blurb: string;
  recommended: string[];
}

export const INDUSTRIES: Industry[] = [
  { id: "software", label: "Software / IT / SaaS", blurb: "Building and selling software needs product, engineering and quality, plus growth and support.", recommended: ["strategy", "finance", "product", "engineering", "qa", "marketing", "sales", "support"] },
  { id: "healthcare", label: "Healthcare / Clinic / Hospital", blurb: "Care providers need compliance, hiring and patient support, plus steady finances and local marketing.", recommended: ["strategy", "finance", "hr", "legal", "marketing", "support"] },
  { id: "retail", label: "Retail / E-commerce", blurb: "Selling products is about demand, customers and margins: marketing, sales, support and market research.", recommended: ["strategy", "finance", "marketing", "sales", "support", "research"] },
  { id: "manufacturing", label: "Manufacturing / Industrial", blurb: "Factories need tight finances, people management, contracts and a steady stream of buyers.", recommended: ["strategy", "finance", "hr", "legal", "sales", "research"] },
  { id: "education", label: "Education / Training", blurb: "Schools and training firms need a strong offer, teachers and staff, student support and marketing.", recommended: ["strategy", "finance", "product", "hr", "marketing", "support"] },
  { id: "services", label: "Agency / Consulting / Professional services", blurb: "Selling expertise needs clients, clear positioning, good people and clean contracts.", recommended: ["strategy", "finance", "marketing", "sales", "hr", "legal"] },
  { id: "fintech", label: "Finance / Fintech / Insurance", blurb: "Regulated money businesses need strong compliance, product, engineering and trust-building sales and support.", recommended: ["strategy", "finance", "legal", "product", "engineering", "sales", "support"] },
  { id: "realestate", label: "Real estate / Construction", blurb: "Projects and deals depend on sales, contracts, cash planning and marketing.", recommended: ["strategy", "finance", "sales", "marketing", "legal", "support"] },
  { id: "hospitality", label: "Hospitality / Food & Beverage", blurb: "Restaurants and hotels live on people, reputation, customer service and tight margins.", recommended: ["strategy", "finance", "hr", "marketing", "sales", "support"] },
  { id: "logistics", label: "Logistics / Transport", blurb: "Moving goods needs reliable people, customer service, contracts and well-managed cash flow.", recommended: ["strategy", "finance", "hr", "sales", "support", "legal"] },
  { id: "media", label: "Media / Creative / Content", blurb: "Creative businesses need an audience, partnerships, rights and a clear product.", recommended: ["strategy", "finance", "marketing", "sales", "product", "legal"] },
  { id: "nonprofit", label: "Non-profit / NGO", blurb: "Mission-led organisations need funding strategy, people, compliance and outreach.", recommended: ["strategy", "finance", "hr", "marketing", "legal", "research"] },
  { id: "agri", label: "Agriculture / Food processing", blurb: "Farm and food businesses need buyers, market insight, steady cash and compliance.", recommended: ["strategy", "finance", "sales", "research", "legal", "marketing"] },
  { id: "other", label: "Other", blurb: "A balanced starting team. Add or remove specialists anytime.", recommended: ["strategy", "finance", "marketing", "sales", "hr", "support"] },
];

export const industryById = (id?: string | null) => INDUSTRIES.find((i) => i.id === id);
