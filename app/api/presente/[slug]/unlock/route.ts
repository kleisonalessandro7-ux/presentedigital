import { NextResponse } from "next/server";
import { readGiftBySlug } from "@/lib/storage";
import { ensureSlug } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeSecret(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const slug = ensureSlug(params.slug);
  const gift = await readGiftBySlug(slug);

  if (!gift) {
    return NextResponse.json({ error: "Presente não encontrado." }, { status: 404 });
  }

  if (!gift.secretWord) {
    return NextResponse.json({ ok: true });
  }

  const body = (await request.json().catch(() => ({}))) as { secret?: string };

  if (normalizeSecret(body.secret) !== normalizeSecret(gift.secretWord)) {
    return NextResponse.json({ error: "Palavra secreta incorreta." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: `gift_unlock_${slug}`,
    value: "1",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: `/presente/${slug}`,
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}
