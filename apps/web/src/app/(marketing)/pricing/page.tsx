import Link from "next/link";
import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PACKS, PLANS } from "@/lib/plans";
import { GST_RATE } from "@/lib/pricing";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Pricing — EverMind",
  description: "Start free. Pro and Business plans for growing teams, with extra AI credits whenever you need them.",
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const short = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : `${Math.round(n / 1000)}k`);

const faqs = [
  { q: "What is a credit?", a: "Credits measure how much AI work EverMind does: reading your question and company context, and writing the answer. A short chat uses a few thousand credits; long, detailed answers use more." },
  { q: "What happens when the monthly credits run out?", a: "On Pro and Business you can buy a credit pack and keep going right away. On Free, AI features pause until next month or until you upgrade. Projects, tasks, decisions and knowledge always keep working." },
  { q: "Do unused credits carry over?", a: "The monthly allowance resets each month. Credits from packs stay valid for 12 months and are used only after the monthly allowance." },
  { q: "Can I cancel?", a: "Yes, anytime. Your plan keeps working until the end of the period you've paid for, then your company moves to Free. Your data stays." },
  { q: "How do I pay?", a: "Cards, UPI Autopay and net banking through Razorpay. You get a receipt by email for every payment." },
];

export default function PricingPage() {
  const plans = Object.values(PLANS);
  return (
    <div className="h-screen overflow-y-auto bg-[var(--app-bg)] text-white [background-image:radial-gradient(circle_at_50%_-10%,rgba(124,92,255,.28),transparent_45%)]">
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-full bg-[radial-gradient(circle_at_35%_35%,#a78bfa,#4338ca_55%,#0b0f2a)] shadow-[0_0_20px_rgba(124,92,255,.6)]" />
          <span className="text-[19px] font-semibold">EverMind</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="rounded-lg px-4 py-2 text-[14px] text-white/80 hover:text-white">Sign in</Link>
          <Link href="/signup" className="rounded-lg bg-violet-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-violet-500">Start free</Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-5 pb-20 pt-10">
        <h1 className="text-center text-[36px] font-bold leading-tight sm:text-[44px]">Simple plans for your AI executive team</h1>
        <p className="mx-auto mt-3 max-w-[620px] text-center text-[15px] text-white/65">
          Start free. Upgrade when your team relies on EverMind every day. Prices are in Indian rupees and exclude {Math.round(GST_RATE * 100)}% GST.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.id} className={`flex flex-col rounded-2xl border p-6 ${p.id === "pro" ? "border-violet-500/60 bg-violet-500/[0.08]" : "border-white/[0.08] bg-white/[0.03]"}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-semibold">{p.name}</h2>
                {p.id === "pro" && <span className="rounded-full bg-violet-600/50 px-2.5 py-0.5 text-[11px]">Most popular</span>}
              </div>
              <p className="mt-1 text-[13px] text-white/55">{p.blurb}</p>
              <p className="mt-5 text-[32px] font-bold">
                {p.priceInr.monthly ? inr(p.priceInr.monthly) : "₹0"}
                <span className="text-[13px] font-normal text-white/50">{p.priceInr.monthly ? " / month" : " forever"}</span>
              </p>
              <p className="h-5 text-[12px] text-white/50">{p.priceInr.yearly ? `or ${inr(p.priceInr.yearly)} / year (2 months free)` : "No card needed"}</p>
              <ul className="mt-5 flex-1 space-y-2.5 text-[14px] text-white/80">
                <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />{short(p.monthlyCredits)} AI credits every month</li>
                <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />Up to {p.seats} team members</li>
                <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />All 12 specialist agents</li>
                <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />Projects, decisions, knowledge and reports</li>
                {p.topUps && <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />Buy extra credits anytime</li>}
              </ul>
              <Link href="/signup" className={`mt-6 rounded-xl py-2.5 text-center text-[14px] font-medium ${p.id === "pro" ? "bg-violet-600 hover:bg-violet-500" : "border border-white/15 hover:bg-white/5"}`}>
                {p.id === "free" ? "Start free" : `Choose ${p.name}`}
              </Link>
            </div>
          ))}
        </div>

        <section className="mt-14">
          <h2 className="text-[22px] font-semibold">Need more in a busy month?</h2>
          <p className="mt-1 text-[14px] text-white/60">On Pro and Business, buy a credit pack. It&apos;s used after your monthly allowance and stays valid for 12 months.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {PACKS.map((pack) => (
              <div key={pack.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                <p className="text-[18px] font-semibold">{short(pack.credits)} credits</p>
                <p className="mt-1 text-[14px] text-white/60">{inr(pack.priceInr)} + GST</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 max-w-[760px]">
          <h2 className="text-[22px] font-semibold">Questions</h2>
          {faqs.map((f) => (
            <div key={f.q} className="mt-5">
              <h3 className="text-[15px] font-medium">{f.q}</h3>
              <p className="mt-1 text-[14px] leading-relaxed text-white/65">{f.a}</p>
            </div>
          ))}
        </section>

        <p className="mt-14 border-t border-white/[0.06] pt-6 text-[12px] text-white/40">
          EverMind uses Claude by Anthropic to write its answers. EverMind plans are sold by EverMind and are not Anthropic or Claude subscriptions.
          <span className="float-right flex gap-4">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
          </span>
        </p>
      </main>
    </div>
  );
}
