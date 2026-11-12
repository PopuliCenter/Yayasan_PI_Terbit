import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_appearance_theme_heading_font" AS ENUM('inter', 'plus-jakarta-sans', 'ibm-plex-sans', 'work-sans', 'public-sans', 'source-serif-4', 'lora', 'merriweather', 'literata', 'noto-serif');
  CREATE TYPE "public"."enum_appearance_theme_body_font" AS ENUM('inter', 'plus-jakarta-sans', 'ibm-plex-sans', 'work-sans', 'public-sans', 'source-serif-4', 'lora', 'merriweather', 'literata', 'noto-serif');
  CREATE TYPE "public"."enum_appearance_theme_header_font" AS ENUM('ikut-isi', 'inter', 'plus-jakarta-sans', 'ibm-plex-sans', 'work-sans', 'public-sans', 'source-serif-4', 'lora', 'merriweather', 'literata', 'noto-serif');
  CREATE TYPE "public"."enum_appearance_theme_footer_font" AS ENUM('ikut-isi', 'inter', 'plus-jakarta-sans', 'ibm-plex-sans', 'work-sans', 'public-sans', 'source-serif-4', 'lora', 'merriweather', 'literata', 'noto-serif');
  CREATE TYPE "public"."enum__appearance_v_version_theme_heading_font" AS ENUM('inter', 'plus-jakarta-sans', 'ibm-plex-sans', 'work-sans', 'public-sans', 'source-serif-4', 'lora', 'merriweather', 'literata', 'noto-serif');
  CREATE TYPE "public"."enum__appearance_v_version_theme_body_font" AS ENUM('inter', 'plus-jakarta-sans', 'ibm-plex-sans', 'work-sans', 'public-sans', 'source-serif-4', 'lora', 'merriweather', 'literata', 'noto-serif');
  CREATE TYPE "public"."enum__appearance_v_version_theme_header_font" AS ENUM('ikut-isi', 'inter', 'plus-jakarta-sans', 'ibm-plex-sans', 'work-sans', 'public-sans', 'source-serif-4', 'lora', 'merriweather', 'literata', 'noto-serif');
  CREATE TYPE "public"."enum__appearance_v_version_theme_footer_font" AS ENUM('ikut-isi', 'inter', 'plus-jakarta-sans', 'ibm-plex-sans', 'work-sans', 'public-sans', 'source-serif-4', 'lora', 'merriweather', 'literata', 'noto-serif');
  ALTER TABLE "appearance" ADD COLUMN "theme_heading_font" "enum_appearance_theme_heading_font" DEFAULT 'source-serif-4';
  ALTER TABLE "appearance" ADD COLUMN "theme_body_font" "enum_appearance_theme_body_font" DEFAULT 'inter';
  ALTER TABLE "appearance" ADD COLUMN "theme_header_font" "enum_appearance_theme_header_font" DEFAULT 'ikut-isi';
  ALTER TABLE "appearance" ADD COLUMN "theme_footer_font" "enum_appearance_theme_footer_font" DEFAULT 'ikut-isi';
  ALTER TABLE "_appearance_v" ADD COLUMN "version_theme_heading_font" "enum__appearance_v_version_theme_heading_font" DEFAULT 'source-serif-4';
  ALTER TABLE "_appearance_v" ADD COLUMN "version_theme_body_font" "enum__appearance_v_version_theme_body_font" DEFAULT 'inter';
  ALTER TABLE "_appearance_v" ADD COLUMN "version_theme_header_font" "enum__appearance_v_version_theme_header_font" DEFAULT 'ikut-isi';
  ALTER TABLE "_appearance_v" ADD COLUMN "version_theme_footer_font" "enum__appearance_v_version_theme_footer_font" DEFAULT 'ikut-isi';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "appearance" DROP COLUMN IF EXISTS "theme_heading_font";
  ALTER TABLE "appearance" DROP COLUMN IF EXISTS "theme_body_font";
  ALTER TABLE "appearance" DROP COLUMN IF EXISTS "theme_header_font";
  ALTER TABLE "appearance" DROP COLUMN IF EXISTS "theme_footer_font";
  ALTER TABLE "_appearance_v" DROP COLUMN IF EXISTS "version_theme_heading_font";
  ALTER TABLE "_appearance_v" DROP COLUMN IF EXISTS "version_theme_body_font";
  ALTER TABLE "_appearance_v" DROP COLUMN IF EXISTS "version_theme_header_font";
  ALTER TABLE "_appearance_v" DROP COLUMN IF EXISTS "version_theme_footer_font";
  DROP TYPE IF EXISTS "public"."enum_appearance_theme_heading_font";
  DROP TYPE IF EXISTS "public"."enum_appearance_theme_body_font";
  DROP TYPE IF EXISTS "public"."enum_appearance_theme_header_font";
  DROP TYPE IF EXISTS "public"."enum_appearance_theme_footer_font";
  DROP TYPE IF EXISTS "public"."enum__appearance_v_version_theme_heading_font";
  DROP TYPE IF EXISTS "public"."enum__appearance_v_version_theme_body_font";
  DROP TYPE IF EXISTS "public"."enum__appearance_v_version_theme_header_font";
  DROP TYPE IF EXISTS "public"."enum__appearance_v_version_theme_footer_font";`)
}
