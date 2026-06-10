import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Heart, MessageCircleHeart } from "lucide-react";
import { isAdminAuthenticated } from "@/lib/auth";
import { readGiftReactions } from "@/lib/reactions";
import { readGiftBySlug } from "@/lib/storage";
import { getCurrentUser } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReactionsPageProps = {
  params: {
    slug: string;
  };
};

const reactionLabels: Record<string, string> = {
  amei: "Amei",
  chorei: "Chorei",
  replay: "Quero ver de novo",
  sorriso: "Sorri muito"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export default async function GiftReactionsPage({ params }: ReactionsPageProps) {
  const currentUser = await getCurrentUser();

  if (!isAdminAuthenticated() && !currentUser) {
    redirect("/admin");
  }

  const gift = await readGiftBySlug(params.slug, currentUser?.id);

  if (!gift) {
    notFound();
  }

  const reactions = await readGiftReactions(gift.slug);

  return (
    <main className="min-h-screen px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-bold text-slate-200 hover:bg-white/10"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar ao admin
        </Link>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-5 backdrop-blur-xl">
          <p className="text-sm font-bold uppercase text-pink-200">Reações recebidas</p>
          <h1 className="mt-2 font-display text-4xl">
            Para {gift.recipientName}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {reactions.length} resposta{reactions.length === 1 ? "" : "s"} enviada{reactions.length === 1 ? "" : "s"} no final do presente.
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          {reactions.length ? (
            reactions.map((reaction) => (
              <article
                key={reaction.id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-pink-200/20 bg-pink-500/10 px-3 py-2 text-sm font-bold text-pink-100">
                    <Heart size={15} fill="currentColor" aria-hidden="true" />
                    {reactionLabels[reaction.reaction] || reaction.reaction}
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {formatDate(reaction.createdAt)}
                  </span>
                </div>
                {reaction.senderName ? (
                  <p className="mt-4 text-sm font-bold text-white">{reaction.senderName}</p>
                ) : null}
                {reaction.message ? (
                  <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-slate-200">
                    {reaction.message}
                  </p>
                ) : (
                  <p className="mt-4 text-sm text-slate-400">Sem mensagem escrita.</p>
                )}
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
              <MessageCircleHeart
                size={34}
                className="mx-auto mb-3 text-pink-200"
                aria-hidden="true"
              />
              <p className="font-bold text-white">Ainda não chegou nenhuma reação.</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Quando a pessoa responder no final do presente, vai aparecer aqui.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
