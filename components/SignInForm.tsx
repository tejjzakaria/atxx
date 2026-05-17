"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import ATXXLogo from "@/components/ATXXLogo";

/* ─── Icon primitives ──────────────────────────────────────────────── */

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

/* ─── Main component ────────────────────────────────────────────────── */

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", { email, password, redirect: false });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/stores");
      router.refresh();
    }
  }

  return (
    <div className="w-full md:w-[52%] bg-white p-8 md:p-12 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-[#0d3d38] flex items-center justify-center flex-shrink-0">
          <ATXXLogo size={28} variant="on-dark" />
        </div>
        <span className="text-base font-bold text-gray-900 tracking-tight">ATXX</span>
      </div>

      {/* Heading block */}
      <div className="mt-12 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Welcome Back!
        </h1>
        <p className="mt-2 text-sm text-gray-400 font-normal leading-relaxed">
          Sign in to manage your stores, track orders,
          <br />
          and grow your e-commerce business.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col">
        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-xs font-medium px-3 py-2.5 rounded-lg">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Email
          </label>
          <div className="relative flex items-center">
            <MailIcon className="absolute left-3 text-gray-400 pointer-events-none" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full h-11 rounded-lg text-sm pl-10 pr-4 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 outline-none focus:border-[#0d9488] focus:bg-[#f0faf9] focus:ring-2 focus:ring-[#0d9488]/20 transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div className="mt-4">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Password
          </label>
          <div className="relative flex items-center">
            <LockIcon className="absolute left-3 text-gray-400 pointer-events-none" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full h-11 rounded-lg text-sm pl-10 pr-10 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 outline-none focus:border-[#0d9488] focus:bg-[#f0faf9] focus:ring-2 focus:ring-[#0d9488]/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeIcon /> : <EyeOffIcon />}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div className="text-right mt-1.5 mb-6">
          <Link
            href="/forgot-password"
            className="text-sm text-teal-700 font-medium no-underline hover:text-teal-800 transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Sign In button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-[#0d3d38] hover:bg-[#0f4a43] text-white text-sm font-medium rounded-lg transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              Signing in…
            </>
          ) : "Sign In"}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-gray-400">
        Don&apos;t have an account?{" "}
        <Link
          href=""
          className="text-teal-700 font-medium no-underline hover:text-teal-800 transition-colors"
        >
          Get in touch.
        </Link>
      </p>
    </div>
  );
}
