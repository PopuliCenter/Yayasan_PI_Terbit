import { draftMode, headers } from "next/headers";
import { cache } from "react";
import type { User } from "@/payload-types";
import { isAdminRequest } from "./admin-host";
import { getPayloadClient } from "./payload";
import { PREVIEW_HOME } from "./preview-url";

/**
 * Admin yang sedang mempratinjau draf, atau null. Hanya untuk server (bukan payload.config).
 *
 * Cookie draftMode saja TIDAK PERNAH cukup: nilainya sama untuk satu image, sehingga
 * pratinjau butuh empat lapis sekaligus: cookie draftMode, host admin, JWT Cloudflare
 * Access (lewat isAdminRequest), dan sesi login Payload.
 */
export const getPreviewUser = cache(async (): Promise<User | null> => {
  if (!(await draftMode()).isEnabled) return null;
  const h = await headers();
  if (!(await isAdminRequest(h))) return null;
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: h });
  return user && user.collection === "users" ? (user as User) : null;
});

export { PREVIEW_HOME, previewHref, previewLink } from "./preview-url";

/** Tautan "beranda" yang benar: tetap di pratinjau bila sedang mempratinjau. */
export const getHomeHref = async (): Promise<string> => ((await getPreviewUser()) ? PREVIEW_HOME : "/");
