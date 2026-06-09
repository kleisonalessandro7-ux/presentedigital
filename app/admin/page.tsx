import { GiftBuilder } from "@/components/admin/GiftBuilder";
import { LoginForm } from "@/components/admin/LoginForm";
import { isAdminAuthenticated, isAdminPasswordConfigured } from "@/lib/auth";
import { isBlobConfigured, readGiftIndex } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = isAdminAuthenticated();

  if (!authenticated) {
    return <LoginForm passwordConfigured={isAdminPasswordConfigured()} />;
  }

  const giftIndex = await readGiftIndex();

  return (
    <GiftBuilder
      initialGifts={giftIndex.items}
      blobConfigured={isBlobConfigured()}
    />
  );
}
