import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowRight,
  Brain,
  Check,
  Minus,
  ChevronDown,
  ClipboardList,
  Scale,
  FileText,
  BookOpen,
  Languages,
  MessageSquareText,
  Rocket,
  ShieldCheck,
  Target,
} from "lucide-react";
import { currentSession } from "@/lib/auth";
import { agents } from "@/constants/agents";
import HeroPreview from "@/components/HeroPreview";
import Reveal from "@/components/Reveal";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "EverMind — AI That Remembers. AI That Evolves.",
  description:
    "EverMind is an AI executive team for your company. Specialist agents for strategy, finance, marketing, operations and more learn your business, remember every conversation and decision, and keep getting sharper every day. Free to start.",
};

const today = [
  { icon: Brain, tone: "text-sky-400 bg-sky-500/15", title: "Understands your goal", text: "Tell it what you want in plain words. It fills in the gaps and states its assumptions." },
  { icon: ClipboardList, tone: "text-emerald-400 bg-emerald-500/15", title: "Plans the work", text: "Turns an idea into a roadmap, milestones and a clear first step." },
  { icon: Scale, tone: "text-orange-400 bg-orange-500/15", title: "Recommends decisions", text: "Gives a clear recommendation with the reasoning and the main trade-off." },
  { icon: FileText, tone: "text-violet-400 bg-violet-500/15", title: "Drafts the deliverables", text: "Strategies, specs, proposals, emails, checklists and code — ready to edit." },
  { icon: BookOpen, tone: "text-pink-400 bg-pink-500/15", title: "Remembers everything", text: "Every conversation is saved to your company memory, so you never start from zero." },
  { icon: Languages, tone: "text-amber-400 bg-amber-500/15", title: "Speaks your language", text: "Ask in English, Marathi or Hindi and get the answer back in the same language." },
];

const steps = [
  { n: "1", title: "Share your goal", text: "Type what you want to accomplish — a launch, a pitch, a hiring plan, a problem to solve." },
  { n: "2", title: "EverMind does the thinking", text: "It acts like your chief of staff: it plans, weighs options and writes the first version." },
  { n: "3", title: "You stay in control", text: "Review, ask follow-ups, and decide. You focus on the vision; EverMind handles the rest." },
];

const compare = [
  { what: "Works toward your goal, not just one reply", us: true, other: false },
  { what: "Remembers your company across conversations", us: true, other: false },
  { what: "Answers as the right specialist (finance, legal, product…)", us: true, other: false },
  { what: "Ends with a clear recommendation", us: true, other: false },
  { what: "Generic Q&A about anything", us: true, other: true },
];

const faqs = [
  { q: "Is EverMind free?", a: "You can create a company account and start for free. No credit card is needed." },
  { q: "What can it do today?", a: "It understands your goal, plans the work, recommends decisions, drafts documents and code, and remembers every conversation. It can’t yet take actions outside the chat, like sending emails or deploying software — agents that do that are next." },
  { q: "Is my data private?", a: "Your account and conversations sit behind your login and are not shown to other users. To write answers, your messages are sent to Anthropic’s Claude." },
  { q: "Which languages does it speak?", a: "English, Marathi and Hindi, among others. It replies in the language you write in." },
  { q: "Can my whole team use it?", a: "Today each person creates their own account. Shared team workspaces are on the roadmap." },
];

const examples = ["Plan our Q4 launch", "Draft an investor update", "Compare two pricing models", "Write a job description"];

export default async function LandingPage() {
  if (await currentSession()) redirect("/dashboard");

  return (
    <div className="h-screen overflow-y-auto bg-[var(--app-bg)] text-white [background-image:radial-gradient(circle_at_50%_-10%,rgba(124,92,255,.28),transparent_45%),radial-gradient(circle_at_85%_30%,rgba(56,189,248,.10),transparent_35%)]">
      <div className="sticky top-0 z-20 border-b border-white/[0.06] bg-[color-mix(in_srgb,var(--app-bg)_70%,transparent)] backdrop-blur-md">
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-full bg-[radial-gradient(circle_at_35%_35%,#a78bfa,#4338ca_55%,#0b0f2a)] shadow-[0_0_20px_rgba(124,92,255,.6)]" />
          <span className="text-[19px] font-semibold">EverMind</span>
        </Link>

        <nav className="hidden items-center gap-7 text-[14px] text-white/70 md:flex">
          <a href="#features" className="hover:text-white">What it does</a>
          <a href="#how" className="hover:text-white">How it works</a>
          <a href="#team" className="hover:text-white">AI team</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="rounded-lg px-4 py-2 text-[14px] text-white/80 hover:text-white">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-violet-600 px-4 py-2 text-[14px] font-medium text-white shadow-[0_0_18px_rgba(124,92,255,.45)] hover:bg-violet-500"
          >
            Start free
          </Link>
        </div>
      </header>
      </div>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-[1200px] px-5 pb-16 pt-14 text-center sm:pt-20">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[13px] text-violet-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Free to start · No credit card
          </p>
          <h1 className="mx-auto mt-6 max-w-[860px] text-[40px] font-bold leading-[1.1] sm:text-[60px]">
            AI That Remembers.{" "}
            <span className="bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              AI That Evolves.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-[640px] text-[17px] leading-relaxed text-white/70">
            EverMind is your AI executive team. Specialist agents learn your company, remember every conversation
            and decision, and get sharper every day. You focus on the vision.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-7 py-3.5 text-[15px] font-medium text-white shadow-[0_0_28px_rgba(124,92,255,.5)] hover:bg-violet-500"
            >
              Start free <ArrowRight size={17} />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/15 bg-white/[0.04] px-7 py-3.5 text-[15px] text-white hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>

          <HeroPreview />

          <div className="mx-auto mt-6 flex max-w-[820px] flex-wrap justify-center gap-2">
            {examples.map((e) => (
              <span key={e} className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[12px] text-white/65">
                {e}
              </span>
            ))}
          </div>
        </section>

        {/* What it does */}
        <section id="features" className="mx-auto max-w-[1200px] scroll-mt-20 px-5 py-16">
          <h2 className="text-center text-[30px] font-bold sm:text-[38px]">What EverMind does for you</h2>
          <p className="mx-auto mt-3 max-w-[560px] text-center text-white/60">
            Not another chatbot. An executive that works on your goals and remembers your company.
          </p>
          <Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {today.map(({ icon: Icon, tone, title, text }) => (
              <div key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 text-[16px] font-semibold">{title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-white/60">{text}</p>
              </div>
            ))}
          </div>
          </Reveal>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-[1200px] scroll-mt-20 px-5 py-16">
          <h2 className="text-center text-[30px] font-bold sm:text-[38px]">How it works</h2>
          <Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600/30 text-[15px] font-semibold text-violet-200">
                  {s.n}
                </span>
                <h3 className="mt-4 text-[17px] font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-white/60">{s.text}</p>
              </div>
            ))}
          </div>
          </Reveal>
        </section>

        {/* Compare */}
        <section className="mx-auto max-w-[900px] px-5 py-16">
          <h2 className="text-center text-[30px] font-bold sm:text-[38px]">More than a chatbot</h2>
          <Reveal>
            <div className="mt-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              <div className="grid grid-cols-[1fr_90px_90px] border-b border-white/[0.08] px-5 py-3 text-[12px] uppercase tracking-wide text-white/45 sm:grid-cols-[1fr_130px_130px]">
                <span />
                <span className="text-center text-violet-300">EverMind</span>
                <span className="text-center">Typical chatbot</span>
              </div>
              {compare.map((row) => (
                <div key={row.what} className="grid grid-cols-[1fr_90px_90px] items-center border-b border-white/[0.05] px-5 py-3.5 last:border-b-0 sm:grid-cols-[1fr_130px_130px]">
                  <span className="pr-3 text-[14px] text-white/85">{row.what}</span>
                  <span className="flex justify-center">{row.us ? <Check size={18} className="text-emerald-400" /> : <Minus size={18} className="text-white/25" />}</span>
                  <span className="flex justify-center">{row.other ? <Check size={18} className="text-white/40" /> : <Minus size={18} className="text-white/25" />}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* AI team */}
        <section id="team" className="mx-auto max-w-[1200px] scroll-mt-20 px-5 py-16">
          <h2 className="text-center text-[30px] font-bold sm:text-[38px]">A whole executive team, in one place</h2>
          <p className="mx-auto mt-3 max-w-[620px] text-center text-white/60">
            EverMind thinks like the right specialist for each problem. Dedicated agents that take actions on their own are coming next.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {agents.map(({ icon: Icon, tone, name, text }) => (
              <div key={name} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{name}</p>
                  <p className="truncate text-[11px] text-white/55">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-[780px] scroll-mt-20 px-5 py-16">
          <h2 className="text-center text-[30px] font-bold sm:text-[38px]">Questions, answered</h2>
          <div className="mt-10 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-medium">
                  {f.q}
                  <ChevronDown size={18} className="shrink-0 text-white/50 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-[14px] leading-relaxed text-white/65">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Trust + CTA */}
        <section className="mx-auto max-w-[1200px] px-5 py-16">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Private by default", text: "Your account and conversations are yours, protected behind your login." },
              { icon: MessageSquareText, title: "Always in context", text: "EverMind remembers earlier conversations so every answer builds on the last." },
              { icon: Target, title: "Built for decisions", text: "Every answer ends in a recommendation, not a wall of options." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                <Icon size={22} className="mt-0.5 shrink-0 text-violet-300" />
                <div>
                  <p className="text-[15px] font-semibold">{title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/60">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-3xl border border-violet-500/30 bg-gradient-to-b from-violet-600/20 to-transparent px-6 py-14 text-center">
            <Rocket className="mx-auto text-violet-300" size={28} />
            <h2 className="mt-4 text-[30px] font-bold sm:text-[38px]">Start free today</h2>
            <p className="mx-auto mt-3 max-w-[480px] text-white/65">
              Create your account in a minute and give EverMind its first objective.
            </p>
            <Link
              href="/signup"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-7 py-3.5 text-[15px] font-medium text-white shadow-[0_0_28px_rgba(124,92,255,.5)] hover:bg-violet-500"
            >
              Start free <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.07] px-5 py-12">
        <div className="mx-auto grid max-w-[1200px] gap-8 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-full bg-[radial-gradient(circle_at_35%_35%,#a78bfa,#4338ca_55%,#0b0f2a)]" />
              <span className="text-[17px] font-semibold">EverMind</span>
            </div>
            <p className="mt-3 max-w-[300px] text-[13px] leading-relaxed text-white/50">
              Your AI executive team that learns your company.
            </p>
          </div>
          <div>
            <p className="text-[13px] font-semibold">Product</p>
            <ul className="mt-3 space-y-2 text-[13px] text-white/55">
              <li><a href="#features" className="hover:text-white">What it does</a></li>
              <li><a href="#how" className="hover:text-white">How it works</a></li>
              <li><a href="#team" className="hover:text-white">AI team</a></li>
              <li><a href="#faq" className="hover:text-white">FAQ</a></li>
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold">Account</p>
            <ul className="mt-3 space-y-2 text-[13px] text-white/55">
              <li><Link href="/signup" className="hover:text-white">Start free</Link></li>
              <li><Link href="/login" className="hover:text-white">Sign in</Link></li>
            </ul>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-[1200px] border-t border-white/[0.06] pt-6 text-[12px] text-white/40">
          © {new Date().getFullYear()} EverMind. All rights reserved.
          <span className="float-right flex gap-4">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
          </span>
        </p>
      </footer>
    </div>
  );
}
