import type { ReactNode } from "react";

export default function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="h-full overflow-y-auto px-7 py-6">
      <h1 className="text-[28px] font-semibold text-white">{title}</h1>
      <p className="mt-1 text-[14px] text-white/65">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/[0.07] bg-white/[0.025] px-6 py-16 text-center">
      <div className="h-12 w-12 rounded-full bg-[radial-gradient(circle_at_40%_35%,#c4b5fd,#6d28d9_55%,#1e1b4b)] shadow-[0_0_22px_rgba(124,92,255,.45)]" />
      <p className="mt-4 text-[16px] font-semibold text-white">{title}</p>
      <p className="mt-1 max-w-md text-[13px] text-white/60">{text}</p>
    </div>
  );
}
