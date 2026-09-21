"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
    CheckCircle2,
    KeyRound,
    Lock,
    ShieldCheck,
} from "lucide-react";

import { DegreeLabsLogo } from "@/components/brand/DegreeLabsLogo";
import { completeStudentOnboarding } from "@/lib/api/auth";

function readRecoveryToken() {
    const hash = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
    );

    const query = new URLSearchParams(window.location.search);

    return (
        hash.get("access_token") ||
        query.get("access_token") ||
        ""
    );
}

export default function StudentSetPasswordPage() {
    const [token, setToken] = useState("");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [complete, setComplete] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setToken(readRecoveryToken());
    }, []);

    async function submit(event: FormEvent) {
        event.preventDefault();
        setError(null);

        if (!token) {
            setError(
                "This password setup link is invalid or has expired. Please ask an administrator to send a new activation link."
            );
            return;
        }

        if (password !== confirmation) {
            setError("Passwords do not match.");
            return;
        }

        setSubmitting(true);

        try {
            await completeStudentOnboarding(password, token);

            setComplete(true);

            // Remove the recovery token from the browser URL.
            window.history.replaceState(
                null,
                "",
                "/student-set-password"
            );
        } catch (requestError) {
            setError(
                (requestError as Error).message ||
                "We could not activate your student account. Please request a new link."
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#ede4fc,_#faf8fd_42%,_#fde7de)] px-4 py-10 text-[#10233f]">
            <section className="mx-auto flex w-full max-w-md flex-col items-center">
                <DegreeLabsLogo className="mb-10 w-[250px]" />

                <div className="w-full rounded-3xl border border-violet-100 bg-white p-8 shadow-xl shadow-violet-950/10">
                    {complete ? (
                        <div className="text-center">
                            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />

                            <h1 className="text-2xl font-bold">
                                Your account is ready
                            </h1>

                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                Your password has been saved and your DegreeLabs
                                student account is now active.
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Sign in with your email and new password. You will
                                then complete two-factor authentication.
                            </p>

                            <Link
                                href="/login?role=student"
                                className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700"
                            >
                                Continue to Student Sign In
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={submit}>
                            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                                <KeyRound className="h-6 w-6" />
                            </div>

                            <h1 className="text-2xl font-bold">
                                Activate your student account
                            </h1>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Create a secure password for your DegreeLabs
                                Student Portal account.
                            </p>

                            {error && (
                                <p
                                    role="alert"
                                    className="mt-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                                >
                                    {error}
                                </p>
                            )}

                            <label className="mt-6 block text-sm font-semibold">
                                New password
                            </label>

                            <div className="mt-2 flex items-center rounded-xl border border-slate-200 px-3 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
                                <Lock className="h-5 w-5 text-slate-400" />

                                <input
                                    required
                                    minLength={12}
                                    type="password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    className="w-full bg-transparent px-3 py-3 outline-none"
                                    autoComplete="new-password"
                                />
                            </div>

                            <label className="mt-4 block text-sm font-semibold">
                                Confirm password
                            </label>

                            <div className="mt-2 flex items-center rounded-xl border border-slate-200 px-3 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
                                <Lock className="h-5 w-5 text-slate-400" />

                                <input
                                    required
                                    minLength={12}
                                    type="password"
                                    value={confirmation}
                                    onChange={(event) =>
                                        setConfirmation(event.target.value)
                                    }
                                    className="w-full bg-transparent px-3 py-3 outline-none"
                                    autoComplete="new-password"
                                />
                            </div>

                            <p className="mt-3 flex gap-2 text-xs leading-5 text-slate-500">
                                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />

                                Use 12+ characters, including upper- and lower-case
                                letters, a number, and a symbol.
                            </p>

                            <button
                                disabled={submitting}
                                className="mt-6 w-full rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting
                                    ? "Activating account..."
                                    : "Activate Student Account"}
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    );
}