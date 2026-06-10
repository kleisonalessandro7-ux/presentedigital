import { NextResponse } from "next/server";
import { createSupabaseAuthClient, getEnabledAuthProviders, isUserAuthConfigured } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isUserAuthConfigured()) {
    return NextResponse.redirect(new URL("/admin?auth=missing", request.url));
  }

  const url = new URL(request.url);
  const provider = (url.searchParams.get("provider") || "google").toLowerCase();
  const enabledProviders = getEnabledAuthProviders();

  if (!enabledProviders.includes(provider)) {
    return NextResponse.redirect(new URL("/admin?auth=provider", request.url));
  }

  const supabase = createSupabaseAuthClient();
  const origin = url.origin;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as "google" | "github" | "facebook" | "discord",
    options: {
      redirectTo: `${origin}/api/auth/callback`
    }
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/admin?auth=error", request.url));
  }

  return NextResponse.redirect(data.url);
}
