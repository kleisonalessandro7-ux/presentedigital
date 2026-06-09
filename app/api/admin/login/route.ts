import { NextResponse } from "next/server";
import {
  attachAdminCookie,
  isAdminPasswordConfigured,
  isPasswordValid
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { password } = (await request.json().catch(() => ({}))) as {
    password?: string;
  };

  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      { error: "Configure ADMIN_PASSWORD antes de acessar o admin." },
      { status: 500 }
    );
  }

  if (!password || !isPasswordValid(password)) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  attachAdminCookie(response);

  return response;
}
