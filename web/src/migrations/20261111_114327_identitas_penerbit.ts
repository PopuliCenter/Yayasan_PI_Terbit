import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" ALTER COLUMN "site_name" SET DEFAULT 'Yayasan Populi Indonesia';
  ALTER TABLE "settings" ALTER COLUMN "consent_text" SET DEFAULT 'Saya setuju menerima email kabar terbitan baru dari Yayasan Populi Indonesia, dan saya boleh berhenti kapan saja lewat tautan di setiap email.';
  ALTER TABLE "settings" ADD COLUMN "legal_basis" varchar;
  ALTER TABLE "settings" ADD COLUMN "publisher_responsible" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "settings" ALTER COLUMN "site_name" SET DEFAULT 'Penerbit Yayasan Populi Indonesia';
  ALTER TABLE "settings" ALTER COLUMN "consent_text" SET DEFAULT 'Saya setuju menerima email kabar terbitan baru dari Penerbit Yayasan Populi Indonesia, dan saya boleh berhenti kapan saja lewat tautan di setiap email.';
  ALTER TABLE "settings" DROP COLUMN "legal_basis";
  ALTER TABLE "settings" DROP COLUMN "publisher_responsible";`)
}
