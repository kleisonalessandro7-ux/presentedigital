"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole, Sparkles, UserRound } from "lucide-react";

type LoginFormProps = {
  passwordConfigured: boolean;
  authConfigured: boolean;
  authProviders: string[];
};

const providerLabels: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  facebook: "Facebook",
  discord: "Discord"
};

export function LoginForm({ passwordConfigured, authConfigured, authProviders }: LoginFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const showPasswordForm = passwordConfigured || !authConfigured;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ password })
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setError(payload.error || "Não foi possível entrar.");
      setLoading(false);
      return;
    }

    window.location.reload();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-pink-500 text-white shadow-glow">
            <Sparkles size={21} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase text-pink-200">Presente Digital</p>
            <h1 className="font-display text-3xl text-white">Admin</h1>
          </div>
        </div>

        {!passwordConfigured && !authConfigured ? (
          <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
            Configure a variável ADMIN_PASSWORD antes de entrar.
          </div>
        ) : null}

        {authConfigured ? (
          <div className="mt-6 space-y-3">
            {authProviders.map((provider) => (
              <a
                key={provider}
                href={`/api/auth/sign-in?provider=${provider}`}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-bold text-slate-950 shadow-glow transition hover:bg-pink-100"
              >
                <UserRound size={17} aria-hidden="true" />
                Entrar com {providerLabels[provider] || provider}
              </a>
            ))}
            {passwordConfigured ? (
              <div className="flex items-center gap-3 py-2">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-xs font-bold uppercase text-slate-400">
                  ou senha do admin
                </span>
                <span className="h-px flex-1 bg-white/10" />
              </div>
            ) : null}
          </div>
        ) : null}

        {showPasswordForm ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="password" className="admin-label">
              Senha
            </label>
            <div className="relative">
              <LockKeyhole
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="admin-input h-12 pl-11 pr-4"
                autoComplete="current-password"
                disabled={!passwordConfigured || loading}
              />
            </div>
          </div>

          {error ? <p className="text-sm text-rose-200">{error}</p> : null}

          <button
            type="submit"
            disabled={!passwordConfigured || loading || !password}
            className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-gradient-to-r from-pink-500 to-violet-500 px-5 text-sm font-bold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
