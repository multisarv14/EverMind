"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function UserMenu({ name, subtitle }: { name: string; subtitle: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600/40 text-[14px] font-semibold text-white">
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[13px] font-medium text-white">{name}</p>
        <p className="truncate text-[11px] text-white/50">{subtitle}</p>
      </div>
      <ThemeToggle className="!h-8 !w-8 shrink-0" />
      <button onClick={logout} aria-label="Log out" title="Log out" className="text-white/50 hover:text-white">
        <LogOut size={16} />
      </button>
    </div>
  );
}
