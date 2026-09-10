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
  Sparkles,
} from "lucide-react";

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
  const [devCode, setDevCode] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam && ["student", "mentor", "admin"].includes(roleParam)) {
      setActiveTab(roleParam);
    }
  }, [searchParams]);

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
        setDevCode(response.dev_code || null);
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
      const result = await resendTwoFactorCode(twoFactorToken);
      if (result.dev_code) {
        setDevCode(result.dev_code);
      }
      setResendSuccess("A fresh verification code has been generated.");
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
      defaultPlaceholder: "admin@degreelabs.com",
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
    <div className="w-full max-w-md space-y-6">
      {/* Branding Header */}
      <div className="text-center">
        <Link href="/" className="inline-block">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            DegreeLabs
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Impact Fellowship Platform
          </p>
        </Link>

        {step === "credentials" ? (
          <>
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              <ActiveIcon className="h-3.5 w-3.5 text-slate-600" />
              <span>{portalInfo.badge}</span>
            </div>

            <h2 className="mt-3 text-xl font-bold text-slate-900">
              {portalInfo.title}
            </h2>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              {portalInfo.subtitle}
            </p>
          </>
        ) : (
          <>
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200/60">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              <span>Two-Factor Security Active</span>
            </div>

            <h2 className="mt-3 text-xl font-bold text-slate-900">
              Two-Factor Authentication
            </h2>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              A 6-digit security code is required for {maskedEmail || email}.
            </p>
          </>
        )}
      </div>

      {/* Role Selection Tabs (Only shown in credentials step) */}
      {step === "credentials" && (
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/80 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("student");
              setError(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
              activeTab === "student"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
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
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
              activeTab === "mentor"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
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
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
              activeTab === "admin"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
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
      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm space-y-5">
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
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
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
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
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
          <div className="space-y-5">
            {devCode && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span>Development Security Code</span>
                </div>
                <p className="text-[11px] text-amber-700">
                  For rapid local verification, your active OTP code is:
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono font-extrabold text-sm tracking-widest text-amber-950 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-300">
                    {devCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTwoFactorCode(devCode)}
                    className="text-[11px] font-bold text-blue-700 hover:underline"
                  >
                    Click to Auto-fill
                  </button>
                </div>
              </div>
            )}

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
                    required
                    maxLength={8}
                    autoComplete="one-time-code"
                    placeholder="Enter 6-digit code (e.g. 123456)"
                    value={twoFactorCode}
                    onChange={(e) =>
                      setTwoFactorCode(e.target.value.replace(/\s+/g, ""))
                    }
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-center font-mono text-lg tracking-widest text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Enter the code from your email or Google/Microsoft Authenticator app.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || twoFactorCode.trim().length < 6}
                className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
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
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
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
            <div className="pt-2 text-center">
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
      <div className="text-center text-xs text-slate-500">
        <Link href="/" className="hover:underline">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
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
