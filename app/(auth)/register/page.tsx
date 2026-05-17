"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import ATXXLogo from "@/components/ATXXLogo";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Registration failed.");
      setLoading(false);
      return;
    }

    // Auto-login after registration
    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    router.push("/stores");
    router.refresh();
  }

  const field = (key: keyof typeof form, label: string, type: string, placeholder: string, icon: React.ReactNode) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        <input
          type={key === "password" || key === "confirm" ? (showPw ? "text" : "password") : type}
          required
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 transition-all bg-gray-50 focus:bg-white"
        />
        {(key === "password") && (
          <button type="button" onClick={() => setShowPw(s => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
            {showPw
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-[#0d3d38] flex items-center justify-center border border-white/10">
              <ATXXLogo size={20} variant="on-dark" />
            </div>
            <span className="text-base font-black text-[#0d3d38] tracking-tight">ATXX</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 leading-tight">Create your account</h1>
          <p className="text-sm text-gray-400 mt-1">Start managing your stores today</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-4">

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-600 text-xs font-medium px-4 py-3 rounded-xl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {field("name", "Full Name", "text", "Sarah Reynolds",
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          )}
          {field("email", "Email", "email", "you@example.com",
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          )}
          {field("password", "Password", "password", "Min. 8 characters",
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          )}
          {field("confirm", "Confirm Password", "password", "Repeat password",
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          )}

          {/* Password strength */}
          {form.password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1,2,3,4].map(i => {
                  const len = form.password.length;
                  const hasUp = /[A-Z]/.test(form.password);
                  const hasNum = /[0-9]/.test(form.password);
                  const hasSpec = /[^A-Za-z0-9]/.test(form.password);
                  const score = (len >= 8 ? 1 : 0) + (hasUp ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpec ? 1 : 0);
                  const colors = ["bg-red-400","bg-orange-400","bg-amber-400","bg-emerald-500"];
                  return <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? colors[score - 1] : "bg-gray-100"}`} />;
                })}
              </div>
              <p className="text-[10px] text-gray-400">
                {(() => {
                  const len = form.password.length;
                  const hasUp = /[A-Z]/.test(form.password);
                  const hasNum = /[0-9]/.test(form.password);
                  const hasSpec = /[^A-Za-z0-9]/.test(form.password);
                  const score = (len >= 8 ? 1 : 0) + (hasUp ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpec ? 1 : 0);
                  return ["Too weak", "Weak", "Fair", "Strong"][score - 1] ?? "Too weak";
                })()}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-[#0d3d38] hover:bg-[#0f4a43] text-white text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 shadow-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Creating account…
              </>
            ) : "Create account"}
          </button>

          <p className="text-center text-xs text-gray-400 pt-1">
            Already have an account?{" "}
            <Link href="/login" className="text-[#0d9488] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
