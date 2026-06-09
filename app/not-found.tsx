import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <p className="mb-3 text-sm font-semibold uppercase text-pink-300">
          Presente não encontrado
        </p>
        <h1 className="font-display text-4xl text-white">Este link ainda não existe.</h1>
        <Link
          href="/admin"
          className="mt-8 inline-flex rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950"
        >
          Voltar ao admin
        </Link>
      </div>
    </main>
  );
}
