import type { LucideIcon } from "lucide-react";

export interface HowItem {
  icon: LucideIcon;
  title: string;
  text: string;
}

/** A short row of "what is this / how does it work" cards shown at the top of a screen. */
export default function HowItWorks({ items }: { items: HowItem[] }) {
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-3">
      {items.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300"><Icon size={17} /></span>
          <div>
            <p className="text-[13px] font-semibold text-white">{title}</p>
            <p className="mt-0.5 text-[12px] leading-snug text-white/55">{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
