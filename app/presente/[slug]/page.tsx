import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { GiftExperience } from "@/components/gift/GiftExperience";
import { GiftUnlock } from "@/components/gift/GiftUnlock";
import { readGiftBySlug } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GiftPageProps = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({
  params
}: GiftPageProps): Promise<Metadata> {
  const gift = await readGiftBySlug(params.slug);

  if (!gift) {
    return {
      title: "Presente Digital"
    };
  }

  return {
    title: `Para ${gift.recipientName}`,
    description:
      gift.ogDescription || `Um presente digital de ${gift.creatorName} para ${gift.recipientName}.`,
    openGraph: {
      title: gift.ogTitle || `Um presente para ${gift.recipientNickname || gift.recipientName}`,
      description: gift.ogDescription || `Criado com carinho por ${gift.creatorName}.`,
      images: [`/api/og/${gift.slug}`]
    },
    twitter: {
      card: "summary_large_image",
      title: gift.ogTitle || `Um presente para ${gift.recipientNickname || gift.recipientName}`,
      description: gift.ogDescription || `Criado com carinho por ${gift.creatorName}.`,
      images: [`/api/og/${gift.slug}`]
    }
  };
}

export default async function GiftPage({ params }: GiftPageProps) {
  const gift = await readGiftBySlug(params.slug);

  if (!gift) {
    notFound();
  }

  const unlocked =
    !gift.secretWord || cookies().get(`gift_unlock_${gift.slug}`)?.value === "1";

  if (!unlocked) {
    return <GiftUnlock slug={gift.slug} recipientName={gift.recipientName} />;
  }

  return <GiftExperience gift={{ ...gift, secretWord: undefined }} />;
}
