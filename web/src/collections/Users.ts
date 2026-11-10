import type { CollectionConfig } from "payload";
import { isSuperAdmin } from "../access";

export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Pengguna Admin", plural: "Pengguna Admin" },
  auth: {
    tokenExpiration: 60 * 60 * 8,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    // Produksi: cookie sesi hanya lewat HTTPS (Cloudflare → admin.<domain>). Proxy di
    // dalam VPS memang HTTP, tetapi atribut Secure dinilai peramban, bukan server.
    cookies: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    },
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "role", "isPdpOfficer"],
    group: "Pengaturan",
  },
  hooks: {
    beforeChange: [
      /**
       * Pengguna pertama (layar "buat pengguna pertama" Payload) selalu super admin.
       * Tanpa ini, pengguna pertama mendapat peran bawaan admin-katalog dan tidak
       * ada yang bisa mengelola pengguna. Layar itu hanya terjangkau di
       * admin.<domain>, di balik Cloudflare Access + MFA, jadi tidak ada sandi
       * super admin yang perlu disimpan di .env.
       */
      async ({ data, operation, req }) => {
        if (operation !== "create") return data;
        const { totalDocs } = await req.payload.count({ collection: "users", overrideAccess: true, req });
        if (totalDocs === 0) return { ...data, role: "super-admin" };
        return data;
      },
    ],
  },
  access: {
    // Hanya super admin yang mengelola pengguna (F-ADM-05).
    create: isSuperAdmin,
    delete: isSuperAdmin,
    update: ({ req: { user }, id }) => {
      if (!user) return false;
      if (user.role === "super-admin") return true;
      // Pengguna lain hanya boleh mengubah dirinya sendiri.
      return user.id === id;
    },
    read: ({ req: { user } }) => {
      // Tanpa pengguna: tolak langsung (403), jangan membuat kueri `id = undefined`.
      if (!user) return false;
      if (user.role === "super-admin") return true;
      return { id: { equals: user.id } };
    },
  },
  fields: [
    {
      name: "name",
      type: "text",
      label: "Nama",
      required: true,
    },
    {
      name: "role",
      type: "select",
      label: "Peran",
      required: true,
      defaultValue: "admin-katalog",
      access: {
        // Peran tidak boleh dinaikkan sendiri.
        update: ({ req: { user } }) => user?.role === "super-admin",
      },
      options: [
        { label: "Super admin", value: "super-admin" },
        { label: "Admin katalog", value: "admin-katalog" },
        { label: "Admin order (WA/marketplace)", value: "admin-order" },
      ],
      admin: {
        description:
          "Admin katalog menulis buku dan konten. Admin order menulis buku pesanan. Super admin mengelola pengguna dan pengaturan.",
      },
    },
    {
      name: "isPdpOfficer",
      type: "checkbox",
      label: "PIC Pelindungan Data Pribadi",
      defaultValue: false,
      access: {
        update: ({ req: { user } }) => user?.role === "super-admin",
      },
      admin: {
        description:
          "Penanda, bukan peran terpisah. Orang ini menangani permintaan hak subjek data dan notifikasi insiden.",
      },
    },
    {
      name: "phone",
      type: "text",
      label: "Telepon (internal)",
      admin: { description: "Tidak pernah ditampilkan di situs publik." },
    },
  ],
};
