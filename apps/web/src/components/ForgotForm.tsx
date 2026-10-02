"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { MailCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { api, errMsg } from "@/lib/client";

export default function ForgotForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/forgot", "POST", { email });
      setSent(true);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      {sent ? (
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400"><MailCheck size={26} /></span>
          <h1 className="mt-5 text-[26px] font-bold">Check your email</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-white/60">
            If an account exists for <span className="text-white">{email}</span>, we&apos;ve sent a link to choose a new password. It works for 1 hour.
          </p>
          <p className="mt-2 text-[12px] text-white/40">Nothing arrived? Check your spam folder, or try again in a few minutes.</p>
          <Link href="/login" className="mt-6 inline-block text-[14px] font-medium text-violet-300 hover:underline">← Back to sign in</Link>
        </div>
      ) : (
        <>
          <h1 className="text-[30px] font-bold leading-tight">Forgot your password?</h1>
          <p className="mt-2 text-[14px] text-white/60">Enter your email and we&apos;ll send you a link to choose a new one.</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-white/75">Email</label>
              <input id="email" type="email" required autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[14px] text-white outline-none transition placeholder:text-white/35 focus:border-violet-500/70 focus:bg-white/[0.06]" />
            </div>
            {error && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-300">{error}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-violet-600 py-3.5 text-[15px] font-medium text-white shadow-[0_0_24px_rgba(124,92,255,.45)] transition hover:bg-violet-500 disabled:opacity-60">
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </form>
          <p className="mt-6 text-center text-[14px] text-white/60"><Link href="/login" className="font-medium text-violet-300 hover:underline">← Back to sign in</Link></p>
        </>
      )}
    </AuthLayout>
  );
}
