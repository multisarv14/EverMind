import {
  Target,
  DollarSign,
  Search,
  Users,
  Package,
  Scale,
  Cpu,
  Megaphone,
  ShieldCheck,
  TrendingUp,
  Cloud,
  LifeBuoy,
} from "lucide-react";

export const agents = [
  { icon: Target, tone: "text-blue-400 bg-blue-500/15", id: "strategy", starters: ["Help me define our top 3 priorities for this quarter", "What should our 12-month growth strategy look like?", "Review my business idea and tell me the biggest risks"], name: "Strategy Agent", text: "Planning growth & direction" },
  { icon: DollarSign, tone: "text-amber-400 bg-amber-500/15", id: "finance", starters: ["Build a simple 12-month budget for my company", "How should I price my product?", "Explain our cashflow risks and how to reduce them"], name: "Finance Agent", text: "Accounting, cashflow, tax" },
  { icon: Search, tone: "text-emerald-400 bg-emerald-500/15", id: "research", starters: ["Who are our likely competitors and how do we differ?", "Outline a plan to research our target customers", "Summarise key trends in my industry"], name: "Research Agent", text: "Market, users, trends" },
  { icon: Users, tone: "text-pink-400 bg-pink-500/15", id: "hr", starters: ["Write a job description for a sales manager", "Create a 30-60-90 day onboarding plan", "How should we structure performance reviews?"], name: "HR Agent", text: "Hiring, payroll, culture" },
  { icon: Package, tone: "text-rose-400 bg-rose-500/15", id: "product", starters: ["Write a product requirements doc for a new feature", "Help me prioritise my feature backlog", "Define success metrics for our product"], name: "Product Agent", text: "Roadmaps, features, PRD" },
  { icon: Scale, tone: "text-orange-400 bg-orange-500/15", id: "legal", starters: ["What should be in a simple client contract?", "List compliance basics for a new startup", "Review the risks in this agreement: "], name: "Legal Agent", text: "Contracts, compliance" },
  { icon: Cpu, tone: "text-sky-400 bg-sky-500/15", id: "engineering", starters: ["Propose an architecture for a simple SaaS app", "Estimate the effort to build an MVP", "Help me debug this problem: "], name: "Engineering Agent", text: "Architecture, code, dev" },
  { icon: Megaphone, tone: "text-rose-300 bg-rose-500/15", id: "marketing", starters: ["Create a 30-day launch campaign plan", "Write 5 headlines for our landing page", "Define our brand voice and messaging"], name: "Marketing Agent", text: "Growth, campaigns, brand" },
  { icon: ShieldCheck, tone: "text-emerald-400 bg-emerald-500/15", id: "qa", starters: ["Write a test plan for a login feature", "What edge cases should I test for checkout?", "Create a release-readiness checklist"], name: "QA Agent", text: "Testing, quality, reliability" },
  { icon: TrendingUp, tone: "text-emerald-300 bg-emerald-500/15", id: "sales", starters: ["Write a cold outreach email for new leads", "Create a simple sales process for my team", "How do I handle the price objection?"], name: "Sales Agent", text: "Leads, deals, revenue" },
  { icon: Cloud, tone: "text-blue-400 bg-blue-500/15", id: "devops", starters: ["Design a CI/CD pipeline for a small team", "What monitoring should we set up first?", "Create a deployment checklist"], name: "DevOps Agent", text: "Infra, deploy, monitor" },
  { icon: LifeBuoy, tone: "text-violet-400 bg-violet-500/15", id: "support", starters: ["Write replies to the 5 most common support questions", "Create a ticket triage process", "Draft a polite apology email for a service outage"], name: "Support Agent", text: "Customers, tickets, success" },
];
