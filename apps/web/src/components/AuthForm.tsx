"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { TEAM_SIZES } from "@/constants/team";
import { INDUSTRIES } from "@/constants/industries";
import AuthLayout from "@/components/AuthLayout";
import { Eye, EyeOff } from "lucide-react";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [industry, setIndustry] = useState("");
  const [about, setAbout] = useState("");
  const [joining, setJoining] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const signup = mode === "signup";

  useEffect(() => {
    if (!signup) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("join") !== "1") return;
    const invited = params.get("email") ?? "";
    const t = setTimeout(() => {
      setJoining(true);
      setEmail(invited);
    }, 0);
    return () => clearTimeout(t);
  }, [signup]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, teamSize, industry, about, joining, name, email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.replace(signup && !data.joinedTeam ? "/onboarding" : data.admin ? "/admin" : "/dashboard");
      router.refresh();
    } catch {
      setError("Can't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[14px] text-white outline-none transition placeholder:text-white/35 focus:border-violet-500/70 focus:bg-white/[0.06]";
  const label = "mb-1 block text-[13px] font-medium text-white/75";

  return (
    <AuthLayout>
        <h1 className="text-[26px] font-bold leading-tight">
          {signup ? "Create your company account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-[14px] text-white/60">
          {signup
            ? "Set up EverMind, your AI Executive, for your company. Free to start."
            : "Sign in to your company workspace."}
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
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
            <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="teamSize" className={label}>Team size</label>
              <select
                id="teamSize"
                className={`${field} appearance-none`}
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                required
              >
                <option value="" disabled>Select size</option>
                {TEAM_SIZES.map((t) => (
                  <option key={t} value={t} className="bg-[var(--card-bg)]">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="industry" className={label}>Company type</label>
              <select
                id="industry"
                className={`${field} appearance-none`}
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
              >
                <option value="" disabled>Select type</option>
                {INDUSTRIES.map((i) => (
                  <option key={i.id} value={i.id} className="bg-[var(--card-bg)]">{i.label}</option>
                ))}
              </select>
            </div>
            </div>
          )}
          {signup && !joining && (
            <div>
              <label htmlFor="about" className={label}>What does your company do? <span className="text-white/40">(optional)</span></label>
              <textarea
                id="about"
                className={`${field} resize-none`}
                rows={2}
                maxLength={400}
                placeholder="e.g. We make appointment software for small clinics in Pune"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
              />
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
            <div className="flex items-center justify-between">
              <label htmlFor="password" className={label}>Password</label>
              {!signup && <Link href="/forgot" className="mb-1 text-[12px] text-violet-300 hover:underline">Forgot password?</Link>}
            </div>
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
            className="w-full rounded-xl bg-violet-600 py-3 text-[15px] font-medium text-white shadow-[0_0_24px_rgba(124,92,255,.45)] transition hover:bg-violet-500 disabled:opacity-60"
          >
            {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
          </button>
        </form>

        {signup && (
          <button
            type="button"
            onClick={() => { setJoining((v) => !v); setError(""); }}
            className="mt-3 w-full text-center text-[13px] text-violet-300 hover:underline"
          >
            {joining ? "← Create a new company instead" : "Was your team already invited? Join with your email"}
          </button>
        )}

        {signup && (
          <p className="mt-3 text-center text-[12px] leading-relaxed text-white/40">
            By creating an account you agree to the{" "}
            <Link href="/terms" target="_blank" className="text-white/60 underline hover:text-white">Terms</Link> and{" "}
            <Link href="/privacy" target="_blank" className="text-white/60 underline hover:text-white">Privacy Policy</Link>.
          </p>
        )}

        <p className="mt-3 text-center text-[14px] text-white/60">
          {signup ? "Already have an account?" : "New to EverMind?"}{" "}
          <Link href={signup ? "/login" : "/signup"} className="font-medium text-violet-300 hover:underline">
            {signup ? "Sign in" : "Create a company account"}
          </Link>
        </p>
    </AuthLayout>
  );
}
