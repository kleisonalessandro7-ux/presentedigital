import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { PrintActions } from "@/components/gift/PrintActions";
import { readGiftBySlug } from "@/lib/storage";
import type { GiftCoupon } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PrintGiftPageProps = {
  params: {
    slug: string;
  };
  searchParams?: {
    tipo?: string;
  };
};

const fallbackCoupons: GiftCoupon[] = [
  {
    title: "Vale abraco demorado",
    description: "Para usar em qualquer dia que pedir mais carinho."
  },
  {
    title: "Vale encontro surpresa",
    description: "Um momento escolhido com calma, so para nos dois."
  },
  {
    title: "Vale filme juntinhos",
    description: "Com direito a escolher o filme e ficar perto."
  },
  {
    title: "Vale passeio sem pressa",
    description: "Um dia para caminhar, conversar e criar outra lembranca."
  }
];

function formatDate(date: string) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(`${date}T12:00:00`));
}

function getBaseUrl() {
  const headerList = headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "";
  const protocol = headerList.get("x-forwarded-proto") || "https";

  return host ? `${protocol}://${host}` : "";
}

function cleanCoupons(coupons: GiftCoupon[] | undefined) {
  const cleaned = (coupons || []).filter(
    (coupon) => coupon.title.trim() || coupon.description.trim()
  );

  return (cleaned.length ? cleaned : fallbackCoupons).slice(0, 8);
}

export default async function PrintGiftPage({ params, searchParams }: PrintGiftPageProps) {
  const gift = await readGiftBySlug(params.slug);

  if (!gift) {
    notFound();
  }

  const mode =
    searchParams?.tipo === "cupons"
      ? "coupons"
      : searchParams?.tipo === "pacote"
        ? "package"
        : "invite";
  const baseUrl = getBaseUrl();
  const giftUrl = `${baseUrl}/presente/${gift.slug}`;
  const qrUrl = await QRCode.toDataURL(giftUrl, {
    margin: 1,
    width: 480,
    color: {
      dark: "#111827",
      light: "#ffffff"
    }
  });
  const cover =
    gift.photos.find((photo) => photo.pathname === gift.coverPhotoPathname) ||
    gift.photos[0];
  const coupons = cleanCoupons(gift.coupons);

  return (
    <main className="gift-print-shell">
      <PrintActions giftUrl={`/presente/${gift.slug}`} />

      {mode === "invite" || mode === "package" ? (
        <section className="gift-print-page gift-print-invite">
          <div className="gift-print-ornament left" />
          <div className="gift-print-ornament right" />
          <div className="gift-print-invite-grid">
            <div className="gift-print-copy">
              <p className="gift-print-eyebrow">Um presente digital espera por voce</p>
              <h1>Para {gift.recipientName}</h1>
              <p className="gift-print-subtitle">
                Com amor de {gift.creatorName}, em uma lembranca feita para abrir devagar.
              </p>
              <div className="gift-print-tags">
                <span>Desde {formatDate(gift.specialDate)}</span>
                <span>{gift.photos.length} memorias</span>
              </div>
              <p className="gift-print-note">
                Aponte a camera do celular para o QR Code e abra a surpresa.
              </p>
            </div>

            <div className="gift-print-qr-card">
              {cover ? <img className="gift-print-cover" src={cover.url} alt="" /> : null}
              <div className="gift-print-qr-frame">
                <img src={qrUrl} alt="QR Code do presente" />
              </div>
              <p>{giftUrl}</p>
            </div>
          </div>
        </section>
      ) : null}

      {mode === "package" ? (
        <>
          <section className="gift-print-page gift-print-cover-page">
            <div>
              <p className="gift-print-eyebrow">Para entregar em mãos</p>
              <h1>Um presente para {gift.recipientName}</h1>
              <p>
                Abra com calma. Cada página aqui guarda um pedaço do carinho de {gift.creatorName}.
              </p>
            </div>
          </section>

          <section className="gift-print-page gift-print-fold-card">
            <div className="gift-print-fold-half">
              <p className="gift-print-eyebrow">Dobre aqui</p>
              <h1>{gift.recipientName}</h1>
              <p>Tem uma surpresa esperando por você.</p>
            </div>
            <div className="gift-print-fold-half">
              <p>
                Aponte a câmera para o QR Code do convite e abra quando puder viver este momento sem pressa.
              </p>
              <strong>{gift.creatorName}</strong>
            </div>
          </section>

          <section className="gift-print-page gift-print-envelope">
            <div className="gift-print-envelope-flap" />
            <div className="gift-print-envelope-body">
              <p>Para</p>
              <h1>{gift.recipientName}</h1>
              <span>Com amor de {gift.creatorName}</span>
            </div>
          </section>
        </>
      ) : null}

      {mode === "coupons" || mode === "package" ? (
        <section className="gift-print-page gift-print-coupons">
          <div className="gift-print-coupon-header">
            <p className="gift-print-eyebrow">Vales para usar com carinho</p>
            <h1>Cupons de amor</h1>
            <p>
              Para {gift.recipientName}, de {gift.creatorName}
            </p>
          </div>

          <div className="gift-print-coupon-grid">
            {coupons.map((coupon, index) => (
              <article className="gift-print-coupon" key={`${coupon.title}-${index}`}>
                <div>
                  <span>Vale {String(index + 1).padStart(2, "0")}</span>
                  <h2>{coupon.title}</h2>
                  <p>{coupon.description}</p>
                </div>
                <div className="gift-print-coupon-foot">
                  <span>Para destacar e usar quando quiser</span>
                  <span>Presente digital</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
