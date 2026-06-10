import { get, put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { GiftAsset, GiftData, GiftIndex, GiftPhoto, GiftVideo } from "@/lib/types";
import { ensureSlug, sanitizeFilename } from "@/lib/slug";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

const LOCAL_BLOB_ROOT = path.join(process.cwd(), ".local-blob");

export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function normalizePathname(pathname: string) {
  return pathname.replace(/\\/g, "/").replace(/^\/+/, "");
}

function resolveLocalPath(pathname: string) {
  const safePath = normalizePathname(pathname)
    .split("/")
    .filter((part) => part && part !== "." && part !== "..");

  const target = path.resolve(LOCAL_BLOB_ROOT, ...safePath);
  const root = path.resolve(LOCAL_BLOB_ROOT);

  if (!target.startsWith(root)) {
    throw new Error("Caminho de arquivo inválido.");
  }

  return target;
}

function contentTypeFromPathname(pathname: string) {
  const ext = pathname.split(".").pop()?.toLowerCase();

  if (pathname.startsWith("videos/") && ext === "mp4") return "video/mp4";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "m4a") return "audio/mp4";
  if (ext === "mp4") return "audio/mp4";
  if (ext === "wav") return "audio/wav";
  if (ext === "ogg") return "audio/ogg";
  if (ext === "webm") return "audio/webm";
  if (ext === "mov") return "video/quicktime";
  if (ext === "m4v") return "video/mp4";
  if (ext === "json") return "application/json";

  return "application/octet-stream";
}

async function streamToText(stream: ReadableStream<Uint8Array>) {
  return new Response(stream).text();
}

export async function readJsonBlob<T>(pathname: string, fallback: T): Promise<T> {
  const cleanPathname = normalizePathname(pathname);

  if (!isBlobConfigured()) {
    try {
      const text = await readFile(resolveLocalPath(cleanPathname), "utf8");
      return JSON.parse(text) as T;
    } catch {
      return fallback;
    }
  }

  const result = await get(cleanPathname, { access: "public" });

  if (!result || result.statusCode !== 200 || !result.stream) {
    return fallback;
  }

  const text = await streamToText(result.stream);
  return JSON.parse(text) as T;
}

export async function putJsonBlob<T>(
  pathname: string,
  data: T,
  options: { allowOverwrite?: boolean } = {}
) {
  const cleanPathname = normalizePathname(pathname);
  const body = JSON.stringify(data, null, 2);

  if (!isBlobConfigured()) {
    const localPath = resolveLocalPath(cleanPathname);
    await mkdir(path.dirname(localPath), { recursive: true });
    await writeFile(localPath, body, "utf8");
    return {
      pathname: cleanPathname,
      url: `/api/local-blob/${cleanPathname}`
    };
  }

  return put(cleanPathname, body, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: options.allowOverwrite ?? false,
    cacheControlMaxAge: 60,
    contentType: "application/json"
  });
}

export function createEmptyGiftIndex(): GiftIndex {
  return {
    updatedAt: new Date().toISOString(),
    items: []
  };
}

export async function readGiftIndex(ownerId?: string) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("gifts")
      .select(
        "slug, creator_name, recipient_name, special_date, theme, photo_count, owner_email, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (ownerId) {
      query = query.eq("owner_id", ownerId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao listar presentes no Supabase: ${error.message}`);
    }

    return {
      updatedAt: new Date().toISOString(),
      items: (data || []).map((row) => ({
        slug: row.slug,
        creatorName: row.creator_name,
        recipientName: row.recipient_name,
        specialDate: row.special_date,
        theme: row.theme,
        photoCount: row.photo_count,
        ownerEmail: row.owner_email || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    } satisfies GiftIndex;
  }

  return readJsonBlob<GiftIndex>("gifts/index.json", createEmptyGiftIndex());
}

export async function saveGiftIndex(index: GiftIndex) {
  if (isSupabaseConfigured()) {
    return null;
  }

  return putJsonBlob("gifts/index.json", index, { allowOverwrite: true });
}

export async function readGiftBySlug(slug: string, ownerId?: string) {
  const cleanSlug = ensureSlug(slug);

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("gifts")
      .select("data")
      .eq("slug", cleanSlug);

    if (ownerId) {
      query = query.eq("owner_id", ownerId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw new Error(`Erro ao ler presente no Supabase: ${error.message}`);
    }

    return (data?.data as GiftData | undefined) || null;
  }

  return readJsonBlob<GiftData | null>(`gifts/${cleanSlug}.json`, null);
}

export async function giftExists(slug: string, ownerId?: string) {
  return Boolean(await readGiftBySlug(slug, ownerId));
}

export async function createUniqueGiftSlug(slug: string, ownerId?: string) {
  const base = ensureSlug(slug);
  let candidate = base;
  let attempt = 2;

  while (await giftExists(candidate, ownerId)) {
    candidate = `${base}-${attempt}`;
    attempt += 1;
  }

  return candidate;
}

export async function saveGift(
  gift: GiftData,
  options: { allowOverwrite?: boolean; ownerId?: string; ownerEmail?: string } = {}
) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const row = {
      slug: gift.slug,
      creator_name: gift.creatorName,
      recipient_name: gift.recipientName,
      special_date: gift.specialDate,
      theme: gift.theme,
      photo_count: gift.photos.length,
      data: gift,
      created_at: gift.createdAt,
      updated_at: gift.updatedAt
    } as Record<string, unknown>;

    if (options.ownerId) {
      row.owner_id = options.ownerId;
      row.owner_email = options.ownerEmail || null;
    }

    const { error } = await supabase.from("gifts").upsert(row);

    if (error) {
      throw new Error(`Erro ao salvar presente no Supabase: ${error.message}`);
    }

    return;
  }

  await putJsonBlob(`gifts/${gift.slug}.json`, gift, {
    allowOverwrite: options.allowOverwrite ?? false
  });

  const index = await readGiftIndex();
  const nextItem = {
    slug: gift.slug,
    creatorName: gift.creatorName,
    recipientName: gift.recipientName,
    specialDate: gift.specialDate,
    theme: gift.theme,
    photoCount: gift.photos.length,
    createdAt: gift.createdAt,
    updatedAt: gift.updatedAt
  };

  const items = [
    nextItem,
    ...index.items.filter((item) => item.slug !== gift.slug)
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  await saveGiftIndex({
    updatedAt: new Date().toISOString(),
    items
  });
}

async function saveLocalAsset(
  slug: string,
  file: File,
  folder: "photos" | "audio" | "videos"
): Promise<GiftAsset> {
  const safeSlug = ensureSlug(slug);
  const safeFilename = sanitizeFilename(file.name);
  const pathname = `${folder}/${safeSlug}/${Date.now()}-${randomUUID().slice(0, 8)}-${safeFilename}`;
  const localPath = resolveLocalPath(pathname);
  const buffer = Buffer.from(await file.arrayBuffer());

  await mkdir(path.dirname(localPath), { recursive: true });
  await writeFile(localPath, buffer);

  return {
    url: `/api/local-blob/${pathname}`,
    pathname,
    filename: file.name,
    contentType: file.type || contentTypeFromPathname(pathname)
  };
}

export async function saveLocalPhoto(slug: string, file: File): Promise<GiftPhoto> {
  return saveLocalAsset(slug, file, "photos");
}

export async function saveLocalAudio(slug: string, file: File): Promise<GiftAsset> {
  return saveLocalAsset(slug, file, "audio");
}

export async function saveLocalVideo(slug: string, file: File): Promise<GiftVideo> {
  return saveLocalAsset(slug, file, "videos");
}

export async function readLocalBlob(pathname: string) {
  const cleanPathname = normalizePathname(pathname);
  const file = await readFile(resolveLocalPath(cleanPathname));

  return {
    body: file,
    contentType: contentTypeFromPathname(cleanPathname)
  };
}
