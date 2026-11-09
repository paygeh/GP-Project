"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "./actions";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="plum-gradient flex min-h-screen items-center justify-center px-5 py-16 text-paper">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center">
          <p className="eyebrow text-gold">Studio access</p>
          <h1 className="mt-3 font-display text-3xl">Stylist Login</h1>
        </div>

        <form
          action={action}
          className="mt-8 rounded-[var(--radius-card)] border border-white/10 bg-plum-800/70 p-7 shadow-2xl backdrop-blur"
        >
          {state.error && (
            <div className="mb-5 rounded-lg border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {state.error}
            </div>
          )}
          <label className="block text-sm text-paper/70">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-white/[0.04] px-4 py-3 text-paper outline-none transition focus:border-gold"
            />
          </label>
          <label className="mt-4 block text-sm text-paper/70">
            Password
            <div className="relative mt-1.5">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-4 py-3 pr-11 text-paper outline-none transition focus:border-gold"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-paper/50 transition hover:text-paper"
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </label>
          <button
            type="submit"
            disabled={pending}
            className="mt-6 w-full rounded-full bg-gold py-3 text-sm font-semibold text-plum transition hover:bg-gold-200 disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <Link
          href="/"
          className="mt-6 block text-center text-sm text-paper/60 transition hover:text-paper"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
