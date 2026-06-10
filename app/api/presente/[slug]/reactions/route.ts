import { NextResponse } from "next/server";
import { normalizeReaction, saveGiftReaction } from "@/lib/reactions";
import { ensureSlug } from "@/lib/slug";
import { readGiftBySlug } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function text(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = ensureSlug(params.slug);
    const gift = await readGiftBySlug(slug);

    if (!gift) {
      return NextResponse.json({ error: "Presente não encontrado." }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as {
      reaction?: unknown;
      senderName?: unknown;
      message?: unknown;
    } | null;
    const reaction = normalizeReaction(body?.reaction);

    if (!reaction) {
      return NextResponse.json({ error: "Escolha uma reação." }, { status: 400 });
    }

    await saveGiftReaction(slug, {
      reaction,
      senderName: text(body?.senderName, 80) || undefined,
      message: text(body?.message, 600) || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Não foi possível enviar a reação agora." },
      { status: 500 }
    );
  }
}
