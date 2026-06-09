import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { detectMediaType } from "@/lib/media";
import { createUniqueGiftSlug, readGiftIndex, saveGift } from "@/lib/storage";
import type {
  DraftGift,
  CaptionPosition,
  ExperienceStyle,
  GiftAsset,
  GiftCoupon,
  GiftData,
  GiftMessageChapter,
  GiftPhoto,
  GiftPlace,
  GiftTimelineEvent,
  GiftTheme,
  GiftVideo,
  PhotoFilter,
  SlideDurationKey
} from "@/lib/types";
import { ensureSlug } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const themes: GiftTheme[] = ["romantic-dark", "floral-light", "minimal"];
const experienceStyles: ExperienceStyle[] = ["classic", "scrapbook", "cinema"];
const captionPositions: CaptionPosition[] = ["bottom", "center", "top", "hidden"];
const photoFilters: PhotoFilter[] = ["none", "film", "bw", "soft"];
const slideDurationKeys: SlideDurationKey[] = [
  "welcome",
  "counter",
  "personal",
  "timeline",
  "constellation",
  "reasons",
  "coupons",
  "places",
  "photo",
  "video",
  "scratch",
  "capsule",
  "chapters",
  "message",
  "promises",
  "album",
  "ending"
];

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

function optionalDate(value: string) {
  return value && validDate(value) ? value : "";
}

function normalizeStringList(value: unknown, limit: number) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(text).filter(Boolean).slice(0, limit);
}

function normalizePlaces(value: unknown): GiftPlace[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((place) => {
      if (!place || typeof place !== "object") {
        return null;
      }

      const current = place as Partial<GiftPlace>;
      const name = text(current.name);
      const note = text(current.note);

      if (!name && !note) {
        return null;
      }

      return {
        name: name || "Lugar especial",
        note
      };
    })
    .filter(Boolean)
    .slice(0, 8) as GiftPlace[];
}

function normalizeTimelineEvents(value: unknown): GiftTimelineEvent[] {
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
      const date = optionalDate(text(current.date));

      if (!title && !description) {
        return null;
      }

      return {
        title: title || "Momento especial",
        description,
        date: date || undefined
      };
    })
    .filter(Boolean)
    .slice(0, 12) as GiftTimelineEvent[];
}

function normalizeCoupons(value: unknown): GiftCoupon[] {
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

function normalizeMessageChapters(value: unknown): GiftMessageChapter[] {
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

function normalizeAsset(asset: unknown): GiftAsset | undefined {
  if (!asset || typeof asset !== "object") {
    return undefined;
  }

  const current = asset as Partial<GiftAsset>;
  const url = text(current.url);
  const pathname = text(current.pathname);

  if (!url || !pathname) {
    return undefined;
  }

  return {
    url,
    pathname,
    filename: text(current.filename) || "audio",
    contentType: text(current.contentType) || undefined
  };
}

function normalizeVideos(videos: unknown): GiftVideo[] {
  if (!Array.isArray(videos)) {
    return [];
  }

  return videos
    .slice(0, 3)
    .map((video) => {
      const asset = normalizeAsset(video);

      if (!asset) {
        return null;
      }

      return {
        ...asset,
        caption: text((video as Partial<GiftVideo>).caption) || undefined
      };
    })
    .filter(Boolean) as GiftVideo[];
}

function normalizeSlideDurations(value: unknown) {
  if (!value || typeof value !== "object") {
    return {};
  }

  return slideDurationKeys.reduce(
    (durations, key) => {
      const raw = Number((value as Partial<Record<SlideDurationKey, number>>)[key]);

      if (Number.isFinite(raw)) {
        durations[key] = Math.min(30, Math.max(4, Math.round(raw)));
      }

      return durations;
    },
    {} as Partial<Record<SlideDurationKey, number>>
  );
}

function normalizePhotos(photos: unknown): GiftPhoto[] {
  if (!Array.isArray(photos)) {
    return [];
  }

  return photos
    .slice(0, 10)
    .map((photo) => {
      if (!photo || typeof photo !== "object") {
        return null;
      }

      const current = photo as Partial<GiftPhoto>;
      const url = text(current.url);
      const pathname = text(current.pathname);

      if (!url || !pathname) {
        return null;
      }

      return {
        url,
        pathname,
        filename: text(current.filename) || "foto",
        contentType: text(current.contentType) || undefined,
        caption: text(current.caption) || undefined,
        memoryDate: optionalDate(text(current.memoryDate)) || undefined,
        location: text(current.location) || undefined,
        quizQuestion: text(current.quizQuestion) || undefined,
        quizAnswer: text(current.quizAnswer) || undefined,
        captionPosition: captionPositions.includes(current.captionPosition as CaptionPosition)
          ? current.captionPosition
          : "bottom",
        filter: photoFilters.includes(current.filter as PhotoFilter) ? current.filter : "none",
        polaroid: Boolean(current.polaroid)
      };
    })
    .filter(Boolean) as GiftPhoto[];
}

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  return NextResponse.json(await readGiftIndex());
}

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as DraftGift | null;

  if (!body) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const creatorName = text(body.creatorName);
  const recipientName = text(body.recipientName);
  const recipientNickname = text(body.recipientNickname);
  const specialDate = text(body.specialDate);
  const openingHint = text(body.openingHint);
  const message = text(body.message);
  const mediaUrl = text(body.mediaUrl);
  const theme = themes.includes(body.theme) ? body.theme : "romantic-dark";
  const experienceStyle = experienceStyles.includes(body.experienceStyle)
    ? body.experienceStyle
    : "classic";
  const photos = normalizePhotos(body.photos);
  const videos = normalizeVideos(body.videos);
  const coverPhotoPathname = text(body.coverPhotoPathname);
  const ogTitle = text(body.ogTitle);
  const ogDescription = text(body.ogDescription);
  const reasons = normalizeStringList(body.reasons, 30);
  const promises = normalizeStringList(body.promises, 12);
  const hiddenMessages = normalizeStringList(body.hiddenMessages, 12);
  const places = normalizePlaces(body.places);
  const insideJokes = normalizeStringList(body.insideJokes, 12);
  const timelineEvents = normalizeTimelineEvents(body.timelineEvents);
  const coupons = normalizeCoupons(body.coupons);
  const messageChapters = normalizeMessageChapters(body.messageChapters);
  const firstLoveMoment = text(body.firstLoveMoment);
  const favoriteMoment = text(body.favoriteMoment);
  const untoldThing = text(body.untoldThing);
  const surpriseQuestion = text(body.surpriseQuestion);
  const surpriseAnswer = text(body.surpriseAnswer);
  const capsuleDate = optionalDate(text(body.capsuleDate));
  const capsuleMessage = text(body.capsuleMessage);
  const finalSignature = text(body.finalSignature);
  const secretWord = text(body.secretWord);
  const slideDurations = normalizeSlideDurations(body.slideDurations);
  const primaryColor = /^#[0-9a-f]{6}$/i.test(text(body.primaryColor))
    ? text(body.primaryColor)
    : "#ec4899";

  if (!creatorName || !recipientName || !validDate(specialDate) || !message) {
    return NextResponse.json(
      { error: "Preencha criador, destinatário, data e mensagem." },
      { status: 400 }
    );
  }

  const slug = await createUniqueGiftSlug(body.slug || ensureSlug(recipientName));
  const now = new Date().toISOString();
  const gift: GiftData = {
    slug,
    creatorName,
    recipientName,
    recipientNickname: recipientNickname || undefined,
    specialDate,
    openingHint: openingHint || undefined,
    message,
    mediaUrl: mediaUrl || undefined,
    mediaType: detectMediaType(mediaUrl),
    audio: normalizeAsset(body.audio),
    videos,
    theme,
    experienceStyle,
    primaryColor,
    coverPhotoPathname: photos.some((photo) => photo.pathname === coverPhotoPathname)
      ? coverPhotoPathname
      : photos[0]?.pathname,
    ogTitle: ogTitle || undefined,
    ogDescription: ogDescription || undefined,
    photos,
    reasons,
    promises,
    hiddenMessages,
    places,
    insideJokes,
    timelineEvents,
    coupons,
    messageChapters,
    firstLoveMoment: firstLoveMoment || undefined,
    favoriteMoment: favoriteMoment || undefined,
    untoldThing: untoldThing || undefined,
    surpriseQuestion: surpriseQuestion || undefined,
    surpriseAnswer: surpriseQuestion && surpriseAnswer ? surpriseAnswer : undefined,
    capsuleDate: capsuleDate || undefined,
    capsuleMessage: capsuleMessage || undefined,
    finalSignature: finalSignature || undefined,
    secretWord: secretWord || undefined,
    slideDurations,
    createdAt: now,
    updatedAt: now
  };

  await saveGift(gift);

  return NextResponse.json({
    gift,
    url: `/presente/${gift.slug}`
  });
}
