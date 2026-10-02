import { DollarSign } from "lucide-react";
import { agents } from "@/constants/agents";

export default function AIPanel() {
  return (
    <div className="flex min-h-0 flex-col gap-3">
      <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-white">
            My AI Team <span className="font-normal text-white/60">(Always Working)</span>
          </h3>
          <span className="rounded-md border border-white/10 px-3 py-1 text-[11px] text-white/80">
            View all
          </span>
        </div>

        <div className="mt-3 grid min-h-0 flex-1 grid-cols-2 content-between gap-x-3 gap-y-2">
          {agents.map(({ icon: Icon, tone, name, text }) => (
            <div key={name} className="flex items-center gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                <Icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-white">{name}</p>
                <p className="truncate text-[10px] text-white/55">{text}</p>
                <p className="flex items-center gap-1 text-[9px] text-emerald-400">
                  <span className={`h-1 w-1 rounded-full bg-emerald-400`} />
                  Active
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
          <DollarSign size={22} />
        </span>
        <div>
          <p className="text-[13px] font-semibold text-white">Financial Overview</p>
          <p className="text-[11px] text-white/55">No data yet</p>
        </div>
      </section>
    </div>
  );
}
