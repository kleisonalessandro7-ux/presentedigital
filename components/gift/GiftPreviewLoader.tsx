"use client";

import { useEffect, useState } from "react";
import { GiftExperience } from "@/components/gift/GiftExperience";
import { detectMediaType } from "@/lib/media";
import type { DraftGift, GiftData } from "@/lib/types";

function draftToGift(draft: DraftGift): GiftData {
  const now = new Date().toISOString();

  return {
    slug: draft.slug || "preview",
    creatorName: draft.creatorName || "Você",
    recipientName: draft.recipientName || "alguém especial",
    recipientNickname: draft.recipientNickname || undefined,
    specialDate: draft.specialDate || new Date().toISOString().slice(0, 10),
    openingHint: draft.openingHint || undefined,
    message: draft.message || "Sua mensagem aparecerá aqui.",
    mediaUrl: draft.mediaUrl || undefined,
    mediaType: detectMediaType(draft.mediaUrl),
    audio: draft.audio,
    videos: draft.videos || [],
    theme: draft.theme || "romantic-dark",
    experienceStyle: draft.experienceStyle || "classic",
    primaryColor: draft.primaryColor || "#ec4899",
    coverPhotoPathname: draft.coverPhotoPathname || draft.photos[0]?.pathname,
    ogTitle: draft.ogTitle || undefined,
    ogDescription: draft.ogDescription || undefined,
    photos: draft.photos || [],
    reasons: draft.reasons || [],
    promises: draft.promises || [],
    hiddenMessages: draft.hiddenMessages || [],
    places: draft.places || [],
    insideJokes: draft.insideJokes || [],
    timelineEvents: draft.timelineEvents || [],
    coupons: draft.coupons || [],
    messageChapters: draft.messageChapters || [],
    firstLoveMoment: draft.firstLoveMoment || undefined,
    favoriteMoment: draft.favoriteMoment || undefined,
    untoldThing: draft.untoldThing || undefined,
    surpriseQuestion: draft.surpriseQuestion || undefined,
    surpriseAnswer: draft.surpriseAnswer || undefined,
    capsuleDate: draft.capsuleDate || undefined,
    capsuleMessage: draft.capsuleMessage || undefined,
    finalSignature: draft.finalSignature || undefined,
    slideDurations: draft.slideDurations || {},
    createdAt: now,
    updatedAt: now
  };
}

export function GiftPreviewLoader() {
  const [gift, setGift] = useState<GiftData | null>(null);

  useEffect(() => {
    const raw = window.sessionStorage.getItem("gift-preview");

    if (!raw) {
      return;
    }

    try {
      setGift(draftToGift(JSON.parse(raw) as DraftGift));
    } catch {
      setGift(null);
    }
  }, []);

  if (!gift) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 text-center">
        <div>
          <p className="text-sm font-bold uppercase text-pink-200">Prévia indisponível</p>
          <h1 className="mt-3 font-display text-4xl text-white">
            Volte ao admin e gere uma nova prévia.
          </h1>
        </div>
      </main>
    );
  }

  return <GiftExperience gift={gift} />;
}
