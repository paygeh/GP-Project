"use client";

import { useActionState } from "react";
import {
  updateAdminEmailAction,
  updateAdminPasswordAction,
  type AccountState,
} from "@/app/admin/(panel)/account/actions";

const field =
  "w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-brand";
const label = "text-xs font-medium text-muted";

function Banner({ state }: { state: AccountState }) {
  if (state.error)
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {state.error}
      </p>
    );
  if (state.success)
    return (
      <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
        {state.success}
      </p>
    );
  return null;
}

export function AccountForms({ currentEmail }: { currentEmail: string }) {
  const [emailState, emailAction, emailPending] = useActionState<
    AccountState,
    FormData
  >(updateAdminEmailAction, {});
  const [pwState, pwAction, pwPending] = useActionState<AccountState, FormData>(
    updateAdminPasswordAction,
    {},
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Change email */}
      <form
        action={emailAction}
        className="rounded-[var(--radius-card)] border border-border bg-card p-6"
      >
        <h2 className="font-display text-xl text-ink">Login email</h2>
        <p className="mt-1 text-sm text-muted">
          Currently <span className="font-medium text-ink">{currentEmail}</span>.
        </p>
        <div className="mt-4 space-y-3">
          <Banner state={emailState} />
          <label className="block">
            <span className={label}>New email</span>
            <input
              name="newEmail"
              type="email"
              required
              defaultValue={currentEmail}
              className={`mt-1 ${field}`}
            />
          </label>
          <label className="block">
            <span className={label}>Current password</span>
            <input
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className={`mt-1 ${field}`}
            />
          </label>
          <button
            disabled={emailPending}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {emailPending ? "Updating…" : "Update email"}
          </button>
        </div>
      </form>

      {/* Change password */}
      <form
        action={pwAction}
        className="rounded-[var(--radius-card)] border border-border bg-card p-6"
      >
        <h2 className="font-display text-xl text-ink">Password</h2>
        <p className="mt-1 text-sm text-muted">
          Use at least 8 characters.
        </p>
        <div className="mt-4 space-y-3">
          <Banner state={pwState} />
          <label className="block">
            <span className={label}>Current password</span>
            <input
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className={`mt-1 ${field}`}
            />
          </label>
          <label className="block">
            <span className={label}>New password</span>
            <input
              name="newPassword"
              type="password"
              required
              autoComplete="new-password"
              className={`mt-1 ${field}`}
            />
          </label>
          <label className="block">
            <span className={label}>Confirm new password</span>
            <input
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              className={`mt-1 ${field}`}
            />
          </label>
          <button
            disabled={pwPending}
            className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {pwPending ? "Updating…" : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
}
