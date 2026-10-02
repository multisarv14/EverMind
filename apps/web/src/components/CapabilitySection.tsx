import {
  ScanSearch,
  ClipboardList,
  Code,
  ShieldCheck,
  Rocket,
  Activity,
  TrendingUp,
  Sparkles,
} from "lucide-react";

const items = [
  { icon: ScanSearch, tone: "text-sky-400 bg-sky-500/15", title: "Understand", text: "Deeply understand business, users, market" },
  { icon: ClipboardList, tone: "text-emerald-400 bg-emerald-500/15", title: "Plan", text: "Create strategy, roadmap, architecture, tasks" },
  { icon: Code, tone: "text-blue-400 bg-blue-500/15", title: "Build", text: "Design, code, integrate, and develop" },
  { icon: ShieldCheck, tone: "text-orange-400 bg-orange-500/15", title: "Test", text: "QA, test cases, automation" },
  { icon: Rocket, tone: "text-violet-400 bg-violet-500/15", title: "Deploy", text: "Setup infra, CI/CD, deploy live" },
  { icon: Activity, tone: "text-sky-400 bg-sky-500/15", title: "Monitor", text: "Monitor systems, errors, performance" },
  { icon: TrendingUp, tone: "text-emerald-400 bg-emerald-500/15", title: "Scale", text: "Optimize, scale, improve" },
  { icon: Sparkles, tone: "text-violet-300 bg-violet-500/15", title: "Learn", text: "Remember everything, get smarter daily" },
];

export default function CapabilitySection() {
  return (
    <section className="flex min-h-0 flex-col rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
      <h3 className="text-[14px] font-semibold text-white">EverMind Capabilities</h3>

      <div className="mt-3 grid min-h-0 flex-1 grid-cols-4 gap-2">
        {items.map(({ icon: Icon, tone, title, text }) => (
          <div
            key={title}
            className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-2.5"
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
              <Icon size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-white">{title}</p>
              <p className="mt-0.5 line-clamp-3 text-[10px] leading-snug text-white/60">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
