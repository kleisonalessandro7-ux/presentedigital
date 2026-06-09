export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export function ensureSlug(value: string, fallback = "presente") {
  return slugify(value) || fallback;
}

export function shortId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }

  return Math.random().toString(36).slice(2, 10);
}

export function makeGiftSlug(name: string) {
  return `${ensureSlug(name)}-${shortId()}`;
}

export function sanitizeFilename(filename: string) {
  const parts = filename.split(".");
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : "";
  const base = ensureSlug(parts.join(".") || filename, "foto").slice(0, 48);

  return ext ? `${base}.${ext}` : base;
}
