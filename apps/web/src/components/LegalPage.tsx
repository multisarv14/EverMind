import Link from "next/link";

export interface LegalSection {
  title: string;
  body: string[];
}

/** A plain, readable page for legal text, shared by Terms and Privacy. */
export default function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro: string; sections: LegalSection[] }) {
  return (
    <div className="h-screen overflow-y-auto bg-[var(--app-bg)] text-white">
      <header className="mx-auto flex max-w-[820px] items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-full bg-[radial-gradient(circle_at_35%_35%,#a78bfa,#4338ca_55%,#0b0f2a)] shadow-[0_0_20px_rgba(124,92,255,.6)]" />
          <span className="text-[19px] font-semibold">EverMind</span>
        </Link>
        <nav className="flex gap-5 text-[13px] text-white/60">
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
        </nav>
      </header>

      <main className="mx-auto max-w-[820px] px-5 pb-20 pt-6">
        <h1 className="text-[34px] font-bold leading-tight">{title}</h1>
        <p className="mt-1 text-[13px] text-white/45">Last updated: {updated}</p>

        <p className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] leading-relaxed text-amber-300">
          Draft: this document is a plain-language starting point and has not yet been reviewed by a lawyer. Details in [square brackets] will be filled in before launch.
        </p>

        <p className="mt-6 text-[15px] leading-relaxed text-white/75">{intro}</p>

        {sections.map((s, i) => (
          <section key={s.title} className="mt-9">
            <h2 className="text-[19px] font-semibold">{i + 1}. {s.title}</h2>
            {s.body.map((para) => (
              <p key={para} className="mt-3 text-[14px] leading-relaxed text-white/70">{para}</p>
            ))}
          </section>
        ))}

        <p className="mt-12 border-t border-white/[0.08] pt-6 text-[13px] text-white/45">
          Questions? Contact us at [support email]. <Link href="/" className="text-violet-300 hover:underline">Back to EverMind</Link>
        </p>
      </main>
    </div>
  );
}
