import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { detectMediaType } from "@/lib/media";
import { readGiftBySlug, saveGift } from "@/lib/storage";
import { getCurrentUser } from "@/lib/user-auth";
import type {
  DraftGift,
  ExperienceStyle,
  GiftCoupon,
  GiftData,
  GiftMessageChapter,
  GiftTimelineEvent,
  GiftTheme
} from "@/lib/types";
import { ensureSlug } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

function stringList(value: unknown, limit: number) {
  return Array.isArray(value) ? value.map(text).filter(Boolean).slice(0, limit) : [];
}

function cleanExperienceStyle(value: unknown): ExperienceStyle {
  return value === "scrapbook" || value === "cinema" ? value : "classic";
}

function cleanTheme(value: unknown): GiftTheme {
  return value === "floral-light" ||
    value === "minimal" ||
    value === "cinema-night" ||
    value === "starry-sky" ||
    value === "vintage-letter" ||
    value === "luxury-gold" ||
    value === "neon-heart"
    ? value
    : "romantic-dark";
}

function cleanTimelineEvents(value: unknown): GiftTimelineEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((event) => {
      if (!event || typeof event !== "object") {
        return null;
      }

      const current = event as Partial<GiftTimelineEvent>;
      const title = text(current.title);
      const description = text(current.description);
      const date = cleanDate(current.date);

      if (!title && !description) {
        return null;
      }

      return {
        title: title || "Momento especial",
        description,
        date
      };
    })
    .filter(Boolean)
    .slice(0, 12) as GiftTimelineEvent[];
}

function cleanCoupons(value: unknown): GiftCoupon[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((coupon) => {
      if (!coupon || typeof coupon !== "object") {
        return null;
      }

      const current = coupon as Partial<GiftCoupon>;
      const title = text(current.title);
      const description = text(current.description);

      if (!title && !description) {
        return null;
      }

      return {
        title: title || "Vale amor",
        description
      };
    })
    .filter(Boolean)
    .slice(0, 12) as GiftCoupon[];
}

function cleanMessageChapters(value: unknown): GiftMessageChapter[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((chapter) => {
      if (!chapter || typeof chapter !== "object") {
        return null;
      }

      const current = chapter as Partial<GiftMessageChapter>;
      const title = text(current.title);
      const body = text(current.body);

      if (!title && !body) {
        return null;
      }

      return {
        title: title || "Capítulo",
        body
      };
    })
    .filter(Boolean)
    .slice(0, 8) as GiftMessageChapter[];
}

function cleanDate(value: unknown) {
  const date = text(value);
  return validDate(date) ? date : undefined;
}

function cleanDurations(value: unknown) {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>(
    (durations, [key, raw]) => {
      const duration = Number(raw);

      if (Number.isFinite(duration)) {
        durations[key] = Math.min(30, Math.max(4, Math.round(duration)));
      }

      return durations;
    },
    {}
  );
}

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const currentUser = await getCurrentUser();

  if (!isAdminAuthenticated() && !currentUser) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const gift = await readGiftBySlug(params.slug, currentUser?.id);

  if (!gift) {
    return NextResponse.json({ error: "Presente não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ gift });
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const currentUser = await getCurrentUser();

  if (!isAdminAuthenticated() && !currentUser) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const existing = await readGiftBySlug(params.slug, currentUser?.id);

  if (!existing) {
    return NextResponse.json({ error: "Presente não encontrado." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as DraftGift | null;

  if (!body) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const creatorName = text(body.creatorName);
  const recipientName = text(body.recipientName);
  const specialDate = text(body.specialDate);
  const message = text(body.message);

  if (!creatorName || !recipientName || !validDate(specialDate) || !message) {
    return NextResponse.json(
      { error: "Preencha criador, destinatário, data e mensagem." },
      { status: 400 }
    );
  }

  const slug = ensureSlug(params.slug);
  const photos = (body.photos || []).slice(0, 10);
  const coverPhotoPathname = photos.some((photo) => photo.pathname === body.coverPhotoPathname)
    ? body.coverPhotoPathname
    : photos[0]?.pathname;
  const gift: GiftData = {
    ...existing,
    slug,
    creatorName,
    recipientName,
    recipientNickname: text(body.recipientNickname) || undefined,
    specialDate,
    openingHint: text(body.openingHint) || undefined,
    message,
    mediaUrl: text(body.mediaUrl) || undefined,
    mediaType: detectMediaType(text(body.mediaUrl)),
    audio: body.audio,
    videos: (body.videos || []).slice(0, 3),
    theme: cleanTheme(body.theme),
    experienceStyle: cleanExperienceStyle(body.experienceStyle),
    primaryColor: /^#[0-9a-f]{6}$/i.test(text(body.primaryColor))
      ? text(body.primaryColor)
      : "#ec4899",
    coverPhotoPathname,
    ogTitle: text(body.ogTitle) || undefined,
    ogDescription: text(body.ogDescription) || undefined,
    photos,
    reasons: stringList(body.reasons, 30),
    promises: stringList(body.promises, 12),
    hiddenMessages: stringList(body.hiddenMessages, 12),
    places: (body.places || [])
      .filter((place) => text(place.name) || text(place.note))
      .slice(0, 8),
    insideJokes: stringList(body.insideJokes, 12),
    timelineEvents: cleanTimelineEvents(body.timelineEvents),
    coupons: cleanCoupons(body.coupons),
    messageChapters: cleanMessageChapters(body.messageChapters),
    firstLoveMoment: text(body.firstLoveMoment) || undefined,
    favoriteMoment: text(body.favoriteMoment) || undefined,
    untoldThing: text(body.untoldThing) || undefined,
    surpriseQuestion: text(body.surpriseQuestion) || undefined,
    surpriseAnswer:
      text(body.surpriseQuestion) && text(body.surpriseAnswer)
        ? text(body.surpriseAnswer)
        : undefined,
    capsuleDate: cleanDate(body.capsuleDate),
    capsuleMessage: text(body.capsuleMessage) || undefined,
    finalSignature: text(body.finalSignature) || undefined,
    secretWord: text(body.secretWord) || undefined,
    slideDurations: cleanDurations(body.slideDurations),
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  };

  await saveGift(gift, {
    allowOverwrite: true,
    ownerId: currentUser?.id,
    ownerEmail: currentUser?.email || undefined
  });

  return NextResponse.json({
    gift,
    url: `/presente/${gift.slug}`
  });
}
