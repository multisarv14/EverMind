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
} from "lucide-react";

const menu = [
  { icon: LayoutDashboard, label: "Command Center", active: true },
  { icon: Target, label: "Objectives" },
  { icon: FolderKanban, label: "Projects" },
  { icon: Bot, label: "Agents" },
  { icon: Database, label: "Knowledge" },
  { icon: Activity, label: "Execution" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-[236px] h-screen bg-[#0b0e17] border-r border-white/10 flex flex-col">

      <div className="px-5 py-5 border-b border-white/5">

        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center">
            <Brain size={22} className="text-white"/>
          </div>

          <div>
            <h1 className="text-white text-lg font-semibold">
              EverMind
            </h1>

            <p className="text-xs text-white/45">
              Autonomous AI Executive
            </p>
          </div>

        </div>

      </div>

      <nav className="flex-1 p-3 space-y-1">

        {menu.map(({ icon: Icon, label, active }) => (

          <button
            key={label}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition ${
              active
                ? "bg-gradient-to-r from-violet-600/25 to-indigo-600/20 border border-violet-500/20 text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon size={18}/>
            {label}
          </button>

        ))}

      </nav>

    </aside>
  );
}
