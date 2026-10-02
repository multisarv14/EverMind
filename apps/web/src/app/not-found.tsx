import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex h-screen flex-col items-center justify-center overflow-y-auto bg-[var(--app-bg)] px-6 text-center text-white">
      <div className="h-16 w-16 rounded-full bg-[radial-gradient(circle_at_35%_35%,#a78bfa,#4338ca_55%,#0b0f2a)] shadow-[0_0_30px_rgba(124,92,255,.6)]" />
      <p className="mt-6 text-[13px] uppercase tracking-wide text-white/40">Error 404</p>
      <h1 className="mt-2 text-[30px] font-bold">This page doesn&apos;t exist</h1>
      <p className="mt-2 max-w-[420px] text-[14px] leading-relaxed text-white/60">The link may be old or mistyped. Let&apos;s get you back to somewhere useful.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/dashboard" className="rounded-xl bg-violet-600 px-5 py-2.5 text-[14px] font-medium text-white hover:bg-violet-500">Go to Command Center</Link>
        <Link href="/" className="rounded-xl border border-white/15 px-5 py-2.5 text-[14px] text-white/80 hover:bg-white/5">Home</Link>
      </div>
    </main>
  );
}
