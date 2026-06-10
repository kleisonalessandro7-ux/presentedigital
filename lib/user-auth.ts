import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function normalizeSupabaseUrl(value?: string) {
  const rawUrl = value?.trim();

  if (!rawUrl) {
    return "";
  }

  try {
    return new URL(rawUrl).origin;
  } catch {
    return rawUrl.replace(/\/+$/, "");
  }
}

export function getSupabaseAuthConfig() {
  const url = normalizeSupabaseUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  );
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  return {
    url,
    publishableKey: publishableKey.trim()
  };
}

export function isUserAuthConfigured() {
  const config = getSupabaseAuthConfig();
  return Boolean(config.url && config.publishableKey);
}

export function getEnabledAuthProviders() {
  const configured = (process.env.AUTH_PROVIDERS || "google")
    .split(",")
    .map((provider) => provider.trim().toLowerCase())
    .filter(Boolean);

  return configured.length ? configured : ["google"];
}

export function createSupabaseAuthClient() {
  const config = getSupabaseAuthConfig();

  if (!config.url || !config.publishableKey) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }

  const cookieStore = cookies();

  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components can read cookies but cannot always write refreshed cookies.
        }
      }
    }
  });
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isUserAuthConfigured()) {
    return null;
  }

  try {
    const supabase = createSupabaseAuthClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    return user;
  } catch {
    return null;
  }
}
