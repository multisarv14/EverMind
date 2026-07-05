import { Activity, Bot, Brain, Sparkles } from "lucide-react";

const cards = [
  {
    title: "System Status",
    value: "Optimal",
    dot: "bg-emerald-400",
    Icon: Activity,
  },
  {
    title: "AI Confidence",
    value: "98%",
    dot: "bg-violet-400",
    Icon: Sparkles,
  },
  {
    title: "Company Memory",
    value: "Learning",
    dot: "bg-sky-400",
    Icon: Brain,
  },
  {
    title: "Active Agents",
    value: "12",
    dot: "bg-emerald-400",
    Icon: Bot,
  },
];

export default function TopStatus() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map(({ title, value, dot, Icon }) => (
        <div
          key={title}
          className="rounded-xl border border-white/8 bg-white/[0.04] backdrop-blur-2xl px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-white/45">
                {title}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                <span className="text-sm font-medium text-white">
                  {value}
                </span>
              </div>
            </div>

            <Icon size={18} className="text-white/35" />
          </div>
        </div>
      ))}
    </div>
  );
}
