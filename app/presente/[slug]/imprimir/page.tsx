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

type PrintMode = "invite" | "coupons" | "letter" | "package";

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

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function chunkTextByWords(text: string, maxLength: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const pages: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxLength && current) {
      pages.push(current);
      current = word;
      continue;
    }

    current = next;
  }

  if (current) {
    pages.push(current);
  }

  return pages.length ? pages : [text];
}

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

function getPrintMode(tipo?: string): PrintMode {
  if (tipo === "cupons") {
    return "coupons";
  }

  if (tipo === "carta") {
    return "letter";
  }

  if (tipo === "pacote") {
    return "package";
  }

  return "invite";
}

function cleanCoupons(coupons: GiftCoupon[] | undefined) {
  const cleaned = (coupons || []).filter(
    (coupon) => coupon.title.trim() || coupon.description.trim()
  );

  return (cleaned.length ? cleaned : fallbackCoupons).slice(0, 12);
}

export default async function PrintGiftPage({ params, searchParams }: PrintGiftPageProps) {
  const gift = await readGiftBySlug(params.slug);

  if (!gift) {
    notFound();
  }

  const mode = getPrintMode(searchParams?.tipo);
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
  const couponPages = chunkItems(coupons, 4);
  const letterMessage =
    gift.message ||
    "Escrevi esse presente para voce abrir com calma e lembrar o quanto voce e especial para mim.";
  const letterPages = chunkTextByWords(letterMessage, 850);

  return (
    <main className="gift-print-shell">
      <PrintActions giftUrl={`/presente/${gift.slug}`} />

      {mode === "package" ? (
        <section className="gift-print-page gift-print-cover-page">
          <div>
            <p className="gift-print-eyebrow">Para entregar em maos</p>
            <h1>Um presente para {gift.recipientName}</h1>
            <p>
              Abra com calma. Cada pagina aqui guarda um pedaco do carinho de {gift.creatorName}.
            </p>
          </div>
        </section>
      ) : null}

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

      {mode === "letter" || mode === "package"
        ? letterPages.map((letterPage, pageIndex) => {
            const isLastLetterPage = pageIndex === letterPages.length - 1;

            return (
              <section className="gift-print-page gift-print-letter-page" key={`letter-${pageIndex}`}>
                <div className="gift-print-letter-paper">
                  <p className="gift-print-eyebrow">
                    Carta para guardar
                    {letterPages.length > 1 ? ` - parte ${pageIndex + 1} de ${letterPages.length}` : ""}
                  </p>
                  <h1>{pageIndex === 0 ? gift.recipientName : "Continuacao"}</h1>
                  <p className="gift-print-letter-message">{letterPage}</p>
                  {isLastLetterPage ? (
                    <>
                      <p className="gift-print-letter-signature">
                        {gift.finalSignature || `Com amor, ${gift.creatorName}`}
                      </p>
                      <div className="gift-print-letter-footer">
                        <div>
                          <span>Abra tambem o presente digital</span>
                          <p>Aponte a camera para o QR Code quando quiser viver tudo isso na tela.</p>
                        </div>
                        <div className="gift-print-letter-qr">
                          <img src={qrUrl} alt="QR Code do presente" />
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="gift-print-fold-mark">linha suave para dobrar a carta</div>
              </section>
            );
          })
        : null}

      {mode === "package" ? (
        <>
          <section className="gift-print-page gift-print-fold-card">
            <div className="gift-print-fold-half">
              <p className="gift-print-eyebrow">Dobre aqui</p>
              <h1>{gift.recipientName}</h1>
              <p>Tem uma surpresa esperando por voce.</p>
            </div>
            <div className="gift-print-fold-half">
              <p>
                Aponte a camera para o QR Code do convite e abra quando puder viver este momento sem pressa.
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

      {mode === "coupons" || mode === "package"
        ? couponPages.map((pageCoupons, pageIndex) => (
            <section className="gift-print-page gift-print-coupons" key={`coupons-${pageIndex}`}>
              <div className="gift-print-coupon-header">
                <p className="gift-print-eyebrow">Vales para usar com carinho</p>
                <h1>Cupons de amor</h1>
                <p>
                  Para {gift.recipientName}, de {gift.creatorName}
                </p>
              </div>

              <div className="gift-print-coupon-grid">
                {pageCoupons.map((coupon, index) => {
                  const couponNumber = pageIndex * 4 + index + 1;

                  return (
                    <article className="gift-print-coupon" key={`${coupon.title}-${couponNumber}`}>
                      <div>
                        <span>Vale {String(couponNumber).padStart(2, "0")}</span>
                        <h2>{coupon.title}</h2>
                        <p>{coupon.description}</p>
                      </div>
                      <div className="gift-print-coupon-foot">
                        <span>Recorte e use quando quiser</span>
                        <span>Presente digital</span>
                      </div>
                    </article>
                  );
                })}
              </div>
              <p className="gift-print-coupon-page-count">
                Folha {pageIndex + 1} de {couponPages.length}
              </p>
            </section>
          ))
        : null}
    </main>
  );
}
