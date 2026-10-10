import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Brain, FileText, ShieldCheck } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import AuthDemo from "@/components/AuthDemo";

const points = [
  { icon: Brain, title: "Understands your goal", text: "Share an objective in plain words, in English, Marathi or Hindi." },
  { icon: FileText, title: "Plans and drafts the work", text: "Roadmaps, strategies, specs and proposals, ready to edit." },
  { icon: ShieldCheck, title: "Remembers your company", text: "Every conversation is saved to your private company memory." },
];

/** The split-screen frame shared by sign in, sign up and password reset. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid h-screen grid-cols-1 overflow-y-auto bg-[var(--app-bg)] text-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Form side */}
      <section className="flex flex-col px-6 py-4 sm:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-full bg-[radial-gradient(circle_at_35%_35%,#a78bfa,#4338ca_55%,#0b0f2a)] shadow-[0_0_20px_rgba(124,92,255,.6)]" />
            <span className="text-[19px] font-semibold">EverMind</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-1.5 text-[13px] text-white/55 hover:text-white">
              <ArrowLeft size={14} /> Back to home
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center py-4">
          {children}
        </div>

        <p className="text-center text-[12px] text-white/35">
          © {new Date().getFullYear()} EverMind · AI That Remembers. AI That Evolves.
        </p>
      </section>

      {/* Brand side */}
      <aside className="relative hidden overflow-hidden border-l border-white/[0.07] lg:flex lg:flex-col lg:justify-start lg:px-16 lg:pt-[9vh] [background-image:radial-gradient(circle_at_30%_20%,rgba(124,92,255,.35),transparent_50%),radial-gradient(circle_at_80%_85%,rgba(56,189,248,.18),transparent_45%)]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle_at_40%_35%,#c4b5fd,#6d28d9_45%,transparent_70%)] opacity-40 blur-2xl" />

        <div className="relative w-full max-w-[560px]">
          <h2 className="text-[36px] font-bold leading-[1.15]">
            The AI Executive that{" "}
            <span className="bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              runs the work
            </span>{" "}
            while you lead.
          </h2>

          <ul className="mt-7 space-y-4">
            {points.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-violet-300">
                  <Icon size={20} />
                </span>
                <div>
                  <p className="text-[15px] font-semibold">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-white/60">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <AuthDemo />
        </div>
      </aside>
    </main>
  );
}
