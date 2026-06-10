import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/auth";
import { createSupabaseAuthClient, isUserAuthConfigured } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (isUserAuthConfigured()) {
    const supabase = createSupabaseAuthClient();
    await supabase.auth.signOut().catch(() => undefined);
  }

  const response = NextResponse.json({ ok: true });
  clearAdminCookie(response);

  return response;
}
