"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { DegreeLabsLogo } from "@/components/brand/DegreeLabsLogo";
import { completeMentorOnboarding } from "@/lib/api/auth";

function readRecoveryToken() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return hash.get("access_token") || new URLSearchParams(window.location.search).get("access_token") || "";
}

export default function SetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setToken(readRecoveryToken()), []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!token) {
      setError("This password setup link is invalid or has expired. Ask an administrator to send a new link.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await completeMentorOnboarding(password, token);
      setComplete(true);
      window.history.replaceState(null, "", "/set-password");
    } catch (requestError) {
      setError((requestError as Error).message || "We could not activate your account. Please request a new link.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#e0f3ff,_#f7faff_42%,_#e8efff)] px-4 py-10 text-[#10233f]">
      <section className="mx-auto flex w-full max-w-md flex-col items-center">
        <DegreeLabsLogo className="mb-10 w-[250px]" />
        <div className="w-full rounded-3xl border border-blue-100 bg-white p-8 shadow-xl shadow-blue-950/10">
          {complete ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
              <h1 className="text-2xl font-bold">Your account is ready</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">Your password has been saved and your mentor account is now active.</p>
              <Link href="/login?role=mentor" className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">Continue to sign in</Link>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><KeyRound className="h-6 w-6" /></div>
              <h1 className="text-2xl font-bold">Set your password</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">Choose a strong password to activate your DegreeLabs mentor account.</p>
              {error && <p role="alert" className="mt-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
              <label className="mt-6 block text-sm font-semibold">New password</label>
              <div className="mt-2 flex items-center rounded-xl border border-slate-200 px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"><Lock className="h-5 w-5 text-slate-400" /><input required minLength={12} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full bg-transparent px-3 py-3 outline-none" autoComplete="new-password" /></div>
              <label className="mt-4 block text-sm font-semibold">Confirm password</label>
              <div className="mt-2 flex items-center rounded-xl border border-slate-200 px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"><Lock className="h-5 w-5 text-slate-400" /><input required minLength={12} type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full bg-transparent px-3 py-3 outline-none" autoComplete="new-password" /></div>
              <p className="mt-3 flex gap-2 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />Use 12+ characters, including upper- and lower-case letters, a number, and a symbol.</p>
              <button disabled={submitting} className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Activating account…" : "Activate mentor account"}</button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
