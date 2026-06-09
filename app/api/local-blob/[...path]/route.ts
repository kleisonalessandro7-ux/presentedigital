import { NextResponse } from "next/server";
import { readLocalBlob } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const blob = await readLocalBlob(params.path.join("/"));

    return new NextResponse(blob.body, {
      headers: {
        "content-type": blob.contentType,
        "cache-control": "public, max-age=60"
      }
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
