import { NextResponse } from "next/server";
import { createSupabaseAuthClient, isUserAuthConfigured } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSafeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/admin";
  }

  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeNext(url.searchParams.get("next"));

  if (!isUserAuthConfigured() || !code) {
    return NextResponse.redirect(new URL("/admin?auth=error", request.url));
  }

  const supabase = createSupabaseAuthClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/admin?auth=error", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
