import { randomBytes } from "crypto";
import type { CollectionConfig } from "payload";
import { isOrder, isSuperAdmin } from "../access";

/**
 * Buku pesanan manual (F-ORD-05).
 *
 * Situs TIDAK memproses transaksi. Koleksi ini adalah catatan yang diisi admin
 * setelah pesanan masuk lewat WhatsApp atau marketplace, supaya rekap keuangan
 * dan laporan per judul punya satu sumber. Tidak ada otomatisasi status di sini:
 * setiap perubahan status dilakukan manusia.
 *
 * Catatan retensi: isi koleksi ini adalah data transaksi keuangan, disimpan 10 tahun.
 */
export const Orders: CollectionConfig = {
  slug: "orders",
  labels: { singular: "Pesanan", plural: "Buku Pesanan" },
  admin: {
    useAsTitle: "orderNumber",
    defaultColumns: ["orderNumber", "orderDate", "customerName", "channel", "total", "status"],
    group: "Pesanan",
    description:
      "Catatan pesanan yang masuk lewat WhatsApp atau marketplace. Isi paling lambat pada hari pesanan dibayar.",
    listSearchableFields: ["orderNumber", "customerName", "customerContact", "trackingNumber"],
  },
  defaultSort: "-orderDate",
  access: {
    read: isOrder,
    create: isOrder,
    update: isOrder,
    // Data transaksi keuangan tidak boleh dihapus sembarangan (retensi 10 tahun).
    delete: isSuperAdmin,
  },
  hooks: {
    beforeChange: [
      ({ data, operation, originalDoc, req }) => {
        // Nomor pesanan otomatis: PSN-YYYYMMDD-XXXXXX, tanggal dalam WIB.
        // Container berjalan UTC (panduan deploy §6.8); tanpa timeZone eksplisit,
        // pesanan pukul 00.00–06.59 WIB akan bertanggal kemarin.
        if (operation === "create" && !data.orderNumber) {
          const stamp = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
            .format(new Date())
            .replace(/-/g, "");
          const rand = randomBytes(3).toString("hex").toUpperCase();
          data.orderNumber = `PSN-${stamp}-${rand}`;
        }

        // Total dihitung ulang di server agar rekap tidak bergantung ketelitian admin.
        // Update parsial (mis. ubah status massal) bisa tidak membawa items/ongkir; pakai nilai lama.
        const pick = (k: string) => (data?.[k] !== undefined ? data[k] : originalDoc?.[k]);
        const itemsRaw = pick("items");
        const items = Array.isArray(itemsRaw) ? itemsRaw : [];
        const itemsTotal = items.reduce((sum: number, item: Record<string, unknown>) => {
          const qty = Number(item?.quantity) || 0;
          const unit = Number(item?.unitPrice) || 0;
          return sum + qty * unit;
        }, 0);
        data.itemsTotal = itemsTotal;
        data.total = itemsTotal + (Number(pick("shippingCost")) || 0) - (Number(pick("discount")) || 0);

        if (operation === "create" && req.user) data.recordedBy = req.user.id;
        return data;
      },
    ],
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "orderNumber",
          type: "text",
          label: "Nomor pesanan",
          unique: true,
          index: true,
          admin: { readOnly: true, description: "Dibuat otomatis." },
        },
        {
          name: "orderDate",
          type: "date",
          label: "Tanggal pesanan",
          required: true,
          defaultValue: () => new Date().toISOString(),
          admin: { date: { displayFormat: "d MMM yyyy" } },
        },
        {
          name: "channel",
          type: "select",
          label: "Kanal",
          required: true,
          defaultValue: "wa",
          index: true,
          options: [
            { label: "WhatsApp", value: "wa" },
            { label: "Tokopedia", value: "tokopedia" },
            { label: "Shopee", value: "shopee" },
            { label: "TikTok Shop", value: "tiktok" },
            { label: "Blibli", value: "blibli" },
            { label: "Lazada", value: "lazada" },
            { label: "Institusi (penawaran)", value: "institusi" },
            { label: "Lainnya", value: "lainnya" },
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Pembeli",
      admin: {
        description:
          "Isi hanya yang diperlukan untuk mengirim paket. Jangan menyimpan data yang tidak dipakai.",
      },
      fields: [
        {
          type: "row",
          fields: [
            { name: "customerName", type: "text", label: "Nama pembeli", required: true },
            {
              name: "customerContact",
              type: "text",
              label: "Kontak (WA/telepon/email)",
              required: true,
            },
          ],
        },
        {
          name: "shippingAddress",
          type: "textarea",
          label: "Alamat kirim",
          admin: {
            description:
              "Untuk pesanan marketplace, biarkan kosong — alamat ada di dasbor marketplace.",
          },
        },
        {
          name: "institutionName",
          type: "text",
          label: "Nama lembaga",
          admin: { condition: (data) => data?.channel === "institusi" },
        },
      ],
    },
    {
      name: "items",
      type: "array",
      label: "Buku yang dipesan",
      required: true,
      minRows: 1,
      labels: { singular: "Baris", plural: "Baris" },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "book",
              type: "relationship",
              relationTo: "books",
              label: "Buku",
              required: true,
            },
            {
              name: "quantity",
              type: "number",
              label: "Jumlah",
              required: true,
              min: 1,
              defaultValue: 1,
            },
            {
              name: "unitPrice",
              type: "number",
              label: "Harga satuan (Rp)",
              required: true,
              min: 0,
              admin: {
                description: "Harga yang benar-benar dibayar, bukan harga katalog.",
              },
            },
          ],
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "shippingCost",
          type: "number",
          label: "Ongkir dibayar pembeli (Rp)",
          defaultValue: 0,
          min: 0,
        },
        {
          name: "discount",
          type: "number",
          label: "Potongan (Rp)",
          defaultValue: 0,
          min: 0,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "itemsTotal",
          type: "number",
          label: "Subtotal barang (Rp)",
          admin: {
            readOnly: true,
            description: "Dihitung otomatis.",
            components: { Cell: "@/components/admin/cells/RupiahCell#RupiahCell" },
          },
        },
        {
          name: "total",
          type: "number",
          label: "Total (Rp)",
          admin: {
            readOnly: true,
            description: "Subtotal + ongkir − potongan.",
            components: { Cell: "@/components/admin/cells/RupiahCell#RupiahCell" },
          },
        },
      ],
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      required: true,
      defaultValue: "baru",
      index: true,
      options: [
        { label: "Baru", value: "baru" },
        { label: "Menunggu pembayaran", value: "menunggu-bayar" },
        { label: "Dibayar", value: "dibayar" },
        { label: "Dikemas", value: "dikemas" },
        { label: "Dikirim", value: "dikirim" },
        { label: "Selesai", value: "selesai" },
        { label: "Batal", value: "batal" },
      ],
      admin: {
        description: "Diubah manual oleh admin. Tidak ada otomatisasi dari sistem.",
      },
    },
    {
      type: "collapsible",
      label: "Pembayaran & pengiriman",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "paidAt",
              type: "date",
              label: "Waktu dibayar",
              admin: { date: { pickerAppearance: "dayAndTime" } },
            },
            {
              name: "paymentMethod",
              type: "select",
              label: "Cara bayar",
              options: [
                { label: "Transfer bank", value: "transfer" },
                { label: "QRIS", value: "qris" },
                { label: "Dibayar di marketplace", value: "marketplace" },
                { label: "Tunai / ambil sendiri", value: "tunai" },
                { label: "Lainnya", value: "lainnya" },
              ],
            },
          ],
        },
        {
          name: "paymentProof",
          type: "upload",
          relationTo: "private-files",
          label: "Bukti pembayaran",
          admin: {
            description:
              "Simpan hanya bila perlu. Berisi data pribadi, jadi ikut masa retensi 10 tahun dan tidak boleh disebar.",
          },
        },
        {
          type: "row",
          fields: [
            { name: "courier", type: "text", label: "Kurir" },
            { name: "trackingNumber", type: "text", label: "Nomor resi", index: true },
            {
              name: "shippedAt",
              type: "date",
              label: "Waktu dikirim",
              admin: { date: { pickerAppearance: "dayAndTime" } },
            },
          ],
        },
      ],
    },
    {
      name: "notes",
      type: "textarea",
      label: "Catatan internal",
    },
    {
      name: "recordedBy",
      type: "relationship",
      relationTo: "users",
      label: "Dicatat oleh",
      admin: { position: "sidebar", readOnly: true },
    },
  ],
};
