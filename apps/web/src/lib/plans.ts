export type PlanId = "free" | "pro" | "business";
export type Interval = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  name: string;
  /** AI credits included every month (see lib/pricing.ts). */
  monthlyCredits: number;
  seats: number;
  /** Price in INR before GST. Free is 0. */
  priceInr: Record<Interval, number>;
  /** Whether the company can buy extra credit packs on this plan. */
  topUps: boolean;
  blurb: string;
}

// Free-plan limits can be tuned with env vars (handy for testing).
export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    monthlyCredits: Number(process.env.FREE_MONTHLY_CREDITS ?? process.env.FREE_MONTHLY_TOKENS ?? 50_000),
    seats: Number(process.env.FREE_SEATS ?? 3),
    priceInr: { monthly: 0, yearly: 0 },
    topUps: false,
    blurb: "Try EverMind with your team.",
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyCredits: 2_000_000,
    seats: 25,
    priceInr: { monthly: 2999, yearly: 29990 },
    topUps: true,
    blurb: "For growing companies.",
  },
  business: {
    id: "business",
    name: "Business",
    monthlyCredits: 10_000_000,
    seats: 100,
    priceInr: { monthly: 14999, yearly: 149990 },
    topUps: true,
    blurb: "For larger teams and heavy use.",
  },
};

export const planOf = (id: string | undefined): Plan => PLANS[(id as PlanId) in PLANS ? (id as PlanId) : "free"];

export const isPaidPlan = (id: string): id is Exclude<PlanId, "free"> => id === "pro" || id === "business";

export interface CreditPack {
  id: string;
  credits: number;
  /** Price in INR before GST. */
  priceInr: number;
}

/** Extra credits for paid plans, used after the monthly allowance. Valid for 12 months. */
export const PACKS: CreditPack[] = [
  { id: "500k", credits: 500_000, priceInr: 799 },
  { id: "1m", credits: 1_000_000, priceInr: 1499 },
  { id: "5m", credits: 5_000_000, priceInr: 6999 },
];

export const PACK_VALID_DAYS = 365;

/** Days a company keeps its paid plan after a renewal payment fails. */
export const GRACE_DAYS = 7;
