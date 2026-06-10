import { GiftBuilder } from "@/components/admin/GiftBuilder";
import { LoginForm } from "@/components/admin/LoginForm";
import { isAdminAuthenticated, isAdminPasswordConfigured } from "@/lib/auth";
import { createEmptyGiftIndex, isBlobConfigured, readGiftIndex } from "@/lib/storage";
import { getCurrentUser, getEnabledAuthProviders, isUserAuthConfigured } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const passwordAuthenticated = isAdminAuthenticated();
  const currentUser = await getCurrentUser();
  const authenticated = passwordAuthenticated || Boolean(currentUser);

  if (!authenticated) {
    return (
      <LoginForm
        passwordConfigured={isAdminPasswordConfigured()}
        authConfigured={isUserAuthConfigured()}
        authProviders={getEnabledAuthProviders()}
      />
    );
  }

  let giftIndex = createEmptyGiftIndex();
  let storageError = "";

  try {
    giftIndex = await readGiftIndex(currentUser?.id);
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
      currentUserEmail={currentUser?.email || ""}
    />
  );
}
