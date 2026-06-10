import { createClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(value?: string) {
  const rawUrl = value?.trim();

  if (!rawUrl) {
    return "";
  }

  try {
    const url = new URL(rawUrl);
    return url.origin;
  } catch {
    return rawUrl.replace(/\/+$/, "");
  }
}

export function isSupabaseConfigured() {
  return Boolean(
    normalizeSupabaseUrl(process.env.SUPABASE_URL) &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
  );
}

export function getSupabaseAdmin() {
  const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
