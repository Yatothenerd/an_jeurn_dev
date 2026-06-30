-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'client');

-- CreateEnum
CREATE TYPE "GuestControlType" AS ENUM ('none', 'limited', 'full');

-- CreateEnum
CREATE TYPE "UserPackageStatus" AS ENUM ('active', 'expired', 'revoked');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('email', 'phone', 'whatsapp');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'client',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price_usd" DECIMAL(10,2) NOT NULL,
    "max_sections" INTEGER NOT NULL,
    "max_photos" INTEGER NOT NULL,
    "max_guests" INTEGER NOT NULL,
    "has_music" BOOLEAN NOT NULL DEFAULT false,
    "has_video" BOOLEAN NOT NULL DEFAULT false,
    "has_khqr" BOOLEAN NOT NULL DEFAULT false,
    "has_wishing" BOOLEAN NOT NULL DEFAULT false,
    "has_hosting" BOOLEAN NOT NULL DEFAULT false,
    "has_custom_thumb" BOOLEAN NOT NULL DEFAULT false,
    "has_location" BOOLEAN NOT NULL DEFAULT false,
    "has_opening_cover" BOOLEAN NOT NULL DEFAULT false,
    "has_watermark" BOOLEAN NOT NULL DEFAULT true,
    "has_guest_control" BOOLEAN NOT NULL DEFAULT false,
    "guest_control_type" "GuestControlType" NOT NULL DEFAULT 'none',
    "guest_edit_limit" INTEGER,
    "has_logo" BOOLEAN NOT NULL DEFAULT false,
    "gallery_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_packages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "status" "UserPackageStatus" NOT NULL DEFAULT 'active',
    "notes" TEXT,

    CONSTRAINT "user_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "venue_name" TEXT,
    "venue_map_url" TEXT,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "content_type" TEXT DEFAULT 'photo',
    "default_sections" JSONB,
    "overlay_config" JSONB,
    "background_url" TEXT,
    "background_video_url" TEXT,
    "cover_url" TEXT,
    "thumbnail_url" TEXT,
    "preview_url" TEXT,
    "music_url" TEXT,
    "is_animated" BOOLEAN NOT NULL DEFAULT false,
    "share_link" TEXT,
    "show_watermark" BOOLEAN NOT NULL DEFAULT true,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "invitation_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "content" JSONB NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "invitation_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishes" (
    "id" TEXT NOT NULL,
    "invitation_id" TEXT NOT NULL,
    "guest_name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "token" TEXT,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "contact_type" "ContactType",
    "rsvp_status" TEXT,
    "meal_pref" TEXT,
    "rsvp_at" TIMESTAMP(3),

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content_type" TEXT DEFAULT 'photo',
    "default_sections" JSONB,
    "overlay_config" JSONB,
    "background_url" TEXT,
    "background_video_url" TEXT,
    "cover_url" TEXT,
    "thumbnail_url" TEXT,
    "preview_url" TEXT,
    "music_url" TEXT,
    "is_animated" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_templates" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "packages_slug_key" ON "packages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_event_id_key" ON "invitations"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "guests_token_key" ON "guests"("token");

-- CreateIndex
CREATE UNIQUE INDEX "package_templates_package_id_template_id_key" ON "package_templates"("package_id", "template_id");

-- AddForeignKey
ALTER TABLE "user_packages" ADD CONSTRAINT "user_packages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_packages" ADD CONSTRAINT "user_packages_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_packages" ADD CONSTRAINT "user_packages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishes" ADD CONSTRAINT "wishes_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_templates" ADD CONSTRAINT "package_templates_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_templates" ADD CONSTRAINT "package_templates_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

