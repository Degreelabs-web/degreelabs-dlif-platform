"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  loginUser,
  verifyTwoFactor,
  resendTwoFactorCode,
} from "@/lib/api/auth";
import {
  ShieldCheck,
  UserRound,
  UsersRound,
  Lock,
  Mail,
  Loader2,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { DegreeLabsLogo } from "@/components/brand/DegreeLabsLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") || "student";
  const redirectUrl = searchParams.get("redirect");

  // Step state
  const [step, setStep] = useState<"credentials" | "two_factor">("credentials");

  // Credentials state
  const [activeTab, setActiveTab] = useState<string>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2FA state
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const codeInputRef = useRef<HTMLInputElement>(null);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Auto-focus 2FA input when entering two_factor step
  useEffect(() => {
    if (step === "two_factor") {
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 100);
    }
  }, [step]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await loginUser(email, password);

      if (response.requires_2fa) {
        setTwoFactorToken(response.two_factor_token);
        setMaskedEmail(response.masked_email);
        setTwoFactorCode("");
        setStep("two_factor");
        setResendCooldown(30);
        return;
      }

      const userRole = response.user.role;
      if (redirectUrl && redirectUrl.startsWith("/")) {
        router.push(redirectUrl);
      } else if (userRole === "admin") {
        router.push("/admin");
      } else if (userRole === "mentor") {
        router.push("/mentor");
      } else {
        router.push("/student");
      }
    } catch (err) {
      setError(
        (err as Error).message ||
        "Invalid credentials. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!twoFactorCode || twoFactorCode.trim().length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setError(null);
    setResendSuccess(null);
    setLoading(true);

    try {
      const response = await verifyTwoFactor(twoFactorToken, twoFactorCode.trim());
      const userRole = response.user.role;

      if (redirectUrl && redirectUrl.startsWith("/")) {
        router.push(redirectUrl);
      } else if (userRole === "admin") {
        router.push("/admin");
      } else if (userRole === "mentor") {
        router.push("/mentor");
      } else {
        router.push("/student");
      }
    } catch (err) {
      setError(
        (err as Error).message ||
        "Invalid or expired verification code. Please check and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    setResendSuccess(null);

    try {
      const response = await resendTwoFactorCode(twoFactorToken);
      setTwoFactorToken(response.two_factor_token);
      setResendSuccess(
        response.message ||
        "A fresh verification code was sent to your email address."
      );
      setResendCooldown(30);
    } catch (err) {
      setError((err as Error).message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  const portalInfo = {
    student: {
      title: "Student Portal Sign In",
      subtitle:
        "Enter your student email and password to access your capstone workspace.",
      icon: UsersRound,
      badge: "Student Capstone Workspace",
      defaultPlaceholder: "student@institution.edu",
    },
    mentor: {
      title: "Mentor Portal Sign In",
      subtitle:
        "Enter your mentor credentials to access your advisor dashboard.",
      icon: UserRound,
      badge: "Industry Advisor Workspace",
      defaultPlaceholder: "mentor@company.com",
    },
    admin: {
      title: "Admin Portal Sign In",
      subtitle:
        "Enter your administrator credentials to access the operations console.",
      icon: ShieldCheck,
      badge: "Operations Console",
      defaultPlaceholder: "samatha.reddy@degreelabs.com",
    },
  }[activeTab as "student" | "mentor" | "admin"] || {
    title: "Sign in to your portal",
    subtitle: "Enter your credentials to access your fellowship workspace.",
    icon: UsersRound,
    badge: "DegreeLabs Portal",
    defaultPlaceholder: "name@domain.com",
  };

  const ActiveIcon = portalInfo.icon;

  return (
    <div className="relative z-10 w-full max-w-[500px] space-y-5">
      {/* Branding Header */}
      <div className="flex flex-col items-center text-center">
        <Link
          href="/"
          className="group inline-flex items-center rounded-2xl px-3 py-2 transition-transform hover:-translate-y-0.5"
        >
          <DegreeLabsLogo size="large" priority />
        </Link>

        {step === "credentials" ? (
          <>
            <div className="mt-5 flex w-fit items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3.5 py-1.5 text-xs font-bold text-brand-700 shadow-sm">
              <ActiveIcon className="h-3.5 w-3.5" />
              <span>{portalInfo.badge}</span>
            </div>

            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              {portalInfo.title}
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-5 text-slate-500">
              {portalInfo.subtitle}
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
              Two-Factor Authentication
            </h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-5 text-slate-500">
              We sent a 6-digit security code to {maskedEmail || email}.
            </p>
          </>
        )}
      </div>

      {/* Role Selection Tabs (Only shown in credentials step) */}
      {step === "credentials" && (
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-brand-100/70 bg-brand-100/60 p-1.5 text-xs font-semibold shadow-inner">
          <button
            type="button"
            onClick={() => {
              setActiveTab("student");
              setError(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${activeTab === "student"
                ? "bg-white text-brand-700 shadow-sm ring-1 ring-brand-100"
                : "text-slate-600 hover:bg-white/50 hover:text-brand-700"
              }`}
          >
            <UsersRound className="h-3.5 w-3.5" />
            Student
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("mentor");
              setError(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${activeTab === "mentor"
                ? "bg-white text-brand-700 shadow-sm ring-1 ring-brand-100"
                : "text-slate-600 hover:bg-white/50 hover:text-brand-700"
              }`}
          >
            <UserRound className="h-3.5 w-3.5" />
            Mentor
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("admin");
              setError(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${activeTab === "admin"
                ? "bg-white text-brand-700 shadow-sm ring-1 ring-brand-100"
                : "text-slate-600 hover:bg-white/50 hover:text-brand-700"
              }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Success Notice */}
      {resendSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
          {resendSuccess}
        </div>
      )}

      {/* Main Form Card */}
      <div className="space-y-5 rounded-3xl border border-white bg-white/95 p-6 shadow-xl shadow-blue-950/[0.08] ring-1 ring-brand-100/80 sm:p-8">
        {step === "credentials" ? (
          /* STEP 1: CREDENTIALS FORM */
          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder={portalInfo.defaultPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Portal
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: TWO-FACTOR VERIFICATION FORM */
          <div>
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  6-Digit Verification Code
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    ref={codeInputRef}
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={8}
                    autoComplete="one-time-code"
                    placeholder="Enter 6-digit code"
                    value={twoFactorCode}
                    onChange={(e) =>
                      setTwoFactorCode(e.target.value.replace(/\s+/g, ""))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-10 pr-10 text-center font-mono text-lg tracking-[0.25em] text-slate-900 placeholder:font-sans placeholder:text-sm placeholder:tracking-normal focus:border-brand-400 focus:bg-white focus:outline-none"
                  />
                </div>
                <p className="mt-2 text-center text-xs text-slate-500">
                  Check your email or authenticator app for the code.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || twoFactorCode.trim().length < 6}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying Code...
                  </>
                ) : (
                  <>
                    Verify & Complete Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Resend Action */}
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span>Didn&apos;t receive a code?</span>
              <button
                type="button"
                disabled={resendCooldown > 0 || resending}
                onClick={handleResendCode}
                className="font-semibold text-slate-900 hover:underline disabled:text-slate-400 inline-flex items-center gap-1"
              >
                <RefreshCw
                  className={`h-3 w-3 ${resending ? "animate-spin" : ""}`}
                />
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend Code"}
              </button>
            </div>

            {/* Back to Credentials */}
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setError(null);
                  setResendSuccess(null);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to email & password
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="text-center text-xs font-semibold text-slate-500">
        <Link href="/" className="inline-flex rounded-lg px-3 py-2 hover:bg-brand-50 hover:text-brand-700">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_#dff3ff_0%,_transparent_38%),radial-gradient(circle_at_bottom_right,_#e2eaff_0%,_transparent_36%),linear-gradient(135deg,#f8fbff_0%,#f1f7ff_100%)] px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute left-[8%] top-[12%] h-44 w-44 rounded-full bg-brand-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[8%] right-[10%] h-56 w-56 rounded-full bg-brand-500/10 blur-3xl" />
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
            Loading portal sign-in...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
