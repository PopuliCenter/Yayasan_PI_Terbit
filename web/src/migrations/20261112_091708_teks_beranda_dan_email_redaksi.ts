import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "homepage_blocks_hero" ALTER COLUMN "intro" SET DEFAULT '{penerbit} menerbitkan buku untuk pembaca umum. Situs ini adalah katalog resmi terbitan kami: pilih judul, lalu pesan lewat WhatsApp.';
  ALTER TABLE "homepage_blocks_order_steps" ALTER COLUMN "note" SET DEFAULT 'Pembayaran hanya ke rekening atas nama Yayasan Populi Indonesia. Kami tidak pernah meminta transfer ke rekening pribadi.';
  ALTER TABLE "_homepage_v_blocks_hero" ALTER COLUMN "intro" SET DEFAULT '{penerbit} menerbitkan buku untuk pembaca umum. Situs ini adalah katalog resmi terbitan kami: pilih judul, lalu pesan lewat WhatsApp.';
  ALTER TABLE "_homepage_v_blocks_order_steps" ALTER COLUMN "note" SET DEFAULT 'Pembayaran hanya ke rekening atas nama Yayasan Populi Indonesia. Kami tidak pernah meminta transfer ke rekening pribadi.';
  ALTER TABLE "settings" ADD COLUMN "editorial_email" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "homepage_blocks_hero" ALTER COLUMN "intro" SET DEFAULT '{penerbit} menerbitkan buku untuk pembaca umum. Situs ini adalah katalog resmi terbitan kami: pilih judul, lalu pesan lewat WhatsApp atau toko resmi kami di marketplace.';
  ALTER TABLE "homepage_blocks_order_steps" ALTER COLUMN "note" SET DEFAULT 'Lebih suka belanja di marketplace? Setiap halaman buku juga menautkan ke toko resmi kami.';
  ALTER TABLE "_homepage_v_blocks_hero" ALTER COLUMN "intro" SET DEFAULT '{penerbit} menerbitkan buku untuk pembaca umum. Situs ini adalah katalog resmi terbitan kami: pilih judul, lalu pesan lewat WhatsApp atau toko resmi kami di marketplace.';
  ALTER TABLE "_homepage_v_blocks_order_steps" ALTER COLUMN "note" SET DEFAULT 'Lebih suka belanja di marketplace? Setiap halaman buku juga menautkan ke toko resmi kami.';
  ALTER TABLE "settings" DROP COLUMN IF EXISTS "editorial_email";`)
}
