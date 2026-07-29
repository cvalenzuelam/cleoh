"use client";

import { useActionState } from "react";
import { loginAdmin, type AuthState } from "@/app/admin/actions";

const initial: AuthState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAdmin, initial);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Cleoh
        </p>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900">
          Admin login
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Solo cuentas con rol <code className="text-xs">admin</code>.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1.5 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium uppercase tracking-wide text-zinc-500"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1.5 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
