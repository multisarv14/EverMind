"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";

/** The signed-in frame: a fixed sidebar on large screens, a slide-in menu on phones and tablets. */
export default function AppShell({ user, children }: { user: { name: string; subtitle: string }; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--app-bg)] text-white">
      <div className="hidden lg:block">
        <Sidebar user={user} />
      </div>

      {/* Phone / tablet top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.07] bg-[var(--panel-bg)] px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="h-8 w-8 rounded-full bg-[radial-gradient(circle_at_35%_35%,#a78bfa,#4338ca_55%,#0b0f2a)] shadow-[0_0_14px_rgba(124,92,255,.55)]" />
          <span className="text-[17px] font-semibold">EverMind</span>
        </Link>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="flex h-10 w-10 items-center justify-center rounded-lg text-white/75 hover:bg-white/10">
          <Menu size={22} />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-label="Menu">
          <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 cursor-default bg-black/50" />
          <div className="relative h-full w-[265px] max-w-[85vw]">
            <Sidebar user={user} onNavigate={() => setOpen(false)} />
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute -right-12 top-3 flex h-10 w-10 items-center justify-center rounded-lg bg-black/40 text-white">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1 overflow-hidden pt-14 lg:pt-0">{children}</div>
    </div>
  );
}
