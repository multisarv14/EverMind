"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TEAM_SIZES } from "@/constants/team";
import { ArrowLeft, Brain, Eye, EyeOff, FileText, ShieldCheck } from "lucide-react";

const points = [
  { icon: Brain, title: "Understands your goal", text: "Share an objective in plain words, in English, Marathi or Hindi." },
  { icon: FileText, title: "Plans and drafts the work", text: "Roadmaps, strategies, specs and proposals, ready to edit." },
  { icon: ShieldCheck, title: "Remembers your company", text: "Every conversation is saved to your private company memory." },
];

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [joining, setJoining] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const signup = mode === "signup";

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, teamSize, joining, name, email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.replace(signup && !data.joinedTeam ? "/projects?welcome=1" : "/dashboard");
      router.refresh();
    } catch {
      setError("Can't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[14px] text-white outline-none transition placeholder:text-white/35 focus:border-violet-500/70 focus:bg-white/[0.06]";
  const label = "mb-1.5 block text-[13px] font-medium text-white/75";

  return (
    <main className="grid h-screen grid-cols-1 overflow-y-auto bg-[#05060f] text-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Form side */}
      <section className="flex flex-col px-6 py-6 sm:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-full bg-[radial-gradient(circle_at_35%_35%,#a78bfa,#4338ca_55%,#0b0f2a)] shadow-[0_0_20px_rgba(124,92,255,.6)]" />
            <span className="text-[19px] font-semibold">EverMind</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-[13px] text-white/55 hover:text-white">
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
          <h1 className="text-[30px] font-bold leading-tight">
            {signup ? "Create your company account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-[14px] text-white/60">
            {signup
              ? "Set up EverMind, your AI Executive, for your company. Free to start."
              : "Sign in to your company workspace."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {signup && !joining && (
              <div>
                <label htmlFor="company" className={label}>Company name</label>
                <input
                  id="company"
                  className={field}
                  placeholder="Acme Pvt Ltd"
                  autoComplete="organization"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
            )}
            {signup && !joining && (
              <div>
                <label htmlFor="teamSize" className={label}>Team size</label>
                <select
                  id="teamSize"
                  className={`${field} appearance-none`}
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  required
                >
                  <option value="" disabled>Select team size</option>
                  {TEAM_SIZES.map((t) => (
                    <option key={t} value={t} className="bg-[#0a0c1c]">{t}</option>
                  ))}
                </select>
              </div>
            )}
            {signup && (
              <div>
                <label htmlFor="name" className={label}>Your name</label>
                <input
                  id="name"
                  className={field}
                  placeholder="Full name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            {signup && joining && (
              <p className="rounded-lg bg-violet-500/10 px-3 py-2.5 text-[13px] text-violet-200">
                Use the email your admin invited. You&apos;ll join their company with the access they chose.
              </p>
            )}
            <div>
              <label htmlFor="email" className={label}>{signup ? (joining ? "Invited email" : "Work email") : "Email"}</label>
              <input
                id="email"
                className={field}
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className={label}>Password</label>
              <div className="relative">
                <input
                  id="password"
                  className={`${field} pr-11`}
                  type={show ? "text" : "password"}
                  placeholder={signup ? "At least 8 characters" : "Your password"}
                  autoComplete={signup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={signup ? 8 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
                >
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-violet-600 py-3.5 text-[15px] font-medium text-white shadow-[0_0_24px_rgba(124,92,255,.45)] transition hover:bg-violet-500 disabled:opacity-60"
            >
              {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
            </button>
          </form>

          {signup && (
            <button
              type="button"
              onClick={() => { setJoining((v) => !v); setError(""); }}
              className="mt-5 w-full text-center text-[13px] text-violet-300 hover:underline"
            >
              {joining ? "← Create a new company instead" : "Was your team already invited? Join with your email"}
            </button>
          )}

          <p className="mt-4 text-center text-[14px] text-white/60">
            {signup ? "Already have an account?" : "New to EverMind?"}{" "}
            <Link href={signup ? "/login" : "/signup"} className="font-medium text-violet-300 hover:underline">
              {signup ? "Sign in" : "Create a company account"}
            </Link>
          </p>
        </div>

        <p className="text-center text-[12px] text-white/35">
          © {new Date().getFullYear()} EverMind · Your AI Executive
        </p>
      </section>

      {/* Brand side */}
      <aside className="relative hidden overflow-hidden border-l border-white/[0.07] lg:flex lg:flex-col lg:justify-center lg:px-16 [background-image:radial-gradient(circle_at_30%_20%,rgba(124,92,255,.35),transparent_50%),radial-gradient(circle_at_80%_85%,rgba(56,189,248,.18),transparent_45%)]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle_at_40%_35%,#c4b5fd,#6d28d9_45%,transparent_70%)] opacity-40 blur-2xl" />

        <div className="relative max-w-[480px]">
          <h2 className="text-[36px] font-bold leading-[1.15]">
            The AI Executive that{" "}
            <span className="bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              runs the work
            </span>{" "}
            while you lead.
          </h2>

          <ul className="mt-9 space-y-5">
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

          <div className="mt-10 rounded-2xl border border-white/10 bg-[#0a0c1c]/80 p-4 backdrop-blur">
            <p className="text-[11px] uppercase tracking-wide text-white/40">Example</p>
            <p className="mt-2 text-[13px] text-white/80">&ldquo;Plan our hiring for the next quarter.&rdquo;</p>
            <p className="mt-2 border-t border-white/10 pt-2 text-[13px] text-white/60">
              I recommend two engineers and one sales lead first. Here&apos;s the 90-day plan and budget…
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}
