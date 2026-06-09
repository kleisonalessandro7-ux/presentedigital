import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { ensureSlug } from "@/lib/slug";
import {
  isBlobConfigured,
  saveLocalAudio,
  saveLocalPhoto,
  saveLocalVideo
} from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const allowedAudioTypes = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/x-m4a"
];
const allowedVideoTypes = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];

const maxLocalPhotoSize = 10 * 1024 * 1024;
const maxLocalAudioSize = 25 * 1024 * 1024;
const maxLocalVideoSize = 80 * 1024 * 1024;

function isAllowedPhoto(file: File) {
  return allowedImageTypes.includes(file.type) && file.size <= maxLocalPhotoSize;
}

function isAllowedAudio(file: File) {
  return allowedAudioTypes.includes(file.type) && file.size <= maxLocalAudioSize;
}

function isAllowedVideo(file: File) {
  return allowedVideoTypes.includes(file.type) && file.size <= maxLocalVideoSize;
}

function parseClientPayload(payload?: string | null) {
  if (!payload) {
    return null;
  }

  try {
    const parsed = JSON.parse(payload) as { slug?: string; kind?: string };

    if (!parsed.slug) {
      return null;
    }

    return {
      slug: ensureSlug(parsed.slug),
      kind: parsed.kind === "audio" ? "audio" : parsed.kind === "videos" ? "videos" : "photos"
    };
  } catch {
    return null;
  }
}

async function handleVercelBlobUpload(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!isAdminAuthenticated()) {
          throw new Error("Não autorizado.");
        }

        const payload = parseClientPayload(clientPayload);

        if (!payload || !pathname.startsWith(`${payload.kind}/${payload.slug}/`)) {
          throw new Error("Caminho de upload inválido.");
        }

        return {
          allowedContentTypes: payload.kind === "audio"
            ? allowedAudioTypes
            : payload.kind === "videos"
              ? allowedVideoTypes
              : allowedImageTypes,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify(payload)
        };
      },
      onUploadCompleted: async () => {
        return;
      }
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha no upload." },
      { status: 400 }
    );
  }
}

async function handleLocalUpload(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const formData = await request.formData();
  const slug = ensureSlug(String(formData.get("slug") || "presente"));
  const kind = String(formData.get("kind") || "photos");

  if (kind === "audio") {
    const file = formData.get("audio");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Selecione um áudio." }, { status: 400 });
    }

    if (!isAllowedAudio(file)) {
      return NextResponse.json(
        { error: "Use áudio MP3, M4A, WAV, OGG ou WEBM com até 25 MB." },
        { status: 400 }
      );
    }

    const audio = await saveLocalAudio(slug, file);
    return NextResponse.json({ audio, storage: "local" });
  }

  if (kind === "videos") {
    const files = formData
      .getAll("videos")
      .filter((entry): entry is File => entry instanceof File)
      .slice(0, 3);

    if (!files.length) {
      return NextResponse.json({ error: "Selecione ao menos um vídeo." }, { status: 400 });
    }

    const invalid = files.find((file) => !isAllowedVideo(file));

    if (invalid) {
      return NextResponse.json(
        { error: "Use vídeos MP4, MOV ou WEBM com até 80 MB." },
        { status: 400 }
      );
    }

    const videos = await Promise.all(files.map((file) => saveLocalVideo(slug, file)));
    return NextResponse.json({ videos, storage: "local" });
  }

  const files = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File)
    .slice(0, 10);

  if (!files.length) {
    return NextResponse.json({ error: "Selecione ao menos uma foto." }, { status: 400 });
  }

  const invalid = files.find((file) => !isAllowedPhoto(file));

  if (invalid) {
    return NextResponse.json(
      { error: "Use imagens JPG, PNG, WEBP ou GIF com até 10 MB." },
      { status: 400 }
    );
  }

  const photos = await Promise.all(files.map((file) => saveLocalPhoto(slug, file)));

  return NextResponse.json({ photos, storage: "local" });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (isBlobConfigured() && contentType.includes("application/json")) {
    return handleVercelBlobUpload(request);
  }

  return handleLocalUpload(request);
}
