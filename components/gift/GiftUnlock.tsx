"use client";

import { FormEvent, useState } from "react";
import { Heart, LockKeyhole } from "lucide-react";

export function GiftUnlock({
  slug,
  recipientName
}: {
  slug: string;
  recipientName: string;
}) {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(`/api/presente/${slug}/unlock`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ secret })
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setError(payload.error || "Não foi possível abrir este presente.");
      setLoading(false);
      return;
    }

    window.location.reload();
  }

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden px-5 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(236,72,153,0.32),transparent_28rem),radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.26),transparent_30rem)]" />
      <div className="glass-panel relative z-10 w-full max-w-md rounded-2xl p-6 sm:p-8">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-pink-500 text-white shadow-glow">
          <Heart size={26} fill="currentColor" aria-hidden="true" />
        </div>
        <p className="text-sm font-bold uppercase text-pink-200">Presente protegido</p>
        <h1 className="mt-3 font-display text-4xl text-white">Para {recipientName}</h1>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div className="relative">
            <LockKeyhole
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              className="admin-input h-12 pl-11 pr-4 text-left"
              placeholder="Palavra secreta"
              autoFocus
            />
          </div>
          {error ? <p className="text-sm text-rose-200">{error}</p> : null}
          <button
            type="submit"
            disabled={!secret.trim() || loading}
            className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-gradient-to-r from-pink-500 to-violet-500 px-5 text-sm font-bold text-white shadow-glow disabled:opacity-50"
          >
            {loading ? "Abrindo..." : "Abrir presente"}
          </button>
        </form>
      </div>
    </main>
  );
}
