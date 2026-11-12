import { Button } from "@payloadcms/ui";
import type { ServerProps } from "payload";
import { formatAdminURL } from "payload/shared";
import { SITE_INDEXABLE, SITE_URL } from "@/lib/site";

const ROLE_LABEL: Record<string, string> = {
  "super-admin": "Super admin",
  "admin-katalog": "Admin katalog",
  "admin-order": "Admin order",
};

const greeting = (now = new Date()): string => {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", hour12: false }).format(now));
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
};

/**
 * Sapaan dan pintasan di atas dasbor (admin.components.beforeDashboard).
 * Tanpa kueri basis data; tombol mengikuti hak akses pengguna.
 */
export function WelcomeHeader({ user, permissions, payload }: ServerProps) {
  const u = user as { name?: string | null; email?: string; role?: string } | undefined;
  const name = u?.name || u?.email || "";
  const role = (u?.role && ROLE_LABEL[u.role]) || "";
  const col = permissions?.collections ?? {};
  const admin = (path: `/${string}`) => formatAdminURL({ adminRoute: payload.config.routes.admin, path });

  return (
    <section className="ypi-welcome" aria-labelledby="ypi-welcome-title">
      <div>
        <h1 id="ypi-welcome-title" className="ypi-welcome__title">
          {greeting()}
          {name ? `, ${name}` : ""}
        </h1>
        <p className="ypi-welcome__meta">
          {role}
          {!SITE_INDEXABLE ? " · situs ini tidak diindeks (staging/pengembangan)" : ""}
        </p>
      </div>
      <div className="ypi-welcome__actions">
        {col.books?.create ? (
          <Button el="link" url={admin("/collections/books/create")} buttonStyle="primary" size="small">
            Tambah buku
          </Button>
        ) : null}
        {col.posts?.create ? (
          <Button el="link" url={admin("/collections/posts/create")} buttonStyle="secondary" size="small">
            Tulis kabar
          </Button>
        ) : null}
        {col.orders?.create ? (
          <Button el="link" url={admin("/collections/orders/create")} buttonStyle="secondary" size="small">
            Catat pesanan
          </Button>
        ) : null}
        {col.inquiries?.read ? (
          <Button el="link" url={`${admin("/collections/inquiries")}?where[status][equals]=baru`} buttonStyle="secondary" size="small">
            Pesan masuk baru
          </Button>
        ) : null}
        <Button el="anchor" url={SITE_URL} newTab buttonStyle="subtle" size="small">
          Lihat situs ↗
        </Button>
      </div>
    </section>
  );
}
