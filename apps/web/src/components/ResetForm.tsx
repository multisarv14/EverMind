"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { api, errMsg } from "@/lib/client";

export default function ResetForm() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setToken(new URLSearchParams(window.location.search).get("token") ?? ""), 0);
    return () => clearTimeout(t);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/reset", "POST", { token, password });
      setDone(true);
      setTimeout(() => router.replace("/login"), 2500);
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      {done ? (
        <div className="text-center">
          <h1 className="text-[26px] font-bold">Password updated</h1>
          <p className="mt-3 text-[14px] text-white/60">You can now sign in with your new password. Taking you there…</p>
          <Link href="/login" className="mt-6 inline-block text-[14px] font-medium text-violet-300 hover:underline">Sign in now</Link>
        </div>
      ) : token === "" ? (
        <div className="text-center">
          <h1 className="text-[26px] font-bold">This link isn&apos;t valid</h1>
          <p className="mt-3 text-[14px] text-white/60">Open the link from your email again, or ask for a new one.</p>
          <Link href="/forgot" className="mt-6 inline-block text-[14px] font-medium text-violet-300 hover:underline">Request a new link</Link>
        </div>
      ) : (
        <>
          <h1 className="text-[30px] font-bold leading-tight">Choose a new password</h1>
          <p className="mt-2 text-[14px] text-white/60">Use at least 8 characters. You&apos;ll be signed out of every device.</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-white/75">New password</label>
              <div className="relative">
                <input id="password" type={show ? "text" : "password"} required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-11 text-[14px] text-white outline-none transition placeholder:text-white/35 focus:border-violet-500/70 focus:bg-white/[0.06]" />
                <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2.5 text-[13px] text-rose-300">
                {error} <Link href="/forgot" className="underline">Request a new link</Link>
              </p>
            )}
            <button disabled={busy || token === null} className="w-full rounded-xl bg-violet-600 py-3.5 text-[15px] font-medium text-white shadow-[0_0_24px_rgba(124,92,255,.45)] transition hover:bg-violet-500 disabled:opacity-60">
              {busy ? "Saving…" : "Save new password"}
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
