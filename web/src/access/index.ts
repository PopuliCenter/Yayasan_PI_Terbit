import type { Access, FieldAccess } from "payload";

export type Role = "super-admin" | "admin-katalog" | "admin-order";

type MaybeUser = { role?: Role | null } | null | undefined;

const hasRole = (user: MaybeUser, ...roles: Role[]): boolean =>
  Boolean(user?.role && roles.includes(user.role as Role));

/** Siapa pun, termasuk pengunjung yang tidak masuk. Dipakai untuk konten publik. */
export const anyone: Access = () => true;

/** Hanya pengguna admin yang sudah masuk. */
export const isAdmin: Access = ({ req: { user } }) => Boolean(user);

export const isSuperAdmin: Access = ({ req: { user } }) =>
  hasRole(user as MaybeUser, "super-admin");

/** Admin katalog dan super admin: boleh menulis katalog dan konten. */
export const isKatalog: Access = ({ req: { user } }) =>
  hasRole(user as MaybeUser, "super-admin", "admin-katalog");

/** Admin order dan super admin: boleh menulis buku pesanan dan menangani pesan masuk. */
export const isOrder: Access = ({ req: { user } }) =>
  hasRole(user as MaybeUser, "super-admin", "admin-order");

/** Field yang hanya boleh dibaca admin yang masuk, termasuk lewat REST API. */
export const fieldIsAdmin: FieldAccess = ({ req: { user } }) => Boolean(user);

/** Versi field-level dari aturan yang sama. */
export const fieldIsSuperAdmin: FieldAccess = ({ req: { user } }) =>
  hasRole(user as MaybeUser, "super-admin");

export const fieldIsKatalog: FieldAccess = ({ req: { user } }) =>
  hasRole(user as MaybeUser, "super-admin", "admin-katalog");

/**
 * Publik hanya boleh membaca dokumen yang sudah terbit.
 * Pengguna admin yang masuk tetap melihat draf.
 */
export const publishedOrAdmin: Access = ({ req: { user } }) => {
  if (user) return true;
  return {
    _status: { equals: "published" },
  };
};
