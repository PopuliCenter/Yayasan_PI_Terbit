import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_redirects_to_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_redirects_type" AS ENUM('308', '307');
  CREATE TYPE "public"."enum_redirects_source" AS ENUM('manual', 'otomatis');
  CREATE TYPE "public"."enum_forms_confirmation_type" AS ENUM('message', 'redirect');
  CREATE TYPE "public"."enum_forms_redirect_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_form_submissions_status" AS ENUM('baru', 'diproses', 'selesai', 'spam');
  CREATE TYPE "public"."enum_exports_format" AS ENUM('csv', 'json');
  CREATE TYPE "public"."enum_exports_sort_order" AS ENUM('asc', 'desc');
  CREATE TYPE "public"."enum_exports_drafts" AS ENUM('yes', 'no');
  CREATE TYPE "public"."enum_imports_import_mode" AS ENUM('create', 'update', 'upsert');
  CREATE TYPE "public"."enum_imports_status" AS ENUM('pending', 'completed', 'partial', 'failed');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  CREATE TYPE "public"."enum_appearance_header_nav_visibility" AS ENUM('all', 'mobile');
  CREATE TYPE "public"."enum_appearance_header_nav_link_type" AS ENUM('route', 'page', 'custom');
  CREATE TYPE "public"."enum_appearance_header_nav_link_route" AS ENUM('beranda', 'katalog', 'penulis', 'kabar', 'caraPesan', 'tentang', 'institusi', 'kontak');
  CREATE TYPE "public"."enum_appearance_footer_links_link_type" AS ENUM('route', 'page', 'custom');
  CREATE TYPE "public"."enum_appearance_footer_links_link_route" AS ENUM('beranda', 'katalog', 'penulis', 'kabar', 'caraPesan', 'tentang', 'institusi', 'kontak');
  CREATE TYPE "public"."enum_appearance_theme_preset" AS ENUM('navy', 'hijau', 'petrol', 'marun', 'grafit');
  CREATE TYPE "public"."enum_appearance_announcement_tone" AS ENUM('info', 'important');
  CREATE TYPE "public"."enum_appearance_announcement_link_type" AS ENUM('none', 'route', 'page', 'custom');
  CREATE TYPE "public"."enum_appearance_announcement_link_route" AS ENUM('beranda', 'katalog', 'penulis', 'kabar', 'caraPesan', 'tentang', 'institusi', 'kontak');
  CREATE TYPE "public"."enum_appearance_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__appearance_v_version_header_nav_visibility" AS ENUM('all', 'mobile');
  CREATE TYPE "public"."enum__appearance_v_version_header_nav_link_type" AS ENUM('route', 'page', 'custom');
  CREATE TYPE "public"."enum__appearance_v_version_header_nav_link_route" AS ENUM('beranda', 'katalog', 'penulis', 'kabar', 'caraPesan', 'tentang', 'institusi', 'kontak');
  CREATE TYPE "public"."enum__appearance_v_version_footer_links_link_type" AS ENUM('route', 'page', 'custom');
  CREATE TYPE "public"."enum__appearance_v_version_footer_links_link_route" AS ENUM('beranda', 'katalog', 'penulis', 'kabar', 'caraPesan', 'tentang', 'institusi', 'kontak');
  CREATE TYPE "public"."enum__appearance_v_version_theme_preset" AS ENUM('navy', 'hijau', 'petrol', 'marun', 'grafit');
  CREATE TYPE "public"."enum__appearance_v_version_announcement_tone" AS ENUM('info', 'important');
  CREATE TYPE "public"."enum__appearance_v_version_announcement_link_type" AS ENUM('none', 'route', 'page', 'custom');
  CREATE TYPE "public"."enum__appearance_v_version_announcement_link_route" AS ENUM('beranda', 'katalog', 'penulis', 'kabar', 'caraPesan', 'tentang', 'institusi', 'kontak');
  CREATE TYPE "public"."enum__appearance_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_homepage_blocks_hero_spotlight_mode" AS ENUM('auto', 'manual', 'none');
  CREATE TYPE "public"."enum_homepage_blocks_book_shelf_source" AS ENUM('manual', 'category', 'featured');
  CREATE TYPE "public"."enum_homepage_blocks_call_to_action_button_style" AS ENUM('outline', 'solid');
  CREATE TYPE "public"."enum_homepage_blocks_text_section_columns" AS ENUM('split', 'single');
  CREATE TYPE "public"."enum_homepage_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__homepage_v_blocks_hero_spotlight_mode" AS ENUM('auto', 'manual', 'none');
  CREATE TYPE "public"."enum__homepage_v_blocks_book_shelf_source" AS ENUM('manual', 'category', 'featured');
  CREATE TYPE "public"."enum__homepage_v_blocks_call_to_action_button_style" AS ENUM('outline', 'solid');
  CREATE TYPE "public"."enum__homepage_v_blocks_text_section_columns" AS ENUM('split', 'single');
  CREATE TYPE "public"."enum__homepage_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"to_type" "enum_redirects_to_type" DEFAULT 'reference',
  	"to_url" varchar,
  	"type" "enum_redirects_type" DEFAULT '308' NOT NULL,
  	"allow_external" boolean DEFAULT false,
  	"approved_external_url" varchar,
  	"source" "enum_redirects_source" DEFAULT 'manual',
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "redirects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"books_id" integer,
  	"pages_id" integer,
  	"posts_id" integer,
  	"authors_id" integer,
  	"categories_id" integer,
  	"series_id" integer
  );
  
  CREATE TABLE "forms_blocks_checkbox" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"width" numeric,
  	"required" boolean,
  	"default_value" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_email" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"width" numeric,
  	"required" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_message" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"message" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_number" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"width" numeric,
  	"default_value" numeric,
  	"required" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_select_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "forms_blocks_select" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"width" numeric,
  	"default_value" varchar,
  	"placeholder" varchar,
  	"required" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"width" numeric,
  	"default_value" varchar,
  	"required" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_textarea" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"width" numeric,
  	"default_value" varchar,
  	"required" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_radio_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "forms_blocks_radio" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"width" numeric,
  	"default_value" varchar,
  	"required" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_date" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"width" numeric,
  	"required" boolean,
  	"default_value" timestamp(3) with time zone,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"submit_button_label" varchar,
  	"confirmation_type" "enum_forms_confirmation_type" DEFAULT 'message',
  	"confirmation_message" jsonb,
  	"redirect_type" "enum_forms_redirect_type" DEFAULT 'reference',
  	"redirect_url" varchar,
  	"accepting_responses" boolean DEFAULT true,
  	"closes_at" timestamp(3) with time zone,
  	"closed_message" varchar DEFAULT 'Formulir ini sudah ditutup. Terima kasih atas minat Anda.',
  	"purpose" varchar NOT NULL,
  	"require_consent" boolean DEFAULT true,
  	"consent_label" varchar DEFAULT 'Saya menyetujui pemrosesan data saya untuk tujuan di atas sesuai Kebijakan Privasi.',
  	"consent_version" varchar DEFAULT '1.0',
  	"retention_days" numeric DEFAULT 365 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "forms_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer
  );
  
  CREATE TABLE "form_submissions_submission_data" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field" varchar NOT NULL,
  	"label" varchar,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "form_submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"form_id" integer NOT NULL,
  	"status" "enum_form_submissions_status" DEFAULT 'baru' NOT NULL,
  	"handled_by_id" integer,
  	"internal_notes" varchar,
  	"consent_given" boolean,
  	"consent_at" timestamp(3) with time zone,
  	"consent_version" varchar,
  	"consent_text" varchar,
  	"consent_purpose" varchar,
  	"source_path" varchar,
  	"expires_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "exports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"format" "enum_exports_format" DEFAULT 'csv' NOT NULL,
  	"limit" numeric,
  	"page" numeric DEFAULT 1,
  	"sort" varchar,
  	"sort_order" "enum_exports_sort_order",
  	"drafts" "enum_exports_drafts" DEFAULT 'yes',
  	"collection_slug" varchar DEFAULT 'books' NOT NULL,
  	"where" jsonb DEFAULT '{}'::jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "exports_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "imports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"collection_slug" varchar DEFAULT 'books' NOT NULL,
  	"import_mode" "enum_imports_import_mode" DEFAULT 'create',
  	"match_field" varchar DEFAULT 'slug',
  	"status" "enum_imports_status" DEFAULT 'pending',
  	"summary_imported" numeric,
  	"summary_updated" numeric,
  	"summary_total" numeric,
  	"summary_issues" numeric,
  	"summary_issue_details" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "appearance_header_nav" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"visibility" "enum_appearance_header_nav_visibility" DEFAULT 'all',
  	"link_type" "enum_appearance_header_nav_link_type" DEFAULT 'route',
  	"link_route" "enum_appearance_header_nav_link_route",
  	"link_page_id" integer,
  	"link_url" varchar,
  	"link_new_tab" boolean
  );
  
  CREATE TABLE "appearance_footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"link_type" "enum_appearance_footer_links_link_type" DEFAULT 'route',
  	"link_route" "enum_appearance_footer_links_link_route",
  	"link_page_id" integer,
  	"link_url" varchar,
  	"link_new_tab" boolean
  );
  
  CREATE TABLE "appearance" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"theme_preset" "enum_appearance_theme_preset" DEFAULT 'navy',
  	"theme_custom_accent" boolean DEFAULT false,
  	"theme_accent_light" varchar,
  	"theme_accent_dark" varchar,
  	"show_whats_app_button" boolean DEFAULT true,
  	"footer_info_title" varchar DEFAULT 'Informasi',
  	"footer_note" varchar,
  	"show_newsletter" boolean DEFAULT true,
  	"show_social_links" boolean DEFAULT true,
  	"announcement_enabled" boolean DEFAULT false,
  	"announcement_text" varchar,
  	"announcement_tone" "enum_appearance_announcement_tone" DEFAULT 'info',
  	"announcement_starts_at" timestamp(3) with time zone,
  	"announcement_ends_at" timestamp(3) with time zone,
  	"announcement_link_label" varchar DEFAULT 'Selengkapnya',
  	"announcement_link_type" "enum_appearance_announcement_link_type" DEFAULT 'none',
  	"announcement_link_route" "enum_appearance_announcement_link_route",
  	"announcement_link_page_id" integer,
  	"announcement_link_url" varchar,
  	"announcement_link_new_tab" boolean,
  	"_status" "enum_appearance_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_appearance_v_version_header_nav" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"visibility" "enum__appearance_v_version_header_nav_visibility" DEFAULT 'all',
  	"link_type" "enum__appearance_v_version_header_nav_link_type" DEFAULT 'route',
  	"link_route" "enum__appearance_v_version_header_nav_link_route",
  	"link_page_id" integer,
  	"link_url" varchar,
  	"link_new_tab" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_appearance_v_version_footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"link_type" "enum__appearance_v_version_footer_links_link_type" DEFAULT 'route',
  	"link_route" "enum__appearance_v_version_footer_links_link_route",
  	"link_page_id" integer,
  	"link_url" varchar,
  	"link_new_tab" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_appearance_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_theme_preset" "enum__appearance_v_version_theme_preset" DEFAULT 'navy',
  	"version_theme_custom_accent" boolean DEFAULT false,
  	"version_theme_accent_light" varchar,
  	"version_theme_accent_dark" varchar,
  	"version_show_whats_app_button" boolean DEFAULT true,
  	"version_footer_info_title" varchar DEFAULT 'Informasi',
  	"version_footer_note" varchar,
  	"version_show_newsletter" boolean DEFAULT true,
  	"version_show_social_links" boolean DEFAULT true,
  	"version_announcement_enabled" boolean DEFAULT false,
  	"version_announcement_text" varchar,
  	"version_announcement_tone" "enum__appearance_v_version_announcement_tone" DEFAULT 'info',
  	"version_announcement_starts_at" timestamp(3) with time zone,
  	"version_announcement_ends_at" timestamp(3) with time zone,
  	"version_announcement_link_label" varchar DEFAULT 'Selengkapnya',
  	"version_announcement_link_type" "enum__appearance_v_version_announcement_link_type" DEFAULT 'none',
  	"version_announcement_link_route" "enum__appearance_v_version_announcement_link_route",
  	"version_announcement_link_page_id" integer,
  	"version_announcement_link_url" varchar,
  	"version_announcement_link_new_tab" boolean,
  	"version__status" "enum__appearance_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "homepage_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Buku kajian politik, demokrasi, dan kebijakan publik.',
  	"intro" varchar DEFAULT '{penerbit} menerbitkan buku untuk pembaca umum. Situs ini adalah katalog resmi terbitan kami: pilih judul, lalu pesan lewat WhatsApp atau toko resmi kami di marketplace.',
  	"show_search" boolean DEFAULT true,
  	"search_placeholder" varchar DEFAULT 'Judul, penulis, atau ISBN',
  	"spotlight_mode" "enum_homepage_blocks_hero_spotlight_mode" DEFAULT 'auto',
  	"spotlight_book_id" integer,
  	"spotlight_label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_latest_books" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Terbitan terbaru',
  	"limit" numeric DEFAULT 8,
  	"show_all_link" boolean DEFAULT true,
  	"all_link_label" varchar DEFAULT 'Lihat semua buku',
  	"empty_text" varchar DEFAULT 'Katalog sedang disiapkan. Silakan kembali lagi nanti.',
  	"hide_section" boolean DEFAULT false,
  	"paper_band" boolean DEFAULT false,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_book_shelf" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum_homepage_blocks_book_shelf_source" DEFAULT 'manual',
  	"category_id" integer,
  	"limit" numeric DEFAULT 4,
  	"show_all_link" boolean DEFAULT true,
  	"hide_section" boolean DEFAULT false,
  	"paper_band" boolean DEFAULT false,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Menurut topik',
  	"hide_section" boolean DEFAULT false,
  	"paper_band" boolean DEFAULT false,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_order_steps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "homepage_blocks_order_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Cara memesan',
  	"intro" varchar DEFAULT 'Situs ini tidak memakai keranjang belanja. Setiap pesanan dilayani langsung oleh admin kami.',
  	"note" varchar DEFAULT 'Lebih suka belanja di marketplace? Setiap halaman buku juga menautkan ke toko resmi kami.',
  	"link_label" varchar DEFAULT 'Selengkapnya',
  	"link_url" varchar DEFAULT '/cara-pesan',
  	"hide_section" boolean DEFAULT false,
  	"paper_band" boolean DEFAULT false,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_call_to_action" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"button_label" varchar,
  	"button_url" varchar,
  	"button_style" "enum_homepage_blocks_call_to_action_button_style" DEFAULT 'outline',
  	"hide_section" boolean DEFAULT false,
  	"paper_band" boolean DEFAULT false,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_news" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Kabar penerbit',
  	"limit" numeric DEFAULT 3,
  	"all_link_label" varchar DEFAULT 'Semua kabar',
  	"hide_section" boolean DEFAULT false,
  	"paper_band" boolean DEFAULT false,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_text_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"content" jsonb,
  	"columns" "enum_homepage_blocks_text_section_columns" DEFAULT 'split',
  	"hide_section" boolean DEFAULT false,
  	"paper_band" boolean DEFAULT false,
  	"anchor" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"_status" "enum_homepage_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "homepage_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"books_id" integer,
  	"categories_id" integer
  );
  
  CREATE TABLE "_homepage_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Buku kajian politik, demokrasi, dan kebijakan publik.',
  	"intro" varchar DEFAULT '{penerbit} menerbitkan buku untuk pembaca umum. Situs ini adalah katalog resmi terbitan kami: pilih judul, lalu pesan lewat WhatsApp atau toko resmi kami di marketplace.',
  	"show_search" boolean DEFAULT true,
  	"search_placeholder" varchar DEFAULT 'Judul, penulis, atau ISBN',
  	"spotlight_mode" "enum__homepage_v_blocks_hero_spotlight_mode" DEFAULT 'auto',
  	"spotlight_book_id" integer,
  	"spotlight_label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_latest_books" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Terbitan terbaru',
  	"limit" numeric DEFAULT 8,
  	"show_all_link" boolean DEFAULT true,
  	"all_link_label" varchar DEFAULT 'Lihat semua buku',
  	"empty_text" varchar DEFAULT 'Katalog sedang disiapkan. Silakan kembali lagi nanti.',
  	"hide_section" boolean DEFAULT false,
  	"paper_band" boolean DEFAULT false,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_book_shelf" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"source" "enum__homepage_v_blocks_book_shelf_source" DEFAULT 'manual',
  	"category_id" integer,
  	"limit" numeric DEFAULT 4,
  	"show_all_link" boolean DEFAULT true,
  	"hide_section" boolean DEFAULT false,
  	"paper_band" boolean DEFAULT false,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Menurut topik',
  	"hide_section" boolean DEFAULT false,
  	"paper_band" boolean DEFAULT false,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_order_steps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_order_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Cara memesan',
  	"intro" varchar DEFAULT 'Situs ini tidak memakai keranjang belanja. Setiap pesanan dilayani langsung oleh admin kami.',
  	"note" varchar DEFAULT 'Lebih suka belanja di marketplace? Setiap halaman buku juga menautkan ke toko resmi kami.',
  	"link_label" varchar DEFAULT 'Selengkapnya',
  	"link_url" varchar DEFAULT '/cara-pesan',
  	"hide_section" boolean DEFAULT false,
  	"paper_band" boolean DEFAULT false,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_call_to_action" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"button_label" varchar,
  	"button_url" varchar,
  	"button_style" "enum__homepage_v_blocks_call_to_action_button_style" DEFAULT 'outline',
  	"hide_section" boolean DEFAULT false,
  	"paper_band" boolean DEFAULT false,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_news" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Kabar penerbit',
  	"limit" numeric DEFAULT 3,
  	"all_link_label" varchar DEFAULT 'Semua kabar',
  	"hide_section" boolean DEFAULT false,
  	"paper_band" boolean DEFAULT false,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v_blocks_text_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"content" jsonb,
  	"columns" "enum__homepage_v_blocks_text_section_columns" DEFAULT 'split',
  	"hide_section" boolean DEFAULT false,
  	"paper_band" boolean DEFAULT false,
  	"anchor" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_homepage_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version__status" "enum__homepage_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_homepage_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"books_id" integer,
  	"categories_id" integer
  );
  
  ALTER TABLE "books" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "_books_v" ADD COLUMN "version_meta_image_id" integer;
  ALTER TABLE "pages" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "pages" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "pages" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "version_meta_title" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_meta_description" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_meta_image_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "autosave" boolean;
  ALTER TABLE "posts" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "posts" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "posts" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "_posts_v" ADD COLUMN "version_meta_title" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_meta_description" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_meta_image_id" integer;
  ALTER TABLE "_posts_v" ADD COLUMN "autosave" boolean;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "redirects_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "forms_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "form_submissions_id" integer;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_books_fk" FOREIGN KEY ("books_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_authors_fk" FOREIGN KEY ("authors_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_series_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_checkbox" ADD CONSTRAINT "forms_blocks_checkbox_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_email" ADD CONSTRAINT "forms_blocks_email_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_message" ADD CONSTRAINT "forms_blocks_message_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_number" ADD CONSTRAINT "forms_blocks_number_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_select_options" ADD CONSTRAINT "forms_blocks_select_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_select"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_select" ADD CONSTRAINT "forms_blocks_select_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_text" ADD CONSTRAINT "forms_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_textarea" ADD CONSTRAINT "forms_blocks_textarea_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_radio_options" ADD CONSTRAINT "forms_blocks_radio_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_radio"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_radio" ADD CONSTRAINT "forms_blocks_radio_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_date" ADD CONSTRAINT "forms_blocks_date_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_rels" ADD CONSTRAINT "forms_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_rels" ADD CONSTRAINT "forms_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "form_submissions_submission_data" ADD CONSTRAINT "form_submissions_submission_data_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_handled_by_id_users_id_fk" FOREIGN KEY ("handled_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "exports_texts" ADD CONSTRAINT "exports_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "appearance_header_nav" ADD CONSTRAINT "appearance_header_nav_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "appearance_header_nav" ADD CONSTRAINT "appearance_header_nav_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."appearance"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "appearance_footer_links" ADD CONSTRAINT "appearance_footer_links_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "appearance_footer_links" ADD CONSTRAINT "appearance_footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."appearance"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "appearance" ADD CONSTRAINT "appearance_announcement_link_page_id_pages_id_fk" FOREIGN KEY ("announcement_link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_appearance_v_version_header_nav" ADD CONSTRAINT "_appearance_v_version_header_nav_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_appearance_v_version_header_nav" ADD CONSTRAINT "_appearance_v_version_header_nav_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_appearance_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_appearance_v_version_footer_links" ADD CONSTRAINT "_appearance_v_version_footer_links_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_appearance_v_version_footer_links" ADD CONSTRAINT "_appearance_v_version_footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_appearance_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_appearance_v" ADD CONSTRAINT "_appearance_v_version_announcement_link_page_id_pages_id_fk" FOREIGN KEY ("version_announcement_link_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero" ADD CONSTRAINT "homepage_blocks_hero_spotlight_book_id_books_id_fk" FOREIGN KEY ("spotlight_book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_hero" ADD CONSTRAINT "homepage_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_latest_books" ADD CONSTRAINT "homepage_blocks_latest_books_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_book_shelf" ADD CONSTRAINT "homepage_blocks_book_shelf_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_book_shelf" ADD CONSTRAINT "homepage_blocks_book_shelf_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_topics" ADD CONSTRAINT "homepage_blocks_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_order_steps_steps" ADD CONSTRAINT "homepage_blocks_order_steps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_order_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_order_steps" ADD CONSTRAINT "homepage_blocks_order_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_call_to_action" ADD CONSTRAINT "homepage_blocks_call_to_action_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_news" ADD CONSTRAINT "homepage_blocks_news_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_text_section" ADD CONSTRAINT "homepage_blocks_text_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_books_fk" FOREIGN KEY ("books_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero" ADD CONSTRAINT "_homepage_v_blocks_hero_spotlight_book_id_books_id_fk" FOREIGN KEY ("spotlight_book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_hero" ADD CONSTRAINT "_homepage_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_latest_books" ADD CONSTRAINT "_homepage_v_blocks_latest_books_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_book_shelf" ADD CONSTRAINT "_homepage_v_blocks_book_shelf_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_book_shelf" ADD CONSTRAINT "_homepage_v_blocks_book_shelf_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_topics" ADD CONSTRAINT "_homepage_v_blocks_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_order_steps_steps" ADD CONSTRAINT "_homepage_v_blocks_order_steps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v_blocks_order_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_order_steps" ADD CONSTRAINT "_homepage_v_blocks_order_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_call_to_action" ADD CONSTRAINT "_homepage_v_blocks_call_to_action_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_news" ADD CONSTRAINT "_homepage_v_blocks_news_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_blocks_text_section" ADD CONSTRAINT "_homepage_v_blocks_text_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v" ADD CONSTRAINT "_homepage_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_homepage_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_books_fk" FOREIGN KEY ("books_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_homepage_v_rels" ADD CONSTRAINT "_homepage_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "redirects_from_idx" ON "redirects" USING btree ("from");
  CREATE INDEX "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  CREATE INDEX "redirects_rels_order_idx" ON "redirects_rels" USING btree ("order");
  CREATE INDEX "redirects_rels_parent_idx" ON "redirects_rels" USING btree ("parent_id");
  CREATE INDEX "redirects_rels_path_idx" ON "redirects_rels" USING btree ("path");
  CREATE INDEX "redirects_rels_books_id_idx" ON "redirects_rels" USING btree ("books_id");
  CREATE INDEX "redirects_rels_pages_id_idx" ON "redirects_rels" USING btree ("pages_id");
  CREATE INDEX "redirects_rels_posts_id_idx" ON "redirects_rels" USING btree ("posts_id");
  CREATE INDEX "redirects_rels_authors_id_idx" ON "redirects_rels" USING btree ("authors_id");
  CREATE INDEX "redirects_rels_categories_id_idx" ON "redirects_rels" USING btree ("categories_id");
  CREATE INDEX "redirects_rels_series_id_idx" ON "redirects_rels" USING btree ("series_id");
  CREATE INDEX "forms_blocks_checkbox_order_idx" ON "forms_blocks_checkbox" USING btree ("_order");
  CREATE INDEX "forms_blocks_checkbox_parent_id_idx" ON "forms_blocks_checkbox" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_checkbox_path_idx" ON "forms_blocks_checkbox" USING btree ("_path");
  CREATE INDEX "forms_blocks_email_order_idx" ON "forms_blocks_email" USING btree ("_order");
  CREATE INDEX "forms_blocks_email_parent_id_idx" ON "forms_blocks_email" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_email_path_idx" ON "forms_blocks_email" USING btree ("_path");
  CREATE INDEX "forms_blocks_message_order_idx" ON "forms_blocks_message" USING btree ("_order");
  CREATE INDEX "forms_blocks_message_parent_id_idx" ON "forms_blocks_message" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_message_path_idx" ON "forms_blocks_message" USING btree ("_path");
  CREATE INDEX "forms_blocks_number_order_idx" ON "forms_blocks_number" USING btree ("_order");
  CREATE INDEX "forms_blocks_number_parent_id_idx" ON "forms_blocks_number" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_number_path_idx" ON "forms_blocks_number" USING btree ("_path");
  CREATE INDEX "forms_blocks_select_options_order_idx" ON "forms_blocks_select_options" USING btree ("_order");
  CREATE INDEX "forms_blocks_select_options_parent_id_idx" ON "forms_blocks_select_options" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_select_order_idx" ON "forms_blocks_select" USING btree ("_order");
  CREATE INDEX "forms_blocks_select_parent_id_idx" ON "forms_blocks_select" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_select_path_idx" ON "forms_blocks_select" USING btree ("_path");
  CREATE INDEX "forms_blocks_text_order_idx" ON "forms_blocks_text" USING btree ("_order");
  CREATE INDEX "forms_blocks_text_parent_id_idx" ON "forms_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_text_path_idx" ON "forms_blocks_text" USING btree ("_path");
  CREATE INDEX "forms_blocks_textarea_order_idx" ON "forms_blocks_textarea" USING btree ("_order");
  CREATE INDEX "forms_blocks_textarea_parent_id_idx" ON "forms_blocks_textarea" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_textarea_path_idx" ON "forms_blocks_textarea" USING btree ("_path");
  CREATE INDEX "forms_blocks_radio_options_order_idx" ON "forms_blocks_radio_options" USING btree ("_order");
  CREATE INDEX "forms_blocks_radio_options_parent_id_idx" ON "forms_blocks_radio_options" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_radio_order_idx" ON "forms_blocks_radio" USING btree ("_order");
  CREATE INDEX "forms_blocks_radio_parent_id_idx" ON "forms_blocks_radio" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_radio_path_idx" ON "forms_blocks_radio" USING btree ("_path");
  CREATE INDEX "forms_blocks_date_order_idx" ON "forms_blocks_date" USING btree ("_order");
  CREATE INDEX "forms_blocks_date_parent_id_idx" ON "forms_blocks_date" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_date_path_idx" ON "forms_blocks_date" USING btree ("_path");
  CREATE INDEX "forms_updated_at_idx" ON "forms" USING btree ("updated_at");
  CREATE INDEX "forms_created_at_idx" ON "forms" USING btree ("created_at");
  CREATE INDEX "forms_rels_order_idx" ON "forms_rels" USING btree ("order");
  CREATE INDEX "forms_rels_parent_idx" ON "forms_rels" USING btree ("parent_id");
  CREATE INDEX "forms_rels_path_idx" ON "forms_rels" USING btree ("path");
  CREATE INDEX "forms_rels_pages_id_idx" ON "forms_rels" USING btree ("pages_id");
  CREATE INDEX "form_submissions_submission_data_order_idx" ON "form_submissions_submission_data" USING btree ("_order");
  CREATE INDEX "form_submissions_submission_data_parent_id_idx" ON "form_submissions_submission_data" USING btree ("_parent_id");
  CREATE INDEX "form_submissions_form_idx" ON "form_submissions" USING btree ("form_id");
  CREATE INDEX "form_submissions_status_idx" ON "form_submissions" USING btree ("status");
  CREATE INDEX "form_submissions_handled_by_idx" ON "form_submissions" USING btree ("handled_by_id");
  CREATE INDEX "form_submissions_expires_at_idx" ON "form_submissions" USING btree ("expires_at");
  CREATE INDEX "form_submissions_updated_at_idx" ON "form_submissions" USING btree ("updated_at");
  CREATE INDEX "form_submissions_created_at_idx" ON "form_submissions" USING btree ("created_at");
  CREATE INDEX "exports_updated_at_idx" ON "exports" USING btree ("updated_at");
  CREATE INDEX "exports_created_at_idx" ON "exports" USING btree ("created_at");
  CREATE UNIQUE INDEX "exports_filename_idx" ON "exports" USING btree ("filename");
  CREATE INDEX "exports_texts_order_parent" ON "exports_texts" USING btree ("order","parent_id");
  CREATE INDEX "imports_updated_at_idx" ON "imports" USING btree ("updated_at");
  CREATE INDEX "imports_created_at_idx" ON "imports" USING btree ("created_at");
  CREATE UNIQUE INDEX "imports_filename_idx" ON "imports" USING btree ("filename");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "appearance_header_nav_order_idx" ON "appearance_header_nav" USING btree ("_order");
  CREATE INDEX "appearance_header_nav_parent_id_idx" ON "appearance_header_nav" USING btree ("_parent_id");
  CREATE INDEX "appearance_header_nav_link_link_page_idx" ON "appearance_header_nav" USING btree ("link_page_id");
  CREATE INDEX "appearance_footer_links_order_idx" ON "appearance_footer_links" USING btree ("_order");
  CREATE INDEX "appearance_footer_links_parent_id_idx" ON "appearance_footer_links" USING btree ("_parent_id");
  CREATE INDEX "appearance_footer_links_link_link_page_idx" ON "appearance_footer_links" USING btree ("link_page_id");
  CREATE INDEX "appearance_announcement_link_announcement_link_page_idx" ON "appearance" USING btree ("announcement_link_page_id");
  CREATE INDEX "appearance__status_idx" ON "appearance" USING btree ("_status");
  CREATE INDEX "_appearance_v_version_header_nav_order_idx" ON "_appearance_v_version_header_nav" USING btree ("_order");
  CREATE INDEX "_appearance_v_version_header_nav_parent_id_idx" ON "_appearance_v_version_header_nav" USING btree ("_parent_id");
  CREATE INDEX "_appearance_v_version_header_nav_link_link_page_idx" ON "_appearance_v_version_header_nav" USING btree ("link_page_id");
  CREATE INDEX "_appearance_v_version_footer_links_order_idx" ON "_appearance_v_version_footer_links" USING btree ("_order");
  CREATE INDEX "_appearance_v_version_footer_links_parent_id_idx" ON "_appearance_v_version_footer_links" USING btree ("_parent_id");
  CREATE INDEX "_appearance_v_version_footer_links_link_link_page_idx" ON "_appearance_v_version_footer_links" USING btree ("link_page_id");
  CREATE INDEX "_appearance_v_version_announcement_link_version_announce_idx" ON "_appearance_v" USING btree ("version_announcement_link_page_id");
  CREATE INDEX "_appearance_v_version_version__status_idx" ON "_appearance_v" USING btree ("version__status");
  CREATE INDEX "_appearance_v_created_at_idx" ON "_appearance_v" USING btree ("created_at");
  CREATE INDEX "_appearance_v_updated_at_idx" ON "_appearance_v" USING btree ("updated_at");
  CREATE INDEX "_appearance_v_latest_idx" ON "_appearance_v" USING btree ("latest");
  CREATE INDEX "homepage_blocks_hero_order_idx" ON "homepage_blocks_hero" USING btree ("_order");
  CREATE INDEX "homepage_blocks_hero_parent_id_idx" ON "homepage_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_hero_path_idx" ON "homepage_blocks_hero" USING btree ("_path");
  CREATE INDEX "homepage_blocks_hero_spotlight_book_idx" ON "homepage_blocks_hero" USING btree ("spotlight_book_id");
  CREATE INDEX "homepage_blocks_latest_books_order_idx" ON "homepage_blocks_latest_books" USING btree ("_order");
  CREATE INDEX "homepage_blocks_latest_books_parent_id_idx" ON "homepage_blocks_latest_books" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_latest_books_path_idx" ON "homepage_blocks_latest_books" USING btree ("_path");
  CREATE INDEX "homepage_blocks_book_shelf_order_idx" ON "homepage_blocks_book_shelf" USING btree ("_order");
  CREATE INDEX "homepage_blocks_book_shelf_parent_id_idx" ON "homepage_blocks_book_shelf" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_book_shelf_path_idx" ON "homepage_blocks_book_shelf" USING btree ("_path");
  CREATE INDEX "homepage_blocks_book_shelf_category_idx" ON "homepage_blocks_book_shelf" USING btree ("category_id");
  CREATE INDEX "homepage_blocks_topics_order_idx" ON "homepage_blocks_topics" USING btree ("_order");
  CREATE INDEX "homepage_blocks_topics_parent_id_idx" ON "homepage_blocks_topics" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_topics_path_idx" ON "homepage_blocks_topics" USING btree ("_path");
  CREATE INDEX "homepage_blocks_order_steps_steps_order_idx" ON "homepage_blocks_order_steps_steps" USING btree ("_order");
  CREATE INDEX "homepage_blocks_order_steps_steps_parent_id_idx" ON "homepage_blocks_order_steps_steps" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_order_steps_order_idx" ON "homepage_blocks_order_steps" USING btree ("_order");
  CREATE INDEX "homepage_blocks_order_steps_parent_id_idx" ON "homepage_blocks_order_steps" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_order_steps_path_idx" ON "homepage_blocks_order_steps" USING btree ("_path");
  CREATE INDEX "homepage_blocks_call_to_action_order_idx" ON "homepage_blocks_call_to_action" USING btree ("_order");
  CREATE INDEX "homepage_blocks_call_to_action_parent_id_idx" ON "homepage_blocks_call_to_action" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_call_to_action_path_idx" ON "homepage_blocks_call_to_action" USING btree ("_path");
  CREATE INDEX "homepage_blocks_news_order_idx" ON "homepage_blocks_news" USING btree ("_order");
  CREATE INDEX "homepage_blocks_news_parent_id_idx" ON "homepage_blocks_news" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_news_path_idx" ON "homepage_blocks_news" USING btree ("_path");
  CREATE INDEX "homepage_blocks_text_section_order_idx" ON "homepage_blocks_text_section" USING btree ("_order");
  CREATE INDEX "homepage_blocks_text_section_parent_id_idx" ON "homepage_blocks_text_section" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_text_section_path_idx" ON "homepage_blocks_text_section" USING btree ("_path");
  CREATE INDEX "homepage_meta_meta_image_idx" ON "homepage" USING btree ("meta_image_id");
  CREATE INDEX "homepage__status_idx" ON "homepage" USING btree ("_status");
  CREATE INDEX "homepage_rels_order_idx" ON "homepage_rels" USING btree ("order");
  CREATE INDEX "homepage_rels_parent_idx" ON "homepage_rels" USING btree ("parent_id");
  CREATE INDEX "homepage_rels_path_idx" ON "homepage_rels" USING btree ("path");
  CREATE INDEX "homepage_rels_books_id_idx" ON "homepage_rels" USING btree ("books_id");
  CREATE INDEX "homepage_rels_categories_id_idx" ON "homepage_rels" USING btree ("categories_id");
  CREATE INDEX "_homepage_v_blocks_hero_order_idx" ON "_homepage_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_hero_parent_id_idx" ON "_homepage_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_hero_path_idx" ON "_homepage_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_hero_spotlight_book_idx" ON "_homepage_v_blocks_hero" USING btree ("spotlight_book_id");
  CREATE INDEX "_homepage_v_blocks_latest_books_order_idx" ON "_homepage_v_blocks_latest_books" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_latest_books_parent_id_idx" ON "_homepage_v_blocks_latest_books" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_latest_books_path_idx" ON "_homepage_v_blocks_latest_books" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_book_shelf_order_idx" ON "_homepage_v_blocks_book_shelf" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_book_shelf_parent_id_idx" ON "_homepage_v_blocks_book_shelf" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_book_shelf_path_idx" ON "_homepage_v_blocks_book_shelf" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_book_shelf_category_idx" ON "_homepage_v_blocks_book_shelf" USING btree ("category_id");
  CREATE INDEX "_homepage_v_blocks_topics_order_idx" ON "_homepage_v_blocks_topics" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_topics_parent_id_idx" ON "_homepage_v_blocks_topics" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_topics_path_idx" ON "_homepage_v_blocks_topics" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_order_steps_steps_order_idx" ON "_homepage_v_blocks_order_steps_steps" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_order_steps_steps_parent_id_idx" ON "_homepage_v_blocks_order_steps_steps" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_order_steps_order_idx" ON "_homepage_v_blocks_order_steps" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_order_steps_parent_id_idx" ON "_homepage_v_blocks_order_steps" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_order_steps_path_idx" ON "_homepage_v_blocks_order_steps" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_call_to_action_order_idx" ON "_homepage_v_blocks_call_to_action" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_call_to_action_parent_id_idx" ON "_homepage_v_blocks_call_to_action" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_call_to_action_path_idx" ON "_homepage_v_blocks_call_to_action" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_news_order_idx" ON "_homepage_v_blocks_news" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_news_parent_id_idx" ON "_homepage_v_blocks_news" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_news_path_idx" ON "_homepage_v_blocks_news" USING btree ("_path");
  CREATE INDEX "_homepage_v_blocks_text_section_order_idx" ON "_homepage_v_blocks_text_section" USING btree ("_order");
  CREATE INDEX "_homepage_v_blocks_text_section_parent_id_idx" ON "_homepage_v_blocks_text_section" USING btree ("_parent_id");
  CREATE INDEX "_homepage_v_blocks_text_section_path_idx" ON "_homepage_v_blocks_text_section" USING btree ("_path");
  CREATE INDEX "_homepage_v_version_meta_version_meta_image_idx" ON "_homepage_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_homepage_v_version_version__status_idx" ON "_homepage_v" USING btree ("version__status");
  CREATE INDEX "_homepage_v_created_at_idx" ON "_homepage_v" USING btree ("created_at");
  CREATE INDEX "_homepage_v_updated_at_idx" ON "_homepage_v" USING btree ("updated_at");
  CREATE INDEX "_homepage_v_latest_idx" ON "_homepage_v" USING btree ("latest");
  CREATE INDEX "_homepage_v_autosave_idx" ON "_homepage_v" USING btree ("autosave");
  CREATE INDEX "_homepage_v_rels_order_idx" ON "_homepage_v_rels" USING btree ("order");
  CREATE INDEX "_homepage_v_rels_parent_idx" ON "_homepage_v_rels" USING btree ("parent_id");
  CREATE INDEX "_homepage_v_rels_path_idx" ON "_homepage_v_rels" USING btree ("path");
  CREATE INDEX "_homepage_v_rels_books_id_idx" ON "_homepage_v_rels" USING btree ("books_id");
  CREATE INDEX "_homepage_v_rels_categories_id_idx" ON "_homepage_v_rels" USING btree ("categories_id");
  ALTER TABLE "books" ADD CONSTRAINT "books_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_books_v" ADD CONSTRAINT "_books_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_forms_fk" FOREIGN KEY ("forms_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_form_submissions_fk" FOREIGN KEY ("form_submissions_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "books_meta_meta_image_idx" ON "books" USING btree ("meta_image_id");
  CREATE INDEX "_books_v_version_meta_version_meta_image_idx" ON "_books_v" USING btree ("version_meta_image_id");
  CREATE INDEX "pages_meta_meta_image_idx" ON "pages" USING btree ("meta_image_id");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "_pages_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_pages_v_autosave_idx" ON "_pages_v" USING btree ("autosave");
  CREATE INDEX "posts_meta_meta_image_idx" ON "posts" USING btree ("meta_image_id");
  CREATE INDEX "_posts_v_version_meta_version_meta_image_idx" ON "_posts_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_posts_v_autosave_idx" ON "_posts_v" USING btree ("autosave");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");
  CREATE INDEX "payload_locked_documents_rels_forms_id_idx" ON "payload_locked_documents_rels" USING btree ("forms_id");
  CREATE INDEX "payload_locked_documents_rels_form_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("form_submissions_id");`)
}

// Diubah dari hasil generate: DROP TABLE ... CASCADE di atas sudah menghapus sebagian
// constraint/indeks, jadi pernyataan berikut memakai IF EXISTS agar rollback tidak gagal.
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "redirects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "redirects_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms_blocks_checkbox" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms_blocks_email" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms_blocks_message" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms_blocks_number" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms_blocks_select_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms_blocks_select" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms_blocks_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms_blocks_textarea" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms_blocks_radio_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms_blocks_radio" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms_blocks_date" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "form_submissions_submission_data" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "form_submissions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "exports" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "exports_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "imports" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "appearance_header_nav" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "appearance_footer_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "appearance" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_appearance_v_version_header_nav" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_appearance_v_version_footer_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_appearance_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_latest_books" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_book_shelf" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_topics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_order_steps_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_order_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_call_to_action" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_news" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_blocks_text_section" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_latest_books" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_book_shelf" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_topics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_order_steps_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_order_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_call_to_action" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_news" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_blocks_text_section" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_homepage_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "redirects" CASCADE;
  DROP TABLE "redirects_rels" CASCADE;
  DROP TABLE "forms_blocks_checkbox" CASCADE;
  DROP TABLE "forms_blocks_email" CASCADE;
  DROP TABLE "forms_blocks_message" CASCADE;
  DROP TABLE "forms_blocks_number" CASCADE;
  DROP TABLE "forms_blocks_select_options" CASCADE;
  DROP TABLE "forms_blocks_select" CASCADE;
  DROP TABLE "forms_blocks_text" CASCADE;
  DROP TABLE "forms_blocks_textarea" CASCADE;
  DROP TABLE "forms_blocks_radio_options" CASCADE;
  DROP TABLE "forms_blocks_radio" CASCADE;
  DROP TABLE "forms_blocks_date" CASCADE;
  DROP TABLE "forms" CASCADE;
  DROP TABLE "forms_rels" CASCADE;
  DROP TABLE "form_submissions_submission_data" CASCADE;
  DROP TABLE "form_submissions" CASCADE;
  DROP TABLE "exports" CASCADE;
  DROP TABLE "exports_texts" CASCADE;
  DROP TABLE "imports" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "appearance_header_nav" CASCADE;
  DROP TABLE "appearance_footer_links" CASCADE;
  DROP TABLE "appearance" CASCADE;
  DROP TABLE "_appearance_v_version_header_nav" CASCADE;
  DROP TABLE "_appearance_v_version_footer_links" CASCADE;
  DROP TABLE "_appearance_v" CASCADE;
  DROP TABLE "homepage_blocks_hero" CASCADE;
  DROP TABLE "homepage_blocks_latest_books" CASCADE;
  DROP TABLE "homepage_blocks_book_shelf" CASCADE;
  DROP TABLE "homepage_blocks_topics" CASCADE;
  DROP TABLE "homepage_blocks_order_steps_steps" CASCADE;
  DROP TABLE "homepage_blocks_order_steps" CASCADE;
  DROP TABLE "homepage_blocks_call_to_action" CASCADE;
  DROP TABLE "homepage_blocks_news" CASCADE;
  DROP TABLE "homepage_blocks_text_section" CASCADE;
  DROP TABLE "homepage" CASCADE;
  DROP TABLE "homepage_rels" CASCADE;
  DROP TABLE "_homepage_v_blocks_hero" CASCADE;
  DROP TABLE "_homepage_v_blocks_latest_books" CASCADE;
  DROP TABLE "_homepage_v_blocks_book_shelf" CASCADE;
  DROP TABLE "_homepage_v_blocks_topics" CASCADE;
  DROP TABLE "_homepage_v_blocks_order_steps_steps" CASCADE;
  DROP TABLE "_homepage_v_blocks_order_steps" CASCADE;
  DROP TABLE "_homepage_v_blocks_call_to_action" CASCADE;
  DROP TABLE "_homepage_v_blocks_news" CASCADE;
  DROP TABLE "_homepage_v_blocks_text_section" CASCADE;
  DROP TABLE "_homepage_v" CASCADE;
  DROP TABLE "_homepage_v_rels" CASCADE;
  ALTER TABLE "books" DROP CONSTRAINT IF EXISTS "books_meta_image_id_media_id_fk";
  
  ALTER TABLE "_books_v" DROP CONSTRAINT IF EXISTS "_books_v_version_meta_image_id_media_id_fk";
  
  ALTER TABLE "pages" DROP CONSTRAINT IF EXISTS "pages_meta_image_id_media_id_fk";
  
  ALTER TABLE "_pages_v" DROP CONSTRAINT IF EXISTS "_pages_v_version_meta_image_id_media_id_fk";
  
  ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_meta_image_id_media_id_fk";
  
  ALTER TABLE "_posts_v" DROP CONSTRAINT IF EXISTS "_posts_v_version_meta_image_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_redirects_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_forms_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_form_submissions_fk";
  
  DROP INDEX IF EXISTS "books_meta_meta_image_idx";
  DROP INDEX IF EXISTS "_books_v_version_meta_version_meta_image_idx";
  DROP INDEX IF EXISTS "pages_meta_meta_image_idx";
  DROP INDEX IF EXISTS "_pages_v_version_meta_version_meta_image_idx";
  DROP INDEX IF EXISTS "_pages_v_autosave_idx";
  DROP INDEX IF EXISTS "posts_meta_meta_image_idx";
  DROP INDEX IF EXISTS "_posts_v_version_meta_version_meta_image_idx";
  DROP INDEX IF EXISTS "_posts_v_autosave_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_redirects_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_forms_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_form_submissions_id_idx";
  ALTER TABLE "books" DROP COLUMN "meta_image_id";
  ALTER TABLE "_books_v" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "pages" DROP COLUMN "meta_title";
  ALTER TABLE "pages" DROP COLUMN "meta_description";
  ALTER TABLE "pages" DROP COLUMN "meta_image_id";
  ALTER TABLE "_pages_v" DROP COLUMN "version_meta_title";
  ALTER TABLE "_pages_v" DROP COLUMN "version_meta_description";
  ALTER TABLE "_pages_v" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "_pages_v" DROP COLUMN "autosave";
  ALTER TABLE "posts" DROP COLUMN "meta_title";
  ALTER TABLE "posts" DROP COLUMN "meta_description";
  ALTER TABLE "posts" DROP COLUMN "meta_image_id";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_title";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_description";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "_posts_v" DROP COLUMN "autosave";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "redirects_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "forms_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "form_submissions_id";
  DROP TYPE "public"."enum_redirects_to_type";
  DROP TYPE "public"."enum_redirects_type";
  DROP TYPE "public"."enum_redirects_source";
  DROP TYPE "public"."enum_forms_confirmation_type";
  DROP TYPE "public"."enum_forms_redirect_type";
  DROP TYPE "public"."enum_form_submissions_status";
  DROP TYPE "public"."enum_exports_format";
  DROP TYPE "public"."enum_exports_sort_order";
  DROP TYPE "public"."enum_exports_drafts";
  DROP TYPE "public"."enum_imports_import_mode";
  DROP TYPE "public"."enum_imports_status";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_appearance_header_nav_visibility";
  DROP TYPE "public"."enum_appearance_header_nav_link_type";
  DROP TYPE "public"."enum_appearance_header_nav_link_route";
  DROP TYPE "public"."enum_appearance_footer_links_link_type";
  DROP TYPE "public"."enum_appearance_footer_links_link_route";
  DROP TYPE "public"."enum_appearance_theme_preset";
  DROP TYPE "public"."enum_appearance_announcement_tone";
  DROP TYPE "public"."enum_appearance_announcement_link_type";
  DROP TYPE "public"."enum_appearance_announcement_link_route";
  DROP TYPE "public"."enum_appearance_status";
  DROP TYPE "public"."enum__appearance_v_version_header_nav_visibility";
  DROP TYPE "public"."enum__appearance_v_version_header_nav_link_type";
  DROP TYPE "public"."enum__appearance_v_version_header_nav_link_route";
  DROP TYPE "public"."enum__appearance_v_version_footer_links_link_type";
  DROP TYPE "public"."enum__appearance_v_version_footer_links_link_route";
  DROP TYPE "public"."enum__appearance_v_version_theme_preset";
  DROP TYPE "public"."enum__appearance_v_version_announcement_tone";
  DROP TYPE "public"."enum__appearance_v_version_announcement_link_type";
  DROP TYPE "public"."enum__appearance_v_version_announcement_link_route";
  DROP TYPE "public"."enum__appearance_v_version_status";
  DROP TYPE "public"."enum_homepage_blocks_hero_spotlight_mode";
  DROP TYPE "public"."enum_homepage_blocks_book_shelf_source";
  DROP TYPE "public"."enum_homepage_blocks_call_to_action_button_style";
  DROP TYPE "public"."enum_homepage_blocks_text_section_columns";
  DROP TYPE "public"."enum_homepage_status";
  DROP TYPE "public"."enum__homepage_v_blocks_hero_spotlight_mode";
  DROP TYPE "public"."enum__homepage_v_blocks_book_shelf_source";
  DROP TYPE "public"."enum__homepage_v_blocks_call_to_action_button_style";
  DROP TYPE "public"."enum__homepage_v_blocks_text_section_columns";
  DROP TYPE "public"."enum__homepage_v_version_status";`)
}
