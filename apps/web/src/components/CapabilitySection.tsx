import {
  Brain,
  Search,
  Database,
  Workflow,
  Scale,
  Bot,
  MemoryStick,
  CheckCircle,
} from "lucide-react";

const items = [
  {
    icon: Search,
    title: "Understanding",
    desc: "Analyze objectives and identify intent.",
  },
  {
    icon: Brain,
    title: "Thinking",
    desc: "Reason through objectives before execution.",
  },
  {
    icon: Database,
    title: "Knowledge",
    desc: "Retrieve relevant business knowledge.",
  },
  {
    icon: Workflow,
    title: "Planning",
    desc: "Generate an execution strategy.",
  },
  {
    icon: Scale,
    title: "Decision",
    desc: "Choose the best execution path.",
  },
  {
    icon: Bot,
    title: "Agent Routing",
    desc: "Select the most suitable AI agent.",
  },
  {
    icon: MemoryStick,
    title: "Memory",
    desc: "Store outcomes for continuous learning.",
  },
  {
    icon: CheckCircle,
    title: "Execution",
    desc: "Execute, validate and complete objectives.",
  },
];

export default function CapabilitySection() {
  return (
    <section className="ev-card h-full p-5">

      <h3 className="mb-4 text-[18px] font-semibold text-white">
        EverMind Runtime Pipeline
      </h3>

      <div className="grid h-[calc(100%-36px)] grid-cols-4 gap-3">

        {items.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-violet-500/30"
          >
            <Icon size={20} className="mb-3 text-violet-300" />

            <div className="text-sm font-semibold text-white">
              {title}
            </div>

            <div className="mt-2 text-xs leading-5 text-white/50">
              {desc}
            </div>
          </div>
        ))}

      </div>

    </section>
  );
}
