import {
  Brain,
  LayoutDashboard,
  Target,
  FolderKanban,
  Bot,
  Database,
  Activity,
  BarChart3,
  Settings,
  Clock3,
  MemoryStick,
  Workflow,
} from "lucide-react";

const menu = [
  { icon: LayoutDashboard, label: "Executive Dashboard", active: true },
  { icon: Workflow, label: "Runtime" },
  { icon: Brain, label: "Thinking" },
  { icon: MemoryStick, label: "Memory" },
  { icon: Bot, label: "Agents" },
  { icon: Database, label: "Knowledge" },
  { icon: Clock3, label: "Sessions" },
  { icon: Target, label: "Objectives" },
  { icon: FolderKanban, label: "Projects" },
  { icon: Activity, label: "Execution" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-[250px] h-screen bg-[#0b0e17] border-r border-white/10 flex flex-col">

      <div className="px-5 py-6 border-b border-white/10">

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center">
            <Brain size={22} className="text-white"/>
          </div>

          <div>
            <h1 className="text-lg font-semibold text-white">
              EverMind
            </h1>

            <p className="text-xs text-violet-300">
              AI Executive OS
            </p>
          </div>
        </div>

      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">

        {menu.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
              active
                ? "border border-violet-500/20 bg-violet-500/10 text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}

      </nav>

    </aside>
  );
}
