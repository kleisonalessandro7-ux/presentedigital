import { GiftBuilder } from "@/components/admin/GiftBuilder";
import { LoginForm } from "@/components/admin/LoginForm";
import { isAdminAuthenticated, isAdminPasswordConfigured } from "@/lib/auth";
import { createEmptyGiftIndex, isBlobConfigured, readGiftIndex } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = isAdminAuthenticated();

  if (!authenticated) {
    return <LoginForm passwordConfigured={isAdminPasswordConfigured()} />;
  }

  let giftIndex = createEmptyGiftIndex();
  let storageError = "";

  try {
    giftIndex = await readGiftIndex();
  } catch (error) {
    console.error(error);
    storageError =
      error instanceof Error
        ? error.message
        : "Nao foi possivel carregar os presentes salvos.";
  }

  return (
    <GiftBuilder
      initialGifts={giftIndex.items}
      blobConfigured={isBlobConfigured()}
      storageError={storageError}
    />
  );
}
