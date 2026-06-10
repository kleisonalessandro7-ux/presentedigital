import { randomUUID } from "crypto";
import { readJsonBlob, putJsonBlob } from "@/lib/storage";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { ensureSlug } from "@/lib/slug";

export type GiftReactionType = "amei" | "chorei" | "replay" | "sorriso";

export type GiftReactionInput = {
  reaction: GiftReactionType;
  senderName?: string;
  message?: string;
  userAgent?: string;
};

export type GiftReactionRecord = GiftReactionInput & {
  id: string;
  giftSlug: string;
  createdAt: string;
};

const allowedReactions = new Set<GiftReactionType>(["amei", "chorei", "replay", "sorriso"]);

function cleanText(value: string | undefined, limit: number) {
  return (value || "").trim().slice(0, limit);
}

export function normalizeReaction(value: unknown): GiftReactionType | null {
  if (typeof value !== "string") {
    return null;
  }

  return allowedReactions.has(value as GiftReactionType) ? (value as GiftReactionType) : null;
}

function localPath(slug: string) {
  return `reactions/${ensureSlug(slug)}.json`;
}

export async function saveGiftReaction(slug: string, input: GiftReactionInput) {
  const cleanSlug = ensureSlug(slug);
  const now = new Date().toISOString();
  const reaction: GiftReactionRecord = {
    id: randomUUID(),
    giftSlug: cleanSlug,
    reaction: input.reaction,
    senderName: cleanText(input.senderName, 80) || undefined,
    message: cleanText(input.message, 600) || undefined,
    userAgent: cleanText(input.userAgent, 240) || undefined,
    createdAt: now
  };

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("gift_reactions").insert({
      id: reaction.id,
      gift_slug: reaction.giftSlug,
      reaction: reaction.reaction,
      sender_name: reaction.senderName || null,
      message: reaction.message || null,
      user_agent: reaction.userAgent || null,
      created_at: reaction.createdAt
    });

    if (error) {
      throw new Error(`Erro ao salvar reação: ${error.message}`);
    }

    return reaction;
  }

  const current = await readGiftReactions(cleanSlug);
  await putJsonBlob(localPath(cleanSlug), [reaction, ...current], { allowOverwrite: true });
  return reaction;
}

export async function readGiftReactions(slug: string) {
  const cleanSlug = ensureSlug(slug);

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("gift_reactions")
      .select("id, gift_slug, reaction, sender_name, message, user_agent, created_at")
      .eq("gift_slug", cleanSlug)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      throw new Error(`Erro ao listar reações: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      giftSlug: row.gift_slug,
      reaction: row.reaction,
      senderName: row.sender_name || undefined,
      message: row.message || undefined,
      userAgent: row.user_agent || undefined,
      createdAt: row.created_at
    })) as GiftReactionRecord[];
  }

  return readJsonBlob<GiftReactionRecord[]>(localPath(cleanSlug), []);
}
