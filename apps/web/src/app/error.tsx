"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex h-screen flex-col items-center justify-center overflow-y-auto bg-[var(--app-bg)] px-6 text-center text-white">
      <div className="h-16 w-16 rounded-full bg-[radial-gradient(circle_at_35%_35%,#fda4af,#be123c_55%,#2a0a14)] shadow-[0_0_30px_rgba(244,63,94,.45)]" />
      <h1 className="mt-6 text-[28px] font-bold">Something went wrong</h1>
      <p className="mt-2 max-w-[440px] text-[14px] leading-relaxed text-white/60">
        That wasn&apos;t supposed to happen, and it isn&apos;t your fault. Try again, and if it keeps happening, come back in a few minutes.
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="rounded-xl bg-violet-600 px-5 py-2.5 text-[14px] font-medium text-white hover:bg-violet-500">Try again</button>
        <Link href="/dashboard" className="rounded-xl border border-white/15 px-5 py-2.5 text-[14px] text-white/80 hover:bg-white/5">Command Center</Link>
      </div>
    </main>
  );
}
