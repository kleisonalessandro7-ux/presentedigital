import { ImageResponse } from "next/og";
import { readGiftBySlug } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const gift = await readGiftBySlug(params.slug);

  if (!gift) {
    return new Response("Not found", { status: 404 });
  }

  const cover =
    gift.photos.find((photo) => photo.pathname === gift.coverPhotoPathname) ||
    gift.photos[0];
  const recipient = gift.recipientNickname || gift.recipientName;
  const title = gift.ogTitle || `Para ${recipient}`;
  const subtitle = gift.ogDescription || `Com amor de ${gift.creatorName}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background:
            "radial-gradient(circle at 25% 18%, rgba(236,72,153,0.55), transparent 360px), radial-gradient(circle at 76% 28%, rgba(139,92,246,0.42), transparent 380px), #07050f",
          color: "white",
          overflow: "hidden"
        }}
      >
        {cover ? (
          <img
            src={cover.url}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.34
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(7,5,15,0.95), rgba(7,5,15,0.48), rgba(7,5,15,0.84))"
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: 76,
            width: "72%",
            height: "100%"
          }}
        >
          <div
            style={{
              fontSize: 28,
              textTransform: "uppercase",
              color: "#fbcfe8",
              fontWeight: 800,
              marginBottom: 24
            }}
          >
            Presente digital
          </div>
          <div
            style={{
              fontSize: 86,
              lineHeight: 0.95,
              fontWeight: 800,
              letterSpacing: -2
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 30,
              fontSize: 34,
              color: "#fce7f3"
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
