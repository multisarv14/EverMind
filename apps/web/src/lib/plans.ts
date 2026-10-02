export type PlanId = "free" | "pro" | "business";

export interface Plan {
  id: PlanId;
  name: string;
  monthlyTokens: number;
  seats: number;
  blurb: string;
}

// Free-plan limits can be tuned with env vars (handy for testing).
export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    monthlyTokens: Number(process.env.FREE_MONTHLY_TOKENS ?? 50_000),
    seats: Number(process.env.FREE_SEATS ?? 3),
    blurb: "Try EverMind with your team.",
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyTokens: 2_000_000,
    seats: 25,
    blurb: "For growing companies.",
  },
  business: {
    id: "business",
    name: "Business",
    monthlyTokens: 10_000_000,
    seats: 100,
    blurb: "For larger teams and heavy use.",
  },
};

export const planOf = (id: string | undefined): Plan => PLANS[(id as PlanId) in PLANS ? (id as PlanId) : "free"];
