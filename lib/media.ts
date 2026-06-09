import type { MediaType } from "@/lib/types";

export function detectMediaType(url?: string): MediaType {
  if (!url) {
    return "none";
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host.includes("youtube.com") || host === "youtu.be") {
      return "youtube";
    }

    if (host.includes("spotify.com")) {
      return "spotify";
    }
  } catch {
    return "none";
  }

  return "none";
}

export function getMediaEmbedUrl(url?: string) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id
        ? `https://www.youtube.com/embed/${id}?autoplay=1&loop=1&playlist=${id}&rel=0`
        : null;
    }

    if (host.includes("youtube.com")) {
      const pathnameParts = parsed.pathname.split("/").filter(Boolean);
      const id =
        parsed.searchParams.get("v") ||
        (pathnameParts[0] === "embed" ? pathnameParts[1] : undefined) ||
        (pathnameParts[0] === "shorts" ? pathnameParts[1] : undefined);

      return id
        ? `https://www.youtube.com/embed/${id}?autoplay=1&loop=1&playlist=${id}&rel=0`
        : null;
    }

    if (host.includes("spotify.com")) {
      const [kind, id] = parsed.pathname.split("/").filter(Boolean);
      const allowed = ["track", "playlist", "album", "episode", "show"];

      return kind && id && allowed.includes(kind)
        ? `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator`
        : null;
    }
  } catch {
    return null;
  }

  return null;
}
