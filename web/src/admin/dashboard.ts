import type { DashboardConfig } from "payload";

/**
 * Dasbor admin (fitur dasbor modular Payload 3.93, masih @experimental).
 * Widget adalah komponen server; tata letak bawaan menyesuaikan peran. Admin bisa menata
 * ulang dasbornya sendiri; tata letak tersimpan di payload-preferences (tanpa skema baru).
 * Impor relatif saja (dipakai payload.config).
 */

const W = "@/components/admin/dashboard/widgets";

export const dashboard: DashboardConfig = {
  widgets: [
    { slug: "ringkasan-katalog", label: "Ringkasan katalog", minWidth: "small", Component: `${W}#CatalogSummaryWidget` },
    { slug: "pesan-masuk", label: "Pesan masuk terbaru", minWidth: "small", Component: `${W}#LatestInquiriesWidget` },
    { slug: "pesanan", label: "Pesanan perlu tindakan", minWidth: "small", Component: `${W}#OrdersQueueWidget` },
    { slug: "minat-per-judul", label: "Minat per judul (klik order)", minWidth: "medium", Component: `${W}#InterestWidget` },
    { slug: "rekap-pesanan", label: "Rekap pesanan per judul", minWidth: "medium", Component: `${W}#OrdersRecapWidget` },
  ],
  defaultLayout: ({ req }) => {
    const role = (req.user as { role?: string } | null | undefined)?.role;
    if (role === "admin-order") {
      return [
        { widgetSlug: "pesanan", width: "medium" },
        { widgetSlug: "pesan-masuk", width: "medium" },
        { widgetSlug: "rekap-pesanan", width: "full" },
        { widgetSlug: "minat-per-judul", width: "full" },
        { widgetSlug: "ringkasan-katalog", width: "full" },
        { widgetSlug: "collections", width: "full" },
      ];
    }
    if (role === "admin-katalog") {
      return [
        { widgetSlug: "ringkasan-katalog", width: "medium" },
        { widgetSlug: "pesan-masuk", width: "medium" },
        { widgetSlug: "minat-per-judul", width: "full" },
        { widgetSlug: "collections", width: "full" },
      ];
    }
    return [
      { widgetSlug: "ringkasan-katalog", width: "medium" },
      { widgetSlug: "pesan-masuk", width: "medium" },
      { widgetSlug: "pesanan", width: "full" },
      { widgetSlug: "minat-per-judul", width: "full" },
      { widgetSlug: "rekap-pesanan", width: "full" },
      { widgetSlug: "collections", width: "full" },
    ];
  },
};
