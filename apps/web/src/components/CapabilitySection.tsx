import {
  Brain,
  Compass,
  Hammer,
  Rocket,
  ShieldCheck,
  TrendingUp,
  Wrench,
  Layers3,
} from "lucide-react";

const items = [
  { icon: Compass, title: "Understand", desc: "Business, users, market" },
  { icon: Layers3, title: "Plan", desc: "Roadmaps & strategy" },
  { icon: Hammer, title: "Build", desc: "Engineering execution" },
  { icon: ShieldCheck, title: "Test", desc: "Quality assurance" },
  { icon: Rocket, title: "Deploy", desc: "Release & delivery" },
  { icon: TrendingUp, title: "Scale", desc: "Growth & optimization" },
  { icon: Brain, title: "Learn", desc: "Continuous memory" },
  { icon: Wrench, title: "Operate", desc: "Monitoring & support" },
];

export default function CapabilitySection() {
  return (
    <section className="ev-card h-full p-5">

      <h3 className="mb-4 text-[18px] font-semibold text-white">
        EverMind Capabilities
      </h3>

      <div className="grid h-[calc(100%-36px)] grid-cols-4 gap-3">

        {items.map(({ icon: Icon, title, desc }) => (

          <div
            key={title}
            className="rounded-xl border border-white/8 bg-white/[0.025] p-3 transition hover:border-violet-400/20"
          >

            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
              <Icon size={16} className="text-violet-300" />
            </div>

            <div className="text-[15px] font-semibold text-white">
              {title}
            </div>

            <div className="mt-1 line-clamp-2 text-[12px] leading-4 text-white/45">
              {desc}
            </div>

          </div>

        ))}

      </div>

    </section>
  );
}
