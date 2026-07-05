import {
  Brain,
  CheckSquare,
  Code2,
  DollarSign,
  FileText,
  FolderKanban,
  Scale,
} from "lucide-react";

const cards = [
  { icon: Scale, title: "Active Initiatives", value: "0", sub: "No initiatives yet", color: "text-violet-300" },
  { icon: Code2, title: "Projects", value: "0", sub: "No projects yet", color: "text-cyan-300" },
  { icon: CheckSquare, title: "Tasks", value: "0", sub: "No tasks yet", color: "text-emerald-300" },
  { icon: FolderKanban, title: "Decisions", value: "0", sub: "No decisions yet", color: "text-amber-300" },
  { icon: FileText, title: "Documents", value: "0", sub: "No documents yet", color: "text-pink-300" },
  { icon: Brain, title: "Memory", value: "0", sub: "Learning your business", color: "text-violet-300" },
  { icon: DollarSign, title: "Financial", value: "₹0", sub: "No financial data", color: "text-yellow-300" },
];

export default function KPISection() {
  return (
    <section className="mt-3">
      <div className="grid grid-cols-7 gap-3">

        {cards.map(({ icon: Icon, title, value, sub, color }) => (

          <div
            key={title}
            className="ev-card flex h-[118px] flex-col justify-between p-3"
          >

            <div className="flex items-center justify-between">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04]">
                <Icon size={16} className={color} />
              </div>

              <span className="text-[18px] font-semibold text-white">
                {value}
              </span>

            </div>

            <div>

              <div className="text-[15px] font-semibold leading-5 text-white">
                {title}
              </div>

              <div className="mt-1 text-[12px] leading-4 text-white/45 line-clamp-2">
                {sub}
              </div>

            </div>

          </div>

        ))}

      </div>
    </section>
  );
}
